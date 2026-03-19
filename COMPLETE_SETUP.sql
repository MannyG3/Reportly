-- ============================================
-- REPORTLY DATABASE SETUP
-- Run this entire script in Supabase SQL Editor
-- ============================================

-- Create agencies table
CREATE TABLE IF NOT EXISTS agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  brand_color TEXT DEFAULT '#ffffff',
  custom_domain TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create users table (linked to auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL UNIQUE REFERENCES agencies(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT NOT NULL,
  plan TEXT DEFAULT 'starter' CHECK (plan IN ('starter', 'pro', 'enterprise')),
  status TEXT DEFAULT 'incomplete',
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create integrations table
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('google_analytics', 'google_ads')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'ready', 'failed')),
  share_token TEXT UNIQUE,
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create report_sections table
CREATE TABLE IF NOT EXISTS report_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL,
  data_snapshot JSONB DEFAULT '{}'::jsonb,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_sections ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CREATE RLS POLICIES
-- ============================================

-- Users can view their own agency
DROP POLICY IF EXISTS "Users can view their own agency" ON agencies;
CREATE POLICY "Users can view their own agency" ON agencies
  FOR SELECT USING (id IN (SELECT agency_id FROM users WHERE id = auth.uid()));

-- Users can update their own agency
DROP POLICY IF EXISTS "Users can update their own agency" ON agencies;
CREATE POLICY "Users can update their own agency" ON agencies
  FOR UPDATE USING (id IN (SELECT agency_id FROM users WHERE id = auth.uid()));

-- Users can view own user record
DROP POLICY IF EXISTS "Users can view own user record" ON users;
CREATE POLICY "Users can view own user record" ON users
  FOR SELECT USING (id = auth.uid());

-- Users can view agency subscriptions
DROP POLICY IF EXISTS "Users can view agency subscriptions" ON subscriptions;
CREATE POLICY "Users can view agency subscriptions" ON subscriptions
  FOR SELECT USING (agency_id IN (SELECT agency_id FROM users WHERE id = auth.uid()));

-- Users can view agency clients
DROP POLICY IF EXISTS "Users can view agency clients" ON clients;
CREATE POLICY "Users can view agency clients" ON clients
  FOR SELECT USING (agency_id IN (SELECT agency_id FROM users WHERE id = auth.uid()) AND deleted_at IS NULL);

-- Users can create clients
DROP POLICY IF EXISTS "Users can create clients" ON clients;
CREATE POLICY "Users can create clients" ON clients
  FOR INSERT WITH CHECK (agency_id IN (SELECT agency_id FROM users WHERE id = auth.uid()));

-- Users can update clients
DROP POLICY IF EXISTS "Users can update clients" ON clients;
CREATE POLICY "Users can update clients" ON clients
  FOR UPDATE USING (agency_id IN (SELECT agency_id FROM users WHERE id = auth.uid()));

-- Users can delete clients (soft delete)
DROP POLICY IF EXISTS "Users can delete clients" ON clients;
CREATE POLICY "Users can delete clients" ON clients
  FOR UPDATE USING (agency_id IN (SELECT agency_id FROM users WHERE id = auth.uid()));

-- Users can view agency integrations
DROP POLICY IF EXISTS "Users can view agency integrations" ON integrations;
CREATE POLICY "Users can view agency integrations" ON integrations
  FOR SELECT USING (agency_id IN (SELECT agency_id FROM users WHERE id = auth.uid()));

-- Users can view agency reports
DROP POLICY IF EXISTS "Users can view agency reports" ON reports;
CREATE POLICY "Users can view agency reports" ON reports
  FOR SELECT USING (agency_id IN (SELECT agency_id FROM users WHERE id = auth.uid()));

-- Users can create reports
DROP POLICY IF EXISTS "Users can create reports" ON reports;
CREATE POLICY "Users can create reports" ON reports
  FOR INSERT WITH CHECK (agency_id IN (SELECT agency_id FROM users WHERE id = auth.uid()));

-- Users can view report sections
DROP POLICY IF EXISTS "Users can view report sections" ON report_sections;
CREATE POLICY "Users can view report sections" ON report_sections
  FOR SELECT USING (report_id IN (SELECT id FROM reports WHERE agency_id IN (SELECT agency_id FROM users WHERE id = auth.uid())));

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_agency_id ON users(agency_id);
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);
CREATE INDEX IF NOT EXISTS idx_clients_agency_id ON clients(agency_id);
CREATE INDEX IF NOT EXISTS idx_clients_deleted_at ON clients(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_reports_agency_id ON reports(agency_id);
CREATE INDEX IF NOT EXISTS idx_reports_client_id ON reports(client_id);
CREATE INDEX IF NOT EXISTS idx_reports_generated_at ON reports(generated_at);
CREATE INDEX IF NOT EXISTS idx_report_sections_report_id ON report_sections(report_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_agency_id ON subscriptions(agency_id);
CREATE INDEX IF NOT EXISTS idx_integrations_agency_id ON integrations(agency_id);

-- Multi-column indexes for common queries
CREATE INDEX IF NOT EXISTS idx_reports_agency_generated ON reports(agency_id, generated_at);
CREATE INDEX IF NOT EXISTS idx_clients_agency_active ON clients(agency_id, deleted_at) WHERE deleted_at IS NULL;

-- ============================================
-- DONE!
-- ============================================
-- Tables created with RLS policies and indexes enabled.
-- Your Reportly database is ready to use!
