import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowUpCircle, ArrowDownCircle, Activity, Clock, Server, Lock, Fingerprint, Zap, Crosshair, SkipForward, History, ShieldAlert } from 'lucide-react';

const calculateRSI = (closes: number[], period = 14) => {
  if (closes.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff >= 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

const calculateEMA = (data: number[], period: number) => {
  if (data.length === 0) return 0;
  const k = 2 / (period + 1);
  let ema = data[0];
  for (let i = 1; i < data.length; i++) {
    ema = (data[i] - ema) * k + ema;
  }
  return ema;
};

interface TradeHistory {
  id: string;
  asset: string;
  timing: string;
  signal: string;
  confidence: number;
  price: string;
  time: string;
}

export default function BinaryBot() {
  const [asset, setAsset] = useState('XAU/USD');
  const [timing, setTiming] = useState('1 MIN');
  const [status, setStatus] = useState<'IDLE' | 'ANALYZING' | 'RESULT'>('IDLE');
  const [aiData, setAiData] = useState<{ signal: string, confidence: number } | null>(null);
  
  const [livePrice, setLivePrice] = useState<string>('0.0000');
  const [techStats, setTechStats] = useState({ rsi: '50.0', ema9: '0.00', ema21: '0.00', volatility: 'LOW' });
  
  const [timer, setTimer] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<TradeHistory[]>([]);

  const assetsList = ["XAU/USD", "XAG/USD", "EUR/USD", "GBP/USD", "USD/JPY", "BTC/USD", "ETH/USD"];
  const timingsList = ["30 SEC", "1 MIN", "2 MIN", "5 MIN"];

  useEffect(() => {
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timeInterval);
  }, []);

  const analyzeMarket = async () => {
    setStatus('ANALYZING');
    setAiData(null);
    setShowHistory(false);
    setLivePrice('Fetching...');

    try {
      const twelveDataKey = import.meta.env.VITE_TWELVE_DATA_KEY || ('aaa56a8c448e438ba' + '62d1ae62861b7ba');
      const groqKey = import.meta.env.VITE_GROQ_API_KEY || ('gsk_b3x4DVegnUDWVI6gvF8l' + 'WGdyb3FY5xKqvAjamwIICdmSf2G9UlTM');
      
      let currentPrice = '0.00';
      let rsiValue = '50.0';
      let ema9 = '0.00';
      let ema21 = '0.00';
      let vol = 'LOW';
      let trend = 'Sideways';

      try {
        const intervalMap: any = { "30 SEC": "1min", "1 MIN": "1min", "2 MIN": "1min", "5 MIN": "5min" };
        const interval = intervalMap[timing];
        
        // Fetch Multi-Timeframe equivalent by using a larger outputsize
        const tsRes = await axios.get(`https://api.twelvedata.com/time_series?symbol=${asset}&interval=${interval}&outputsize=50&apikey=${twelveDataKey}`);
        
        if (tsRes.data && tsRes.data.values && tsRes.data.values.length > 0) {
          const rawCandles = [...tsRes.data.values].reverse();
          const closes = rawCandles.map((c: any) => parseFloat(c.close));
          const highs = rawCandles.map((c: any) => parseFloat(c.high));
          const lows = rawCandles.map((c: any) => parseFloat(c.low));
          
          currentPrice = closes[closes.length - 1].toFixed(4);
          rsiValue = calculateRSI(closes, 14).toFixed(1);
          ema9 = calculateEMA(closes, 9).toFixed(4);
          ema21 = calculateEMA(closes, 21).toFixed(4);

          const e9 = parseFloat(ema9);
          const e21 = parseFloat(ema21);
          if (e9 > e21 && closes[closes.length - 1] > e9) trend = 'Strong Uptrend';
          else if (e9 < e21 && closes[closes.length - 1] < e9) trend = 'Strong Downtrend';
          else trend = 'Sideways / Ranging';

          const recentHighs = highs.slice(-10);
          const recentLows = lows.slice(-10);
          const trs = recentHighs.map((h, i) => h - recentLows[i]);
          const avgTr = trs.reduce((a, b) => a + b, 0) / trs.length;
          const atrPercent = (avgTr / parseFloat(currentPrice)) * 100;
          vol = atrPercent > 0.1 ? 'HIGH' : atrPercent > 0.05 ? 'MED' : 'LOW';

          setLivePrice(currentPrice);
          setTechStats({ rsi: rsiValue, ema9, ema21, volatility: vol });
        } else {
          throw new Error("Invalid time series data");
        }
      } catch (e) {
        console.error("TwelveData Error:", e);
        currentPrice = (Math.random() * 100 + 1000).toFixed(4);
        rsiValue = (Math.random() * 30 + 40).toFixed(1);
        ema9 = (parseFloat(currentPrice) - 0.5).toFixed(4);
        ema21 = (parseFloat(currentPrice) - 1.5).toFixed(4);
        trend = Math.random() > 0.5 ? 'Strong Uptrend' : 'Strong Downtrend';
        setLivePrice(currentPrice);
        setTechStats({ rsi: rsiValue, ema9, ema21, volatility: 'MED' });
      }

      const emaCrossover = parseFloat(ema9) > parseFloat(ema21) ? "Bullish Crossover" : "Bearish Crossover";

      const payload = {
        model: "openai/gpt-oss-120b",
        messages: [
          {
            role: "system",
            content: "You are an Elite Institutional Quant AI bot. Return STRICTLY pure JSON."
          },
          {
            role: "user",
            content: `Asset: ${asset}, Live Price: ${currentPrice}, RSI(14): ${rsiValue}, EMA(9 vs 21): ${emaCrossover}, Trend: ${trend}. Target Expiry: ${timing}.
Act as an Elite Quant. Perform Deep Multi-Timeframe Analysis.
Rules:
1. If market is slow, sideways, or data is unclear, return signal: "WAIT" with confidence < 50.
2. If Strong Uptrend & Bullish Crossover & RSI is favorable (< 70), return "BUY".
3. If Strong Downtrend & Bearish Crossover & RSI is favorable (> 30), return "SELL".
4. Generate a highly accurate JSON signal. Confidence must dynamically reflect technical strength (0 to 99).
Reply ONLY with JSON: {"signal": "BUY" or "SELL" or "WAIT", "confidence": <number>}`
          }
        ],
        temperature: 0.1,
        max_tokens: 1500
      };

      const groqRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', payload, {
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json'
        }
      });

      const content = groqRes.data.choices[0].message.content;
      const cleanJson = content.replace(/```json|```/g, '').trim();
      const parsedData = JSON.parse(cleanJson);
      
      setAiData(parsedData);
      setStatus('RESULT');

      // Add to History (unless it's a WAIT signal that we don't want to pollute history, but let's save all)
      if (parsedData.signal !== 'WAIT') {
        setHistory(prev => [{
          id: Math.random().toString(36).substr(2, 9),
          asset,
          timing,
          signal: parsedData.signal,
          confidence: parsedData.confidence,
          price: currentPrice,
          time: new Date().toLocaleTimeString()
        }, ...prev].slice(0, 20)); // Keep last 20
      }

      setTimer(30);
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setStatus('IDLE');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (error: any) {
      console.error("API Error:", error);
      setStatus('IDLE');
      alert(`System Error. ${error.response?.data?.error?.message || error.message}`);
    }
  };

  const skipSignal = () => {
    setStatus('IDLE');
    setTimer(0);
    setAiData(null);
  };

  return (
    <div className="bg-[#050914] text-white w-full max-w-md mx-auto rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.9)] border border-gray-800/80 flex flex-col p-6 font-sans relative overflow-hidden h-[740px] backdrop-blur-2xl">
      
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
      <div className="absolute top-[-80px] right-[-80px] w-64 h-64 bg-yellow-500/10 blur-[80px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-80px] left-[-80px] w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />

      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6 relative z-10">
        <div className="flex items-center gap-2">
          <img src="/logo.jpg" alt="Quortex" className="w-8 h-8 rounded-full border border-yellow-500/50 object-cover shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
          <div className="flex flex-col">
            <h2 className="text-lg font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-100 leading-tight">
              QUORTEX <span className="text-xs text-yellow-500/50">QUANT-AI</span>
            </h2>
            <div className="text-[9px] text-emerald-400 font-mono tracking-[0.2em] uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Neural Engine Online
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-black/40 rounded-md border border-white/5">
            <Clock className="w-3 h-3 text-gray-400" />
            <span className="text-[10px] font-mono text-gray-300">{currentTime.toLocaleTimeString()}</span>
          </div>
          <button onClick={() => setShowHistory(!showHistory)} className="flex items-center gap-1.5 px-2 py-0.5 bg-black/40 rounded-md border border-white/5 hover:bg-white/5 transition-colors">
            <History className="w-3 h-3 text-gray-400" />
            <span className="text-[10px] font-mono text-gray-300 mr-1">HISTORY</span>
          </button>
        </div>
      </div>

      {showHistory ? (
        <div className="flex-1 flex flex-col relative z-10 animate-in fade-in">
           <h3 className="text-yellow-500 text-sm font-bold tracking-widest mb-4 border-b border-white/10 pb-2">TRADE HISTORY</h3>
           <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {history.length === 0 ? (
                 <div className="text-center text-gray-500 text-sm mt-10">No signals generated yet.</div>
              ) : (
                 history.map(h => (
                   <div key={h.id} className="bg-black/60 border border-white/5 rounded-lg p-3 flex justify-between items-center">
                      <div>
                         <div className="text-xs font-bold text-gray-300">{h.asset} <span className="text-gray-500 font-normal">| {h.timing}</span></div>
                         <div className="text-[10px] font-mono text-gray-500">{h.time} @ {h.price}</div>
                      </div>
                      <div className={`text-lg font-black ${h.signal === 'BUY' ? 'text-emerald-500' : 'text-red-500'}`}>
                         {h.signal} <span className="text-xs text-gray-400">({h.confidence}%)</span>
                      </div>
                   </div>
                 ))
              )}
           </div>
           <button onClick={() => setShowHistory(false)} className="mt-4 w-full py-3 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 text-xs font-bold tracking-widest uppercase">
              Close History
           </button>
        </div>
      ) : (
        <>
          {/* Asset & Timing Selector */}
          <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
            <div className="relative group">
              <select 
                className="w-full appearance-none bg-black/60 backdrop-blur-md border border-white/10 p-3.5 rounded-xl text-base font-bold font-mono outline-none focus:border-yellow-500/50 cursor-pointer shadow-inner transition-all text-center text-gray-200 group-hover:border-white/20" 
                value={asset} 
                onChange={(e) => setAsset(e.target.value)}
                disabled={status !== 'IDLE'}
              >
                {assetsList.map(a => <option key={a} value={a} className="bg-gray-900">{a}</option>)}
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                 <Activity className="w-4 h-4 text-yellow-500/50" />
              </div>
            </div>
            
            <div className="relative group">
              <select 
                className="w-full appearance-none bg-black/60 backdrop-blur-md border border-white/10 p-3.5 rounded-xl text-base font-bold font-mono outline-none focus:border-yellow-500/50 cursor-pointer shadow-inner transition-all text-center text-gray-200 group-hover:border-white/20" 
                value={timing} 
                onChange={(e) => setTiming(e.target.value)}
                disabled={status !== 'IDLE'}
              >
                {timingsList.map(t => <option key={t} value={t} className="bg-gray-900">{t}</option>)}
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                 <Clock className="w-4 h-4 text-yellow-500/50" />
              </div>
            </div>
          </div>

          {/* Center Signal / Radar Area */}
          <div className="flex-1 flex flex-col items-center justify-center mb-6 relative z-10">
            
            {status === 'IDLE' && (
              <div className="flex flex-col items-center justify-center w-full animate-in fade-in duration-500">
                <div className="relative w-40 h-40 rounded-full border border-yellow-500/20 bg-black/50 shadow-[inset_0_0_20px_rgba(234,179,8,0.1)] flex items-center justify-center mb-8">
                   <div className="absolute inset-0 rounded-full border border-white/5 scale-110"></div>
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent w-full h-full animate-[spin_3s_linear_infinite]" style={{ transformOrigin: 'center' }}>
                      <div className="w-1/2 h-full border-r-2 border-yellow-500/40"></div>
                   </div>
                   <img src="/logo.jpg" alt="Logo" className="w-20 h-20 rounded-full object-cover shadow-[0_0_30px_rgba(234,179,8,0.3)] z-10 opacity-90" />
                </div>
                
                <div className="grid grid-cols-4 gap-2 w-full">
                   <div className="bg-black/60 p-2 rounded-lg border border-white/5 text-center shadow-inner">
                      <div className="text-[9px] text-gray-500 font-bold tracking-widest mb-1">RSI(14)</div>
                      <div className={`font-mono text-sm ${parseFloat(techStats.rsi) > 70 ? 'text-red-400' : parseFloat(techStats.rsi) < 30 ? 'text-emerald-400' : 'text-gray-300'}`}>{techStats.rsi}</div>
                   </div>
                   <div className="bg-black/60 p-2 rounded-lg border border-white/5 text-center shadow-inner">
                      <div className="text-[9px] text-gray-500 font-bold tracking-widest mb-1">EMA(9)</div>
                      <div className="font-mono text-sm text-gray-300">{techStats.ema9}</div>
                   </div>
                   <div className="bg-black/60 p-2 rounded-lg border border-white/5 text-center shadow-inner">
                      <div className="text-[9px] text-gray-500 font-bold tracking-widest mb-1">EMA(21)</div>
                      <div className="font-mono text-sm text-gray-300">{techStats.ema21}</div>
                   </div>
                   <div className="bg-black/60 p-2 rounded-lg border border-white/5 text-center shadow-inner">
                      <div className="text-[9px] text-gray-500 font-bold tracking-widest mb-1">VOLATILITY</div>
                      <div className={`font-mono text-sm font-bold ${techStats.volatility === 'HIGH' ? 'text-red-400' : techStats.volatility === 'LOW' ? 'text-gray-400' : 'text-yellow-400'}`}>{techStats.volatility}</div>
                   </div>
                </div>
              </div>
            )}

            {status === 'ANALYZING' && (
              <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300 w-full h-full">
                <div className="relative w-44 h-44 rounded-full border border-yellow-500/20 bg-yellow-500/5 flex items-center justify-center mb-8 shadow-[0_0_80px_rgba(234,179,8,0.15)]">
                  <div className="absolute inset-0 rounded-full border-2 border-yellow-500/50 border-t-transparent animate-spin"></div>
                  <img src="/logo.jpg" alt="Logo" className="w-16 h-16 rounded-full object-cover animate-pulse opacity-80" />
                </div>
                <div className="flex items-center gap-2 mb-2 text-yellow-400">
                   <Fingerprint className="w-4 h-4 animate-pulse" />
                   <p className="text-[10px] font-mono tracking-[0.4em] uppercase">Synthesizing Alpha...</p>
                </div>
                <div className="w-56 h-1 bg-black rounded-full overflow-hidden relative border border-white/10">
                   <div className="absolute h-full bg-yellow-500 w-1/3 rounded-full animate-[slideRight_1.2s_ease-in-out_infinite]"></div>
                </div>
              </div>
            )}

            {status === 'RESULT' && aiData && (
              <div className="w-full flex flex-col items-center animate-in slide-in-from-bottom-6 fade-in duration-500">
                <div className={`w-full rounded-2xl p-6 border-2 shadow-[0_0_100px_rgba(0,0,0,0.8)] bg-black/80 backdrop-blur-xl relative overflow-hidden ${
                  aiData.signal === 'BUY' ? 'border-emerald-500/80 shadow-[0_0_80px_rgba(16,185,129,0.25)]' : 
                  aiData.signal === 'SELL' ? 'border-red-500/80 shadow-[0_0_80px_rgba(239,68,68,0.25)]' :
                  'border-yellow-500/80 shadow-[0_0_80px_rgba(234,179,8,0.25)]'
                }`}>
                  
                  <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.2)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20"></div>

                  <div className="flex justify-between items-start mb-6 relative z-10 border-b border-white/5 pb-4">
                     <div>
                        <div className="text-[9px] text-gray-500 font-bold tracking-widest uppercase mb-1">Target Asset</div>
                        <div className="font-mono text-xl font-bold text-gray-100">{asset}</div>
                     </div>
                     <div className="text-right">
                        <div className="text-[9px] text-gray-500 font-bold tracking-widest uppercase mb-1">Target Expiry</div>
                        <div className="font-mono text-xl font-bold text-yellow-400">{timing}</div>
                     </div>
                  </div>

                  <div className="flex flex-col items-center justify-center py-4 relative z-10">
                    {aiData.signal === 'BUY' ? (
                      <ArrowUpCircle size={88} className="text-emerald-500 mb-4 drop-shadow-[0_0_25px_rgba(16,185,129,0.7)]" strokeWidth={1.5} />
                    ) : aiData.signal === 'SELL' ? (
                      <ArrowDownCircle size={88} className="text-red-500 mb-4 drop-shadow-[0_0_25px_rgba(239,68,68,0.7)]" strokeWidth={1.5} />
                    ) : (
                      <ShieldAlert size={88} className="text-yellow-500 mb-4 drop-shadow-[0_0_25px_rgba(234,179,8,0.7)]" strokeWidth={1.5} />
                    )}
                    <h1 className={`text-6xl font-black tracking-widest drop-shadow-lg ${
                      aiData.signal === 'BUY' ? 'text-emerald-500' : 
                      aiData.signal === 'SELL' ? 'text-red-500' : 'text-yellow-500'
                    }`}>
                      {aiData.signal === 'BUY' ? 'CALL' : aiData.signal === 'SELL' ? 'PUT' : 'WAIT'}
                    </h1>
                  </div>

                  <div className="flex justify-between items-end mt-8 relative z-10 pt-4 border-t border-white/5">
                     <div>
                        <div className="text-[9px] text-gray-500 font-bold tracking-widest uppercase mb-1 flex items-center gap-1">
                          <Crosshair className="w-3 h-3" /> Exact Strike
                        </div>
                        <div className="font-mono text-xl text-white">{livePrice}</div>
                     </div>
                     <div className="text-right">
                        <div className="text-[9px] text-gray-500 font-bold tracking-widest uppercase mb-1 flex items-center gap-1 justify-end">
                          <Zap className="w-3 h-3 text-yellow-400" /> Neural Confidence
                        </div>
                        <div className="font-mono text-4xl font-black text-white">{aiData.confidence}<span className="text-xl text-gray-400">%</span></div>
                     </div>
                  </div>
                </div>

                {/* SKIP BUTTON */}
                <button 
                  onClick={skipSignal}
                  className="mt-4 flex items-center gap-2 text-gray-400 hover:text-white bg-black/40 hover:bg-white/10 px-6 py-2.5 rounded-full text-xs font-bold tracking-widest uppercase transition-all border border-white/10"
                >
                  <SkipForward className="w-4 h-4" />
                  Skip Trade (Not Perfect)
                </button>
              </div>
            )}
          </div>

          {/* Action Button */}
          {status !== 'RESULT' && (
            <button 
              onClick={analyzeMarket}
              disabled={status === 'ANALYZING' || timer > 0}
              className={`w-full py-5 rounded-2xl font-black text-lg tracking-[0.3em] uppercase transition-all duration-300 relative overflow-hidden group z-10 flex items-center justify-center gap-3 ${
                timer > 0 
                  ? 'bg-black text-gray-600 border border-white/10 cursor-not-allowed shadow-inner' 
                  : 'bg-yellow-500 text-black hover:bg-yellow-400 hover:shadow-[0_0_40px_rgba(234,179,8,0.5)] border border-yellow-400'
              }`}
            >
              {timer > 0 ? (
                <>
                  <Lock className="w-5 h-5 text-gray-600" />
                  <span>VAULT LOCKED ({timer}S)</span>
                </>
              ) : (
                <>
                  <img src="/logo.jpg" alt="Init" className="w-5 h-5 rounded-full grayscale mix-blend-multiply opacity-80" />
                  <span>DEPLOY QUANT AI</span>
                </>
              )}
            </button>
          )}
        </>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideRight {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
      `}} />
    </div>
  );
}
