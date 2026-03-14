/**
 * Auth Routes
 * GitHub OAuth login, repo listing, and auto-webhook creation
 */

import express from 'express';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Read env vars lazily (dotenv.config() runs after imports in index.js)
function getClientId() { return process.env.GITHUB_CLIENT_ID; }
function getClientSecret() { return process.env.GITHUB_CLIENT_SECRET; }
function getClientUrl() { return process.env.CLIENT_URL || 'http://localhost:5173'; }

function sessionCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
  };
}

function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);
      return resolve();
    });
  });
}

let supabaseAdmin = null;
function getSupabaseAdmin() {
  if (supabaseAdmin) return supabaseAdmin;

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseAdmin;
}

async function upsertUserProfile(adminClient, profile) {
  try {
    await adminClient.from('profiles').upsert(profile, { onConflict: 'id' });
  } catch (error) {
    console.warn('Profile upsert skipped:', error.message);
  }
}

// Generate a stable webhook secret if not set
let webhookSecret = null;
function getWebhookSecret() {
  if (webhookSecret) return webhookSecret;
  webhookSecret = process.env.GITHUB_WEBHOOK_SECRET?.trim() || 'gitsage-webhook-' + crypto.randomBytes(8).toString('hex');
  if (!process.env.GITHUB_WEBHOOK_SECRET?.trim()) {
    process.env.GITHUB_WEBHOOK_SECRET = webhookSecret;
  }
  return webhookSecret;
}

/**
 * GET /api/auth/github
 * Redirects user to GitHub OAuth authorization page
 */
router.get('/auth/github', (req, res) => {
  const clientId = getClientId();
  if (!clientId) {
    return res.status(500).json({ error: 'GitHub OAuth not configured (missing GITHUB_CLIENT_ID)' });
  }

  const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/github/callback`;
  const scope = 'repo admin:repo_hook read:user';
  const state = crypto.randomBytes(16).toString('hex');

  req.session.oauthState = state;

  const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`;

  res.redirect(authUrl);
});

/**
 * GET /api/auth/github/callback
 * Handles GitHub OAuth callback — exchanges code for token
 */
router.get('/auth/github/callback', async (req, res) => {
  const { code, state } = req.query;

  if (!code) {
    return res.redirect(`${getClientUrl()}?auth_error=no_code`);
  }

  // Verify state parameter
  if (state !== req.session.oauthState) {
    return res.redirect(`${getClientUrl()}?auth_error=invalid_state`);
  }
  delete req.session.oauthState;

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: getClientId(),
        client_secret: getClientSecret(),
        code
      })
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('OAuth token error:', tokenData.error_description);
      return res.redirect(`${getClientUrl()}?auth_error=${tokenData.error}`);
    }

    const accessToken = tokenData.access_token;

    // Fetch user info
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GitSage'
      }
    });

    const userData = await userResponse.json();

    const nextSessionUser = {
      login: userData.login,
      avatar_url: userData.avatar_url,
      name: userData.name || userData.login,
      id: userData.id
    };

    // Rotate session ID after auth to reduce session fixation risk
    await regenerateSession(req);
    req.session.githubToken = accessToken;
    req.session.user = nextSessionUser;

    console.log(`User ${userData.login} authenticated via GitHub OAuth`);

    // Redirect to frontend
    res.redirect(`${getClientUrl()}?auth=success`);

  } catch (error) {
    console.error('OAuth callback error:', error.message);
    res.redirect(`${getClientUrl()}?auth_error=server_error`);
  }
});

/**
 * GET /api/auth/user
 * Returns the currently authenticated user or null
 */
router.get('/auth/user', (req, res) => {
  if (req.session?.user) {
    return res.json({ user: req.session.user, authenticated: true });
  }
  res.json({ user: null, authenticated: false });
});

/**
 * POST /api/auth/session
 * Verifies Supabase access token and stores user in express session
 */
router.post('/auth/session', async (req, res) => {
  const { accessToken, providerToken, provider } = req.body || {};

  if (!accessToken) {
    return res.status(400).json({ error: 'Missing access token' });
  }

  const adminClient = getSupabaseAdmin();
  if (!adminClient) {
    return res.status(500).json({
      error: 'Supabase not configured on server (SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY missing)',
    });
  }

  try {
    const { data, error } = await adminClient.auth.getUser(accessToken);
    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid Supabase token' });
    }

    const supabaseUser = data.user;
    const metadata = supabaseUser.user_metadata || {};
    const login =
      metadata.user_name ||
      metadata.preferred_username ||
      (supabaseUser.email ? supabaseUser.email.split('@')[0] : null) ||
      supabaseUser.id;

    const sessionUser = {
      id: supabaseUser.id,
      login,
      name: metadata.full_name || metadata.name || login,
      avatar_url: metadata.avatar_url || metadata.picture || '',
      email: supabaseUser.email || metadata.email || '',
      provider: provider || supabaseUser.app_metadata?.provider || 'unknown',
    };

    await regenerateSession(req);
    req.session.user = sessionUser;

    if (providerToken && sessionUser.provider === 'github') {
      req.session.githubToken = providerToken;
    } else if (sessionUser.provider !== 'github') {
      delete req.session.githubToken;
    }

    await upsertUserProfile(adminClient, {
      id: supabaseUser.id,
      email: sessionUser.email,
      login: sessionUser.login,
      full_name: sessionUser.name,
      avatar_url: sessionUser.avatar_url,
      provider: sessionUser.provider,
      last_login_at: new Date().toISOString(),
    });

    res.json({ authenticated: true, user: sessionUser });
  } catch (syncError) {
    console.error('Supabase session sync error:', syncError.message);
    res.status(500).json({ error: 'Failed to sync authentication session' });
  }
});

/**
 * GET /api/auth/repos
 * Lists the authenticated user's repositories
 */
router.get('/auth/repos', async (req, res) => {
  if (!req.session?.githubToken) {
    return res.status(401).json({ error: 'Not authenticated', code: 'UNAUTHORIZED' });
  }

  try {
    const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=50&type=all', {
      headers: {
        'Authorization': `Bearer ${req.session.githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GitSage'
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const repos = await response.json();

    const simplified = repos.map(repo => ({
      fullName: repo.full_name,
      name: repo.name,
      owner: repo.owner.login,
      description: repo.description,
      private: repo.private,
      language: repo.language,
      stars: repo.stargazers_count,
      updatedAt: repo.updated_at
    }));

    res.json(simplified);

  } catch (error) {
    console.error('Error fetching repos:', error.message);
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

/**
 * POST /api/auth/webhook
 * Creates a webhook on the specified repository automatically
 */
router.post('/auth/webhook', async (req, res) => {
  if (!req.session?.githubToken) {
    return res.status(401).json({ error: 'Not authenticated', code: 'UNAUTHORIZED' });
  }

  const { owner, repo } = req.body;
  if (!owner || !repo) {
    return res.status(400).json({ error: 'Missing owner or repo' });
  }

  // Determine the webhook URL — use server's public URL if available
  const serverUrl = process.env.WEBHOOK_URL || `${req.protocol}://${req.get('host')}`;
  const webhookUrl = `${serverUrl}/api/webhook/${owner}/${repo}`;

  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/hooks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${req.session.githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GitSage',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'web',
        active: true,
        events: ['push', 'pull_request', 'create'],
        config: {
          url: webhookUrl,
          content_type: 'json',
          secret: getWebhookSecret(),
          insecure_ssl: '0'
        }
      })
    });

    if (response.status === 422) {
      // Webhook already exists — that's fine
      console.log(`Webhook already exists for ${owner}/${repo}`);
      return res.json({ success: true, message: 'Webhook already exists', webhookUrl });
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `GitHub API error: ${response.status}`);
    }

    const hook = await response.json();
    console.log(`Webhook created for ${owner}/${repo} (id: ${hook.id})`);

    res.json({ success: true, webhookId: hook.id, webhookUrl });

  } catch (error) {
    console.error(`Failed to create webhook for ${owner}/${repo}:`, error.message);
    // Don't fail the request — webhook creation is non-critical
    res.json({ success: false, error: error.message, webhookUrl });
  }
});

/**
 * POST /api/auth/logout
 * Destroys the session
 */
router.post('/auth/logout', (req, res) => {
  const user = req.session?.user?.login;
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.clearCookie('gitsage.sid', sessionCookieOptions());
    console.log(`User ${user} logged out`);
    res.json({ success: true });
  });
});

export default router;
