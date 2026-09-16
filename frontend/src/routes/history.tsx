import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { AppLayout } from '../components/Layout';
import { History, TrendingUp, TrendingDown, Clock, Target } from 'lucide-react';

export const Route = createFileRoute('/history')({
  component: HistoryPage,
});

function HistoryPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      const data = await api.getBotSessions();
      setSessions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  // Group by date
  const grouped = sessions.reduce((acc: any, session: any) => {
    const date = session.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(session);
    return acc;
  }, {});

  const dates = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <AppLayout>
      <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-8 relative z-10 min-h-screen bg-transparent">
        <div className="flex justify-between items-center bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-orange-400">
              <History className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-white">Bot Sessions History</h1>
          </div>
        </div>

        {loading && sessions.length === 0 ? (
          <div className="text-center text-slate-500 py-10">Loading history...</div>
        ) : sessions.length === 0 ? (
          <div className="text-center text-slate-500 py-10 bg-slate-900/30 rounded-2xl border border-slate-800">
            No bot sessions recorded yet.
          </div>
        ) : (
          <div className="space-y-8">
            {dates.map(date => (
              <div key={date} className="space-y-4">
                <h2 className="text-xl font-bold text-white border-b border-slate-800 pb-2">{date}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {grouped[date].map((s: any) => {
                    const pl = (s.finalBalance || 0) - (s.initialBalance || 0);
                    const isProfit = pl > 0;
                    const isLoss = pl < 0;
                    
                    return (
                      <div key={s.id} className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 shadow-lg group hover:border-slate-700 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              s.status === 'ACTIVE' ? 'bg-blue-500/20 text-blue-400' :
                              s.status === 'TAKE_PROFIT' ? 'bg-emerald-500/20 text-emerald-400' :
                              s.status === 'STOP_LOSS' ? 'bg-red-500/20 text-red-400' :
                              'bg-slate-700 text-slate-300'
                            }`}>
                              {s.status}
                            </span>
                            <div className="flex items-center space-x-2 mt-2 text-slate-300 text-sm">
                              <Clock className="w-3.5 h-3.5 text-blue-400" />
                              <span>{s.timeSlotName || 'Unknown Slot'}</span>
                            </div>
                            <div className="flex items-center space-x-2 mt-1 text-slate-300 text-sm">
                              <Target className="w-3.5 h-3.5 text-purple-400" />
                              <span>{s.strategyName || 'Unknown Strategy'}</span>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">P&L</p>
                            <p className={`text-lg font-bold font-mono ${isProfit ? 'text-emerald-400' : isLoss ? 'text-red-400' : 'text-slate-300'}`}>
                              {isProfit ? '+' : ''}{pl.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-800/50 mb-3">
                           <div>
                              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Start Bal</p>
                              <p className="text-sm font-mono text-white">₹{(s.initialBalance || 0).toFixed(2)}</p>
                           </div>
                           <div>
                              <p className="text-[10px] text-slate-500 uppercase tracking-wider">End Bal</p>
                              <p className="text-sm font-mono text-white">₹{(s.finalBalance || 0).toFixed(2)}</p>
                           </div>
                        </div>

                        <div className="flex justify-between items-center text-sm">
                          <div className="flex items-center space-x-1.5 text-emerald-400 bg-emerald-900/20 px-2 py-1 rounded">
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span>{s.totalWins} Wins</span>
                          </div>
                          <div className="flex items-center space-x-1.5 text-red-400 bg-red-900/20 px-2 py-1 rounded">
                            <TrendingDown className="w-3.5 h-3.5" />
                            <span>{s.totalLosses} Losses</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
