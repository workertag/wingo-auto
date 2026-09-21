import { useEffect } from 'react';
import { create } from 'zustand';

interface BotStreamState {
  logs: Record<string, any[]>;
  events: any[];
  addLog: (botId: string, log: any) => void;
  addEvent: (event: any) => void;
}

export const useBotStreamStore = create<BotStreamState>((set) => ({
  logs: {},
  events: [],
  addLog: (botId, log) => set((state) => ({
    logs: {
      ...state.logs,
      [botId]: [...(state.logs[botId] || []), log].slice(-100) // Keep last 100 logs per bot
    }
  })),
  addEvent: (event) => set((state) => ({
    events: [event, ...state.events].slice(0, 50) // Keep last 50 global events
  }))
}));

export function useBotStream() {
  const addLog = useBotStreamStore(state => state.addLog);
  const addEvent = useBotStreamStore(state => state.addEvent);

  useEffect(() => {
    const eventSource = new EventSource('http://localhost:3001/api/stream');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'LOG') {
          addLog(data.botId, data);
        } else {
          // BOT_STARTED, BOT_STOPPED, BALANCE_UPDATE
          addEvent(data);
        }
      } catch (e) {
        console.error("Error parsing SSE message:", e);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [addLog, addEvent]);
}
