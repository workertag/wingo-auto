import { createFileRoute, redirect } from '@tanstack/react-router';
import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { Bot, Lock, ArrowRight } from 'lucide-react';

export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    if (useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/' });
    }
  },
  component: Login,
});

function Login() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore(state => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await login(password);
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || 'Invalid password');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 backdrop-blur-xl">
            <Bot className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
          Wingo Automator
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Secure Dashboard Access
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900/50 py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-slate-800 backdrop-blur-xl">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-300">
                Dashboard Password
              </label>
              <div className="mt-2 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-xl bg-slate-950/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors sm:text-sm"
                  placeholder="Enter admin password"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-sm font-medium bg-red-400/10 py-2 px-3 rounded-lg border border-red-400/20">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {loading ? 'Authenticating...' : 'Access Dashboard'}
                {!loading && <ArrowRight className="ml-2 h-5 w-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
    </div>
  );
}
