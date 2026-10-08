import { schedule } from '@netlify/functions';

export const handler = schedule('* * * * *', async () => {
  console.log("Running scheduled check-signal-results job...");

  const TWELVE_DATA_KEY = (process.env.TWELVE_DATA_KEY || '').trim();
  const rawUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const SUPABASE_URL = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  const SUPABASE_SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  if (!TWELVE_DATA_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("Missing required environment variables for check-signal-results.");
    return { statusCode: 500 };
  }

  try {
    // 1. Fetch PENDING signals from Supabase
    const supabaseHeaders = {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json'
    };

    const signalsRes = await fetch(`${SUPABASE_URL}/rest/v1/signals?result=eq.PENDING&select=*`, {
      headers: supabaseHeaders
    });

    if (!signalsRes.ok) {
      throw new Error(`Supabase fetch failed: ${await signalsRes.text()}`);
    }

    const pendingSignals = await signalsRes.json();
    if (!pendingSignals || pendingSignals.length === 0) {
      console.log("No pending signals to evaluate.");
      return { statusCode: 200 };
    }

    const now = Date.now();
    const readyToEvaluate = pendingSignals.filter((s: any) => {
      const createdAt = new Date(s.created_at).getTime();
      const durationMs = (s.duration_seconds || 60) * 1000;
      return now >= (createdAt + durationMs);
    });

    if (readyToEvaluate.length === 0) {
      console.log("No pending signals have expired yet.");
      return { statusCode: 200 };
    }

    // 2. Group by symbol to minimize Twelve Data API calls
    const symbols = Array.from(new Set(readyToEvaluate.map((s: any) => s.symbol)));
    const prices: Record<string, number> = {};

    for (const sym of symbols) {
      try {
        const pRes = await fetch(`https://api.twelvedata.com/price?symbol=${sym}&apikey=${TWELVE_DATA_KEY}`);
        const pData = await pRes.json();
        if (pData.price) {
          prices[sym as string] = parseFloat(pData.price);
        }
      } catch (err) {
        console.error(`Failed to fetch price for ${sym}:`, err);
      }
    }

    // 3. Evaluate and update each signal
    for (const signal of readyToEvaluate) {
      const currentPrice = prices[signal.symbol];
      if (!currentPrice) continue; // Skip if we failed to get price

      const entryPrice = parseFloat(signal.entry_price);
      let newResult = "COMPLETED";

      if (signal.signal === 'BUY' || signal.signal === 'UP') {
        newResult = currentPrice > entryPrice ? "WIN" : "LOSS";
      } else if (signal.signal === 'SELL' || signal.signal === 'DOWN') {
        newResult = currentPrice < entryPrice ? "WIN" : "LOSS";
      } else if (signal.signal === 'NEUTRAL') {
        newResult = "NEUTRAL";
      }

      // Update in Supabase
      const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/signals?id=eq.${signal.id}`, {
        method: 'PATCH',
        headers: supabaseHeaders,
        body: JSON.stringify({
          result: newResult,
          exit_price: currentPrice
        })
      });

      if (!updateRes.ok) {
        console.error(`Failed to update signal ${signal.id}:`, await updateRes.text());
      } else {
        console.log(`Evaluated Signal ${signal.id} - Result: ${newResult}`);
      }
    }

    return { statusCode: 200 };
  } catch (error: any) {
    console.error("Scheduled task error:", error);
    return { statusCode: 500 };
  }
});