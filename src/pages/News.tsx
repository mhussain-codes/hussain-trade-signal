import { Header } from '../components/Header';
import { fetchMarketIntelligence, MarketIntelligenceResult } from '../services/aiService';
import { useAppStore } from '../store/useAppStore';
import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, TrendingUp, TrendingDown, Activity, Globe } from 'lucide-react';

export const News = () => {
  const { licenseKey } = useAppStore();
  const [data, setData] = useState<MarketIntelligenceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!licenseKey) {
      setError("Activate license in settings to enable Market Intelligence");
      return;
    }

    const loadIntelligence = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchMarketIntelligence(licenseKey);
        setData(result);
      } catch (err: any) {
        setError(err.message || "Failed to load market intelligence");
      } finally {
        setLoading(false);
      }
    };

    loadIntelligence();
  }, [licenseKey]);

  const NewsCard = ({ item, color }: { item: any, color: string }) => (
    <div className="glass-card p-5 hover:bg-white/5 transition-colors">
      <div className="flex justify-between items-start gap-4 mb-3">
        <h3 className="font-bold text-lg leading-tight">{item.headline}</h3>
        <span className={`text-xs px-2 py-1 rounded font-bold shrink-0 ${color}`}>
          {item.importance}
        </span>
      </div>
      <p className="text-sm text-text-muted mb-4">{item.summary}</p>
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div>
          <span className="text-success font-bold block mb-1">BULLISH IMPACT</span>
          <p className="text-text-muted">{item.bullishImpact}</p>
        </div>
        <div>
          <span className="text-danger font-bold block mb-1">BEARISH IMPACT</span>
          <p className="text-text-muted">{item.bearishImpact}</p>
        </div>
      </div>
      <div className="mt-4 text-xs text-text-muted/60">{item.time}</div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Market Intelligence" />
      
      <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full flex flex-col gap-8">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-text-muted">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="animate-pulse">Aggregating & Analyzing Market Data...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-text-muted">
            <AlertCircle className="w-10 h-10 text-danger" />
            <p className="text-lg">{error}</p>
          </div>
        ) : data ? (
          <>
            <div className="glass-card p-6 border-l-4 border-l-primary">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-2"><Globe className="w-6 h-6 text-primary"/> Overall Narrative</h2>
              <p className="text-lg text-text-muted">{data.overallAnalysis}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* NEWS SECTION */}
              <div className="flex flex-col gap-6">
                <h2 className="text-2xl font-bold flex items-center gap-2"><Activity className="w-6 h-6"/> Live News Analysis</h2>
                
                {data.highImpact?.map((item, i) => <NewsCard key={i} item={item} color="bg-danger/20 text-danger" />)}
                {data.mediumImpact?.map((item, i) => <NewsCard key={i} item={item} color="bg-warning/20 text-warning" />)}
                {data.lowImpact?.map((item, i) => <NewsCard key={i} item={item} color="bg-primary/20 text-primary" />)}
              </div>

              {/* IMPACT ANALYSIS SECTION */}
              <div className="flex flex-col gap-6">
                <h2 className="text-2xl font-bold flex items-center gap-2"><TrendingUp className="w-6 h-6"/> XAU/USD Impact Analysis</h2>
                
                <div className="flex flex-col gap-4">
                  {data.impactAnalysis?.map((impact, i) => (
                    <div key={i} className="glass-card p-5">
                      <h3 className="font-bold text-lg mb-3">{impact.event}</h3>
                      <div className="space-y-3">
                        <div className="bg-background/50 p-3 rounded text-sm">
                          <span className="font-bold text-text-muted block mb-1">EXPECTED IMPACT</span>
                          {impact.expectedImpact}
                        </div>
                        <div className="bg-background/50 p-3 rounded text-sm">
                          <span className="font-bold text-text-muted block mb-1">ACTUAL IMPACT</span>
                          {impact.actualImpact}
                        </div>
                        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/10">
                          <div className="flex-1">
                            <div className="flex justify-between text-xs font-bold mb-1">
                              <span className="text-success">BULLISH SCORE</span>
                              <span>{impact.bullishScore}/10</span>
                            </div>
                            <div className="h-2 bg-background rounded-full overflow-hidden">
                              <div className="h-full bg-success" style={{ width: `\${impact.bullishScore * 10}%` }}></div>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between text-xs font-bold mb-1">
                              <span className="text-danger">BEARISH SCORE</span>
                              <span>{impact.bearishScore}/10</span>
                            </div>
                            <div className="h-2 bg-background rounded-full overflow-hidden">
                              <div className="h-full bg-danger" style={{ width: `\${impact.bearishScore * 10}%` }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : null}

      </div>
    </div>
  );
};
