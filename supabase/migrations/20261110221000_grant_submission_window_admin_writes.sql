-- Allow authenticated admins to write the singleton settings row; RLS remains admin-only.
grant insert, update on public.project_submission_settings to authenticated;
