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
  { symbol: 'NDX', name: 'US100 (Nasdaq)', type: 'index' }, // TwelveData symbol for NDX
  { symbol: 'SPX', name: 'US500 (S&P 500)', type: 'index' }, // TwelveData symbol for SPX
  { symbol: 'DJI', name: 'US30 (Dow Jones)', type: 'index' }  // TwelveData symbol for Dow
];
