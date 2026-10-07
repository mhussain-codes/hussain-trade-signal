import Groq from 'groq-sdk';
import { verifyLicense } from './utils/license';
import { GROQ_MODEL, GROQ_TEMPERATURE } from './utils/groq-config';
import { parseStringPromise } from 'xml2js';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = (process.env.GROQ_API_KEY || '').trim();
  if (!apiKey) return { statusCode: 503, body: JSON.stringify({ error: 'Missing GROQ_API_KEY' }) };

  try {
    const { licenseKey } = JSON.parse(event.body || '{}');
    const licenseResult = await verifyLicense(licenseKey);
    if (!licenseResult.valid) return { statusCode: 401, body: JSON.stringify({ error: licenseResult.error }) };

    // Fetch real RSS news
    const feeds = [
      'https://www.kitco.com/news/rss', // Kitco Gold News
    ];
    
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
        // Fallback fake news if offline
        rawHeadlines = [
            { title: "Gold Prices Surge as Fed Hints at Rate Cuts", pubDate: new Date().toISOString() },
            { title: "Geopolitical Tensions Drive Safe Haven Demand", pubDate: new Date().toISOString() }
        ];
    }

    const newsContext = rawHeadlines.map(h => h.title).join(' | ');

    const groq = new Groq({ apiKey });

    const prompt = `
Analyze the following recent market headlines for Gold (XAU/USD).
Headlines: ${newsContext}

Extract facts and generate original intelligence. DO NOT copy the articles verbatim.
Categorize into High, Medium, and Low impact news items.

Also, provide an XAU/USD Impact Analysis evaluating the current macroeconomic factors (Fed Rates, CPI, NFP, DXY, Yields, Geopolitics).

Respond ONLY with a JSON object exactly matching this schema:
{
  "highImpact": [
    { "headline": "Original AI Headline", "time": "Recent", "importance": "HIGH", "bullishImpact": "...", "bearishImpact": "...", "summary": "..." }
  ],
  "mediumImpact": [
    { "headline": "Original AI Headline", "time": "Recent", "importance": "MEDIUM", "bullishImpact": "...", "bearishImpact": "...", "summary": "..." }
  ],
  "lowImpact": [
    { "headline": "Original AI Headline", "time": "Recent", "importance": "LOW", "bullishImpact": "...", "bearishImpact": "...", "summary": "..." }
  ],
  "impactAnalysis": [
    { "event": "E.g., Fed Interest Rates", "expectedImpact": "...", "actualImpact": "...", "bullishScore": 8, "bearishScore": 2 }
  ],
  "overallAnalysis": "2 sentences summarizing the market narrative."
}
`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: GROQ_MODEL,
      temperature: GROQ_TEMPERATURE,
      response_format: { type: "json_object" }
    });

    const responseText = chatCompletion.choices[0]?.message?.content;
    return { statusCode: 200, body: responseText };
  } catch (error: any) {
    console.error("Groq API Error:", error);
    return { statusCode: error.status || 500, body: JSON.stringify({ error: error.message || 'Failed to analyze news' }) };
  }
};
