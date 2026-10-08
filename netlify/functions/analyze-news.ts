import Groq from 'groq-sdk';
import { verifyLicense } from './utils/license';

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
    const { licenseKey, newsContext } = JSON.parse(event.body || '{}');
    
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
Analyze the following recent market news for its potential impact on Gold (XAU/USD).
Provide a breakdown of factors influencing the market.

News Context:
${newsContext}

Respond ONLY with a valid JSON object matching exactly this schema, with no markdown formatting or extra text:
{
  "bullishFactors": ["factor 1", "factor 2"],
  "bearishFactors": ["factor 1", "factor 2"],
  "neutralFactors": ["factor 1"]
}
`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      model: 'llama-3.1-8b-instant', // DIRECT WORKING MODEL ADDED HERE
      temperature: 0.5,
      response_format: { type: "json_object" }
    });

    const responseText = chatCompletion.choices[0]?.message?.content;

    if (!responseText) {
      throw new Error("Empty response from AI");
    }

    // Ensure it's valid JSON
    JSON.parse(responseText);

    return {
      statusCode: 200,
      body: responseText
    };
  } catch (error: any) {
    console.error("Groq API Error:", error);
    
    // Handle Groq specific error formats
    const errorMessage = error?.error?.error?.message || error.message || 'Failed to analyze news';
    const status = error.status || 500;
    
    return {
      statusCode: status,
      body: JSON.stringify({ error: errorMessage })
    };
  }
};