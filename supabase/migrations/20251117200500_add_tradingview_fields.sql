-- Add new fields to alerts table for TradingView-like functionality

-- Add alert name
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS name TEXT;

-- Add condition type with all TradingView options
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS condition_type TEXT
  CHECK (condition_type IN (
    'crossing',
    'crossing_up',
    'crossing_down',
    'greater_than',
    'less_than',
    'entering_channel',
    'exiting_channel',
    'inside_channel',
    'outside_channel',
    'moving_up',
    'moving_down',
    'moving_up_pct',
    'moving_down_pct'
  )) DEFAULT 'greater_than';

-- Add trigger mode (once or every time)
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS trigger_mode TEXT
  CHECK (trigger_mode IN ('once', 'every_time'))
  DEFAULT 'once';

-- Add expiration timestamp
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;

-- Add last price for crossing detection
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS last_price NUMERIC;

-- Add channel bounds for channel-based conditions
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS upper_bound NUMERIC;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS lower_bound NUMERIC;

-- Add trigger tracking
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS trigger_count INTEGER DEFAULT 0;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS last_triggered_at TIMESTAMP;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_alerts_condition_type ON alerts(condition_type);
CREATE INDEX IF NOT EXISTS idx_alerts_trigger_mode ON alerts(trigger_mode);
CREATE INDEX IF NOT EXISTS idx_alerts_expires_at ON alerts(expires_at);
CREATE INDEX IF NOT EXISTS idx_alerts_active_expires ON alerts(active, expires_at) WHERE active = true;

-- Create user_preferences table for webhook configuration
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,
  webhook_url TEXT,
  email_notifications BOOLEAN DEFAULT true,
  webhook_notifications BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on user_id
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Add RLS policies for user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own preferences"
  ON user_preferences FOR DELETE
  USING (auth.uid()::text = user_id);
