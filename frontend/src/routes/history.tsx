import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { History, TrendingUp, TrendingDown, Clock, Target } from 'lucide-react';
import { AppLayout } from '../components/Layout';

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
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Bot Sessions History</h1>
          <p className="text-slate-500 mt-1 font-medium">Review past performance and automated trades.</p>
        </div>
      </div>

      {loading && sessions.length === 0 ? (
        <div className="text-center text-slate-500 py-10 font-medium animate-pulse">Loading history...</div>
      ) : sessions.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl text-center border-dashed border-2 border-slate-200">
          <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-700">No bot sessions recorded yet</h3>
          <p className="text-slate-500 mt-2">Start a bot instance to begin recording session history.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {dates.map(date => (
            <div key={date} className="space-y-4">
              <h2 className="text-xl font-bold text-slate-800 border-b border-slate-200 pb-2">{date}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {grouped[date].map((s: any) => {
                  const pl = (s.finalBalance || 0) - (s.initialBalance || 0);
                  const isProfit = pl > 0;
                  const isLoss = pl < 0;
                  
                  return (
                    <div key={s.id} className="glass-card p-5 rounded-2xl group hover:-translate-y-1 transition-all duration-300">
                      <div className="flex flex-wrap justify-between items-start gap-2 mb-4">
                        <div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            s.status === 'ACTIVE' ? 'bg-indigo-100 text-indigo-600' :
                            s.status === 'TAKE_PROFIT' ? 'bg-emerald-100 text-emerald-600' :
                            s.status === 'STOP_LOSS' ? 'bg-red-100 text-red-600' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {s.status}
                          </span>
                          <div className="flex items-center space-x-2 mt-2 text-slate-600 text-sm font-semibold">
                            <Clock className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{s.timeSlotName || 'Unknown Slot'}</span>
                          </div>
                          <div className="flex items-center space-x-2 mt-1 text-slate-600 text-sm font-semibold">
                            <Target className="w-3.5 h-3.5 text-violet-500" />
                            <span>{s.strategyName || 'Unknown Strategy'}</span>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">P&L</p>
                          <p className={`text-xl font-black font-mono ${isProfit ? 'text-emerald-500' : isLoss ? 'text-red-500' : 'text-slate-400'}`}>
                            {isProfit ? '+' : ''}{pl.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-100 mb-3 bg-white/40 px-3 rounded-xl">
                         <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Bal</p>
                            <p className="text-sm font-mono font-semibold text-slate-700">₹{(s.initialBalance || 0).toFixed(2)}</p>
                         </div>
                         <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">End Bal</p>
                            <p className="text-sm font-mono font-semibold text-slate-700">₹{(s.finalBalance || 0).toFixed(2)}</p>
                         </div>
                      </div>

                      <div className="flex justify-between items-center text-sm font-semibold">
                        <div className="flex items-center space-x-1.5 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                          <TrendingUp className="w-4 h-4" />
                          <span>{s.totalWins} Wins</span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-red-600 bg-red-50 px-2 py-1 rounded-lg">
                          <TrendingDown className="w-4 h-4" />
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
