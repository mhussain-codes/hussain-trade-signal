import { useMarketStore } from '../store/useMarketStore';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { CircleUser } from 'lucide-react';

export const Header = ({ title }: { title: string }) => {
  const { currentPrice, dailyChange, dailyChangePercent } = useMarketStore();
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
        <div className="sm:hidden font-bold">XAU/USD</div>
        <div className="flex items-center gap-2 bg-card border border-white/5 px-3 py-1.5 rounded-full">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
          <span className="text-sm font-mono font-bold">${currentPrice.toFixed(2)}</span>
          <span className={`text-xs font-medium \${isUp ? 'text-success' : 'text-danger'}`}>
            {isUp ? '+' : ''}{dailyChange.toFixed(2)} ({isUp ? '+' : ''}{dailyChangePercent.toFixed(2)}%)
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-sm text-text-muted hidden md:block">
          {format(time, 'MMM d, yyyy HH:mm:ss')}
        </div>
        <button className="w-8 h-8 rounded-full bg-card border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors">
          <CircleUser className="w-5 h-5 text-text-muted" />
        </button>
      </div>
    </div>
  );
};
