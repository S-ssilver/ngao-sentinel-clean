-- Security hardening for NGAO Sentinel
-- Review and apply in a controlled environment before production.
-- RLS policies do not protect against TRUNCATE, so remove that privilege
-- from client-facing roles. Unauthenticated users should not have direct
-- table privileges on application data.

BEGIN;

REVOKE ALL PRIVILEGES ON TABLE
    public."Profiles",
    public.attendance_logs,
    public.companies,
    public.guards,
    public.incident_logs,
    public.sites
FROM anon;

REVOKE TRUNCATE, REFERENCES, TRIGGER ON TABLE
    public."Profiles",
    public.attendance_logs,
    public.companies,
    public.guards,
    public.incident_logs,
    public.sites
FROM authenticated;

-- Storage metadata is managed through the Storage API. Anonymous SQL access
-- to storage.objects is not required for a signed-in application.
REVOKE ALL PRIVILEGES ON TABLE storage.objects FROM anon;

REVOKE TRUNCATE, REFERENCES, TRIGGER ON TABLE storage.objects
FROM authenticated;

COMMIT;

-- Verification after applying:
-- SELECT grantee, table_schema, table_name, privilege_type
-- FROM information_schema.role_table_grants
-- WHERE grantee IN ('anon', 'authenticated')
--   AND (
--     (table_schema = 'public' AND table_name IN
--       ('Profiles','attendance_logs','companies','guards','incident_logs','sites'))
--     OR (table_schema = 'storage' AND table_name = 'objects')
--   )
-- ORDER BY table_schema, table_name, grantee, privilege_type;
--
-- Note: this does not remove broad storage RLS policies or make a bucket private.
-- Inspect storage.buckets.public and replace bucket policies separately.
