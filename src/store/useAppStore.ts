import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SignalHistory {
  id: string;
  time: number;
  price: number;
  direction: 'UP' | 'DOWN' | 'NEUTRAL';
  confidence: number;
  duration: number; // in seconds
  strength: 'Weak' | 'Medium' | 'Strong' | 'None';
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  status: 'Pending' | 'Completed';
  result?: 'Direction moved UP' | 'Direction moved DOWN' | 'Unable to verify' | 'Neutral';
  entryPrice?: number;
  exitPrice?: number;
}

interface AppState {
  licenseKey: string;
  setLicenseKey: (key: string) => void;
  isLicenseActive: boolean;
  setIsLicenseActive: (active: boolean) => void;
  refreshRate: number;
  setRefreshRate: (rate: number) => void;
  defaultDuration: number;
  setDefaultDuration: (duration: number) => void;
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
      defaultDuration: 15,
      setDefaultDuration: (duration) => set({ defaultDuration: duration }),
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
