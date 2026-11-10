-- Give participants compact sequential IDs and keep staff identities separate.
-- Existing participant IDs are renumbered in registration creation order so they
-- remain unique and consistent across passes, check-in records and exports.
WITH numbered AS (
  SELECT
    id,
    'GXC26-' || lpad(row_number() OVER (ORDER BY created_at, id)::text, 4, '0') AS new_number
  FROM public.registrations
  WHERE application_number ~ '^GXC26-[0-9]+$'
)
UPDATE public.registrations AS r
SET
  application_number = n.new_number,
  registration_code = CASE
    WHEN r.registration_code ~ '^GXC26-[0-9]+$' THEN n.new_number
    ELSE r.registration_code
  END
FROM numbered AS n
WHERE r.id = n.id;

SELECT setval(
  'public.application_number_seq',
  COALESCE(MAX(substring(application_number FROM '^GXC26-([0-9]+)$')::bigint), 1),
  COUNT(*) > 0
)
FROM public.registrations
WHERE application_number ~ '^GXC26-[0-9]+$';

-- Keep both registration entry points on the same four-digit participant format.
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

  v_application_number := 'GXC26-' || LPAD(nextval('public.application_number_seq')::text, 4, '0');

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

CREATE OR REPLACE FUNCTION public.submit_hackathon_registration(p_payment_order_id uuid)
RETURNS TABLE(registration_id uuid, application_number text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_payment public.payment_orders%rowtype;
  v_registration_id uuid;
  v_application_number text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Please sign in before registering.';
  END IF;

  SELECT * INTO v_payment
  FROM public.payment_orders
  WHERE id = p_payment_order_id AND user_id = v_user_id
  FOR UPDATE;

  IF v_payment.id IS NULL OR v_payment.status <> 'paid' OR v_payment.amount_paise <> 7900 THEN
    RAISE EXCEPTION 'A verified ₹79 payment is required before registration.';
  END IF;

  IF v_payment.registration_id IS NOT NULL THEN
    RETURN QUERY SELECT r.id, r.application_number
    FROM public.registrations r WHERE r.id = v_payment.registration_id;
    RETURN;
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id;
  IF v_profile.id IS NULL
     OR NULLIF(TRIM(v_profile.full_name), '') IS NULL
     OR NULLIF(TRIM(v_profile.phone), '') IS NULL
     OR NULLIF(TRIM(v_profile.college), '') IS NULL
     OR NULLIF(TRIM(v_profile.branch), '') IS NULL
     OR NULLIF(TRIM(v_profile.study_year), '') IS NULL THEN
    RAISE EXCEPTION 'Complete your profile before registering (name, phone, college, branch and year).';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.registrations r
    WHERE r.created_by = v_user_id AND r.status <> 'cancelled'
  ) THEN
    RAISE EXCEPTION 'You already have a hackathon application.';
  END IF;

  v_application_number := 'GXC26-' || lpad(nextval('public.application_number_seq')::text, 4, '0');

  INSERT INTO public.registrations(
    registration_code, application_number, registration_type, created_by,
    status, base_fee_paise, coupon_discount_paise, amount_due_paise
  )
  VALUES (
    v_application_number, v_application_number, 'individual', v_user_id,
    'confirmed', 7900, 0, 7900
  )
  RETURNING id INTO v_registration_id;

  INSERT INTO public.payments(
    registration_id, provider, provider_order_id, provider_payment_id,
    amount_paise, currency, status, paid_at
  )
  VALUES (
    v_registration_id, 'razorpay', v_payment.provider_order_id,
    v_payment.provider_payment_id, 7900, 'INR', 'paid', v_payment.paid_at
  );

  UPDATE public.payment_orders
  SET registration_id = v_registration_id, updated_at = now()
  WHERE id = v_payment.id;

  RETURN QUERY SELECT v_registration_id, v_application_number;
END;
$function$;

REVOKE ALL ON FUNCTION public.submit_hackathon_registration() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_hackathon_registration() TO authenticated;
REVOKE ALL ON FUNCTION public.submit_hackathon_registration(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_hackathon_registration(uuid) TO authenticated;
