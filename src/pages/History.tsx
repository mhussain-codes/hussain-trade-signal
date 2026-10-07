import { Header } from '../components/Header';
import { useAppStore } from '../store/useAppStore';
import { format } from 'date-fns';
import { useState } from 'react';

export const History = () => {
  const { signals } = useAppStore();
  const [filter, setFilter] = useState<'All' | 'UP' | 'DOWN' | 'NEUTRAL'>('All');

  const filteredSignals = signals.filter(s => filter === 'All' || s.direction === filter);

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Signal History" />
      
      <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
        
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {['All', 'UP', 'DOWN', 'NEUTRAL'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors \${
                  filter === f ? 'bg-primary text-background' : 'bg-card border border-white/5 hover:bg-white/5'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white/5 text-text-muted border-b border-white/5">
                <tr>
                  <th className="px-6 py-4 font-medium">Time</th>
                  <th className="px-6 py-4 font-medium">Entry Price</th>
                  <th className="px-6 py-4 font-medium">Direction</th>
                  <th className="px-6 py-4 font-medium">Confidence</th>
                  <th className="px-6 py-4 font-medium">Duration</th>
                  <th className="px-6 py-4 font-medium">AI Sentiment</th>
                  <th className="px-6 py-4 font-medium">Status / Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredSignals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-text-muted">
                      No signals found.
                    </td>
                  </tr>
                ) : (
                  filteredSignals.map(s => (
                    <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">{format(s.time, 'HH:mm:ss')}</td>
                      <td className="px-6 py-4 font-mono">${s.entryPrice?.toFixed(2) || s.price.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`font-bold \${s.direction === 'UP' ? 'text-success' : s.direction === 'DOWN' ? 'text-danger' : 'text-warning'}`}>
                          {s.direction === 'NEUTRAL' ? 'NO SIGNAL' : s.direction}
                        </span>
                      </td>
                      <td className="px-6 py-4">{s.confidence}%</td>
                      <td className="px-6 py-4">{s.duration}s</td>
                      <td className="px-6 py-4">{s.sentiment}</td>
                      <td className="px-6 py-4">
                        {s.status === 'Pending' ? (
                          <span className="text-primary font-medium animate-pulse">Pending...</span>
                        ) : (
                          <div className="flex flex-col">
                            <span className="font-medium">Completed</span>
                            {s.result && <span className="text-xs text-text-muted">{s.result}</span>}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
