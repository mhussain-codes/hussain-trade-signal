import { Header } from '../components/Header';
import { Shield, BrainCircuit, LineChart, Newspaper } from 'lucide-react';

export const About = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header title="About" />
      
      <div className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full flex flex-col gap-12">
        
        <div className="text-center space-y-4 mt-8">
          <img src="/logo.jpg" alt="HTS Logo" className="w-24 h-24 mx-auto rounded-2xl border-2 border-primary/20 shadow-[0_0_30px_rgba(234,179,8,0.15)]" />
          <h1 className="text-4xl font-bold">Hussain Trade Signal</h1>
          <p className="text-xl text-text-muted max-w-2xl mx-auto leading-relaxed">
            Hussain Trade Signal is an educational AI-powered market analysis platform designed to help users explore XAU/USD price movement, market news, sentiment and short-term AI-generated signals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-6 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-bold text-lg">AI Analysis</h3>
            <p className="text-sm text-text-muted leading-relaxed">
              Utilizing advanced language models to analyze short-term market conditions and generate directional insights.
            </p>
          </div>
          
          <div className="glass-card p-6 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <LineChart className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-bold text-lg">Live Market Data</h3>
            <p className="text-sm text-text-muted leading-relaxed">
              Track XAU/USD in real-time with responsive charts and critical market metrics to contextualize signals.
            </p>
          </div>

          <div className="glass-card p-6 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Newspaper className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-bold text-lg">News Intelligence</h3>
            <p className="text-sm text-text-muted leading-relaxed">
              Aggregate the latest financial news and automatically extract bullish, bearish, and neutral factors.
            </p>
          </div>

          <div className="glass-card p-6 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-bold text-lg">Educational Research</h3>
            <p className="text-sm text-text-muted leading-relaxed">
              Built specifically for research and learning. Track AI performance objectively without financial risk.
            </p>
          </div>
        </div>
        
        <div className="glass-card p-6 border-primary/20 bg-primary/5">
          <h3 className="font-bold text-primary mb-2 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Important Disclaimer
          </h3>
          <p className="text-sm text-text-muted leading-relaxed">
            Hussain Trade Signal is an educational and research platform. AI-generated signals are opinions based on available data and news. They are not financial advice, and no result or prediction is guaranteed. Do not use this platform to make real financial decisions.
          </p>
        </div>

      </div>
    </div>
  );
};
