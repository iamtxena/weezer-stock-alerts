-- Add message column to alerts table
ALTER TABLE alerts
ADD COLUMN IF NOT EXISTS message TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_alerts_message ON alerts(message);
