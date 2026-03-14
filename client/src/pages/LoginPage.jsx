import { useState } from 'react';
import PropTypes from 'prop-types';

function OAuthButton({ provider, label, onClick, disabled }) {
  const isGitHub = provider === 'github';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full inline-flex items-center justify-center gap-3 px-5 py-3 rounded-xl border border-slate-200 bg-white
                 text-slate-800 font-medium hover:bg-slate-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {isGitHub ? (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 0C5.373 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.111.793-.261.793-.577v-2.234c-3.338.726-4.034-1.416-4.034-1.416C4.42 17.773 3.633 17.404 3.633 17.404c-1.087-.744.084-.729.084-.729 1.205.084 1.839 1.236 1.839 1.236 1.07 1.834 2.807 1.304 3.492.997.108-.775.419-1.304.763-1.604-2.665-.306-5.467-1.335-5.467-5.93 0-1.312.469-2.382 1.236-3.222-.123-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.3 1.23A11.515 11.515 0 0112 5.798c1.021.005 2.047.138 3.006.404 2.291-1.552 3.299-1.23 3.299-1.23.653 1.653.241 2.873.118 3.176.77.84 1.235 1.91 1.235 3.222 0 4.607-2.804 5.624-5.476 5.92.431.372.815 1.103.815 2.222v3.293c0 .319.192.694.801.576C20.565 21.796 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-1.4 3.6-5.5 3.6-3.3 0-6-2.8-6-6.2s2.7-6.2 6-6.2c1.9 0 3.2.8 3.9 1.5l2.7-2.6C17 2.6 14.7 1.6 12 1.6 6.9 1.6 2.7 5.9 2.7 11s4.2 9.4 9.3 9.4c5.4 0 9-3.8 9-9.2 0-.6-.1-1-.1-1.4H12z" />
        </svg>
      )}
      <span>{label}</span>
    </button>
  );
}

OAuthButton.propTypes = {
  provider: PropTypes.oneOf(['github', 'google']).isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

function LoginPage({ onLogin, error }) {
  const [busyProvider, setBusyProvider] = useState('');

  const handleLogin = async (provider) => {
    setBusyProvider(provider);
    try {
      await onLogin(provider);
    } catch {
      setBusyProvider('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md bg-white border border-slate-200 shadow-xl rounded-2xl p-8">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-16 h-16 rounded-2xl overflow-hidden shadow-lg">
            <img src="/gitsage-logo.jpeg" alt="GitSage Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Sign in to GitSage</h1>
          <p className="mt-2 text-slate-500">
            Continue with GitHub or Google to access your workspace.
          </p>
        </div>

        <div className="space-y-3">
          <OAuthButton
            provider="github"
            label={busyProvider === 'github' ? 'Redirecting to GitHub...' : 'Continue with GitHub'}
            onClick={() => handleLogin('github')}
            disabled={Boolean(busyProvider)}
          />

          <OAuthButton
            provider="google"
            label={busyProvider === 'google' ? 'Redirecting to Google...' : 'Continue with Google'}
            onClick={() => handleLogin('google')}
            disabled={Boolean(busyProvider)}
          />
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <p className="mt-6 text-xs text-slate-400 text-center">
          By continuing, you authenticate using Supabase OAuth.
        </p>
      </div>
    </div>
  );
}

LoginPage.propTypes = {
  onLogin: PropTypes.func.isRequired,
  error: PropTypes.string,
};

export default LoginPage;
