import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { logout, syncAuthSession } from '../utils/api';

const AuthContext = createContext(null);

function normalizeUser(rawUser) {
  if (!rawUser) return null;

  const metadata = rawUser.user_metadata || {};
  const provider =
    rawUser.app_metadata?.provider ||
    rawUser.identities?.[0]?.provider ||
    'unknown';

  const loginFromProvider =
    metadata.user_name ||
    metadata.preferred_username ||
    metadata.email?.split('@')[0] ||
    rawUser.email?.split('@')[0] ||
    rawUser.id;

  return {
    id: rawUser.id,
    login: loginFromProvider,
    name: metadata.full_name || metadata.name || loginFromProvider,
    avatar_url: metadata.avatar_url || metadata.picture || '',
    email: rawUser.email || metadata.email || '',
    provider,
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in client/.env.');
      setLoading(false);
      return;
    }

    let cancelled = false;

    const init = async () => {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (cancelled) return;

        const nextSession = data.session || null;
        setSession(nextSession);
        setUser(normalizeUser(nextSession?.user || null));

        if (nextSession?.access_token) {
          await syncAuthSession({
            accessToken: nextSession.access_token,
            providerToken: nextSession.provider_token,
            provider: nextSession.user?.app_metadata?.provider || 'unknown',
            user: normalizeUser(nextSession.user),
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to initialize authentication');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    init();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession || null);
      setUser(normalizeUser(nextSession?.user || null));

      if (nextSession?.access_token) {
        try {
          await syncAuthSession({
            accessToken: nextSession.access_token,
            providerToken: nextSession.provider_token,
            provider: nextSession.user?.app_metadata?.provider || 'unknown',
            user: normalizeUser(nextSession.user),
          });
        } catch (syncErr) {
          setError(syncErr.message || 'Failed to sync server session');
        }
      }
    });

    return () => {
      cancelled = true;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signInWithProvider = async (provider) => {
    if (!supabase) {
      throw new Error('Supabase auth is not configured');
    }

    const redirectTo = window.location.origin;
    const options = { redirectTo };

    if (provider === 'github') {
      options.scopes = 'repo read:user admin:repo_hook';
    }

    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider,
      options,
    });

    if (signInError) {
      throw signInError;
    }
  };

  const signOut = async () => {
    if (!supabase) return;

    const [supabaseResult] = await Promise.allSettled([
      supabase.auth.signOut(),
      logout(),
    ]);

    if (supabaseResult.status === 'rejected') {
      throw supabaseResult.reason;
    }

    if (supabaseResult.value?.error) {
      throw supabaseResult.value.error;
    }

    setSession(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      session,
      user,
      loading,
      error,
      isAuthenticated: Boolean(user),
      signInWithProvider,
      signOut,
    }),
    [session, user, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
