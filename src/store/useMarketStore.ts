import { create } from 'zustand';

export interface PricePoint {
  time: number;
  value: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface MarketState {
  currentPrice: number;
  priceHistory: PricePoint[];
  dailyChange: number;
  dailyChangePercent: number;
  todayHigh: number;
  todayLow: number;
  marketOpen: boolean;
  addPricePoint: (point: PricePoint) => void;
  initialize: () => void;
}

// Simulated starting price for XAU/USD
const STARTING_PRICE = 3867.42;

export const useMarketStore = create<MarketState>((set, get) => ({
  currentPrice: STARTING_PRICE,
  priceHistory: [],
  dailyChange: +12.36,
  dailyChangePercent: 0.32,
  todayHigh: 3872.50,
  todayLow: 3845.10,
  marketOpen: true,
  
  addPricePoint: (point) => set((state) => {
    const newHistory = [...state.priceHistory, point].slice(-1000); // Keep last 1000 points
    const currentPrice = point.close;
    // Calculate simple stats
    const todayHigh = Math.max(state.todayHigh, currentPrice);
    const todayLow = Math.min(state.todayLow, currentPrice);
    const dailyChange = currentPrice - (STARTING_PRICE - 12.36); // Simulate daily open
    const dailyChangePercent = (dailyChange / (STARTING_PRICE - 12.36)) * 100;

    return {
      currentPrice,
      priceHistory: newHistory,
      todayHigh,
      todayLow,
      dailyChange,
      dailyChangePercent
    };
  }),

  initialize: () => {
    // Generate some initial historical data
    const history: PricePoint[] = [];
    const now = Math.floor(Date.now() / 1000);
    let current = STARTING_PRICE - 5;
    
    for (let i = 200; i >= 0; i--) {
      const time = now - i * 5; // 5 seconds interval
      const volatility = 0.5;
      const change = (Math.random() - 0.5) * volatility;
      const next = current + change;
      
      history.push({
        time,
        open: current,
        high: Math.max(current, next) + Math.random() * 0.2,
        low: Math.min(current, next) - Math.random() * 0.2,
        close: next,
        value: next
      });
      current = next;
    }

    set({ 
      priceHistory: history,
      currentPrice: current
    });
  }
}));

// Setup the simulator loop
let simulatorInterval: any;

export const startMarketSimulator = () => {
  if (simulatorInterval) clearInterval(simulatorInterval);
  
  useMarketStore.getState().initialize();

  simulatorInterval = setInterval(() => {
    const state = useMarketStore.getState();
    if (!state.marketOpen) return;

    const lastPrice = state.currentPrice;
    const volatility = 0.8;
    // Random walk with slight trend tendency based on a sine wave for some realism
    const trend = Math.sin(Date.now() / 10000) * 0.2; 
    const change = (Math.random() - 0.5) * volatility + trend;
    const nextPrice = lastPrice + change;

    state.addPricePoint({
      time: Math.floor(Date.now() / 1000),
      open: lastPrice,
      high: Math.max(lastPrice, nextPrice) + Math.random() * 0.3,
      low: Math.min(lastPrice, nextPrice) - Math.random() * 0.3,
      close: nextPrice,
      value: nextPrice
    });
  }, 3000); // Update every 3 seconds
};

export const stopMarketSimulator = () => {
  if (simulatorInterval) clearInterval(simulatorInterval);
};
