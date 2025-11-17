-- Enable pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create alerts table
CREATE TABLE alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  ticker TEXT NOT NULL,
  threshold NUMERIC NOT NULL,
  type TEXT CHECK (type IN ('buy', 'sell', 'rebalance')) NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to manage their own alerts
CREATE POLICY "Users can manage their own alerts"
ON alerts
FOR ALL
USING (auth.jwt() ->> 'sub' = user_id);

-- Create indexes for better performance
CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_alerts_active ON alerts(active);
