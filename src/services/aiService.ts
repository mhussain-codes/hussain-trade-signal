export interface AIAnalysisResult {
  direction: 'UP' | 'DOWN' | 'NEUTRAL';
  confidence: number;
  duration: number;
  strength: 'Weak' | 'Medium' | 'Strong' | 'None';
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  reason: string;
  bullishFactors?: string[];
  bearishFactors?: string[];
  technicalImpact?: string;
  newsImpact?: string;
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateSignal = async (
  licenseKey: string,
  duration: number,
  currentPrice: number
): Promise<AIAnalysisResult> => {
  if (!licenseKey) {
    throw new Error("License key is required. Please activate in Settings.");
  }

  const delays = [2000, 5000, 10000];
  let attempt = 0;
  
  while (attempt <= delays.length) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout per request

    try {
      const response = await fetch('/.netlify/functions/generate-signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey, duration, currentPrice }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      let data;
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = { error: text.substring(0, 150) };
      }

      if (!response.ok) {
        if (response.status === 401) throw new Error("Invalid API Key or License");
        if (response.status === 429) throw new Error("Rate limit exceeded. Too many requests.");
        
        const isRetriable = response.status === 500 || response.status === 503 || data.error?.includes("503") || data.error?.includes("UNAVAILABLE");
        
        if (isRetriable && attempt < delays.length) {
          throw { retry: true, originalError: data.error };
        }
        
        if (isRetriable) {
          throw new Error("AI service is temporarily busy. Please try again in a few moments.");
        }
        
        throw new Error("AI service is temporarily busy. Please try again in a few moments.");
      }

      return data as AIAnalysisResult;
      
    } catch (err: any) {
      clearTimeout(timeoutId);
      
      if (err.name === 'AbortError') {
        if (attempt < delays.length) {
          console.warn(`[AI Service] Request timeout on attempt \${attempt + 1}. Retrying in \${delays[attempt]}ms...`);
          await wait(delays[attempt]);
          attempt++;
          continue;
        }
        throw new Error("Network Failure. Please check your connection.");
      }

      if (err.retry) {
        console.warn(`[AI Service] Attempt \${attempt + 1} failed (\${err.originalError}). Retrying in \${delays[attempt]}ms...`);
        await wait(delays[attempt]);
        attempt++;
        continue;
      }
      
      if (err.name === 'TypeError' || err.message === 'Failed to fetch') {
         if (attempt < delays.length) {
             console.warn(`[AI Service] Network error on attempt \${attempt + 1}. Retrying in \${delays[attempt]}ms...`);
             await wait(delays[attempt]);
             attempt++;
             continue;
         }
         throw new Error("Network Failure. Please check your connection.");
      }
      
      // Known errors thrown explicitly
      if (err.message === "Invalid API Key or License" || err.message === "Rate limit exceeded. Too many requests.") {
        throw err;
      }
      
      console.error("[AI Service] Unhandled final error:", err);
      throw new Error("AI service is temporarily busy. Please try again in a few moments.");
    }
  }
  
  throw new Error("AI service is temporarily busy. Please try again in a few moments.");
};

export interface NewsAnalysisResult {
  bullishFactors: string[];
  bearishFactors: string[];
  neutralFactors: string[];
}

export const analyzeNews = async (
  licenseKey: string,
  newsContext: string
): Promise<NewsAnalysisResult> => {
  if (!licenseKey) {
    throw new Error("License key is required.");
  }

  const delays = [2000, 5000, 10000];
  let attempt = 0;
  
  while (attempt <= delays.length) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout per request

    try {
      const response = await fetch('/.netlify/functions/analyze-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey, newsContext }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      let data;
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = { error: text.substring(0, 150) };
      }

      if (!response.ok) {
        if (response.status === 401) throw new Error("Invalid API Key or License");
        if (response.status === 429) throw new Error("Rate limit exceeded. Too many requests.");
        
        const isRetriable = response.status === 500 || response.status === 503 || data.error?.includes("503") || data.error?.includes("UNAVAILABLE");
        
        if (isRetriable && attempt < delays.length) {
          throw { retry: true, originalError: data.error };
        }
        
        if (isRetriable) {
          throw new Error("AI service is temporarily busy. Please try again in a few moments.");
        }
        
        throw new Error("AI service is temporarily busy. Please try again in a few moments.");
      }

      return data as NewsAnalysisResult;
      
    } catch (err: any) {
      clearTimeout(timeoutId);
      
      if (err.name === 'AbortError') {
        if (attempt < delays.length) {
          console.warn(`[AI Service] Request timeout on attempt \${attempt + 1}. Retrying in \${delays[attempt]}ms...`);
          await wait(delays[attempt]);
          attempt++;
          continue;
        }
        throw new Error("Network Failure. Please check your connection.");
      }

      if (err.retry) {
        console.warn(`[AI Service] Attempt \${attempt + 1} failed (\${err.originalError}). Retrying in \${delays[attempt]}ms...`);
        await wait(delays[attempt]);
        attempt++;
        continue;
      }
      
      if (err.name === 'TypeError' || err.message === 'Failed to fetch') {
         if (attempt < delays.length) {
             console.warn(`[AI Service] Network error on attempt \${attempt + 1}. Retrying in \${delays[attempt]}ms...`);
             await wait(delays[attempt]);
             attempt++;
             continue;
         }
         throw new Error("Network Failure. Please check your connection.");
      }
      
      if (err.message === "Invalid API Key or License" || err.message === "Rate limit exceeded. Too many requests.") {
        throw err;
      }
      
      console.error("[AI Service] Unhandled final error:", err);
      throw new Error("AI service is temporarily busy. Please try again in a few moments.");
    }
  }
  
  throw new Error("AI service is temporarily busy. Please try again in a few moments.");
};

import { supabase } from '../lib/supabase';

export const verifyLicense = async (licenseKey: string): Promise<boolean> => {
  if (!licenseKey) return false;
  
  try {
    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('license_key', licenseKey.trim());
      
    if (error) {
      console.error("Supabase Error:", error);
      throw new Error(`Database Error: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      throw new Error("Invalid License Key");
    }
    
    const license = data[0];
    
    if (license.active === false) {
      throw new Error("License has been suspended");
    }
    
    // Optional: update 'used' status if needed
    // await supabase.from('licenses').update({ used: true }).eq('id', license.id);
    
    return true;
  } catch (error: any) {
    throw new Error(error.message || "Failed to verify license");
  }
};


export interface MarketIntelligenceResult {
  highImpact: Array<{ headline: string, time: string, importance: string, bullishImpact: string, bearishImpact: string, summary: string }>;
  mediumImpact: Array<{ headline: string, time: string, importance: string, bullishImpact: string, bearishImpact: string, summary: string }>;
  lowImpact: Array<{ headline: string, time: string, importance: string, bullishImpact: string, bearishImpact: string, summary: string }>;
  impactAnalysis: Array<{ event: string, expectedImpact: string, actualImpact: string, bullishScore: number, bearishScore: number }>;
  overallAnalysis: string;
}

export const fetchMarketIntelligence = async (licenseKey: string): Promise<MarketIntelligenceResult> => {
  if (!licenseKey) throw new Error("License key is required.");

  const response = await fetch('/.netlify/functions/fetch-market-intelligence', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ licenseKey })
  });

  if (!response.ok) {
    let err = 'Failed to fetch market intelligence';
    try { const data = await response.json(); err = data.error || err; } catch(e) {}
    throw new Error(err);
  }

  return await response.json();
};
