import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Plus, Trash2, Target, Settings2, PlusCircle, MinusCircle, Edit2, Search } from 'lucide-react';
import { AppLayout } from '../components/Layout';

export const Route = createFileRoute('/strategies')({
  component: StrategiesPage,
});

function StrategiesPage() {
  const [strategies, setStrategies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  const defaultForm = { 
    name: '', minLevel: 1, maxLevel: 20, maxWins: '' as unknown as number, maxLosses: '' as unknown as number, 
    levels: Array(20).fill(''),
    config: { BET_BIG_SMALL: true, BET_RED_GREEN: true, ALLOWED_QUALITIES: ["A", "B"] }
  };
  const [form, setForm] = useState(defaultForm);

  const fetchStrategies = async () => {
    try {
      const data = await api.getStrategies();
      setStrategies(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStrategies();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Sanitize empty strings to 0 for API
    const submitForm = {
      ...form,
      maxWins: form.maxWins === '' ? 0 : form.maxWins,
      maxLosses: form.maxLosses === '' ? 0 : form.maxLosses,
      levels: form.levels.map(l => l === '' ? 0 : l)
    };

    try {
      if (editingId) {
        await api.updateStrategy(editingId, submitForm);
      } else {
        await api.createStrategy(submitForm);
      }
      setForm(defaultForm);
      setIsAdding(false);
      setEditingId(null);
      fetchStrategies();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEdit = (st: any) => {
    setForm({ 
        name: st.name, 
        minLevel: st.minLevel, 
        maxLevel: st.maxLevel, 
        maxWins: st.maxWins, 
        maxLosses: st.maxLosses, 
        levels: st.levels, 
        config: st.config 
    });
    setEditingId(st.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await api.deleteStrategy(id);
      fetchStrategies();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleLevelChange = (idx: number, val: any) => {
    const newLevels = [...form.levels];
    newLevels[idx] = val;
    setForm({ ...form, levels: newLevels });
  };

  const addLevel = () => {
    if (form.levels.length >= 20) return;
    const lastVal = form.levels[form.levels.length - 1] || 1;
    setForm({ ...form, levels: [...form.levels, lastVal * 2] });
  };

  const removeLevel = () => {
    if (form.levels.length <= 1) return;
    const newLevels = form.levels.slice(0, -1);
    setForm({ ...form, levels: newLevels, maxLevel: Math.min(form.maxLevel, newLevels.length) });
  };

  const filteredStrategies = strategies.filter((st: any) => {
    const matchesSearch = st.name.toLowerCase().includes(searchTerm.toLowerCase());
    const isActive = true; // All strategies are active for now since DB doesn't track status
    const matchesFilter = filter === 'all' ? true :
                          filter === 'active' ? isActive :
                          !isActive;
    return matchesSearch && matchesFilter;
  });

  const activeCount = strategies.length; // All active for now
  const inactiveCount = 0;

  return (
    <AppLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">CONFIGURATION</p>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Strategies</h1>
            <p className="text-slate-500 mt-1 text-sm font-medium">Configure martingale levels and bot parameters for different strategies.</p>
          </div>
          <button 
            onClick={() => { setForm(defaultForm); setEditingId(null); setIsAdding(true); }}
            className="flex items-center space-x-2 bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/25 font-semibold text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Strategy</span>
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
              placeholder="Search strategies..."
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
              <span className={`px-2 py-0.5 rounded-md text-xs ${filter === 'all' ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-100 text-slate-500'}`}>{strategies.length}</span>
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

        {/* Add/Edit Modal */}
        {isAdding && (
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-3xl w-full shadow-2xl border border-white/20 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">{editingId ? 'Edit Strategy' : 'Create Strategy'}</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-slate-100 pb-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-1.5">Strategy Name</label>
                    <input 
                      required
                      type="text" 
                      value={form.name}
                      onChange={e => setForm({...form, name: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      placeholder="e.g. Aggressive Martingale"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-1.5">Max Wins</label>
                      <input 
                        required
                        type="number" 
                        value={form.maxWins}
                        onChange={e => setForm({...form, maxWins: e.target.value === '' ? '' : parseInt(e.target.value) || 0})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-1.5">Max Losses</label>
                      <input 
                        required
                        type="number" 
                        value={form.maxLosses}
                        onChange={e => setForm({...form, maxLosses: e.target.value === '' ? '' : parseInt(e.target.value) || 0})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 flex items-center">
                        <Settings2 className="w-4 h-4 mr-2 text-indigo-500" />
                        Martingale Levels
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">Configure bet amounts per loss level.</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button type="button" onClick={removeLevel} className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors">
                        <MinusCircle className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-mono bg-white px-3 py-1.5 rounded-lg text-slate-700 border border-slate-200 font-semibold shadow-sm">
                        {form.levels.length} Levels
                      </span>
                      <button type="button" onClick={addLevel} className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors">
                        <PlusCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-2">
                    {form.levels.map((amt, idx) => (
                      <div key={idx} className="relative group">
                        <label className="absolute -top-2 left-2 px-1 bg-white text-[9px] text-indigo-600 font-bold z-10 shadow-sm rounded-sm">L{idx + 1}</label>
                        <input 
                          type="number" 
                          value={amt}
                          onChange={e => handleLevelChange(idx, e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2.5 text-center text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 mt-4 text-xs font-semibold">
                    <div className="flex items-center">
                      <span className="text-slate-500 mr-2">Start Level:</span>
                      <select 
                        value={form.minLevel}
                        onChange={e => setForm({...form, minLevel: parseInt(e.target.value)})}
                        className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 outline-none"
                      >
                        {form.levels.map((_, i) => <option key={i} value={i+1}>Level {i+1}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center">
                      <span className="text-slate-500 mr-2">Max Level Limit:</span>
                      <select 
                        value={form.maxLevel}
                        onChange={e => setForm({...form, maxLevel: parseInt(e.target.value)})}
                        className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 outline-none"
                      >
                        {form.levels.map((_, i) => <option key={i} value={i+1}>Level {i+1}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => { setIsAdding(false); setEditingId(null); }} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-500/30 transition-colors">
                    {editingId ? 'Update Strategy' : 'Save Strategy'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Strategies Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center text-slate-500 py-10 font-medium">Loading strategies...</div>
          ) : filteredStrategies.length === 0 ? (
            <div className="col-span-full bg-white p-12 rounded-2xl text-center border-dashed border-2 border-slate-200">
               <Target className="w-12 h-12 text-slate-300 mx-auto mb-4" />
               <h3 className="text-xl font-bold text-slate-700">No strategies found</h3>
               <p className="text-slate-500 mt-2">Adjust your filters or create a new strategy.</p>
            </div>
          ) : (
            filteredStrategies.map(st => {
              const displayMin = st.minLevel || 1;
              const displayMax = st.maxLevel || st.levels.length;
              const actualLevels = st.levels
                .map((amt: number, i: number) => ({ amt, level: i + 1 }))
                .filter((l: any) => l.level >= displayMin && l.level <= displayMax && l.amt > 0);
              const totalAmountRequired = actualLevels.reduce((a: number, b: any) => a + b.amt, 0);

              return (
                <div 
                  key={st.id} 
                  className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 group cursor-pointer relative"
                  onClick={() => setExpandedId(expandedId === st.id ? null : st.id)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500">
                        <Target className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg mb-1">{st.name}</h3>
                        <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-emerald-50">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                            Active
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1" onClick={e => e.stopPropagation()}>
                      <button 
                        onClick={() => handleEdit(st)}
                        className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(st.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-3">
                    Limits: {st.maxWins}W / {st.maxLosses}L
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 font-medium">Active Levels</span>
                      <span className="text-slate-800 font-bold font-mono">L{displayMin} - L{displayMax}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 font-medium">Base Bet</span>
                      <span className="text-emerald-500 font-bold font-mono">₹{st.levels[displayMin - 1] || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 font-medium">Max Bet (L{displayMax})</span>
                      <span className="text-red-500 font-bold font-mono">₹{st.levels[displayMax - 1] || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-3 mt-3 border-t border-slate-100">
                      <span className="text-slate-800 font-bold">Total Amount Required</span>
                      <span className="text-indigo-600 font-black font-mono">₹{totalAmountRequired}</span>
                    </div>
                  </div>

                  {expandedId === st.id && (
                    <div className="mt-4 pt-4 border-t border-slate-100 animate-in slide-in-from-top-2" onClick={e => e.stopPropagation()}>
                      <h4 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">All Bet Levels</h4>
                      <div className="grid grid-cols-5 gap-2">
                        {st.levels.map((amt: number, idx: number) => {
                          if (!amt || amt === 0) return null;
                          return (
                            <div key={idx} className="bg-slate-50 rounded-lg border border-slate-100 p-1.5 text-center shadow-sm">
                              <div className="text-[10px] font-bold text-indigo-500 mb-0.5 uppercase">L{idx + 1}</div>
                              <div className="text-xs font-mono font-semibold text-slate-700">₹{amt}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
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
              <p className="text-sm text-slate-500 font-medium">Create different strategies for different market conditions. Start with small bets and test thoroughly.</p>
            </div>
          </div>
          <button className="text-indigo-600 text-sm font-semibold hover:text-indigo-700 flex items-center space-x-1 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-all">
            <span>Learn more</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </button>
        </div>

      </div>
    </AppLayout>
  );
}
