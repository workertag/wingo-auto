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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans relative overflow-hidden transition-colors duration-500">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-400/20 rounded-full blur-[100px] mix-blend-multiply animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-sky-400/20 rounded-full blur-[120px] mix-blend-multiply animate-pulse pointer-events-none delay-75" />
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="flex justify-center">
          <div className="h-20 w-20 bg-white/60 rounded-3xl flex items-center justify-center border border-white/80 shadow-xl shadow-indigo-500/10 backdrop-blur-xl group hover:scale-105 transition-transform duration-300">
            <Bot className="h-10 w-10 text-indigo-600 group-hover:animate-bounce" />
          </div>
        </div>
        <h2 className="mt-8 text-center text-4xl font-black text-slate-800 tracking-tight drop-shadow-sm">
          Wingo Auto
        </h2>
        <p className="mt-3 text-center text-sm font-medium text-slate-500 uppercase tracking-widest">
          Secure Dashboard Access
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-150">
        <div className="bg-white/70 py-10 px-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:rounded-3xl sm:px-10 border border-white/80 backdrop-blur-2xl">
          <form className="space-y-7" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Administrator Password
              </label>
              <div className="relative rounded-xl shadow-sm group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 border-2 border-slate-100 rounded-xl bg-white/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 focus:border-indigo-500 transition-all font-medium"
                  placeholder="Enter your secure password"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm font-bold bg-red-50 py-3 px-4 rounded-xl border border-red-100 flex items-center animate-in zoom-in-95 duration-200">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2 animate-pulse" />
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-500/30 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/40 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 hover:scale-[1.02] active:scale-[0.98] group overflow-hidden relative"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                <span className="relative z-10 flex items-center">
                  {loading ? 'Authenticating...' : 'Access Dashboard'}
                  {!loading && <ArrowRight className="ml-2 h-5 w-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1.5 transition-all" />}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

