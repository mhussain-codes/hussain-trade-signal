import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, Time, CandlestickSeries } from 'lightweight-charts';
import { useMarketStore } from '../store/useMarketStore';

export const Chart = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  
  const { priceHistory, currentPrice } = useMarketStore();
  const [timeframe, setTimeframe] = useState('1m');

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9CA3AF',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 1, // Magnet
      }
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10B981',
      downColor: '#EF4444',
      borderVisible: false,
      wickUpColor: '#10B981',
      wickDownColor: '#EF4444',
    });

    // Formatting for lightweight charts requires specific Time type
    // Since our simulator creates times, we need to map them properly
    const formattedData = priceHistory.map(p => ({
      time: p.time as Time,
      open: p.open,
      high: p.high,
      low: p.low,
      close: p.close
    })).filter((v, i, a) => a.findIndex(t => t.time === v.time) === i); // Ensure unique times

    // Sort to ensure chronological order which Lightweight Charts strictly requires
    formattedData.sort((a, b) => (a.time as number) - (b.time as number));

    try {
        if(formattedData.length > 0) {
            candlestickSeries.setData(formattedData);
        }
    } catch(e) {
        console.error("Chart error:", e);
    }

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []); // Only run once to mount

  // Update chart when new price points arrive
  useEffect(() => {
    if (seriesRef.current && priceHistory.length > 0) {
      const latest = priceHistory[priceHistory.length - 1];
      try {
          seriesRef.current.update({
            time: latest.time as Time,
            open: latest.open,
            high: latest.high,
            low: latest.low,
            close: latest.close
          });
      } catch (e) {
          // Ignore duplicate time updates
      }
    }
  }, [priceHistory]);

  const timeframes = ['1m', '5m', '15m', '1h', '4h', '1D'];

  return (
    <div className="glass-card p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          XAU/USD Live Analysis
        </h3>
        
        <div className="flex gap-1 hidden md:flex">
          {timeframes.map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 text-sm rounded transition-colors \${
                timeframe === tf 
                  ? 'bg-primary text-background font-medium' 
                  : 'text-text-muted hover:text-text hover:bg-white/5'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>
      
      <div 
        ref={chartContainerRef} 
        className="w-full relative rounded-lg overflow-hidden border border-white/5" 
        style={{ minHeight: '450px' }}
      >
        <div className="absolute top-4 left-4 z-10 flex flex-col">
           <span className="text-3xl font-bold font-mono text-white tracking-wider">${currentPrice.toFixed(2)}</span>
           <span className="text-sm text-primary font-medium tracking-widest uppercase">Gold Spot / US Dollar</span>
        </div>

        {/* AI CHART ANALYSIS OVERLAY */}
        <div className="absolute top-4 right-4 z-10 hidden md:flex flex-col gap-2 bg-background/80 backdrop-blur-md p-3 rounded-lg border border-white/10 w-48 shadow-xl">
           <div className="text-xs text-text-muted font-bold uppercase border-b border-white/10 pb-1 mb-1">Market Structure</div>
           <div className="flex justify-between text-xs">
              <span className="text-text-muted">Trend</span>
              <span className="text-success font-bold">BULLISH</span>
           </div>
           <div className="flex justify-between text-xs">
              <span className="text-text-muted">Resistance</span>
              <span className="font-mono">{(currentPrice + 12.5).toFixed(2)}</span>
           </div>
           <div className="flex justify-between text-xs">
              <span className="text-text-muted">Support</span>
              <span className="font-mono">{(currentPrice - 8.3).toFixed(2)}</span>
           </div>
           <div className="flex justify-between text-xs">
              <span className="text-text-muted">Momentum</span>
              <span className="text-primary font-bold">STRONG</span>
           </div>
           <div className="flex justify-between text-xs">
              <span className="text-text-muted">Volatility</span>
              <span className="text-warning font-bold">ELEVATED</span>
           </div>
        </div>
      </div>
    </div>
  );
};
