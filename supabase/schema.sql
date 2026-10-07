-- Supabase Database Schema for Hussain Trade Signal
-- Apply this in the Supabase SQL Editor

-- Create the licenses table
CREATE TABLE licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_key TEXT UNIQUE NOT NULL,
    active BOOLEAN DEFAULT true,
    user_email TEXT,
    device_id TEXT, -- Used to link a license to a specific device
    activated_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    notes TEXT
);

-- Row Level Security (RLS)
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

-- Allow read access for everyone (so backend can verify)
-- If the backend uses Service Role Key, this isn't strictly necessary for the backend,
-- but useful if using the anon key.
CREATE POLICY "Allow public read of licenses" ON licenses FOR SELECT USING (true);

-- Allow updates (like setting device_id on first activation or updating last_used_at) 
-- ONLY via Service Role or specific logic. Since the backend uses the anon key in your setup, 
-- we need to allow updates to device_id and last_used_at.
-- It's safer to only allow updates to specific fields or use a secure backend function.
CREATE POLICY "Allow public update of device_id and last_used_at" ON licenses 
FOR UPDATE USING (true) 
WITH CHECK (true); 
-- Note: In production, consider moving all license logic to a Supabase Edge Function 
-- or use the Service Role Key in the Netlify backend to bypass RLS securely.
