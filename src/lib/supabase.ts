import { createClient } from '@supabase/supabase-js';

export interface Alert {
  id: string;
  user_id: string;
  ticker: string;
  threshold: number;
  type: 'buy' | 'sell' | 'rebalance';
  active: boolean;
  created_at: string;
  message?: string;
  name?: string;
  condition_type?: 'crossing' | 'crossing_up' | 'crossing_down' | 'greater_than' | 'less_than' |
    'entering_channel' | 'exiting_channel' | 'inside_channel' | 'outside_channel' |
    'moving_up' | 'moving_down' | 'moving_up_pct' | 'moving_down_pct';
  trigger_mode?: 'once' | 'every_time';
  expires_at?: string;
  last_price?: number;
  upper_bound?: number;
  lower_bound?: number;
  trigger_count?: number;
  last_triggered_at?: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  webhook_url?: string;
  email_notifications?: boolean;
  webhook_notifications?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      alerts: {
        Row: Alert;
        Insert: Omit<Alert, 'id' | 'created_at'>;
        Update: Partial<Omit<Alert, 'id' | 'created_at'>>;
      };
      user_preferences: {
        Row: UserPreferences;
        Insert: Omit<UserPreferences, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserPreferences, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
}

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
