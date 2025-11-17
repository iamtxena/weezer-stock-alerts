import { Resend } from 'resend';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from project root
const envPath = path.join(process.cwd(), '.env.local');
console.log('Loading env from:', envPath);
const result = dotenv.config({ path: envPath, override: true }); // Force override existing env vars

if (result.error) {
  console.error('Error loading .env.local:', result.error);
} else {
  console.log('Loaded', Object.keys(result.parsed || {}).length, 'environment variables');
}

const resend = new Resend(process.env.RESEND_API_KEY);

async function testResend() {
  try {
    console.log('Testing Resend API configuration...');
    console.log('API Key loaded:', !!process.env.RESEND_API_KEY);
    console.log('API Key starts with:', process.env.RESEND_API_KEY?.substring(0, 8) + '...');
    console.log('API Key length:', process.env.RESEND_API_KEY?.length);

    const data = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'iamtxena@gmail.com',
      subject: 'Stock Alerts App - Test Email',
      html: `
        <h2>Hello from Stock Alerts App!</h2>
        <p>Congrats on successfully configuring your <strong>Resend API</strong>!</p>
        <p>Your email notifications are now ready to work.</p>
        <hr />
        <p><small>This is a test email from your Stock Alerts application.</small></p>
      `
    });

    console.log('✅ Email sent successfully!');
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log('\nCheck your inbox at iamtxena@gmail.com');
  } catch (error) {
    console.error('❌ Error sending email:', error);
    process.exit(1);
  }
}

testResend();
