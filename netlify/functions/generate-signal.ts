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
  const ema21 = calculateEMA(closes, 21);
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

  return {
    currentPrice: closes[closes.length - 1],
    ema9: Number(ema9.toFixed(4)),
    ema21: Number(ema21.toFixed(4)),
    rsi: Number(rsi.toFixed(2)),
    macd: Number(macd.toFixed(4)),
    atr: Number(atr.toFixed(4)),
    support: Number(support.toFixed(4)),
    resistance: Number(resistance.toFixed(4)),
  };
}

export const handler = async (event: any) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed. Use POST.' }) };
  }

  const TWELVE_DATA_KEY = (process.env.TWELVE_DATA_KEY || '').trim();
  const FINNHUB_KEY = (process.env.FINNHUB_KEY || '').trim();
  const GROQ_API_KEY = (process.env.GROQ_API_KEY || '').trim();
  
  const rawUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const SUPABASE_URL = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  const SUPABASE_SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  if (!TWELVE_DATA_KEY || !FINNHUB_KEY || !GROQ_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Data unavailable (Missing Environment Keys)' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const symbol = body.symbol || 'XAU/USD';
    const duration = body.duration || 60; // 60, 120, 300
    
    // Interval mapped from duration
    const interval = duration >= 300 ? '5min' : '1min';

    // 1. Fetch TwelveData Candles
    const twelveDataRes = await fetch(`https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${interval}&outputsize=100&apikey=${TWELVE_DATA_KEY}`);
    const timeSeriesData = await twelveDataRes.json();
    
    if (!timeSeriesData.values || timeSeriesData.values.length === 0) {
      throw new Error("TwelveData API returned empty or error response");
    }

    // TwelveData returns newest first. Reverse to get oldest to newest for calculations.
    const rawCandles = timeSeriesData.values.reverse().map((c: any) => ({
      open: parseFloat(c.open),
      high: parseFloat(c.high),
      low: parseFloat(c.low),
      close: parseFloat(c.close)
    }));

    const indicators = calculateIndicators(rawCandles);

    // 2. Fetch Finnhub News (Search for Gold, Fed, Dollar, Yields if XAU/USD, else general/forex)
    const newsCategory = symbol.includes('BTC') || symbol.includes('CRYPTO') ? 'crypto' : 'general';
    const finnhubRes = await fetch(`https://finnhub.io/api/v1/news?category=${newsCategory}&token=${FINNHUB_KEY}`);
    const newsData = await finnhubRes.json();
    
    let filteredNews = "";
    if (Array.isArray(newsData)) {
       // Find news containing relevant keywords
       const keywords = ['gold', 'xau', 'fed', 'dollar', 'yield', 'rate', 'powell', 'inflation', 'cpi'];
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
You are an elite quantitative analyst. Analyze the Twelve Data technicals and Finnhub news. Your goal is extreme accuracy (90%+). Only output a BUY or SELL signal if both technicals and news align perfectly with a confidence score of 80% or higher. If the market is choppy, data is conflicting, or confidence is below 80%, you MUST return a signal of "NEUTRAL". Do not guess.

TECHNICAL INDICATORS (${interval} timeframe):
- Current Price: ${indicators.currentPrice}
- EMA 9: ${indicators.ema9}
- EMA 21: ${indicators.ema21}
- RSI 14: ${indicators.rsi}
- MACD: ${indicators.macd}
- ATR 14: ${indicators.atr}
- Local Support: ${indicators.support}
- Local Resistance: ${indicators.resistance}

FUNDAMENTAL NEWS & SENTIMENT:
${filteredNews}

Do not write any markdown outside the JSON. The JSON must exactly match this schema:
{
  "signal": "BUY" | "SELL" | "NEUTRAL",
  "confidence": number,
  "reasoning": "string"
}
`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: 'llama-3.1-70b-versatile',
      temperature: 0.5,
      response_format: { type: "json_object" }
    });

    const aiContent = chatCompletion.choices[0]?.message?.content;
    if (!aiContent) throw new Error("AI returned empty response");
    
    let aiResult = JSON.parse(aiContent);
    
    // Normalize case
    if (aiResult.signal.toUpperCase() === "BUY") aiResult.signal = "UP"; 
    const finalSignal = aiResult.signal.toUpperCase() === "BUY" || aiResult.signal.toUpperCase() === "UP" ? "BUY" 
                      : aiResult.signal.toUpperCase() === "SELL" || aiResult.signal.toUpperCase() === "DOWN" ? "SELL" 
                      : "NEUTRAL";

    // 4. Save to Supabase
    const signalRecord = {
      symbol: symbol,
      signal: finalSignal,
      confidence: aiResult.confidence,
      entry_price: indicators.currentPrice,
      duration_seconds: duration,
      reasoning: aiResult.reasoning,
      risk: aiResult.risk || "Medium",
      result: "PENDING",
      created_at: new Date().toISOString()
    };

    const supabaseRes = await fetch(`${SUPABASE_URL}/rest/v1/signals`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(signalRecord)
    });

    if (!supabaseRes.ok) {
      const dbErr = await supabaseRes.text();
      console.error("Supabase Insert Error:", dbErr);
    }

    const savedRecord = supabaseRes.ok ? await supabaseRes.json() : [signalRecord];

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        data: savedRecord[0] || signalRecord
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