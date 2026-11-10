-- Make new participant registrations free while preserving historical payment data.
-- Keep the legacy payment RPC overload during rollout so the currently deployed
-- app remains compatible if this migration is applied before the new app version.
-- The free-registration app calls the zero-argument overload defined below.
-- Existing payment_orders and payments rows remain available for audit/history.

-- Make the database defaults match the new free event policy.
-- Existing registrations keep their historical fee values.
ALTER TABLE public.registrations
  ALTER COLUMN base_fee_paise SET DEFAULT 0,
  ALTER COLUMN amount_due_paise SET DEFAULT 0;

CREATE OR REPLACE FUNCTION public.submit_hackathon_registration()
RETURNS TABLE(registration_id uuid, application_number text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_registration_id uuid;
  v_application_number text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Please sign in before registering.';
  END IF;

  -- Serialize submissions from the same account so duplicate registrations
  -- cannot be created by simultaneous requests.
  PERFORM pg_advisory_xact_lock(hashtext(v_user_id::text)::bigint);

  SELECT r.id, r.application_number
    INTO v_registration_id, v_application_number
  FROM public.registrations r
  WHERE r.created_by = v_user_id
    AND r.status <> 'cancelled'
  ORDER BY r.created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF FOUND THEN
    RETURN QUERY SELECT v_registration_id, v_application_number;
    RETURN;
  END IF;

  SELECT *
    INTO v_profile
  FROM public.profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF v_profile.id IS NULL
     OR NULLIF(TRIM(v_profile.full_name), '') IS NULL
     OR NULLIF(TRIM(v_profile.phone), '') IS NULL
     OR NULLIF(TRIM(v_profile.college), '') IS NULL
     OR NULLIF(TRIM(v_profile.branch), '') IS NULL
     OR NULLIF(TRIM(v_profile.study_year), '') IS NULL THEN
    RAISE EXCEPTION 'Complete your profile before registering (name, phone, college, branch and year).';
  END IF;

  v_application_number := 'GXC26-' || LPAD(nextval('public.application_number_seq')::text, 6, '0');

  INSERT INTO public.registrations (
    registration_code,
    application_number,
    registration_type,
    created_by,
    status,
    base_fee_paise,
    coupon_discount_paise,
    amount_due_paise
  )
  VALUES (
    v_application_number,
    v_application_number,
    'individual',
    v_user_id,
    'confirmed',
    0,
    0,
    0
  )
  RETURNING id INTO v_registration_id;

  RETURN QUERY SELECT v_registration_id, v_application_number;
END;
$function$;

REVOKE ALL ON FUNCTION public.submit_hackathon_registration() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_hackathon_registration() TO authenticated;
