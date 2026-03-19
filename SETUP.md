# Reportly - Setup Guide

## Prerequisites

Before running Reportly, you need to set up Supabase and other services.

## 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In your Supabase project dashboard:
   - Go to **Settings → API** 
   - Copy your **Project URL** and **anon key**
   - Copy your **Service Role key** (keep this secret!)

3. Create a `.env.local` file in `/workspaces/Reportly/reportly/`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## 2. Database Setup

Run the Supabase migrations to create the required tables. Go to your Supabase project dashboard → SQL Editor and run these queries to create the tables:

```sql
-- Create agencies table
CREATE TABLE agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  brand_color TEXT DEFAULT '#ffffff',
  custom_domain TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id),
  email TEXT NOT NULL,
  role TEXT DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL UNIQUE REFERENCES agencies(id),
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT NOT NULL,
  plan TEXT DEFAULT 'starter' CHECK (plan IN ('starter', 'pro', 'enterprise')),
  status TEXT DEFAULT 'incomplete',
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id),
  name TEXT NOT NULL,
  email TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create integrations table
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id),
  platform TEXT NOT NULL CHECK (platform IN ('google_analytics', 'google_ads')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  title TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'ready', 'failed')),
  share_token TEXT UNIQUE,
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create report_sections table
CREATE TABLE report_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id),
  section_type TEXT NOT NULL,
  data_snapshot JSONB DEFAULT '{}'::jsonb,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_sections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view their own agency data
CREATE POLICY "Users can view their own agency" ON agencies
  FOR SELECT USING (id IN (SELECT agency_id FROM users WHERE id = auth.uid()));

-- Users can update their own agency
CREATE POLICY "Users can update their own agency" ON agencies
  FOR UPDATE USING (id IN (SELECT agency_id FROM users WHERE id = auth.uid()));

-- Users can view their own user record
CREATE POLICY "Users can view own user record" ON users
  FOR SELECT USING (id = auth.uid());

-- Users can view their agency's subscriptions
CREATE POLICY "Users can view agency subscriptions" ON subscriptions
  FOR SELECT USING (agency_id IN (SELECT agency_id FROM users WHERE id = auth.uid()));

-- Users can view their agency's clients
CREATE POLICY "Users can view agency clients" ON clients
  FOR SELECT USING (agency_id IN (SELECT agency_id FROM users WHERE id = auth.uid()) AND deleted_at IS NULL);

-- Users can view their agency's reports
CREATE POLICY "Users can view agency reports" ON reports
  FOR SELECT USING (agency_id IN (SELECT agency_id FROM users WHERE id = auth.uid()));

-- Users can view their reports' sections
CREATE POLICY "Users can view report sections" ON report_sections
  FOR SELECT USING (report_id IN (SELECT id FROM reports WHERE agency_id IN (SELECT agency_id FROM users WHERE id = auth.uid())));
```

## 3. Optional: Stripe Setup

If you want to enable billing:

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Create price objects for each plan (Starter, Pro, Enterprise)
3. Add to `.env.local`:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_STARTER=price_...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_ENTERPRISE=price_...
```

## 4. Start Development Server

```bash
cd /workspaces/Reportly/reportly
npm run dev
```

Visit http://localhost:3000

## Testing Login

1. First, create an account via **Sign up** page
2. Then try logging in with the same credentials
3. If you get errors, check the browser console for detailed error messages

## Troubleshooting

### "Missing Supabase environment variables" error
- Make sure `.env.local` is in the `/workspaces/Reportly/reportly/` directory
- Verify you've correctly copied the URL and keys from Supabase
- Restart the dev server after adding environment variables

### Login redirects back to login page
- Check the browser console for error messages
- Verify your Supabase credentials are correct
- Make sure the tables exist in your Supabase database
- Check that RLS policies allow user access

### "User not found" after successful login
- Make sure the tables were created correctly
- Verify RLS policies are set up
- Check that the signup flow created the user records properly
