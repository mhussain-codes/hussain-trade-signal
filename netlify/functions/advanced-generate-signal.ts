import Groq from 'groq-sdk';

export const handler = async (event: any) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed. Use POST.' }) };
  }

  // 1. Environment Variables Configuration
  const TWELVE_DATA_KEY = (process.env.TWELVE_DATA_KEY || '').trim();
  const FINNHUB_KEY = (process.env.FINNHUB_KEY || '').trim();
  const GROQ_API_KEY = (process.env.GROQ_API_KEY || '').trim();
  
  const rawUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const SUPABASE_URL = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  const SUPABASE_SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  // Validate critical keys
  if (!TWELVE_DATA_KEY || !FINNHUB_KEY || !GROQ_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Missing one or more required environment variables.' }) 
    };
  }

  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const symbol = body.symbol || 'BTC/USD'; // e.g., 'BTC/USD', 'EUR/USD', 'AAPL'
    
    // Determine Finnhub category based on symbol
    let newsCategory = 'general';
    if (symbol.includes('BTC') || symbol.includes('ETH') || symbol.includes('CRYPTO')) {
      newsCategory = 'crypto';
    } else if (symbol.includes('USD') || symbol.includes('EUR') || symbol.includes('GBP')) {
      newsCategory = 'forex';
    }

    // ==========================================
    // STEP 2: Twelve Data - Fetch Technicals
    // ==========================================
    const fetchTechnicalData = async () => {
      try {
        const [priceRes, rsiRes, emaRes] = await Promise.all([
          fetch(`https://api.twelvedata.com/price?symbol=\${symbol}&apikey=\${TWELVE_DATA_KEY}`),
          fetch(`https://api.twelvedata.com/rsi?symbol=\${symbol}&interval=15min&apikey=\${TWELVE_DATA_KEY}`),
          fetch(`https://api.twelvedata.com/ema?symbol=\${symbol}&interval=15min&time_period=20&apikey=\${TWELVE_DATA_KEY}`)
        ]);

        const priceData = await priceRes.json();
        const rsiData = await rsiRes.json();
        const emaData = await emaRes.json();

        return {
          price: priceData.price || 'Unknown',
          rsi: rsiData.values?.[0]?.rsi || 'Unknown',
          ema20: emaData.values?.[0]?.ema || 'Unknown'
        };
      } catch (e) {
        console.error("Twelve Data fetch error:", e);
        return { price: 'Error', rsi: 'Error', ema20: 'Error' };
      }
    };

    // ==========================================
    // STEP 3: Finnhub - Fetch Fundamental News
    // ==========================================
    const fetchFundamentalData = async () => {
      try {
        const newsRes = await fetch(`https://finnhub.io/api/v1/news?category=\${newsCategory}&token=\${FINNHUB_KEY}`);
        const newsData = await newsRes.json();
        
        if (!Array.isArray(newsData)) return "No news available.";

        // Extract top 5 headlines
        return newsData.slice(0, 5).map((n: any) => n.headline).join(' | ');
      } catch (e) {
        console.error("Finnhub fetch error:", e);
        return "Failed to fetch fundamental news.";
      }
    };

    // Execute API fetches concurrently
    const [technicals, fundamentals] = await Promise.all([
      fetchTechnicalData(),
      fetchFundamentalData()
    ]);

    // ==========================================
    // STEP 4: Groq AI - Analyze and Generate JSON
    // ==========================================
    const groq = new Groq({ apiKey: GROQ_API_KEY });
    
    const prompt = `
You are an elite quantitative AI trading algorithm.
Analyze the following real-time data for \${symbol}:

TECHNICAL INDICATORS (15m timeframe):
- Current Price: \${technicals.price}
- RSI (14): \${technicals.rsi}
- EMA (20): \${technicals.ema20}

FUNDAMENTAL NEWS:
\${fundamentals}

TASK:
Based on the technical structure and fundamental news sentiment, output a strict JSON object with your trading signal.
Do not write any markdown outside the JSON. The JSON must exactly match this schema:
{
  "signal": "Buy" | "Sell" | "Hold",
  "confidence": number (between 0 and 100),
  "reasoning": "A short, precise explanation combining technical and fundamental factors."
}
`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: 'llama3-70b-8192',
      temperature: 0.1, // Low temp for more analytical, strict output
      response_format: { type: "json_object" }
    });

    const aiContent = chatCompletion.choices[0]?.message?.content;
    if (!aiContent) throw new Error("AI returned empty response");
    
    const aiResult = JSON.parse(aiContent);

    // ==========================================
    // STEP 5: Supabase - Insert Signal Record
    // ==========================================
    const signalRecord = {
      pair: symbol,
      signal: aiResult.signal,
      confidence: aiResult.confidence,
      reasoning: aiResult.reasoning,
      price_at_time: technicals.price,
      created_at: new Date().toISOString()
    };

    const supabaseRes = await fetch(`\${SUPABASE_URL}/rest/v1/signals`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer \${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(signalRecord)
    });

    if (!supabaseRes.ok) {
      const dbErr = await supabaseRes.text();
      console.error("Supabase Insert Error:", dbErr);
      throw new Error(`Failed to save signal to database: \${dbErr}`);
    }

    const savedRecord = await supabaseRes.json();

    // Return the successful result
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: "Signal generated and saved successfully",
        data: savedRecord[0] || savedRecord
      })
    };

  } catch (error: any) {
    console.error("Signal Generation Error:", error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || 'Internal Server Error' })
    };
  }
};
