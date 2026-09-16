import { Link, useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '../stores/authStore';
import { LayoutDashboard, Clock, Target, LogOut, History } from 'lucide-react';
import React from 'react';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate({ to: '/login' });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex text-slate-300 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col hidden md:flex">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
            Wingo Auto
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <Link
            to="/"
            className="flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200"
            activeProps={{ className: "bg-emerald-500/10 text-emerald-400 font-medium" }}
            inactiveProps={{ className: "hover:bg-slate-800/50 hover:text-white" }}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>
          <Link
            to="/time-slots"
            className="flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200"
            activeProps={{ className: "bg-emerald-500/10 text-emerald-400 font-medium" }}
            inactiveProps={{ className: "hover:bg-slate-800/50 hover:text-white" }}
          >
            <Clock className="w-5 h-5" />
            <span>Time Slots</span>
          </Link>
          <Link
            to="/strategies"
            className="flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200"
            activeProps={{ className: "bg-emerald-500/10 text-emerald-400 font-medium" }}
            inactiveProps={{ className: "hover:bg-slate-800/50 hover:text-white" }}
          >
            <Target className="w-5 h-5" />
            <span>Strategies</span>
          </Link>
          <Link
            to="/history"
            className="flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200"
            activeProps={{ className: "bg-emerald-500/10 text-emerald-400 font-medium" }}
            inactiveProps={{ className: "hover:bg-slate-800/50 hover:text-white" }}
          >
            <History className="w-5 h-5" />
            <span>History</span>
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
