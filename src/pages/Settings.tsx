import { useState } from 'react';
import { Header } from '../components/Header';
import { useAppStore } from '../store/useAppStore';
import { Key, Clock, Moon, ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';
import { verifyLicense } from '../services/aiService';

export const Settings = () => {
  const { 
    licenseKey, setLicenseKey, 
    isLicenseActive, setIsLicenseActive,
    refreshRate, setRefreshRate,
    defaultDuration, setDefaultDuration,
    theme, setTheme 
  } = useAppStore();

  const [localKey, setLocalKey] = useState(licenseKey);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const handleActivate = async () => {
    if (!localKey.trim()) {
      setMessage({ text: 'Please enter a license key', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await verifyLicense(localKey.trim());
      setLicenseKey(localKey.trim());
      setIsLicenseActive(true);
      setMessage({ text: 'License activated successfully!', type: 'success' });
    } catch (err: any) {
      setIsLicenseActive(false);
      setMessage({ text: err.message || 'Failed to activate license', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = () => {
    setLicenseKey('');
    setIsLicenseActive(false);
    setLocalKey('');
    setMessage(null);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Settings" />
      
      <div className="flex-1 p-4 md:p-8 max-w-3xl mx-auto w-full flex flex-col gap-8">
        
        <div className="glass-card p-6 flex flex-col gap-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Key className="text-primary w-5 h-5" />
            <h2 className="text-xl font-bold">License Activation</h2>
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="text-sm text-text-muted">
              Enter your HTS License Key to unlock AI market analysis and signals.
            </div>
            
            {isLicenseActive ? (
               <div className="bg-success/10 border border-success/20 p-4 rounded-lg flex items-center justify-between">
                 <div className="flex items-center gap-3 text-success">
                   <ShieldCheck className="w-5 h-5" />
                   <div>
                     <div className="font-bold">License Active</div>
                     <div className="text-xs opacity-80">AI features are unlocked</div>
                   </div>
                 </div>
                 <button 
                   onClick={handleDeactivate}
                   className="text-xs px-3 py-1.5 rounded-lg border border-danger/30 text-danger hover:bg-danger/10 transition-colors"
                 >
                   Deactivate
                 </button>
               </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <input 
                    type="password"
                    value={localKey}
                    onChange={(e) => setLocalKey(e.target.value)}
                    placeholder="Enter License Key..."
                    className="flex-1 bg-background border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
                  />
                  <button 
                    onClick={handleActivate}
                    disabled={loading}
                    className="bg-primary text-background px-6 py-2 rounded-lg font-bold hover:bg-primary-hover transition-colors disabled:opacity-50 min-w-[120px] flex items-center justify-center"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Activate'}
                  </button>
                </div>
                
                {message && (
                  <div className={`p-3 rounded-lg text-sm flex items-start gap-2 border \${
                    message.type === 'success' ? 'bg-success/10 border-success/20 text-success' : 'bg-danger/10 border-danger/20 text-danger'
                  }`}>
                    {message.type === 'success' ? <ShieldCheck className="w-5 h-5 shrink-0" /> : <ShieldAlert className="w-5 h-5 shrink-0" />}
                    <span>{message.text}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="glass-card p-6 flex flex-col gap-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Clock className="text-primary w-5 h-5" />
            <h2 className="text-xl font-bold">App Preferences</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Default Signal Duration</label>
              <select 
                value={defaultDuration}
                onChange={(e) => setDefaultDuration(Number(e.target.value))}
                className="bg-background border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary text-text"
              >
                <option value={10}>10 Seconds</option>
                <option value={15}>15 Seconds</option>
                <option value={30}>30 Seconds</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Market Refresh Rate</label>
              <select 
                value={refreshRate}
                onChange={(e) => setRefreshRate(Number(e.target.value))}
                className="bg-background border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary text-text"
              >
                <option value={3}>3 Seconds (Demo)</option>
                <option value={10}>10 Seconds</option>
                <option value={15}>15 Seconds</option>
                <option value={30}>30 Seconds</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="glass-card p-6 flex flex-col gap-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Moon className="text-primary w-5 h-5" />
            <h2 className="text-xl font-bold">Appearance</h2>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Dark Mode</div>
              <div className="text-sm text-text-muted">Currently the only supported premium theme</div>
            </div>
            <div className="w-12 h-6 bg-primary rounded-full relative">
              <div className="absolute right-1 top-1 w-4 h-4 bg-background rounded-full"></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
