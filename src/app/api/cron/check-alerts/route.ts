import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';
import { supabase } from '@/lib/supabase';
import { sendAlert } from '@/lib/notifier';
import { clerkClient } from '@clerk/nextjs/server';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Alert {
  id: string;
  user_id: string;
  ticker: string;
  threshold: number;
  type: 'buy' | 'sell' | 'rebalance';
  active: boolean;
  message?: string;
  name?: string;
  condition_type?: string;
  trigger_mode?: 'once' | 'every_time';
  expires_at?: string;
  last_price?: number;
  upper_bound?: number;
  lower_bound?: number;
  trigger_count?: number;
  last_triggered_at?: string;
  created_at: string;
}

function checkCondition(alert: Alert, currentPrice: number): boolean {
  const condition = alert.condition_type || 'greater_than'; // Default to greater_than for backward compatibility
  const { threshold, last_price, upper_bound, lower_bound } = alert;

  switch (condition) {
    case 'greater_than':
      return currentPrice >= threshold;

    case 'less_than':
      return currentPrice <= threshold;

    case 'crossing':
      if (last_price === undefined || last_price === null) return false;
      // Price crossed threshold in either direction
      return (last_price < threshold && currentPrice >= threshold) ||
             (last_price > threshold && currentPrice <= threshold);

    case 'crossing_up':
      if (last_price === undefined || last_price === null) return false;
      // Price crossed above threshold
      return last_price < threshold && currentPrice >= threshold;

    case 'crossing_down':
      if (last_price === undefined || last_price === null) return false;
      // Price crossed below threshold
      return last_price > threshold && currentPrice <= threshold;

    case 'entering_channel':
      if (upper_bound === undefined || lower_bound === undefined || last_price === undefined) return false;
      // Price was outside channel, now inside
      const wasOutside = last_price < lower_bound || last_price > upper_bound;
      const isInside = currentPrice >= lower_bound && currentPrice <= upper_bound;
      return wasOutside && isInside;

    case 'exiting_channel':
      if (upper_bound === undefined || lower_bound === undefined || last_price === undefined) return false;
      // Price was inside channel, now outside
      const wasInside = last_price >= lower_bound && last_price <= upper_bound;
      const isOutside = currentPrice < lower_bound || currentPrice > upper_bound;
      return wasInside && isOutside;

    case 'inside_channel':
      if (upper_bound === undefined || lower_bound === undefined) return false;
      // Price is currently inside channel
      return currentPrice >= lower_bound && currentPrice <= upper_bound;

    case 'outside_channel':
      if (upper_bound === undefined || lower_bound === undefined) return false;
      // Price is currently outside channel
      return currentPrice < lower_bound || currentPrice > upper_bound;

    case 'moving_up':
      if (last_price === undefined || last_price === null) return false;
      // Price moved up by threshold amount
      return currentPrice >= last_price + threshold;

    case 'moving_down':
      if (last_price === undefined || last_price === null) return false;
      // Price moved down by threshold amount
      return currentPrice <= last_price - threshold;

    case 'moving_up_pct':
      if (last_price === undefined || last_price === null || last_price === 0) return false;
      // Price moved up by threshold percentage
      const upPctChange = ((currentPrice - last_price) / last_price) * 100;
      return upPctChange >= threshold;

    case 'moving_down_pct':
      if (last_price === undefined || last_price === null || last_price === 0) return false;
      // Price moved down by threshold percentage
      const downPctChange = ((last_price - currentPrice) / last_price) * 100;
      return downPctChange >= threshold;

    default:
      // Fallback to legacy behavior for backward compatibility
      if (alert.type === 'buy') return currentPrice <= threshold;
      if (alert.type === 'sell') return currentPrice >= threshold;
      if (alert.type === 'rebalance') {
        const deviation = Math.abs((currentPrice - threshold) / threshold);
        return deviation > 0.25;
      }
      return false;
  }
}

function shouldTrigger(alert: Alert): boolean {
  // Check expiration
  if (alert.expires_at) {
    const expirationDate = new Date(alert.expires_at);
    if (new Date() > expirationDate) {
      console.log(`Alert ${alert.id} has expired`);
      return false;
    }
  }

  // Check cooldown for "every_time" mode (15 minutes)
  if (alert.trigger_mode === 'every_time' && alert.last_triggered_at) {
    const lastTriggered = new Date(alert.last_triggered_at);
    const cooldownMinutes = 15;
    const cooldownMs = cooldownMinutes * 60 * 1000;
    const timeSinceLastTrigger = Date.now() - lastTriggered.getTime();

    if (timeSinceLastTrigger < cooldownMs) {
      console.log(`Alert ${alert.id} is in cooldown (${Math.round((cooldownMs - timeSinceLastTrigger) / 1000 / 60)} minutes remaining)`);
      return false;
    }
  }

  return true;
}

export async function GET(request: Request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting alert check...');

    // Fetch all active alerts
    const { data: alerts, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('active', true);

    if (error) {
      console.error('Error fetching alerts:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!alerts || alerts.length === 0) {
      console.log('No active alerts found');
      return NextResponse.json({ checked: 0, triggered: 0 });
    }

    console.log(`Checking ${alerts.length} active alerts...`);

    let triggeredCount = 0;
    const checkedTickers = new Set<string>();

    // Group alerts by ticker to minimize API calls
    const alertsByTicker = new Map<string, Alert[]>();
    alerts.forEach((alert: Alert) => {
      if (!alertsByTicker.has(alert.ticker)) {
        alertsByTicker.set(alert.ticker, []);
      }
      alertsByTicker.get(alert.ticker)!.push(alert);
    });

    // Check each ticker
    for (const [ticker, tickerAlerts] of alertsByTicker.entries()) {
      try {
        console.log(`Fetching price for ${ticker}...`);

        // Fetch current price from Yahoo Finance
        const quote = await yahooFinance.quote(ticker) as any;
        const currentPrice = quote.regularMarketPrice;

        if (!currentPrice) {
          console.error(`No price data for ${ticker}`);
          continue;
        }

        console.log(`${ticker} current price: $${currentPrice}`);
        checkedTickers.add(ticker);

        // Check each alert for this ticker
        for (const alert of tickerAlerts) {
          // Check if alert should trigger (expiration, cooldown, etc.)
          if (!shouldTrigger(alert)) {
            // Update last_price even if not triggering
            await (supabase
              .from('alerts')
              .update as any)({ last_price: currentPrice })
              .eq('id', alert.id);
            continue;
          }

          // Check if alert conditions are met
          const triggered = checkCondition(alert, currentPrice);

          if (triggered) {
            console.log(
              `Alert triggered for ${ticker}: ${alert.condition_type || alert.type} at $${currentPrice}`
            );

            try {
              // Get user email from Clerk
              const client = await clerkClient();
              const user = await client.users.getUser(alert.user_id);
              const userEmail = user.emailAddresses[0]?.emailAddress;

              if (!userEmail) {
                console.error(`No email found for user ${alert.user_id}`);
                continue;
              }

              // Get user preferences (webhook URL)
              const { data: preferences } = await (supabase
                .from('user_preferences')
                .select as any)('webhook_url')
                .eq('user_id', alert.user_id)
                .single();

              // Send notification
              await sendAlert({
                ticker: alert.ticker,
                type: alert.type,
                price: currentPrice,
                threshold: alert.threshold,
                userEmail,
                webhookUrl: preferences?.webhook_url,
                customMessage: alert.message,
                alertName: alert.name,
                conditionType: alert.condition_type,
                upperBound: alert.upper_bound,
                lowerBound: alert.lower_bound,
              });

              // Update alert based on trigger mode
              const updateData: any = {
                last_price: currentPrice,
                trigger_count: (alert.trigger_count || 0) + 1,
                last_triggered_at: new Date().toISOString(),
              };

              // Deactivate alert if trigger_mode is "once" (or not set for backward compatibility)
              if (!alert.trigger_mode || alert.trigger_mode === 'once') {
                updateData.active = false;
              }

              await (supabase
                .from('alerts')
                .update as any)(updateData)
                .eq('id', alert.id);

              triggeredCount++;
            } catch (notificationError) {
              console.error('Error sending notification:', notificationError);
            }
          } else {
            // Update last_price for crossing detection even if not triggered
            await (supabase
              .from('alerts')
              .update as any)({ last_price: currentPrice })
              .eq('id', alert.id);
          }
        }
      } catch (tickerError) {
        console.error(`Error checking ticker ${ticker}:`, tickerError);
        // Continue checking other tickers even if one fails
        continue;
      }
    }

    console.log(
      `Alert check complete. Checked ${checkedTickers.size} tickers, triggered ${triggeredCount} alerts.`
    );

    return NextResponse.json({
      checked: checkedTickers.size,
      triggered: triggeredCount,
      totalAlerts: alerts.length
    });
  } catch (error) {
    console.error('Error in cron job:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
