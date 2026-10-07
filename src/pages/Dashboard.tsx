import { Header } from '../components/Header';
import { Chart } from '../components/Chart';
import { SignalGenerator } from '../components/SignalGenerator';
import { useMarketStore } from '../store/useMarketStore';
import { useAppStore } from '../store/useAppStore';
import { TrendingUp, Activity, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard = () => {
  const { currentPrice, dailyChange, dailyChangePercent, todayHigh, todayLow } = useMarketStore();
  const { signals } = useAppStore();
  
  const isUp = dailyChange >= 0;
  
  const recentSignals = signals.slice(0, 3);

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Dashboard" />
      
      <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
        
        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="text-sm text-text-muted">AI Market Sentiment</div>
              <div className="text-xl font-bold text-success">72% Bullish</div>
            </div>
          </div>
          <div className="glass-card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="text-sm text-text-muted">Market Volatility</div>
              <div className="text-xl font-bold">Normal</div>
            </div>
          </div>
          <div className="glass-card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="text-sm text-text-muted">Avg AI Confidence</div>
              <div className="text-xl font-bold">76%</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Chart />
            
            {/* Market Status summary */}
            <div className="glass-card p-4">
               <h3 className="text-sm font-semibold text-text-muted mb-4 uppercase tracking-wider">Market Overview</h3>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-text-muted">Current Price</div>
                    <div className="font-bold">${currentPrice.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-text-muted">Daily Change</div>
                    <div className={`font-bold \${isUp ? 'text-success' : 'text-danger'}`}>
                      {isUp ? '+' : ''}{dailyChange.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-text-muted">Today's High</div>
                    <div className="font-bold">${todayHigh.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-text-muted">Today's Low</div>
                    <div className="font-bold">${todayLow.toFixed(2)}</div>
                  </div>
               </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-6">
            <SignalGenerator />
            
            {/* Recent Signals Summary */}
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Recent Signals</h3>
                <Link to="/history" className="text-xs text-primary hover:underline">View All</Link>
              </div>
              
              {recentSignals.length === 0 ? (
                <div className="text-center py-6 text-text-muted text-sm">
                  No signals generated yet.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {recentSignals.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full \${s.direction === 'UP' ? 'bg-success' : 'bg-danger'}`} />
                        <div>
                          <div className="font-bold text-sm">{s.direction}</div>
                          <div className="text-xs text-text-muted">{s.duration}s • {s.confidence}%</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold">{s.status}</div>
                        {s.result && (
                          <div className="text-[10px] text-text-muted max-w-[100px] truncate">{s.result}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};
