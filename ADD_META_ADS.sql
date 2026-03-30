-- Add meta_ads to integrations platform constraint
ALTER TABLE integrations DROP CONSTRAINT IF EXISTS integrations_platform_check;
ALTER TABLE integrations ADD CONSTRAINT integrations_platform_check CHECK (platform IN ('google_analytics', 'google_ads', 'meta_ads'));
