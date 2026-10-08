import { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useMarketStore } from '../store/useMarketStore';
import { generateSignal } from '../services/aiService';
import { ArrowUpCircle, ArrowDownCircle, MinusCircle, AlertCircle, Loader2, Activity, Target, ShieldAlert, Newspaper, TrendingUp, Search } from 'lucide-react';

export const SignalGenerator = () => {
  const { licenseKey, addSignal, updateSignal } = useAppStore();
  const { currentPrice } = useMarketStore();
  const { defaultDuration, activeAsset } = useAppStore();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [activeSignal, setActiveSignal] = useState<any>(null);
  const [rawAiData, setRawAiData] = useState<any>(null);
  const [countdown, setCountdown] = useState<number>(0);

  const handleGenerate = async () => {
    if (!licenseKey) {
      setError("Please activate your License in Settings first.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setActiveSignal(null);
    setRawAiData(null);
    
    try {
      const recentCandles = useMarketStore.getState().priceHistory.slice(-20);
      const res = await generateSignal(activeAsset.symbol, licenseKey, defaultDuration, currentPrice, recentCandles);
      
      const resultData = res.data;
      if (!resultData) throw new Error("Data unavailable");

      setRawAiData(resultData);

      const rawDirection = resultData.Binary_Signal || 'NO TRADE';
      const direction = rawDirection === 'CALL' ? 'UP' : rawDirection === 'PUT' ? 'DOWN' : 'NEUTRAL';
      
      const newSignal = {
        id: resultData.id || Date.now().toString(),
        time: Date.now(),
        price: currentPrice,
        entryPrice: resultData.entry_price || currentPrice,
        direction: direction as 'UP' | 'DOWN' | 'NEUTRAL',
        confidence: resultData.Confidence || 0,
        duration: resultData.duration_seconds || defaultDuration,
        strength: (resultData.Risk || 'Medium') as 'Low' | 'Medium' | 'High' | 'Weak' | 'Strong' | 'None',
        sentiment: (direction === 'UP' ? 'Bullish' : direction === 'DOWN' ? 'Bearish' : 'Neutral') as 'Bullish' | 'Bearish' | 'Neutral',
        reason: resultData.Reason || "Detailed reasoning provided in Analysis Cards.",
        status: 'Pending' as const
      };
      
      addSignal(newSignal);
      setActiveSignal(newSignal);
      setCountdown(newSignal.duration);
      
    } catch (err: any) {
      console.error("Backend Error:", err);
      setError(err.message || "An unknown error occurred during analysis.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let timer: any;
    if (countdown > 0 && activeSignal) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // Let the scheduled function evaluate the real result
            updateSignal(activeSignal.id, { 
              status: 'Completed', 
              result: 'Evaluating...' 
            });
            setTimeout(() => { setActiveSignal(null); setRawAiData(null); }, 15000); // Leave it on screen for a bit longer
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown, activeSignal, updateSignal]);

  const getConfidenceColor = (conf: number) => {
    if (conf >= 80) return 'text-success';
    if (conf >= 65) return 'text-primary';
    return 'text-danger';
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* SIGNAL GENERATOR CARD */}
      <div className="glass-card p-6 flex flex-col gap-6 relative overflow-hidden">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-primary mb-1">{activeAsset.name} Trading Engine</h2>
          <p className="text-sm text-text-muted">Multi-Asset AI Analysis ({defaultDuration >= 60 ? defaultDuration / 60 : defaultDuration} {defaultDuration >= 60 ? 'MIN' : 'SEC'} Quotex Mode)</p>
        </div>

        {!activeSignal ? (
          <>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-5 rounded-xl font-bold text-lg bg-primary text-background hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)]"
            >
              {loading ? (
                <><Loader2 className="w-6 h-6 animate-spin" /> EXECUTING DEEP ANALYSIS...</>
              ) : (
                `ANALYZE ${activeAsset.symbol}`
              )}
            </button>
            
            {error && (
              <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm flex items-start gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
            <div className="text-center space-y-4 w-full">
              <div className="flex items-center justify-center gap-3">
                {activeSignal.direction === 'UP' ? (
                  <ArrowUpCircle className="w-16 h-16 text-success" />
                ) : activeSignal.direction === 'DOWN' ? (
                  <ArrowDownCircle className="w-16 h-16 text-danger" />
                ) : (
                  <MinusCircle className="w-16 h-16 text-warning" />
                )}
                <div className="flex flex-col items-start">
                  <span className={`text-5xl font-bold leading-none \${
                    activeSignal.direction === 'UP' ? 'text-success' 
                    : activeSignal.direction === 'DOWN' ? 'text-danger' 
                    : 'text-warning'
                  }`}>
                    {activeSignal.direction === 'NEUTRAL' ? 'NO TRADE' : activeSignal.direction === 'UP' ? 'CALL (UP)' : 'PUT (DOWN)'}
                  </span>
                  <span className="text-xs font-bold text-text-muted tracking-widest mt-1 uppercase">Next Candle Prediction</span>
                </div>
              </div>

              {/* Countdown Bar */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm text-text-muted">Time Remaining</div>
                  <div className="text-2xl font-mono font-bold">{countdown}s</div>
                </div>
                <div className="w-full bg-background rounded-full h-3 mt-1 overflow-hidden shadow-inner">
                  <div 
                    className="bg-primary h-full transition-all duration-1000 linear rounded-full"
                    style={{ width: `\${(countdown / activeSignal.duration) * 100}%` }}
                  />
                </div>
              </div>
              
              <button 
                onClick={() => {
                  setActiveSignal(null);
                  setRawAiData(null);
                  setCountdown(0);
                }}
                className="mt-2 w-full py-3 rounded-lg font-bold text-sm bg-white/5 hover:bg-white/10 transition-colors border border-white/10 text-text-muted hover:text-text"
              >
                SKIP / RE-ANALYZE
              </button>
            </div>
          </div>
        )}
      </div>

      {/* AI DASHBOARD CARDS (Collapsible/Grid for Mobile) */}
      {rawAiData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-bottom-4 duration-500">
          
          <div className="glass-card p-4 border border-white/10 flex gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-xs text-text-muted uppercase tracking-wider font-bold mb-1">Signal Strength</div>
              <div className={`text-lg font-bold \${getConfidenceColor(rawAiData.Confidence)}`}>
                {rawAiData.Signal_Strength || 'N/A'} ({rawAiData.Confidence}%)
              </div>
            </div>
          </div>

          <div className="glass-card p-4 border border-white/10 flex gap-4">
            <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <div>
              <div className="text-xs text-text-muted uppercase tracking-wider font-bold mb-1">Market Trend</div>
              <div className="text-sm font-medium leading-snug">{rawAiData.Trend}</div>
            </div>
          </div>

          <div className="glass-card p-4 border border-white/10 flex gap-4 md:col-span-2">
            <div className="w-10 h-10 rounded-lg bg-info/20 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5 text-info" />
            </div>
            <div>
              <div className="text-xs text-text-muted uppercase tracking-wider font-bold mb-1">Market Structure & Price Action</div>
              <div className="text-sm text-text/90 leading-relaxed">{rawAiData.Market_Structure}</div>
            </div>
          </div>

          <div className="glass-card p-4 border border-white/10 flex gap-4">
            <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center shrink-0">
              <Newspaper className="w-5 h-5 text-warning" />
            </div>
            <div>
              <div className="text-xs text-text-muted uppercase tracking-wider font-bold mb-1">News & Sentiment Bias</div>
              <div className="text-sm font-medium">{rawAiData.News_Bias}</div>
            </div>
          </div>

          <div className="glass-card p-4 border border-white/10 flex gap-4">
            <div className="w-10 h-10 rounded-lg bg-danger/20 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-danger" />
            </div>
            <div>
              <div className="text-xs text-text-muted uppercase tracking-wider font-bold mb-1">Risk & Zones</div>
              <div className="text-xs text-text/80 space-y-1">
                <div><span className="text-text-muted">Risk:</span> <span className="font-bold text-white">{rawAiData.Risk}</span></div>
                <div><span className="text-text-muted">Entry:</span> <span className="font-mono">{rawAiData.Entry_Zone}</span></div>
                <div><span className="text-text-muted">TP / SL:</span> <span className="font-mono">{rawAiData.Take_Profit} / {rawAiData.Stop_Loss}</span></div>
              </div>
            </div>
          </div>

          <div className="glass-card p-4 border border-white/10 flex flex-col gap-2 md:col-span-2 bg-primary/5">
            <div className="flex gap-3 items-center border-b border-white/10 pb-2 mb-1">
              <Search className="w-4 h-4 text-primary" />
              <div className="text-xs text-primary uppercase tracking-wider font-bold">AI Execution Reasoning</div>
            </div>
            <div className="text-sm text-text/90 leading-relaxed">{rawAiData.Reason}</div>
          </div>

        </div>
      )}
    </div>
  );
};
