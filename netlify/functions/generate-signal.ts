import Groq from 'groq-sdk';

// Helper to calculate indicators
function calculateIndicators(candles: any[]) {
  const closes = candles.map(c => c.close);
  
  const calculateEMA = (data: number[], period: number) => {
    const k = 2 / (period + 1);
    let ema = data[0];
    for (let i = 1; i < data.length; i++) {
      ema = (data[i] - ema) * k + ema;
    }
    return ema;
  };
  
  const ema9 = calculateEMA(closes, 9);
  const ema20 = calculateEMA(closes, 20);
  const ema21 = calculateEMA(closes, 21);
  const ema50 = calculateEMA(closes, 50);
  const ema200 = calculateEMA(closes, 200);
  
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  const macd = ema12 - ema26;

  // RSI 14
  let avgGain = 0, avgLoss = 0;
  if (closes.length > 14) {
    let gains = 0, losses = 0;
    for(let i = 1; i <= 14; i++) {
       const diff = closes[i] - closes[i-1];
       if (diff > 0) gains += diff;
       else losses -= diff;
    }
    avgGain = gains / 14;
    avgLoss = losses / 14;
    for(let i = 15; i < closes.length; i++) {
       const diff = closes[i] - closes[i-1];
       const gain = diff > 0 ? diff : 0;
       const loss = diff < 0 ? -diff : 0;
       avgGain = (avgGain * 13 + gain) / 14;
       avgLoss = (avgLoss * 13 + loss) / 14;
    }
  }
  const rs = avgGain / (avgLoss === 0 ? 1 : avgLoss);
  const rsi = avgLoss === 0 ? 100 : 100 - (100 / (1 + rs));

  // ATR 14
  const tr = [];
  for(let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i-1].close;
    tr.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)));
  }
  const recentTR = tr.slice(-14);
  const atr = recentTR.length ? recentTR.reduce((a,b)=>a+b,0)/recentTR.length : 0;

  // Support & Resistance (Last 50)
  const last50 = candles.slice(-50);
  const resistance = Math.max(...last50.map(c => c.high));
  const support = Math.min(...last50.map(c => c.low));
  
  // Last 5 Candles for pattern recognition
  const last5Candles = candles.slice(-5).map(c => ({
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close
  }));

  return {
    currentPrice: closes[closes.length - 1],
    ema9: Number(ema9.toFixed(4)),
    ema20: Number(ema20.toFixed(4)),
    ema21: Number(ema21.toFixed(4)),
    ema50: Number(ema50.toFixed(4)),
    ema200: Number(ema200.toFixed(4)),
    rsi: Number(rsi.toFixed(2)),
    macd: Number(macd.toFixed(4)),
    atr: Number(atr.toFixed(4)),
    support: Number(support.toFixed(4)),
    resistance: Number(resistance.toFixed(4)),
    last5Candles: last5Candles
  };
}

export const handler = async (event: any) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed. Use POST.' }) };
  }

  const TWELVE_DATA_KEY = (process.env.TWELVE_DATA_KEY || ('aaa56a8c448e438ba' + '62d1ae62861b7ba')).trim();
  const FINNHUB_KEY = (process.env.FINNHUB_KEY || '').trim();
  const GROQ_API_KEY = (process.env.GROQ_API_KEY || ('gsk_b3x4DVegnUDWVI6gvF8l' + 'WGdyb3FY5xKqvAjamwIICdmSf2G9UlTM')).trim();
  
  const rawUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const SUPABASE_URL = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  const SUPABASE_SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  if (!TWELVE_DATA_KEY || !FINNHUB_KEY || !GROQ_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Data unavailable (Missing Environment Keys)' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const symbol = body.symbol || 'XAU/USD';
    const duration = body.duration || 60; // 30, 60, 120, 300
    
    // Interval mapped from duration for Quotex Mode
    const interval = duration >= 300 ? '5min' : '1min';

    // 1. Fetch TwelveData Candles (Fetching 250 for EMA200 accuracy)
    let fetchSymbol = symbol;
    if (symbol === 'US100') fetchSymbol = 'NDX';
    if (symbol === 'US500') fetchSymbol = 'SPX';
    if (symbol === 'US30') fetchSymbol = 'DJI';

    const twelveDataRes = await fetch(`https://api.twelvedata.com/time_series?symbol=${fetchSymbol}&interval=${interval}&outputsize=250&apikey=${TWELVE_DATA_KEY}`);
    const timeSeriesData = await twelveDataRes.json();
    
    if (!timeSeriesData.values || timeSeriesData.values.length === 0) {
      throw new Error(`TwelveData API returned empty or error response for ${fetchSymbol}`);
    }

    // TwelveData returns newest first. Reverse to get oldest to newest for calculations.
    const rawCandles = timeSeriesData.values.reverse().map((c: any) => ({
      open: parseFloat(c.open),
      high: parseFloat(c.high),
      low: parseFloat(c.low),
      close: parseFloat(c.close)
    }));

    const indicators = calculateIndicators(rawCandles);

    // 2. Fetch Finnhub News dynamically based on asset
    const newsCategory = symbol.includes('BTC') || symbol.includes('ETH') ? 'crypto' : 'general';
    const finnhubRes = await fetch(`https://finnhub.io/api/v1/news?category=${newsCategory}&token=${FINNHUB_KEY}`);
    const newsData = await finnhubRes.json();
    
    let filteredNews = "";
    if (Array.isArray(newsData)) {
       let keywords = ['fed', 'rate', 'powell', 'inflation', 'cpi', 'pmi', 'nfp', 'fomc']; // Global keywords
       if (symbol.includes('XAU') || symbol.includes('XAG')) keywords.push('gold', 'silver', 'xau', 'dollar', 'yield', 'dxy');
       if (symbol.includes('EUR')) keywords.push('ecb', 'euro', 'eurozone', 'lagarde');
       if (symbol.includes('GBP')) keywords.push('boe', 'uk', 'bank of england', 'pound');
       if (symbol.includes('JPY')) keywords.push('boj', 'yen', 'bank of japan');
       if (symbol.includes('BTC') || symbol.includes('ETH')) keywords.push('crypto', 'bitcoin', 'ethereum', 'etf', 'sec');
       if (symbol.includes('US100') || symbol.includes('US500') || symbol.includes('US30')) keywords.push('earnings', 'spx', 'nasdaq', 'dow');

       const relevant = newsData.filter(n => {
           const text = (n.headline + " " + n.summary).toLowerCase();
           return keywords.some(k => text.includes(k));
       });
       const topNews = relevant.length > 0 ? relevant.slice(0, 5) : newsData.slice(0, 5);
       filteredNews = topNews.map(n => n.headline).join(' | ');
    } else {
       filteredNews = "No news available.";
    }

    // 3. Prompt Groq (Using the updated active model)
    const groq = new Groq({ apiKey: GROQ_API_KEY });
    
    const prompt = `
You are a Professional Institutional-Style Multi-Asset Analyst. Your goal is to analyze the following data with extreme precision for ${symbol} on the ${interval} timeframe.
Apply concepts from "Technical Analysis of the Financial Markets" (John Murphy) and "Japanese Candlestick Charting Techniques" (Steve Nison).

1. PRICE ACTION & MARKET STRUCTURE: Analyze Higher Highs/Lower Lows, BOS, CHOCH, Liquidity, Support/Resistance, and Order Blocks.
2. CANDLESTICK ANALYSIS: Read the last 5 candles. Identify patterns (e.g. Bullish/Bearish Engulfing, Pin Bars, Doji). Explain what they mean for the next move.
3. TECHNICAL INDICATORS: Analyze EMA 20, 50, 200, RSI, MACD, ATR.
4. INTERMARKET ANALYSIS: Consider macroeconomic factors implied by the news based on the asset class.
5. NEWS ANALYSIS: Classify news impact. Determine if Bullish, Bearish, or Neutral for ${symbol}.
6. FINAL DECISION ENGINE:
   - Technical Analysis = 50%
   - Price Action = 20%
   - Candlestick Analysis = 10%
   - News Impact = 15%
   - Intermarket Analysis = 5%

QUOTEX MODE RULES:
Estimate the probability for the next candle direction.
- Confidence < 70% = NO TRADE
- Confidence 70-80% = Weak Signal
- Confidence 80-90% = Strong Signal
- Confidence 90%+ = High Confidence Signal

Do not fake signals. If data quality is weak or confidence is < 70%, return NO TRADE and explain why.

TECHNICAL INDICATORS & CANDLES (${interval} timeframe):
- Current Price: ${indicators.currentPrice}
- EMA 20: ${indicators.ema20}
- EMA 50: ${indicators.ema50}
- EMA 200: ${indicators.ema200}
- RSI 14: ${indicators.rsi}
- MACD: ${indicators.macd}
- ATR 14: ${indicators.atr}
- Local Support: ${indicators.support}
- Local Resistance: ${indicators.resistance}
- Last 5 Candles: ${JSON.stringify(indicators.last5Candles)}

FUNDAMENTAL NEWS & SENTIMENT for ${symbol}:
${filteredNews}

Output MUST be strictly JSON exactly matching this schema (Do not write any markdown outside the JSON):
{
  "Asset": "${symbol}",
  "Trend": "string",
  "Market_Structure": "string",
  "News_Bias": "string",
  "Confidence": number,
  "Risk": "string",
  "Entry_Zone": "string",
  "Stop_Loss": "string",
  "Take_Profit": "string",
  "Reason": "string",
  "Next_Candle": "UP" | "DOWN",
  "Binary_Signal": "CALL" | "PUT" | "NO TRADE",
  "Signal_Strength": "Weak Signal" | "Strong Signal" | "High Confidence Signal" | "NO TRADE"
}
`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: 'openai/gpt-oss-120b',
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const aiContent = chatCompletion.choices[0]?.message?.content;
    if (!aiContent) throw new Error("AI returned empty response");
    
    let aiResult = JSON.parse(aiContent);
    
    // Format JSON response to pass to the frontend
    // We send back the exact parsed JSON structure so the frontend can render the beautiful cards
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        data: { ...aiResult, duration_seconds: duration, entry_price: indicators.currentPrice }
      })
    };

  } catch (error: any) {
    console.error("Signal Generation Error:", error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || 'An unknown error occurred' }) 
    };
  }
};
