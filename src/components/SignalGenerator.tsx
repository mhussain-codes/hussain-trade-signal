import { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useMarketStore } from '../store/useMarketStore';
import { generateSignal } from '../services/aiService';
import { ArrowUpCircle, ArrowDownCircle, MinusCircle, AlertCircle, Loader2 } from 'lucide-react';

export const SignalGenerator = () => {
  const { licenseKey, addSignal, updateSignal } = useAppStore();
  const { currentPrice } = useMarketStore();
  const { defaultDuration } = useAppStore();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [activeSignal, setActiveSignal] = useState<any>(null);
  const [countdown, setCountdown] = useState<number>(0);

  const handleGenerate = async () => {
    if (!licenseKey) {
      setError("Please activate your License in Settings first.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setActiveSignal(null);
    
    try {
      const recentCandles = useMarketStore.getState().priceHistory.slice(-20);
      const res = await generateSignal(licenseKey, defaultDuration, currentPrice, recentCandles);
      
      const resultData = res.data;
      if (!resultData) throw new Error("Data unavailable");

      const direction = resultData.signal === 'BUY' ? 'UP' : resultData.signal === 'SELL' ? 'DOWN' : 'NEUTRAL';
      
      const newSignal = {
        id: resultData.id || Date.now().toString(),
        time: Date.now(),
        price: currentPrice,
        entryPrice: resultData.entry_price || currentPrice,
        direction: direction as 'UP' | 'DOWN' | 'NEUTRAL',
        confidence: resultData.confidence,
        duration: resultData.duration_seconds,
        strength: (resultData.risk || 'Medium') as 'Low' | 'Medium' | 'High' | 'Weak' | 'Strong' | 'None',
        sentiment: (direction === 'UP' ? 'Bullish' : direction === 'DOWN' ? 'Bearish' : 'Neutral') as 'Bullish' | 'Bearish' | 'Neutral',
        reason: resultData.reasoning,
        status: 'Pending' as const
      };
      
      addSignal(newSignal);
      setActiveSignal(newSignal);
      setCountdown(resultData.duration_seconds);
      
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
            setTimeout(() => { setActiveSignal(null); }, 5000);
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
    <div className="glass-card p-6 flex flex-col gap-6 relative overflow-hidden">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-primary mb-1">AI Trade Signal</h2>
        <p className="text-sm text-text-muted">Short-term educational market analysis</p>
      </div>

      {!activeSignal ? (
        <>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-4 rounded-xl font-bold text-lg bg-primary text-background hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 className="w-6 h-6 animate-spin" /> Analyzing market conditions...</>
            ) : (
              `GENERATE ${defaultDuration >= 60 ? defaultDuration / 60 : defaultDuration} ${defaultDuration >= 60 ? 'MIN' : 'SEC'} SIGNAL`
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
              <span className={`text-5xl font-bold \${
                activeSignal.direction === 'UP' ? 'text-success' 
                : activeSignal.direction === 'DOWN' ? 'text-danger' 
                : 'text-warning'
              }`}>
                {activeSignal.direction === 'NEUTRAL' ? 'NO CLEAR SIGNAL' : activeSignal.direction}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-6 text-left">
              <div className="bg-background/50 p-3 rounded-lg border border-white/5">
                <div className="text-xs text-text-muted mb-1">AI Confidence</div>
                <div className={`text-xl font-bold \${getConfidenceColor(activeSignal.confidence)}`}>
                  {activeSignal.confidence}%
                </div>
              </div>
              <div className="bg-background/50 p-3 rounded-lg border border-white/5">
                <div className="text-xs text-text-muted mb-1">Duration</div>
                <div className="text-xl font-bold">{activeSignal.duration}s</div>
              </div>
              <div className="bg-background/50 p-3 rounded-lg border border-white/5">
                <div className="text-xs text-text-muted mb-1">Risk Level</div>
                <div className="text-xl font-bold">{activeSignal.strength}</div>
              </div>
              <div className="bg-background/50 p-3 rounded-lg border border-white/5">
                <div className="text-xs text-text-muted mb-1">Entry Price</div>
                <div className="text-xl font-bold">${activeSignal.entryPrice.toFixed(2)}</div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="text-sm text-text-muted mb-2">Time Remaining</div>
              <div className="text-4xl font-mono font-bold">{countdown}s</div>
              <div className="w-full bg-background rounded-full h-2 mt-4 overflow-hidden">
                <div 
                  className="bg-primary h-full transition-all duration-1000 linear"
                  style={{ width: `\${(countdown / activeSignal.duration) * 100}%` }}
                />
              </div>
            </div>

            <div className="mt-6 bg-background/30 rounded-xl border border-white/10 p-4 text-left">
              <h3 className="text-sm font-bold text-primary mb-3">AI Reasoning Panel</h3>
              <p className="text-sm text-text-muted mb-4">{activeSignal.reason}</p>
            </div>
            
            <button 
              onClick={() => {
                setActiveSignal(null);
                setCountdown(0);
              }}
              className="mt-2 w-full py-3 rounded-lg font-bold text-sm bg-white/5 hover:bg-white/10 transition-colors border border-white/10 text-text-muted hover:text-text"
            >
              SKIP / NEW SIGNAL
            </button>
          </div>
        </div>
      )}

      <div className="mt-auto pt-6 border-t border-white/10 flex items-start gap-2 text-xs text-text-muted/60">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <p>Hussain Trade Signal is an educational platform. AI signals are not financial advice.</p>
      </div>
    </div>
  );
};
