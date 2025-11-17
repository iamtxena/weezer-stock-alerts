# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Weezer Stock Alerts, please report it responsibly.

**Please do NOT:**
- Open a public GitHub issue
- Disclose the vulnerability publicly before it's been addressed

**Please DO:**
- Email security details to the maintainer
- Include as much information as possible:
  - Type of vulnerability
  - Steps to reproduce
  - Potential impact
  - Suggested fix (if you have one)

## What to Expect

- Acknowledgment of your report within 48 hours
- Regular updates on the progress of addressing the vulnerability
- Credit for the discovery (if desired) when the fix is released

## Supported Versions

Only the latest version of the application receives security updates.

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |
| Older   | :x:                |

## Security Best Practices

When deploying this application:

### Environment Variables
- Never commit `.env.local` or similar files
- Use strong, unique API keys for all services
- Rotate credentials regularly
- Use environment-specific keys (separate dev/prod)

### Database
- Enable Row Level Security (RLS) in Supabase
- Limit service role key usage to server-side only
- Use anon key for client-side operations
- Regular backups of critical data

### Authentication
- Use production Clerk keys in production
- Enable MFA for admin accounts
- Review user permissions regularly

### API Security
- Protect cron endpoints with `CRON_SECRET`
- Validate all user inputs
- Rate limit API endpoints (via Vercel)
- Use HTTPS only in production

### Webhooks
- Validate webhook URLs before saving
- Use HTTPS for webhook endpoints
- Consider webhook signature verification
- Sanitize all data sent to webhooks

## Known Security Considerations

### API Keys in Client
- `NEXT_PUBLIC_*` variables are exposed to the client
- Use Clerk and Supabase RLS to protect data access
- Never expose service role keys to the client

### Yahoo Finance API
- Free tier, no authentication required
- Rate limits apply
- Data is 15-minute delayed

### Email Notifications
- Emails contain stock prices and alert info
- Ensure Resend API key is kept secure
- Consider encrypting sensitive data in emails

## Disclosure Policy

When a security vulnerability is fixed:
- A security advisory will be published
- The fix will be released in a new version
- Credits will be given to the reporter (if desired)

Thank you for helping keep Weezer Stock Alerts secure!
