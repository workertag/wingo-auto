import { Link, useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '../stores/authStore';
import { LayoutDashboard, Clock, Target, LogOut, History, Bot, Server } from 'lucide-react';
import React from 'react';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate({ to: '/login' });
  };

  return (
    <div className="min-h-screen flex text-slate-800 font-sans transition-colors duration-500">
      {/* Sidebar */}
      <aside className="w-64 glass-panel flex flex-col hidden md:flex">
        <div className="p-6">
          <h1 className="text-3xl font-black tracking-tight text-gradient drop-shadow-sm">
            Wingo Auto
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-2">
          <Link
            to="/"
            className="flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-300 border border-transparent"
            activeProps={{ className: "bg-white/80 shadow-md shadow-indigo-500/10 text-indigo-600 font-semibold border-white" }}
            inactiveProps={{ className: "hover:bg-white/40 hover:text-indigo-700" }}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>
          
          <div className="pt-4 pb-1">
             <p className="px-4 text-xs font-bold uppercase tracking-wider text-slate-400">Management</p>
          </div>
          
          <Link
            to="/bots"
            className="flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-300 border border-transparent"
            activeProps={{ className: "bg-white/80 shadow-md shadow-indigo-500/10 text-indigo-600 font-semibold border-white" }}
            inactiveProps={{ className: "hover:bg-white/40 hover:text-indigo-700" }}
          >
            <Bot className="w-5 h-5" />
            <span>Bot Instances</span>
          </Link>
          <Link
            to="/proxies"
            className="flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-300 border border-transparent"
            activeProps={{ className: "bg-white/80 shadow-md shadow-indigo-500/10 text-indigo-600 font-semibold border-white" }}
            inactiveProps={{ className: "hover:bg-white/40 hover:text-indigo-700" }}
          >
            <Server className="w-5 h-5" />
            <span>Proxies & Endpoints</span>
          </Link>

          <div className="pt-4 pb-1">
             <p className="px-4 text-xs font-bold uppercase tracking-wider text-slate-400">Configuration</p>
          </div>

          <Link
            to="/time-slots"
            className="flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-300 border border-transparent"
            activeProps={{ className: "bg-white/80 shadow-md shadow-indigo-500/10 text-indigo-600 font-semibold border-white" }}
            inactiveProps={{ className: "hover:bg-white/40 hover:text-indigo-700" }}
          >
            <Clock className="w-5 h-5" />
            <span>Time Slots</span>
          </Link>
          <Link
            to="/strategies"
            className="flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-300 border border-transparent"
            activeProps={{ className: "bg-white/80 shadow-md shadow-indigo-500/10 text-indigo-600 font-semibold border-white" }}
            inactiveProps={{ className: "hover:bg-white/40 hover:text-indigo-700" }}
          >
            <Target className="w-5 h-5" />
            <span>Strategies</span>
          </Link>
          <Link
            to="/history"
            className="flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-300 border border-transparent"
            activeProps={{ className: "bg-white/80 shadow-md shadow-indigo-500/10 text-indigo-600 font-semibold border-white" }}
            inactiveProps={{ className: "hover:bg-white/40 hover:text-indigo-700" }}
          >
            <History className="w-5 h-5" />
            <span>History</span>
          </Link>
        </nav>
        <div className="p-4 mb-4 mx-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-2xl bg-white/50 hover:bg-red-50 hover:text-red-600 text-slate-600 transition-all duration-300 font-medium border border-transparent hover:border-red-100 hover:shadow-sm"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto relative">
        {/* Subtle top glare effect */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
        
        <div className="p-8 max-w-7xl mx-auto relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
