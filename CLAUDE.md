# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Development Commands

```bash
# Install dependencies
pnpm install

# Run development server (http://localhost:3000)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linter
pnpm lint
```

## Architecture Overview

This is a **Next.js 16 App Router** application implementing a TradingView-style stock alert system with advanced condition types, customizable notifications, and dual-channel delivery (email + webhooks).

### Key Features

**Alert System (13 Condition Types)**
- Price Crossings: `crossing`, `crossing_up`, `crossing_down`
- Simple Thresholds: `greater_than`, `less_than`
- Channel-Based: `entering_channel`, `exiting_channel`, `inside_channel`, `outside_channel`
- Movement Tracking: `moving_up`, `moving_down`, `moving_up_pct`, `moving_down_pct`

**Advanced Alert Features**
- Custom alert names and messages with placeholders
- Trigger modes: `once` (auto-disable) or `every_time` (15-min cooldown)
- Expiration dates
- Channel conditions with upper/lower bounds
- Price tracking for crossing detection

### Authentication Flow

- **Clerk** handles all authentication via middleware (`src/middleware.ts`)
- Middleware protects all routes except `/sign-in`, `/sign-up`, and `/api/cron/*`
- Client components use `useUser()` hook; server components/API routes use `auth()` from `@clerk/nextjs/server`
- User IDs from Clerk (`userId`) are stored in Supabase as `user_id` (TEXT) for alert ownership

### Database Schema

**Supabase PostgreSQL** with two tables:

**`alerts` table** (main):
- Core fields: `id`, `user_id`, `ticker`, `threshold`, `type`, `active`
- TradingView fields: `name`, `condition_type`, `trigger_mode`, `expires_at`
- Price tracking: `last_price`, `upper_bound`, `lower_bound`
- Trigger tracking: `trigger_count`, `last_triggered_at`
- Timestamps: `created_at`

**`user_preferences` table**:
- `user_id` (primary key)
- `webhook_url` (optional, applies to all user's alerts)

**Supabase Client Pattern:**
- **Client-side**: Uses `createBrowserClient` from `@supabase/ssr` with `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Server-side**: Uses `createClient` from `@supabase/supabase-js` with `SUPABASE_SERVICE_ROLE_KEY`
- Row Level Security (RLS) enabled with JWT-based policies

### Cron Job Architecture

**Location:** `src/app/api/cron/check-alerts/route.ts`

**Execution:** Triggered by Vercel Cron every 15 minutes (configured in `vercel.json`)

**Security:** Requires `CRON_SECRET` in Authorization header

**Process:**
1. Fetch all active alerts from database
2. Group alerts by ticker to minimize Yahoo Finance API calls
3. For each ticker:
   - Fetch current price from Yahoo Finance
   - Check each alert's condition using `checkCondition()` function
   - Verify alert should trigger using `shouldTrigger()` (expiration, cooldown)
   - If triggered: send notifications, update trigger tracking
   - Update `last_price` for crossing detection (even if not triggered)
4. Handle trigger modes:
   - `once`: Set `active: false` after triggering
   - `every_time`: Keep active, update `last_triggered_at`, enforce 15-min cooldown

**Condition Logic** (`checkCondition` function):
- Implements all 13 condition types
- Uses `last_price` for crossing and movement detection
- Uses `upper_bound`/`lower_bound` for channel conditions
- Percentage calculations for `moving_up_pct`/`moving_down_pct`
- Backward compatible: defaults to legacy behavior if `condition_type` not set

### Notification System

**Location:** `src/lib/notifier.ts`

**Function:** `sendAlert(data: AlertData)`

**Dual-channel delivery:**

1. **Email Notifications** (Resend API):
   - Sender: `alerts@lona.agency`
   - Subject: Uses custom alert name or defaults to ticker
   - Rich HTML formatting with alert details
   - Displays condition type, channel bounds, custom message
   - Message placeholder replacement

2. **Webhook Notifications** (Slack/Custom):
   - Fetches webhook URL from `user_preferences` table
   - Sends JSON payload with full alert details
   - Non-blocking: email succeeds even if webhook fails
   - Payload includes: ticker, price, threshold, condition type, alert name, message, timestamp

**Message Placeholders:**
- `{{ticker}}` → Stock symbol
- `{{price}}` → Current price
- `{{threshold}}` → Alert threshold
- `{{date}}` → Current date
- `{{time}}` → Current time

### API Routes

All routes follow Next.js App Router conventions:

**`/api/alerts`** - Alert CRUD
- `GET`: Fetch user's alerts
- `POST`: Create alert (supports all TradingView fields)
- `PUT`: Update alert (supports partial updates)
- `DELETE`: Delete alert by ID (query param)
- All operations verify user ownership via Clerk `userId`

**`/api/user-preferences`** - Webhook Configuration
- `GET`: Fetch user's webhook URL
- `PUT`: Update webhook URL (upsert pattern)

**`/api/symbols`** - Symbol Search & Validation
- `GET /api/symbols/search?q=xxx`: Search stocks/crypto
- `GET /api/symbols/validate?symbol=xxx`: Validate ticker

**`/api/cron/check-alerts`** - Price Monitoring
- `GET`: Check all active alerts (requires `CRON_SECRET`)

### Client-Side State Management

**TanStack Query v5:**
- Alert fetching: `useAlerts()` hook
- Mutations: `useCreateAlert()`, `useUpdateAlert()`, `useToggleAlert()`, `useDeleteAlert()`
- User preferences: `useUserPreferences()` hook
- Symbol search: `useSymbolSearch()` hook
- Automatic cache invalidation after mutations

**Zustand:**
- Form state management: `useAlertFormStore` (stores/alert-form-store.ts)
- Quick create form: ticker, threshold, condition type, message
- Symbol search state: query, dropdown visibility

**React State:**
- Edit mode: `editingId` and `editForm` in dashboard
- Validation errors: `validationError`
- Symbol search dropdown: outside click detection with `useRef`

### TypeScript Types

**Location:** `src/hooks/use-alerts.ts`

**Key Types:**
```typescript
export type ConditionType = 'crossing' | 'crossing_up' | 'crossing_down' |
  'greater_than' | 'less_than' | 'entering_channel' | 'exiting_channel' |
  'inside_channel' | 'outside_channel' | 'moving_up' | 'moving_down' |
  'moving_up_pct' | 'moving_down_pct';

export type TriggerMode = 'once' | 'every_time';

export interface Alert {
  id: string;
  user_id: string;
  ticker: string;
  threshold: number;
  type: 'buy' | 'sell' | 'rebalance';
  active: boolean;
  message?: string;
  name?: string;
  condition_type?: ConditionType;
  trigger_mode?: TriggerMode;
  expires_at?: string;
  last_price?: number;
  upper_bound?: number;
  lower_bound?: number;
  trigger_count?: number;
  last_triggered_at?: string;
  created_at: string;
}
```

### UI Components

**Dashboard** (`src/app/page.tsx`):
- Quick create form with all 13 condition types
- Alert list with visual badges:
  - Type badge (buy/sell/rebalance)
  - Condition type badge (purple)
  - Trigger mode badge (yellow for recurring)
  - Webhook indicator (🔗 icon, indigo)
  - Active status badge
- In-line editing with webhook configuration
- Real-time symbol search dropdown

**Advanced Alert Creation** (`src/app/alerts/new/page.tsx`):
- Three-tab interface: Settings, Message, Notifications
- Settings: Symbol, condition type, threshold/channel, trigger mode, expiration
- Message: Custom name and message with placeholder hints
- Notifications: Email toggle, webhook URL input
- Channel condition detection (shows upper/lower bounds when needed)
- Form validation and error handling

### Yahoo Finance Integration

- Uses `yahoo-finance2` package (pure JavaScript, no Python)
- Ticker format: `AAPL` for stocks, `BTC-USD` for cryptocurrencies
- Free tier provides 15-minute delayed prices
- API calls minimized by grouping alerts by ticker in cron job
- Symbol search via `searchSymbols()` API
- Symbol validation via `quote()` API

### Environment Variables

Required in `.env.local`:

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

# Cron Security
CRON_SECRET=your_random_secret_here
```

**Note:** No SLACK_WEBHOOK_URL needed - webhook configured per-user in database.

### Deployment Considerations

- **Vercel Cron** requires deployment on Vercel (crons defined in `vercel.json`)
- `CRON_SECRET` must be set in Vercel environment variables
- Clerk production domain must be added in Clerk dashboard
- Resend domain must be verified for production email sending
- Database migration must be run via Supabase dashboard or CLI

### Common Modifications

**Changing Email Sender:**
Edit `src/lib/notifier.ts` line 51:
```typescript
from: 'alerts@your-domain.com'
```

**Adjusting Cron Frequency:**
Edit `vercel.json`:
```json
"schedule": "*/5 * * * *"  // Every 5 minutes
```

**Adding New Condition Types:**
1. Add to `ConditionType` enum in `src/hooks/use-alerts.ts`
2. Add case to `checkCondition()` in `src/app/api/cron/check-alerts/route.ts`
3. Add option to dropdown in `src/app/alerts/new/page.tsx` and `src/app/page.tsx`

**Customizing Alert Logic:**
Modify `checkCondition()` and `shouldTrigger()` functions in cron job.

## Migration Scripts

**Location:** `scripts/`

- `update-alert-messages.ts` - Bulk update alert messages and TradingView fields
- `set-webhook-and-nvda-expiry.ts` - Configure webhook URL and update NVDA expiration
- `add-tradingview-fields.ts` - Apply database migration (alternative to Supabase CLI)

## Import Organization

**Always place all imports at the top of files.** Do not create imports in the middle of code blocks.

## Best Practices

- Use TanStack Query for server state
- Use Zustand for client form state
- Always validate user ownership in API routes
- Update `last_price` even when alert doesn't trigger (for crossing detection)
- Handle webhook failures gracefully (don't block email)
- Use TypeScript strict mode
- Follow Next.js App Router conventions
