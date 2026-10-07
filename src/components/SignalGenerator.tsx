import { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useMarketStore } from '../store/useMarketStore';
import { generateSignal } from '../services/aiService';
import { ArrowUpCircle, ArrowDownCircle, MinusCircle, AlertCircle, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid'; // need to install uuid or just use Date.now().toString()

export const SignalGenerator = () => {
  const { licenseKey, defaultDuration, addSignal, updateSignal } = useAppStore();
  const { currentPrice } = useMarketStore();
  
  const [duration, setDuration] = useState(defaultDuration);
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
      const result = await generateSignal(licenseKey, duration, currentPrice);
      
      const newSignal = {
        id: Date.now().toString(),
        time: Date.now(),
        price: currentPrice,
        entryPrice: currentPrice,
        direction: result.direction,
        confidence: result.confidence,
        duration: result.duration,
        strength: result.strength,
        sentiment: result.sentiment,
        status: 'Pending' as const
      };
      
      addSignal(newSignal);
      setActiveSignal({...result, entryPrice: currentPrice, id: newSignal.id});
      setCountdown(duration);
      
    } catch (err: any) {
      console.error("Backend Error:", err);
      setError(err.message || "Failed to generate signal");
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
            // Signal completed
            clearInterval(timer);
            // Check result
            const exitPrice = useMarketStore.getState().currentPrice;
            const entry = activeSignal.entryPrice;
            let res: any = 'Unable to verify';
            
            if (activeSignal.direction === 'UP') {
              res = exitPrice > entry ? 'Direction moved UP' : 'Direction moved DOWN';
            } else {
              res = exitPrice < entry ? 'Direction moved DOWN' : 'Direction moved UP';
            }
            
            updateSignal(activeSignal.id, { 
              status: 'Completed', 
              exitPrice,
              result: res 
            });
            
            // clear active after a short delay
            setTimeout(() => {
                setActiveSignal(null);
            }, 5000);
            
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
    if (conf >= 60) return 'text-primary';
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
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-text-muted">Select Duration:</label>
            <div className="grid grid-cols-3 gap-2">
              {[10, 15, 30].map(d => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`py-2 rounded-lg border transition-all \${
                    duration === d 
                      ? 'border-primary bg-primary/10 text-primary font-bold' 
                      : 'border-white/10 hover:border-white/20 text-text-muted'
                  }`}
                >
                  {d} Seconds
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-4 rounded-xl font-bold text-lg bg-primary text-background hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 className="w-6 h-6 animate-spin" /> Analyzing market conditions...</>
            ) : (
              'GENERATE SIGNAL'
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
                <div className="text-xs text-text-muted mb-1">Signal Strength</div>
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

            {/* AI REASONING PANEL */}
            <div className="mt-6 bg-background/30 rounded-xl border border-white/10 p-4 text-left">
              <h3 className="text-sm font-bold text-primary mb-3">AI Reasoning Panel</h3>
              <p className="text-sm text-text-muted mb-4">{activeSignal.reason}</p>
              
              <div className="space-y-3">
                {activeSignal.bullishFactors && activeSignal.bullishFactors.length > 0 && (
                  <div>
                    <span className="text-xs font-bold text-success uppercase">Bullish Factors:</span>
                    <ul className="list-disc list-inside text-xs text-text-muted mt-1">
                      {activeSignal.bullishFactors.map((f: string, i: number) => <li key={i}>{f}</li>)}
                    </ul>
                  </div>
                )}
                {activeSignal.bearishFactors && activeSignal.bearishFactors.length > 0 && (
                  <div>
                    <span className="text-xs font-bold text-danger uppercase">Bearish Factors:</span>
                    <ul className="list-disc list-inside text-xs text-text-muted mt-1">
                      {activeSignal.bearishFactors.map((f: string, i: number) => <li key={i}>{f}</li>)}
                    </ul>
                  </div>
                )}
                {activeSignal.technicalImpact && (
                  <div>
                    <span className="text-xs font-bold text-primary uppercase">Technical Impact:</span>
                    <p className="text-xs text-text-muted mt-1">{activeSignal.technicalImpact}</p>
                  </div>
                )}
                {activeSignal.newsImpact && (
                  <div>
                    <span className="text-xs font-bold text-primary uppercase">News Impact:</span>
                    <p className="text-xs text-text-muted mt-1">{activeSignal.newsImpact}</p>
                  </div>
                )}
              </div>
            </div>
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
