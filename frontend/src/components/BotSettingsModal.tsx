import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { X, Check } from 'lucide-react';

export function BotSettingsModal({ bot, onClose }: { bot: any, onClose: () => void }) {
  const queryClient = useQueryClient();

  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [schedules, setSchedules] = useState<{ id: string, timeSlotId: string, strategyId: string }[]>([]);

  useEffect(() => {
    if (bot.settings) {
      if (bot.settings.games) setSelectedGames(bot.settings.games);
      if (bot.settings.schedules) {
        setSchedules(bot.settings.schedules);
      } else {
        // Fallback for legacy data (attempt to match the first time slot and strategy)
        const ts = bot.settings.timeSlots?.[0];
        const st = bot.settings.strategies?.[0];
        if (ts && st) {
          setSchedules([{ id: Date.now().toString(), timeSlotId: ts, strategyId: st }]);
        }
      }
    }
  }, [bot.settings]);

  const { data: timeSlots = [] } = useQuery({
    queryKey: ['timeSlots'],
    queryFn: async () => {
      const res = await api.request('/time-slots');
      return res;
    }
  });

  const { data: strategies = [] } = useQuery({
    queryKey: ['strategies'],
    queryFn: async () => {
      const res = await api.request('/strategies');
      return res;
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (settings: any) => {
      const res = await api.request(`/bots/${bot.id}/settings`, {
        method: 'PUT',
        body: JSON.stringify({ settings })
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots'] });
      queryClient.invalidateQueries({ queryKey: ['bot', bot.id] });
      onClose();
    }
  });

  const addSchedule = () => {
    setSchedules([...schedules, { id: Date.now().toString(), timeSlotId: '', strategyId: '' }]);
  };

  const toggleSelection = (setter: any, currentList: string[], item: string) => {
    if (currentList.includes(item)) {
      setter(currentList.filter(i => i !== item));
    } else {
      setter([...currentList, item]);
    }
  };

  const removeSchedule = (id: string) => {
    setSchedules(schedules.filter(s => s.id !== id));
  };

  const updateSchedule = (id: string, field: 'timeSlotId' | 'strategyId', value: string) => {
    setSchedules(schedules.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const hasInvalidSchedule = schedules.some(s => !s.timeSlotId || !s.strategyId);

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100 flex flex-wrap gap-4 justify-between items-start sm:items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Bot Settings</h2>
            <p className="text-sm text-slate-500">{bot.name} Configuration</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto">
          {/* Game Types */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Games to Play</h3>
            <div className="flex space-x-3">
              {['B/S', 'R/G'].map(game => (
                <button
                  key={game}
                  onClick={() => toggleSelection(setSelectedGames, selectedGames, game)}
                  className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all flex items-center space-x-2 ${selectedGames.includes(game) ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
                >
                  {selectedGames.includes(game) && <Check className="w-4 h-4" />}
                  <span>{game === 'B/S' ? 'Big / Small' : 'Red / Green'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Schedules */}
          <div>
            <div className="flex flex-wrap gap-2 justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Schedules</h3>
              <button 
                onClick={addSchedule}
                className="text-indigo-600 hover:text-indigo-700 text-sm font-bold flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                + Add Schedule
              </button>
            </div>
            
            <div className="flex flex-col gap-4">
              {schedules.map((schedule, index) => (
                <div key={schedule.id} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl shadow-sm relative group">
                  <div className="absolute right-3 top-3">
                    <button onClick={() => removeSchedule(schedule.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-4 pr-8">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Time Slot</label>
                      <select 
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer text-sm"
                        value={schedule.timeSlotId}
                        onChange={(e) => updateSchedule(schedule.id, 'timeSlotId', e.target.value)}
                      >
                        <option value="" disabled>Select Time Slot...</option>
                        {timeSlots.map((ts: any) => (
                          <option key={ts.id} value={ts.id}>{ts.name} ({ts.startTime} - {ts.endTime})</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Strategy</label>
                      <select 
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer text-sm"
                        value={schedule.strategyId}
                        onChange={(e) => updateSchedule(schedule.id, 'strategyId', e.target.value)}
                      >
                        <option value="" disabled>Select Strategy...</option>
                        {strategies.map((st: any) => (
                          <option key={st.id} value={st.id}>{st.name} (Levels {st.minLevel}-{st.maxLevel})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              
              {schedules.length === 0 && (
                <div className="text-center p-8 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                  <p className="text-slate-500 text-sm font-medium">No schedules configured.</p>
                  <button onClick={addSchedule} className="mt-3 text-indigo-600 font-semibold hover:underline text-sm">Create your first schedule</button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row justify-end gap-3 bg-slate-50/50">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors w-full sm:w-auto">
            Cancel
          </button>
          <button 
            onClick={() => saveMutation.mutate({ games: selectedGames, schedules })}
            disabled={saveMutation.isPending || hasInvalidSchedule}
            className={`px-5 py-2.5 rounded-xl font-medium transition-all flex items-center space-x-2 ${
              saveMutation.isPending || hasInvalidSchedule
                ? 'bg-indigo-300 cursor-not-allowed text-white shadow-none'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30'
            }`}
          >
            {saveMutation.isPending ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
}
