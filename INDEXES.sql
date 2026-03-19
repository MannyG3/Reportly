-- Add indexes to speed up queries
-- Run this in Supabase SQL Editor

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
