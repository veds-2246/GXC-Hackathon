-- Secure, rotating credentials for participant digital passes.
-- Tokens are opaque UUIDs, short-lived, and stored only in a private schema.
-- Volunteer verification and attendance actions are intentionally out of scope.

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS private.digital_pass_tokens (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  registration_id uuid NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  token uuid NOT NULL UNIQUE,
  issued_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS digital_pass_tokens_expiry_idx
  ON private.digital_pass_tokens (expires_at);

ALTER TABLE private.digital_pass_tokens ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE private.digital_pass_tokens FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.issue_digital_pass_token()
RETURNS TABLE(token text, expires_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_registration_id uuid;
  v_token uuid := gen_random_uuid();
  v_issued_at timestamptz := pg_catalog.now();
  v_expires_at timestamptz := pg_catalog.now() + interval '30 seconds';
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to access your digital pass.';
  END IF;

  SELECT r.id
    INTO v_registration_id
  FROM public.registrations AS r
  WHERE r.created_by = v_user_id
    AND r.status = 'confirmed'
  ORDER BY r.created_at DESC
  LIMIT 1;

  IF v_registration_id IS NULL THEN
    RAISE EXCEPTION 'A confirmed registration is required to access your digital pass.';
  END IF;

  INSERT INTO private.digital_pass_tokens (
    user_id, registration_id, token, issued_at, expires_at
  )
  VALUES (
    v_user_id, v_registration_id, v_token, v_issued_at, v_expires_at
  )
  ON CONFLICT (user_id) DO UPDATE
    SET registration_id = EXCLUDED.registration_id,
        token = EXCLUDED.token,
        issued_at = EXCLUDED.issued_at,
        expires_at = EXCLUDED.expires_at;

  RETURN QUERY SELECT v_token::text, v_expires_at;
END;
$function$;

REVOKE ALL ON FUNCTION public.issue_digital_pass_token() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.issue_digital_pass_token() TO authenticated;
