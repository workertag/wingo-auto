import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { X, Check } from 'lucide-react';

export function BotSettingsModal({ bot, onClose }: { bot: any, onClose: () => void }) {
  const queryClient = useQueryClient();

  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);

  useEffect(() => {
    if (bot.settings) {
      if (bot.settings.games) setSelectedGames(bot.settings.games);
      if (bot.settings.timeSlots) setSelectedTimeSlots(bot.settings.timeSlots);
      if (bot.settings.strategies) setSelectedStrategies(bot.settings.strategies);
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

  const toggleSelection = (setter: any, current: string[], value: string) => {
    if (current.includes(value)) {
      setter(current.filter(i => i !== value));
    } else {
      setter([...current, value]);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
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

          {/* Time Slots */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Active Time Slots</h3>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedTimeSlots.map(tsId => {
                const ts = timeSlots.find((t: any) => t.id === tsId);
                return (
                  <div key={tsId} className="flex items-center gap-2 bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm">
                    <span>{ts ? `${ts.name} (${ts.startTime}-${ts.endTime})` : tsId}</span>
                    <button onClick={() => toggleSelection(setSelectedTimeSlots, selectedTimeSlots, tsId)} className="p-0.5 hover:bg-slate-200 rounded-md transition-colors text-slate-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
              {selectedTimeSlots.length === 0 && <p className="text-sm text-slate-400 italic">No time slots selected.</p>}
            </div>

            <select 
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer font-medium appearance-none"
              value=""
              onChange={(e) => {
                if (e.target.value && !selectedTimeSlots.includes(e.target.value)) {
                  toggleSelection(setSelectedTimeSlots, selectedTimeSlots, e.target.value);
                }
              }}
            >
              <option value="" disabled>+ Add a Time Slot...</option>
              {timeSlots.filter((ts: any) => !selectedTimeSlots.includes(ts.id)).map((ts: any) => (
                <option key={ts.id} value={ts.id}>{ts.name} ({ts.startTime} - {ts.endTime})</option>
              ))}
            </select>
          </div>

          {/* Strategies */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Strategies</h3>
            
            <div className="flex flex-col gap-2 mb-3">
              {selectedStrategies.map(sId => {
                const st = strategies.find((s: any) => s.id === sId);
                return (
                  <div key={sId} className="flex items-center justify-between bg-amber-50 border border-amber-100 text-amber-800 px-4 py-3 rounded-xl text-sm font-medium shadow-sm">
                    <div>
                      <div className="font-bold">{st ? st.name : sId}</div>
                      {st && <div className="text-xs text-amber-600/80 mt-0.5">Levels: L{st.minLevel}-L{st.maxLevel}</div>}
                    </div>
                    <button onClick={() => toggleSelection(setSelectedStrategies, selectedStrategies, sId)} className="p-1.5 hover:bg-amber-200/50 rounded-lg transition-colors text-amber-700">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
              {selectedStrategies.length === 0 && <p className="text-sm text-slate-400 italic">No strategies selected.</p>}
            </div>

            <select 
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer font-medium appearance-none"
              value=""
              onChange={(e) => {
                if (e.target.value && !selectedStrategies.includes(e.target.value)) {
                  toggleSelection(setSelectedStrategies, selectedStrategies, e.target.value);
                }
              }}
            >
              <option value="" disabled>+ Add a Strategy...</option>
              {strategies.filter((st: any) => !selectedStrategies.includes(st.id)).map((st: any) => (
                <option key={st.id} value={st.id}>{st.name} (Levels {st.minLevel}-{st.maxLevel})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end space-x-3 bg-slate-50/50">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            Cancel
          </button>
          <button 
            onClick={() => saveMutation.mutate({ games: selectedGames, timeSlots: selectedTimeSlots, strategies: selectedStrategies })}
            disabled={saveMutation.isPending}
            className="px-5 py-2.5 rounded-xl font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 transition-all flex items-center space-x-2"
          >
            {saveMutation.isPending ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
}
