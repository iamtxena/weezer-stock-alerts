import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

interface AlertData {
  ticker: string;
  type: string;
  price: number;
  threshold: number;
  userEmail: string;
  webhookUrl?: string;
  customMessage?: string;
  alertName?: string;
  conditionType?: string;
  upperBound?: number;
  lowerBound?: number;
}

function replacePlaceholders(message: string, data: AlertData): string {
  const now = new Date();
  return message
    .replace(/\{\{ticker\}\}/g, data.ticker)
    .replace(/\{\{price\}\}/g, data.price.toFixed(2))
    .replace(/\{\{threshold\}\}/g, data.threshold.toFixed(2))
    .replace(/\{\{date\}\}/g, now.toLocaleDateString())
    .replace(/\{\{time\}\}/g, now.toLocaleTimeString());
}

export async function sendAlert(data: AlertData) {
  const { ticker, type, price, threshold, userEmail, webhookUrl, customMessage, alertName, conditionType, upperBound, lowerBound } = data;

  // Generate default message if no custom message provided
  let message = customMessage || `🚨 Alert: ${ticker} ${type} at $${price} (threshold: $${threshold})`;

  // Replace placeholders if custom message exists
  if (customMessage) {
    message = replacePlaceholders(customMessage, data);
  }

  try {
    // Send email notification
    if (userEmail) {
      const subject = alertName ? `Alert: ${alertName}` : `Stock Alert: ${ticker}`;

      let thresholdInfo = `Threshold: $${threshold}`;
      if (upperBound !== undefined && lowerBound !== undefined) {
        thresholdInfo = `Channel: $${lowerBound} - $${upperBound}`;
      }

      await resend.emails.send({
        from: 'alerts@lona.agency',
        to: [userEmail],
        subject,
        text: message,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1f2937;">🚨 Stock Alert</h2>
            ${alertName ? `<h3 style="color: #4b5563;">${alertName}</h3>` : ''}
            <p><strong>${ticker}</strong> has triggered ${conditionType ? `a <strong>${conditionType.replace(/_/g, ' ')}</strong>` : `a <strong>${type}</strong>`} alert!</p>
            <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 8px 0;"><strong>Current Price:</strong> $${price.toFixed(2)}</p>
              <p style="margin: 8px 0;"><strong>${thresholdInfo}</strong></p>
              ${conditionType ? `<p style="margin: 8px 0;"><strong>Condition:</strong> ${conditionType.replace(/_/g, ' ')}</p>` : ''}
              <p style="margin: 8px 0;"><strong>Type:</strong> ${type}</p>
            </div>
            ${customMessage ? `<div style="background-color: #eff6ff; padding: 16px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 16px 0;">
              <p style="margin: 0;"><strong>Message:</strong></p>
              <p style="margin: 8px 0;">${replacePlaceholders(customMessage, data)}</p>
            </div>` : ''}
            <p style="color: #6b7280; font-size: 14px;">Triggered at ${new Date().toLocaleString()}</p>
          </div>
        `
      });
    }

    // Send webhook notification
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticker,
            type,
            price,
            threshold,
            upperBound,
            lowerBound,
            conditionType,
            alertName,
            message: customMessage ? replacePlaceholders(customMessage, data) : message,
            triggeredAt: new Date().toISOString()
          })
        });
        console.log(`Webhook sent to ${webhookUrl} for ${ticker}`);
      } catch (webhookError) {
        console.error('Error sending webhook:', webhookError);
        // Don't throw - email notification should still succeed
      }
    }

    console.log(`Alert sent for ${ticker}: ${type} at $${price}`);
  } catch (error) {
    console.error('Error sending alert:', error);
    throw error;
  }
}
