-- Add standardized participant identity fields to every public application table.
-- Existing profiles.full_name remains for application compatibility.
-- The new profiles.name column is synchronized with full_name.
-- Participant-linked tables store a snapshot of the participant identity.
-- Global setup tables (coupons and problem_statements) keep these fields nullable.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.problem_statements
  ADD COLUMN IF NOT EXISTS name text, ADD COLUMN IF NOT EXISTS email text, ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS name text, ADD COLUMN IF NOT EXISTS email text, ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.registration_problem_statements
  ADD COLUMN IF NOT EXISTS name text, ADD COLUMN IF NOT EXISTS email text, ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS name text, ADD COLUMN IF NOT EXISTS email text, ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS name text, ADD COLUMN IF NOT EXISTS email text, ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.coupon_redemptions
  ADD COLUMN IF NOT EXISTS name text, ADD COLUMN IF NOT EXISTS email text, ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.seat_assignments
  ADD COLUMN IF NOT EXISTS name text, ADD COLUMN IF NOT EXISTS email text, ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.payment_orders
  ADD COLUMN IF NOT EXISTS name text, ADD COLUMN IF NOT EXISTS email text, ADD COLUMN IF NOT EXISTS phone text;

CREATE OR REPLACE FUNCTION public.sync_profile_name_columns()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.name := COALESCE(NULLIF(BTRIM(NEW.name), ''), NULLIF(BTRIM(NEW.full_name), ''));
    NEW.full_name := COALESCE(NULLIF(BTRIM(NEW.full_name), ''), NULLIF(BTRIM(NEW.name), ''));
  ELSE
    IF NEW.full_name IS DISTINCT FROM OLD.full_name THEN
      NEW.name := NEW.full_name;
    ELSIF NEW.name IS DISTINCT FROM OLD.name THEN
      NEW.full_name := NEW.name;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS profiles_sync_name_columns ON public.profiles;
CREATE TRIGGER profiles_sync_name_columns
BEFORE INSERT OR UPDATE OF name, full_name ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_name_columns();

CREATE OR REPLACE FUNCTION public.fill_participant_identity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $function$
DECLARE
  v_related_id uuid;
  v_name text;
  v_email text;
  v_phone text;
BEGIN
  v_related_id := NULLIF(TO_JSONB(NEW) ->> TG_ARGV[0], '')::uuid;
  IF v_related_id IS NULL THEN RETURN NEW; END IF;

  IF TG_ARGV[1] = 'registration' THEN
    SELECT COALESCE(p.name, p.full_name), p.email, p.phone
      INTO v_name, v_email, v_phone
    FROM public.registrations r
    JOIN public.profiles p ON p.id = r.created_by
    WHERE r.id = v_related_id;
  ELSE
    SELECT COALESCE(p.name, p.full_name), p.email, p.phone
      INTO v_name, v_email, v_phone
    FROM public.profiles p WHERE p.id = v_related_id;
  END IF;

  NEW.name := COALESCE(NEW.name, v_name);
  NEW.email := COALESCE(NEW.email, v_email);
  NEW.phone := COALESCE(NEW.phone, v_phone);
  RETURN NEW;
END;
$function$;

UPDATE public.profiles SET name = full_name WHERE name IS NULL;

UPDATE public.registrations r
SET name = COALESCE(r.name, p.name, p.full_name), email = COALESCE(r.email, p.email), phone = COALESCE(r.phone, p.phone)
FROM public.profiles p WHERE p.id = r.created_by;

UPDATE public.payment_orders po
SET name = COALESCE(po.name, p.name, p.full_name), email = COALESCE(po.email, p.email), phone = COALESCE(po.phone, p.phone)
FROM public.profiles p WHERE p.id = po.user_id;

UPDATE public.payments pay
SET name = COALESCE(pay.name, r.name, p.name, p.full_name), email = COALESCE(pay.email, r.email, p.email), phone = COALESCE(pay.phone, r.phone, p.phone)
FROM public.registrations r JOIN public.profiles p ON p.id = r.created_by
WHERE r.id = pay.registration_id;

UPDATE public.registration_problem_statements rps
SET name = COALESCE(rps.name, r.name, p.name, p.full_name), email = COALESCE(rps.email, r.email, p.email), phone = COALESCE(rps.phone, r.phone, p.phone)
FROM public.registrations r JOIN public.profiles p ON p.id = r.created_by
WHERE r.id = rps.registration_id;

UPDATE public.coupon_redemptions cr
SET name = COALESCE(cr.name, p.name, p.full_name), email = COALESCE(cr.email, p.email), phone = COALESCE(cr.phone, p.phone)
FROM public.profiles p WHERE p.id = cr.redeemed_by;

UPDATE public.seat_assignments sa
SET name = COALESCE(sa.name, r.name, p.name, p.full_name), email = COALESCE(sa.email, r.email, p.email), phone = COALESCE(sa.phone, r.phone, p.phone)
FROM public.registrations r JOIN public.profiles p ON p.id = r.created_by
WHERE r.id = sa.registration_id;

DROP TRIGGER IF EXISTS registrations_fill_participant_identity ON public.registrations;
CREATE TRIGGER registrations_fill_participant_identity
BEFORE INSERT OR UPDATE OF created_by, name, email, phone ON public.registrations
FOR EACH ROW EXECUTE FUNCTION public.fill_participant_identity('created_by', 'profile');

DROP TRIGGER IF EXISTS payment_orders_fill_participant_identity ON public.payment_orders;
CREATE TRIGGER payment_orders_fill_participant_identity
BEFORE INSERT OR UPDATE OF user_id, name, email, phone ON public.payment_orders
FOR EACH ROW EXECUTE FUNCTION public.fill_participant_identity('user_id', 'profile');

DROP TRIGGER IF EXISTS payments_fill_participant_identity ON public.payments;
CREATE TRIGGER payments_fill_participant_identity
BEFORE INSERT OR UPDATE OF registration_id, name, email, phone ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.fill_participant_identity('registration_id', 'registration');

DROP TRIGGER IF EXISTS registration_problem_statements_fill_identity ON public.registration_problem_statements;
CREATE TRIGGER registration_problem_statements_fill_identity
BEFORE INSERT OR UPDATE OF registration_id, name, email, phone ON public.registration_problem_statements
FOR EACH ROW EXECUTE FUNCTION public.fill_participant_identity('registration_id', 'registration');

DROP TRIGGER IF EXISTS coupon_redemptions_fill_participant_identity ON public.coupon_redemptions;
CREATE TRIGGER coupon_redemptions_fill_participant_identity
BEFORE INSERT OR UPDATE OF redeemed_by, name, email, phone ON public.coupon_redemptions
FOR EACH ROW EXECUTE FUNCTION public.fill_participant_identity('redeemed_by', 'profile');

DROP TRIGGER IF EXISTS seat_assignments_fill_participant_identity ON public.seat_assignments;
CREATE TRIGGER seat_assignments_fill_participant_identity
BEFORE INSERT OR UPDATE OF registration_id, name, email, phone ON public.seat_assignments
FOR EACH ROW EXECUTE FUNCTION public.fill_participant_identity('registration_id', 'registration');

REVOKE ALL ON FUNCTION public.fill_participant_identity() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_profile_name_columns() FROM PUBLIC, anon, authenticated;
