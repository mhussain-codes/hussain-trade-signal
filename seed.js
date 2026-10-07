import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const testLicenses = [
  'HTS_TEST_LICENSE_001',
  'HTS_TEST_LICENSE_002',
  'HTS_TEST_LICENSE_003'
];

async function seed() {
  console.log("Seeding Supabase with test licenses...");
  
  for (const key of testLicenses) {
    const { data, error } = await supabase
      .from('licenses')
      .upsert({ 
        license_key: key, 
        active: true 
      }, { onConflict: 'license_key' });

    if (error) {
      console.error("Failed to insert " + key + ":", error.message);
    } else {
      console.log("Successfully seeded " + key);
    }
  }
  
  console.log("Seeding complete.");
}

seed();
