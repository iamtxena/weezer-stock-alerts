import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from project root
const envPath = path.join(process.cwd(), '.env.local');
console.log('Loading env from:', envPath);
const result = dotenv.config({ path: envPath, override: true });

if (result.error) {
  console.error('Error loading .env.local:', result.error);
  process.exit(1);
}

console.log('Loaded', Object.keys(result.parsed || {}).length, 'environment variables\n');

async function testSlack() {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error('❌ SLACK_WEBHOOK_URL not found in .env.local');
    process.exit(1);
  }

  if (webhookUrl === 'https://hooks.slack.com/services/xxx') {
    console.error('❌ Please update SLACK_WEBHOOK_URL in .env.local with your actual webhook URL');
    console.error('\nFollow these steps:');
    console.error('1. Go to https://api.slack.com/apps');
    console.error('2. Create a new app or select existing one');
    console.error('3. Enable Incoming Webhooks');
    console.error('4. Add webhook to workspace and select channel');
    console.error('5. Copy the webhook URL to .env.local');
    process.exit(1);
  }

  console.log('Testing Slack webhook...');
  console.log('Webhook URL:', webhookUrl.substring(0, 40) + '...');

  try {
    const message = {
      text: '🧪 Test message from Stock Alerts App',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🚀 Stock Alerts App Connected!',
            emoji: true
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: 'Your Slack notifications are now configured and working! 🎉'
          }
        },
        {
          type: 'divider'
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*What happens next?*\n• You\'ll receive alerts when stock prices hit your thresholds\n• Alerts run every 15 minutes via Vercel Cron\n• Each alert includes ticker, price, and threshold info'
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: '_This is a test message sent from your local development environment_'
            }
          ]
        }
      ]
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message)
    });

    if (response.ok) {
      console.log('\n✅ Message sent successfully!');
      console.log('Check your Slack channel for the test message.');
      console.log('\n📝 Next steps:');
      console.log('1. Verify the message appeared in the correct channel');
      console.log('2. When deploying to Vercel, add SLACK_WEBHOOK_URL to environment variables');
      console.log('3. Start receiving stock price alerts! 🚀');
    } else {
      const errorText = await response.text();
      console.error('❌ Failed to send message');
      console.error('Status:', response.status);
      console.error('Response:', errorText);
    }
  } catch (error) {
    console.error('❌ Error sending Slack message:', error);
    process.exit(1);
  }
}

testSlack();
