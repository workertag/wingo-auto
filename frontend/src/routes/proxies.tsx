import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Server, Plus, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { AppLayout } from '../components/Layout';

export const Route = createFileRoute('/proxies')({
  component: ProxiesPage,
});

function ProxiesPage() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProxy, setNewProxy] = useState({ name: '', host: '', port: '', proxyUser: '', proxyPass: '' });

  const { data: proxies = [], isLoading } = useQuery({
    queryKey: ['endpoints'],
    queryFn: async () => {
      const res = await fetch('http://localhost:3001/api/endpoints', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch proxies');
      return res.json();
    }
  });

  const addProxyMutation = useMutation({
    mutationFn: async (proxyData: any) => {
      const res = await fetch('http://localhost:3001/api/endpoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(proxyData)
      });
      if (!res.ok) throw new Error('Failed to add proxy');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['endpoints'] });
      setShowAddModal(false);
      setNewProxy({ name: '', host: '', port: '', proxyUser: '', proxyPass: '' });
    }
  });

  return (
    <AppLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Proxy Management</h1>
          <p className="text-slate-500 mt-1 font-medium">Configure network endpoints for your bot instances.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/30 font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>Add Proxy</span>
        </button>
      </div>

      {isLoading ? (
        <div className="text-slate-500 font-medium animate-pulse">Loading proxies...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {proxies.map((proxy: any) => (
            <div key={proxy.id} className="glass-card p-6 rounded-2xl group hover:-translate-y-1 transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Server className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{proxy.name}</h3>
                    <div className="flex items-center space-x-1 mt-0.5">
                      {proxy.isActive ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-red-500" />
                      )}
                      <span className="text-xs font-semibold text-slate-500">
                        {proxy.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                  </div>
                </div>
                <button className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-3 bg-white/50 p-4 rounded-xl border border-white/60">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Host:Port</span>
                  <span className="text-slate-800 font-semibold font-mono">{proxy.host}:{proxy.port}</span>
                </div>
                {proxy.proxyUser && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-medium">Auth</span>
                    <span className="text-slate-800 font-semibold font-mono">{proxy.proxyUser}:***</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {proxies.length === 0 && (
             <div className="col-span-full glass-card p-12 rounded-2xl text-center border-dashed border-2 border-indigo-200">
                <Server className="w-12 h-12 text-indigo-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-700">No proxies configured</h3>
                <p className="text-slate-500 mt-2">Add a proxy endpoint to assign to your bot instances.</p>
             </div>
          )}
        </div>
      )}

      {/* Add Proxy Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/20 animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Add New Proxy</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Proxy Name</label>
                <input
                  type="text"
                  value={newProxy.name}
                  onChange={e => setNewProxy({...newProxy, name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                  placeholder="e.g. US Residential 1"
                />
              </div>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-slate-600 mb-1.5">Host / IP</label>
                  <input
                    type="text"
                    value={newProxy.host}
                    onChange={e => setNewProxy({...newProxy, host: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                    placeholder="192.168.1.1"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-sm font-semibold text-slate-600 mb-1.5">Port</label>
                  <input
                    type="text"
                    value={newProxy.port}
                    onChange={e => setNewProxy({...newProxy, port: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                    placeholder="8080"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Username (Optional)</label>
                <input
                  type="text"
                  value={newProxy.proxyUser}
                  onChange={e => setNewProxy({...newProxy, proxyUser: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Password (Optional)</label>
                <input
                  type="password"
                  value={newProxy.proxyPass}
                  onChange={e => setNewProxy({...newProxy, proxyPass: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-8">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => addProxyMutation.mutate(newProxy)}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-500/30 transition-colors"
                disabled={addProxyMutation.isPending}
              >
                {addProxyMutation.isPending ? 'Saving...' : 'Save Proxy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </AppLayout>
  );
}
