import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Server, Plus, Trash2, Search, MoreVertical, Copy, Edit2 } from 'lucide-react';
import { useState } from 'react';
import { api } from '../lib/api';
import { AppLayout } from '../components/Layout';

export const Route = createFileRoute('/proxies')({
  component: ProxiesPage,
});

function ProxiesPage() {
  const token = api.getToken();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newProxy, setNewProxy] = useState({ name: '', host: '', port: '', proxyUser: '', proxyPass: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const { data: proxies = [], isLoading } = useQuery({
    queryKey: ['endpoints'],
    queryFn: async () => {
      const res = await fetch('/api/endpoints', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch proxies');
      return res.json();
    }
  });

  const addProxyMutation = useMutation({
    mutationFn: async (proxyData: any) => {
      const res = await fetch('/api/endpoints', {
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
      setEditingId(null);
      setNewProxy({ name: '', host: '', port: '', proxyUser: '', proxyPass: '' });
    },
    onError: (error: any) => {
      alert(error.message);
    }
  });

  const updateProxyMutation = useMutation({
    mutationFn: async (proxyData: any) => {
      const res = await fetch(`/api/endpoints/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(proxyData)
      });
      if (!res.ok) throw new Error('Failed to update proxy');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['endpoints'] });
      setShowAddModal(false);
      setEditingId(null);
      setNewProxy({ name: '', host: '', port: '', proxyUser: '', proxyPass: '' });
    },
    onError: (error: any) => {
      alert(error.message);
    }
  });

  const handleEdit = (proxy: any) => {
    setNewProxy({
      name: proxy.name,
      host: proxy.host,
      port: proxy.port.toString(),
      proxyUser: proxy.proxyUser || '',
      proxyPass: proxy.proxyPass || ''
    });
    setEditingId(proxy.id);
    setShowAddModal(true);
  };

  const deleteProxyMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/endpoints/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete proxy');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['endpoints'] });
    }
  });

  const filteredProxies = proxies.filter((proxy: any) => {
    const matchesSearch = proxy.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          proxy.host.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' ? true :
                          filter === 'active' ? proxy.isActive :
                          !proxy.isActive;
    return matchesSearch && matchesFilter;
  });

  const activeCount = proxies.filter((p: any) => p.isActive).length;
  const inactiveCount = proxies.length - activeCount;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Optional: add a tiny toast notification here
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">MANAGEMENT</p>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Proxy Management</h1>
            <p className="text-slate-500 mt-1 text-sm font-medium">Configure network endpoints for your bot instances. Add, edit or remove proxies to keep your bots running smoothly.</p>
          </div>
          <button
            onClick={() => {
              setEditingId(null);
              setNewProxy({ name: '', host: '', port: '', proxyUser: '', proxyPass: '' });
              setShowAddModal(true);
            }}
            className="flex items-center space-x-2 bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/25 font-semibold text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Proxy</span>
          </button>
        </div>

        {/* Toolbar (Search + Filters) */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-96">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search proxies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 text-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm transition-all text-sm font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button 
              onClick={() => setFilter('all')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all font-semibold text-sm border ${filter === 'all' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              <span>All</span>
              <span className={`px-2 py-0.5 rounded-md text-xs ${filter === 'all' ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-100 text-slate-500'}`}>{proxies.length}</span>
            </button>
            <button 
              onClick={() => setFilter('active')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all font-semibold text-sm border ${filter === 'active' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              <div className={`w-2 h-2 rounded-full ${filter === 'active' ? 'bg-emerald-500' : 'bg-emerald-400'}`} />
              <span>Active</span>
              <span className={`px-2 py-0.5 rounded-md text-xs ${filter === 'active' ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>{activeCount}</span>
            </button>
            <button 
              onClick={() => setFilter('inactive')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all font-semibold text-sm border ${filter === 'inactive' ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              <div className={`w-2 h-2 rounded-full ${filter === 'inactive' ? 'bg-slate-500' : 'bg-slate-400'}`} />
              <span>Inactive</span>
              <span className={`px-2 py-0.5 rounded-md text-xs ${filter === 'inactive' ? 'bg-slate-300 text-slate-800' : 'bg-slate-100 text-slate-500'}`}>{inactiveCount}</span>
            </button>
          </div>
        </div>

        {/* Proxies Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full text-center text-slate-500 py-10 font-medium">Loading proxies...</div>
          ) : filteredProxies.length === 0 ? (
            <div className="col-span-full bg-white p-12 rounded-2xl text-center border-dashed border-2 border-slate-200">
               <Server className="w-12 h-12 text-slate-300 mx-auto mb-4" />
               <h3 className="text-xl font-bold text-slate-700">No proxies found</h3>
               <p className="text-slate-500 mt-2">Adjust your filters or add a new proxy endpoint.</p>
            </div>
          ) : (
            filteredProxies.map((proxy: any) => (
              <div key={proxy.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 group relative">
                
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500">
                      <Server className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg mb-1">{proxy.name}</h3>
                      <div className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-md ${proxy.isActive ? 'bg-emerald-50' : 'bg-slate-100'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${proxy.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${proxy.isActive ? 'text-emerald-600' : 'text-slate-500'}`}>
                          {proxy.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button 
                      onClick={() => handleEdit(proxy)}
                      className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => {
                        if (window.confirm("Are you sure you want to delete this proxy? Bots using this proxy will lose their connection.")) {
                          deleteProxyMutation.mutate(proxy.id);
                        }
                      }}
                      disabled={deleteProxyMutation.isPending}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-semibold text-slate-500 shrink-0">Host : Port</span>
                    <div className="flex items-center space-x-2 overflow-hidden">
                      <span className="text-sm font-bold text-slate-800 truncate" title={`${proxy.host}:${proxy.port}`}>{proxy.host}:{proxy.port}</span>
                      <button onClick={() => copyToClipboard(`${proxy.host}:${proxy.port}`)} className="text-slate-400 hover:text-indigo-500 transition-colors shrink-0">
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {proxy.proxyUser && (
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm font-semibold text-slate-500 shrink-0">Auth</span>
                      <div className="flex items-center space-x-2 overflow-hidden">
                        <span className="text-sm font-bold text-slate-800 truncate" title={`${proxy.proxyUser}:***`}>{proxy.proxyUser}:***</span>
                        <button onClick={() => copyToClipboard(`${proxy.proxyUser}:${proxy.proxyPass}`)} className="text-slate-400 hover:text-indigo-500 transition-colors shrink-0">
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom Tip */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between mt-8">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full border border-indigo-200 flex items-center justify-center text-indigo-500 bg-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Tip</h4>
              <p className="text-sm text-slate-500 font-medium">Use reliable proxies to avoid connection issues and keep your bots running smoothly.</p>
            </div>
          </div>
          <button className="text-indigo-600 text-sm font-semibold hover:text-indigo-700 flex items-center space-x-1 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-all">
            <span>Learn more</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </button>
        </div>

      </div>

      {/* Add Proxy Modal (retained existing logic, matched styling) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-white/20 animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">{editingId ? 'Edit Proxy' : 'Add New Proxy'}</h2>
            
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
              <div className="flex flex-col sm:flex-row gap-4 sm:space-x-4">
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
                <div className="w-full sm:w-24">
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
                onClick={() => {
                  const payload = {
                    ...newProxy,
                    port: parseInt(newProxy.port, 10)
                  };
                  if (editingId) {
                    updateProxyMutation.mutate(payload);
                  } else {
                    addProxyMutation.mutate({ ...payload, userId: '1' });
                  }
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-500/30 transition-colors"
                disabled={addProxyMutation.isPending || updateProxyMutation.isPending}
              >
                {(addProxyMutation.isPending || updateProxyMutation.isPending) ? 'Saving...' : (editingId ? 'Update Proxy' : 'Save Proxy')}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
