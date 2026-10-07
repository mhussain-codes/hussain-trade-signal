export async function verifyLicense(licenseKey: string) {
  console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
  console.log("VITE_SUPABASE_URL:", process.env.VITE_SUPABASE_URL);
  console.log("SERVICE_ROLE_EXISTS:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);

  const rawUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();

  if (!rawUrl) {
    return { valid: false, error: 'Configuration Error: SUPABASE_URL is missing' };
  }

  // Strip trailing slashes and accidental /rest/v1/ inclusions
  const supabaseBaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();
  
  console.log("SUPABASE_KEY Length:", supabaseKey.length);

  if (!supabaseKey) {
    return { valid: false, error: 'Configuration Error: SUPABASE_KEY is missing' };
  }

  if (!licenseKey) {
    return { valid: false, error: 'License key is missing' };
  }

  try {
    const fetchUrl = `${supabaseBaseUrl}/rest/v1/licenses?license_key=eq.${encodeURIComponent(licenseKey)}&select=*`;
    const response = await fetch(fetchUrl, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Supabase error (${response.status}):`, errorText);
      console.error(`Attempted with URL: ${fetchUrl}`);
      return { valid: false, error: `Supabase API Error (${response.status}): ${errorText}` };
    }

    const data = await response.json();
    
    if (!data || data.length === 0) {
      return { valid: false, error: 'Invalid License' };
    }

    const license = data[0];
    
    if (license.active === false) {
      return { valid: false, error: 'License Suspended' };
    }

    return { valid: true };
  } catch (error: any) {
    console.error('License verification error', error);
    return { valid: false, error: `Function Error: ${error.message || error}` };
  }
}
