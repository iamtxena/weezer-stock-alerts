# Weezer Stock Alerts App

A TradingView-style stock price monitoring application with advanced alert conditions, customizable notifications, and dual-channel delivery via email and webhooks.

## Features

### Alert Conditions (13 Types)

- **Price Crossings**: Crossing, Crossing Up, Crossing Down
- **Simple Thresholds**: Greater Than, Less Than
- **Channel-Based**: Entering Channel, Exiting Channel, Inside Channel, Outside Channel
- **Movement Tracking**: Moving Up/Down (amount), Moving Up/Down (percentage)

### Advanced Alert Features

- 🏷️ **Custom Alert Names**: Organize alerts with descriptive labels
- 🔄 **Trigger Modes**:
  - *Once*: Auto-disable after triggering
  - *Every Time*: Recurring alerts with 15-minute cooldown
- ⏰ **Expiration Dates**: Set alerts to auto-expire
- 💬 **Custom Messages**: Use dynamic placeholders ({{ticker}}, {{price}}, {{threshold}}, {{date}}, {{time}})
- 📊 **Channel Conditions**: Define upper and lower price bounds for range-based alerts
- 🔗 **Webhook Integration**: Send alerts to Slack or custom endpoints

### Notifications

- 📧 **Email**: Rich HTML notifications via Resend
- 🔗 **Webhooks**: JSON payload delivery to Slack or custom URLs
- ⚡ **Real-time**: Automated checks every 15 minutes

### User Experience

- 🔐 Secure authentication with Clerk
- 🔍 Real-time symbol search (stocks & crypto)
- 🎨 Modern UI with dark mode support
- ⚡ Quick create form + Advanced alert builder
- 🖊️ In-line editing with live preview

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query v5, Zustand
- **Authentication**: Clerk
- **Database**: Supabase PostgreSQL
- **Email**: Resend API
- **Stock Data**: Yahoo Finance API (yahoo-finance2)
- **Cron Jobs**: Vercel Cron
- **Deployment**: Vercel

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm (or npm/yarn)
- Accounts for: Clerk, Supabase, Resend

### Installation

```bash
# Clone repository
git clone https://github.com/iamtxena/weezer-stock-alerts.git
cd weezer-stock-alerts

# Install dependencies
pnpm install

# Copy environment template
cp .env.local.example .env.local
```

### Environment Variables

Create `.env.local` with:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx

# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Resend Email Service
RESEND_API_KEY=xxx

# Cron Secret (generate random string)
CRON_SECRET=your_random_secret_here
```

### Database Setup

Run the migration in Supabase SQL Editor:

```bash
# See supabase/migrations/ for schema
```

Or use the Supabase CLI:

```bash
supabase db push --linked
```

### Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Usage

### Creating Alerts

#### Quick Create

1. Enter ticker symbol (AAPL, BTC-USD, etc.)
2. Set threshold price
3. Choose condition type
4. Add optional message
5. Submit

#### Advanced Alerts

1. Click "Advanced Alert" button
2. **Settings Tab**: Configure symbol, condition, trigger mode, expiration
3. **Message Tab**: Add custom name and message with placeholders
4. **Notifications Tab**: Configure email and webhook URLs
5. Create alert

### Managing Alerts

- **Edit**: Click "Edit" to modify alert settings and webhook configuration
- **Enable/Disable**: Toggle alerts on/off
- **Delete**: Remove alerts permanently
- **View Status**: See trigger count, last triggered time, expiration dates

### Webhook Configuration

Configure webhook URL in any alert's edit form. The webhook applies to all your alerts.

**Webhook Payload Example:**

```json
{
  "ticker": "AAPL",
  "type": "buy",
  "price": 150.25,
  "threshold": 155.00,
  "conditionType": "crossing_down",
  "alertName": "Apple Buy Alert",
  "message": "AAPL dropped below $155!",
  "triggeredAt": "2025-01-17T10:30:00Z"
}
```

## Project Structure

```bash
src/
├── app/
│   ├── layout.tsx                    # Root layout with Clerk provider
│   ├── page.tsx                      # Dashboard with quick create
│   ├── alerts/new/page.tsx           # Advanced alert creation
│   └── api/
│       ├── alerts/route.ts           # Alert CRUD operations
│       ├── user-preferences/route.ts # Webhook configuration
│       ├── symbols/
│       │   ├── search/route.ts       # Symbol search
│       │   └── validate/route.ts     # Symbol validation
│       └── cron/check-alerts/route.ts # Price monitoring
├── hooks/
│   ├── use-alerts.ts                 # Alert state management
│   ├── use-symbol-search.ts          # Symbol search hook
│   └── use-user-preferences.ts       # Webhook preferences
├── stores/
│   └── alert-form-store.ts           # Form state (Zustand)
├── lib/
│   ├── supabase.ts                   # Supabase client
│   └── notifier.ts                   # Email & webhook delivery
└── middleware.ts                     # Clerk auth middleware
```

## API Endpoints

- `GET /api/alerts` - Fetch user's alerts
- `POST /api/alerts` - Create alert
- `PUT /api/alerts` - Update alert
- `DELETE /api/alerts?id=xxx` - Delete alert
- `GET /api/user-preferences` - Get webhook URL
- `PUT /api/user-preferences` - Update webhook URL
- `GET /api/symbols/search?q=xxx` - Search symbols
- `GET /api/symbols/validate?symbol=xxx` - Validate symbol
- `GET /api/cron/check-alerts` - Check alerts (Vercel Cron)

## Deployment

### Vercel Deployment

1. Push code to GitHub
2. Import project in Vercel
3. Add all environment variables
4. Deploy

The cron job (`vercel.json`) runs automatically every 15 minutes.

### Database Migration

After deployment, run the migration in Supabase:

```bash
# Via Supabase dashboard SQL Editor
# Copy contents from supabase/migrations/20251117200500_add_tradingview_fields.sql
```

## Development

```bash
# Development
pnpm dev

# Build
pnpm build

# Lint
pnpm lint

# Type check
pnpm type-check
```

## License

MIT

## Author

@iamtxena

---

Built with Next.js 16, TypeScript, and TradingView-inspired UX
