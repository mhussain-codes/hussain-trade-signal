import { verifyLicense } from './utils/license';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { licenseKey } = JSON.parse(event.body || '{}');
    
    // MOCK LICENSE CHECK FOR LOCAL TESTING
    console.log("Mocking license check for key:", licenseKey);
    const result = { valid: true, error: null };

    if (!result.valid) {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: false, error: result.error })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
};
