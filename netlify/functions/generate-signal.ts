import Groq from 'groq-sdk';
import { verifyLicense } from './utils/license';
import { GROQ_MODEL, GROQ_TEMPERATURE } from './utils/groq-config';
import { parseStringPromise } from 'xml2js';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = (process.env.GROQ_API_KEY || '').trim();
  
  if (!apiKey) {
    return {
      statusCode: 503,
      body: JSON.stringify({ error: 'Configuration Error: GROQ_API_KEY is missing from environment' })
    };
  }

  try {
    const { licenseKey, duration, currentPrice, candleData } = JSON.parse(event.body || '{}');
    
    // VERIFY LICENSE
    const licenseResult = await verifyLicense(licenseKey);
    
    if (!licenseResult.valid) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: licenseResult.error })
      };
    }

    // Fetch real RSS news
    const feeds = ['https://www.kitco.com/news/rss'];
    let rawHeadlines = [];
    try {
        for (const feed of feeds) {
            const res = await fetch(feed);
            if(res.ok) {
                const xml = await res.text();
                const json = await parseStringPromise(xml);
                const items = json?.rss?.channel?.[0]?.item || [];
                items.slice(0, 15).forEach(item => {
                    rawHeadlines.push({
                        title: item.title?.[0] || '',
                        pubDate: item.pubDate?.[0] || new Date().toISOString()
                    });
                });
            }
        }
    } catch(e) {
        console.error("RSS Fetch Error:", e);
        rawHeadlines = [
            { title: "Gold Prices Surge as Fed Hints at Rate Cuts", pubDate: new Date().toISOString() },
            { title: "Geopolitical Tensions Drive Safe Haven Demand", pubDate: new Date().toISOString() }
        ];
    }
    const newsContext = rawHeadlines.map(h => h.title).join(' | ');

    // Process Candle Data for technical analysis
    let technicalContext = "No candle data provided. Relying solely on current price.";
    if (candleData && candleData.length > 0) {
       const recent = candleData.slice(-10); // Look at last 10 ticks
       const start = recent[0];
       const end = recent[recent.length - 1];
       const trend = end.close > start.open ? 'BULLISH' : 'BEARISH';
       const highest = Math.max(...recent.map(c => c.high));
       const lowest = Math.min(...recent.map(c => c.low));
       technicalContext = `Recent 10-tick OHLC Analysis: Trend is \${trend}. Local High: $\${highest.toFixed(2)}, Local Low: $\${lowest.toFixed(2)}. Latest Close: $\${end.close.toFixed(2)}.`;
    }

    const groq = new Groq({ apiKey });

    const prompt = `
You are an advanced quantitative AI trading engine analyzing XAU/USD (Gold).
Current Price: $\${currentPrice.toFixed(2)}
Requested Duration: \${duration} seconds

REAL-TIME DATA INPUTS:
1. Technical Market Structure: \${technicalContext}
2. Latest Global News Headlines: \${newsContext}

TASK:
Perform a highly rigorous evaluation fusing the Technical Market Structure and Latest Global News.
Do NOT default to "UP". 
You must synthesize the real-time inputs.
Create a weighted scoring system internally (News Sentiment vs Technical Structure).
If the combined confidence is weak or contradictory, output "NEUTRAL" for direction.

Respond ONLY with a valid JSON object matching exactly this schema (NO MARKDOWN, JUST JSON):
{
  "direction": "UP" | "DOWN" | "NEUTRAL",
  "confidence": number (between 0 and 99. <50 must be NEUTRAL),
  "strength": "Weak" | "Medium" | "Strong" | "None",
  "sentiment": "Bullish" | "Bearish" | "Neutral",
  "reason": "Clear explanation of the dominant market drivers right now, explicitly citing the news and technicals.",
  "bullishFactors": ["factor 1", "factor 2"],
  "bearishFactors": ["factor 1", "factor 2"],
  "technicalImpact": "Description of technical structure",
  "newsImpact": "Description of fundamental news drivers"
}
`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      model: GROQ_MODEL,
      temperature: GROQ_TEMPERATURE,
      response_format: { type: "json_object" }
    });

    const responseText = chatCompletion.choices[0]?.message?.content;

    if (!responseText) {
      throw new Error("Empty response from AI");
    }

    const result = JSON.parse(responseText);
    result.duration = duration;

    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  } catch (error: any) {
    console.error("Groq API Error:", error);
    
    // Handle Groq specific error formats
    const errorMessage = error?.error?.error?.message || error.message || 'Failed to generate AI signal';
    const status = error.status || 500;
    
    return {
      statusCode: status,
      body: JSON.stringify({ error: errorMessage })
    };
  }
};
