-- Make incident evidence private and remove bucket-wide permissive policies.
-- This intentionally fails closed: client access to existing objects will be
-- blocked until scoped Storage policies are designed for the app's upload path
-- and site/company authorization model.
--
-- Review in staging first. This migration has NOT been applied to the live DB.

BEGIN;

UPDATE storage.buckets
SET public = false
WHERE id = 'incident_media';

DROP POLICY IF EXISTS "Allow authenticated read incident_media" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload incident_media" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read incident_media" ON storage.objects;
DROP POLICY IF EXISTS "Auth delete" ON storage.objects;
DROP POLICY IF EXISTS "Auth update" ON storage.objects;
DROP POLICY IF EXISTS "Auth upload" ON storage.objects;
DROP POLICY IF EXISTS "Public read" ON storage.objects;

COMMIT;

-- Follow-up required before enabling incident media features:
-- Add least-privilege policies based on verified object naming/path conventions
-- and authorized site/company membership. Do not restore bucket-wide access.
-- Private objects must be served through authenticated downloads or signed URLs.
