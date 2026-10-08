import { useMarketStore } from '../store/useMarketStore';
import { useAppStore, SUPPORTED_ASSETS } from '../store/useAppStore';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { CircleUser, Clock, LayoutGrid } from 'lucide-react';

export const Header = ({ title }: { title: string }) => {
  const { currentPrice, dailyChange, dailyChangePercent } = useMarketStore();
  const { defaultDuration, setDefaultDuration, activeAsset, setActiveAsset } = useAppStore();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isUp = dailyChange >= 0;

  return (
    <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-white/5 p-4 md:px-8 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold hidden sm:block">{title}</h2>
        
        {/* Asset Selector */}
        <div className="flex items-center gap-2 bg-card border border-white/5 px-2 md:px-3 py-1.5 rounded-lg">
          <LayoutGrid className="w-4 h-4 text-primary hidden md:block" />
          <select 
            value={activeAsset.symbol}
            onChange={(e) => {
              const asset = SUPPORTED_ASSETS.find(a => a.symbol === e.target.value);
              if (asset) setActiveAsset(asset);
            }}
            className="bg-transparent text-xs md:text-sm font-medium focus:outline-none cursor-pointer text-white w-20 md:w-auto"
          >
            {SUPPORTED_ASSETS.map(asset => (
              <option key={asset.symbol} value={asset.symbol} className="bg-background">
                {asset.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 bg-card border border-white/5 px-3 py-1.5 rounded-full hidden sm:flex">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
          <span className="text-sm font-mono font-bold">${currentPrice.toFixed(2)}</span>
          <span className={`text-xs font-medium ${isUp ? 'text-success' : 'text-danger'}`}>
            {isUp ? '+' : ''}{dailyChange.toFixed(2)} ({isUp ? '+' : ''}{dailyChangePercent.toFixed(2)}%)
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Duration Selector for Quotex Mode */}
        <div className="flex items-center gap-2 bg-card border border-white/5 px-2 md:px-3 py-1.5 rounded-lg">
          <Clock className="w-4 h-4 text-primary hidden md:block" />
          <select 
            value={defaultDuration}
            onChange={(e) => setDefaultDuration(Number(e.target.value))}
            className="bg-transparent text-xs md:text-sm font-medium focus:outline-none cursor-pointer"
          >
            <option value={30} className="bg-background">30 Sec</option>
            <option value={60} className="bg-background">1 Min</option>
            <option value={300} className="bg-background">5 Min</option>
          </select>
        </div>
        
        <div className="text-sm text-text-muted hidden lg:block">
          {format(time, 'MMM d, yyyy HH:mm:ss')}
        </div>
        <button className="w-8 h-8 rounded-full bg-card border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors">
          <CircleUser className="w-5 h-5 text-text-muted" />
        </button>
      </div>
    </div>
  );
};
