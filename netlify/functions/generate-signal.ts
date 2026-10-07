import Groq from 'groq-sdk';
import { verifyLicense } from './utils/license';
import { GROQ_MODEL, GROQ_TEMPERATURE } from './utils/groq-config';

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
    const { licenseKey, duration, currentPrice } = JSON.parse(event.body || '{}');
    
    // VERIFY LICENSE
    const licenseResult = await verifyLicense(licenseKey);
    
    if (!licenseResult.valid) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: licenseResult.error })
      };
    }

    const groq = new Groq({ apiKey });

    const prompt = `
You are an advanced quantitative AI trading engine analyzing XAU/USD (Gold).
Current Price: $\${currentPrice.toFixed(2)}
Requested Duration: \${duration} seconds

TASK:
Perform a highly rigorous, unbiased evaluation of current XAU/USD market conditions. 
Do NOT default to "UP". 
You must synthesize simulated real-time inputs for:
1. Economic calendar impact (Fed rates, CPI, NFP, DXY, Yields).
2. Geopolitical risk sentiment.
3. Recent XAU/USD price action and momentum.
4. Support, resistance, and market structure.

Create a weighted scoring system internally (News, Sentiment, Price Action, Technical, Volatility).
If the combined confidence is weak or contradictory, output "NEUTRAL" for direction.

Respond ONLY with a valid JSON object matching exactly this schema (NO MARKDOWN, JUST JSON):
{
  "direction": "UP" | "DOWN" | "NEUTRAL",
  "confidence": number (between 0 and 99. <50 must be NEUTRAL),
  "strength": "Weak" | "Medium" | "Strong" | "None",
  "sentiment": "Bullish" | "Bearish" | "Neutral",
  "reason": "Clear explanation of the dominant market drivers right now.",
  "bullishFactors": ["factor 1", "factor 2"],
  "bearishFactors": ["factor 1", "factor 2"],
  "technicalImpact": "Description of technical structure",
  "newsImpact": "Description of fundamental drivers"
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
    
    // Ensure the duration matches the requested duration
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
