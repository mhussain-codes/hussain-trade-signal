import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SignalHistory {
  id: string;
  time: number;
  price: number;
  direction: 'UP' | 'DOWN' | 'NEUTRAL';
  confidence: number;
  duration: number; // in seconds
  strength: 'Low' | 'Medium' | 'High' | 'Weak' | 'Strong' | 'None';
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  status: 'Pending' | 'Completed';
  result?: 'WIN' | 'LOSS' | 'PENDING' | 'NEUTRAL' | 'Unable to verify' | 'Evaluating...';
  entryPrice?: number;
  exitPrice?: number;
}

export interface Asset {
  symbol: string;
  name: string;
  type: 'forex' | 'metal' | 'crypto' | 'index';
}

export const SUPPORTED_ASSETS: Asset[] = [
  { symbol: 'XAU/USD', name: 'Gold', type: 'metal' },
  { symbol: 'XAG/USD', name: 'Silver', type: 'metal' },
  { symbol: 'EUR/USD', name: 'EUR/USD', type: 'forex' },
  { symbol: 'GBP/USD', name: 'GBP/USD', type: 'forex' },
  { symbol: 'USD/JPY', name: 'USD/JPY', type: 'forex' },
  { symbol: 'BTC/USD', name: 'Bitcoin', type: 'crypto' },
  { symbol: 'ETH/USD', name: 'Ethereum', type: 'crypto' },
  { symbol: 'NDX', name: 'US100', type: 'index' },
  { symbol: 'SPX', name: 'US500', type: 'index' },
  { symbol: 'DJI', name: 'US30', type: 'index' }
];

interface AppState {
  licenseKey: string;
  setLicenseKey: (key: string) => void;
  isLicenseActive: boolean;
  setIsLicenseActive: (active: boolean) => void;
  refreshRate: number;
  setRefreshRate: (rate: number) => void;
  defaultDuration: number;
  setDefaultDuration: (duration: number) => void;
  activeAsset: Asset;
  setActiveAsset: (asset: Asset) => void;
  theme: 'Dark' | 'Light';
  setTheme: (theme: 'Dark' | 'Light') => void;
  signals: SignalHistory[];
  addSignal: (signal: SignalHistory) => void;
  updateSignal: (id: string, updates: Partial<SignalHistory>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      licenseKey: '',
      setLicenseKey: (key) => set({ licenseKey: key }),
      isLicenseActive: false,
      setIsLicenseActive: (active) => set({ isLicenseActive: active }),
      refreshRate: 15,
      setRefreshRate: (rate) => set({ refreshRate: rate }),
      defaultDuration: 60,
      setDefaultDuration: (duration) => set({ defaultDuration: duration }),
      activeAsset: SUPPORTED_ASSETS[0],
      setActiveAsset: (asset) => set({ activeAsset: asset }),
      theme: 'Dark',
      setTheme: (theme) => set({ theme }),
      signals: [],
      addSignal: (signal) => set((state) => ({ signals: [signal, ...state.signals].slice(0, 50) })),
      updateSignal: (id, updates) => set((state) => ({
        signals: state.signals.map(s => s.id === id ? { ...s, ...updates } : s)
      }))
    }),
    {
      name: 'hts-storage',
    }
  )
);
