-- Event operations: volunteer access, attendance, snack claims and audit history.
CREATE TABLE IF NOT EXISTS public.event_volunteers (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  permission text NOT NULL CHECK (permission IN ('checkin', 'snacks', 'both')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);
ALTER TABLE public.event_volunteers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.event_volunteers FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS public.event_operations_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  snack_policy text NOT NULL DEFAULT 'event' CHECK (snack_policy IN ('event', 'daily')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);
ALTER TABLE public.event_operations_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.event_operations_settings FROM PUBLIC, anon, authenticated;
INSERT INTO public.event_operations_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.event_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL UNIQUE REFERENCES public.registrations(id) ON DELETE CASCADE,
  checked_in_at timestamptz NOT NULL DEFAULT now(),
  checked_in_by uuid NOT NULL REFERENCES public.profiles(id)
);
ALTER TABLE public.event_attendance ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.event_attendance FROM PUBLIC, anon, authenticated;
CREATE INDEX IF NOT EXISTS event_attendance_checked_in_at_idx ON public.event_attendance(checked_in_at DESC);

CREATE TABLE IF NOT EXISTS public.snack_distributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  event_day integer NOT NULL CHECK (event_day BETWEEN 0 AND 31),
  distributed_at timestamptz NOT NULL DEFAULT now(),
  distributed_by uuid NOT NULL REFERENCES public.profiles(id),
  UNIQUE (registration_id, event_day)
);
ALTER TABLE public.snack_distributions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.snack_distributions FROM PUBLIC, anon, authenticated;
CREATE INDEX IF NOT EXISTS snack_distributions_distributed_at_idx ON public.snack_distributions(distributed_at DESC);

CREATE TABLE IF NOT EXISTS public.event_audit_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  registration_id uuid REFERENCES public.registrations(id) ON DELETE SET NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.event_audit_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.event_audit_logs FROM PUBLIC, anon, authenticated;
CREATE INDEX IF NOT EXISTS event_audit_logs_created_at_idx ON public.event_audit_logs(created_at DESC);

CREATE OR REPLACE FUNCTION public.event_actor_permission()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin') THEN 'admin'
    WHEN EXISTS (SELECT 1 FROM public.event_volunteers v WHERE v.user_id = auth.uid() AND v.is_active) THEN
      (SELECT v.permission FROM public.event_volunteers v WHERE v.user_id = auth.uid() AND v.is_active)
    ELSE NULL
  END
$$;

CREATE OR REPLACE FUNCTION public.admin_upsert_event_volunteer(p_email text, p_permission text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  IF p_permission NOT IN ('checkin', 'snacks', 'both') OR length(trim(p_email)) = 0 THEN
    RAISE EXCEPTION 'Enter a valid email and permission';
  END IF;
  SELECT id INTO v_user_id FROM public.profiles WHERE lower(email) = lower(trim(p_email)) LIMIT 1;
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'No account found for that email. Ask the volunteer to sign in once first.'; END IF;
  INSERT INTO public.event_volunteers(user_id, permission, is_active, created_by)
  VALUES (v_user_id, p_permission, true, auth.uid())
  ON CONFLICT (user_id) DO UPDATE SET permission = EXCLUDED.permission, is_active = true, created_by = auth.uid();
  INSERT INTO public.event_audit_logs(actor_id, action, details)
  VALUES (auth.uid(), 'volunteer_added_or_updated', jsonb_build_object('volunteer_email', lower(trim(p_email)), 'permission', p_permission));
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_event_volunteer_active(p_user_id uuid, p_active boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  UPDATE public.event_volunteers SET is_active = p_active WHERE user_id = p_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Volunteer not found'; END IF;
  INSERT INTO public.event_audit_logs(actor_id, action, details)
  VALUES (auth.uid(), CASE WHEN p_active THEN 'volunteer_activated' ELSE 'volunteer_deactivated' END, jsonb_build_object('volunteer_id', p_user_id));
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_snack_policy(p_policy text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF p_policy NOT IN ('event', 'daily') THEN RAISE EXCEPTION 'Invalid snack policy'; END IF;
  INSERT INTO public.event_operations_settings(id, snack_policy, updated_by)
  VALUES (1, p_policy, auth.uid())
  ON CONFLICT (id) DO UPDATE SET snack_policy = EXCLUDED.snack_policy, updated_at = now(), updated_by = auth.uid();
  INSERT INTO public.event_audit_logs(actor_id, action, details)
  VALUES (auth.uid(), 'snack_policy_updated', jsonb_build_object('policy', p_policy));
END;
$$;

CREATE OR REPLACE FUNCTION public.event_scan_pass(p_token uuid, p_action text, p_event_day integer DEFAULT 1)
RETURNS TABLE(result text, participant_name text, application_number text, participant_email text, occurred_at timestamptz, snack_policy text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_permission text := public.event_actor_permission();
  v_registration_id uuid;
  v_name text;
  v_application_number text;
  v_email text;
  v_day_count integer;
  v_policy text;
  v_time timestamptz := now();
BEGIN
  IF v_permission IS NULL THEN RAISE EXCEPTION 'Volunteer access required'; END IF;
  IF p_action NOT IN ('checkin', 'snack') THEN RAISE EXCEPTION 'Invalid scan action'; END IF;
  IF p_action = 'checkin' AND v_permission NOT IN ('admin', 'checkin', 'both') THEN RAISE EXCEPTION 'You do not have check-in permission'; END IF;
  IF p_action = 'snack' AND v_permission NOT IN ('admin', 'snacks', 'both') THEN RAISE EXCEPTION 'You do not have snack distribution permission'; END IF;
  SELECT day_count INTO v_day_count FROM public.event_schedule_settings WHERE id = 1;
  IF p_event_day < 1 OR p_event_day > COALESCE(v_day_count, 1) THEN RAISE EXCEPTION 'Choose a valid event day'; END IF;

  SELECT r.id, COALESCE(NULLIF(r.name, ''), p.full_name, 'Participant'),
         COALESCE(r.application_number, r.registration_code, 'Pending'), COALESCE(r.email, p.email)
    INTO v_registration_id, v_name, v_application_number, v_email
  FROM private.digital_pass_tokens t
  JOIN public.registrations r ON r.id = t.registration_id AND r.created_by = t.user_id
  LEFT JOIN public.profiles p ON p.id = t.user_id
  WHERE t.token = p_token AND t.expires_at > v_time AND r.status = 'confirmed'
  LIMIT 1;
  IF v_registration_id IS NULL THEN
    RETURN QUERY SELECT 'invalid'::text, NULL::text, NULL::text, NULL::text, NULL::timestamptz, NULL::text;
    RETURN;
  END IF;

  SELECT s.snack_policy INTO v_policy FROM public.event_operations_settings s WHERE s.id = 1;
  v_policy := COALESCE(v_policy, 'event');

  IF p_action = 'checkin' THEN
    INSERT INTO public.event_attendance(registration_id, checked_in_by)
    VALUES (v_registration_id, auth.uid())
    ON CONFLICT (registration_id) DO NOTHING;
    IF NOT FOUND THEN
      INSERT INTO public.event_audit_logs(actor_id, action, registration_id)
      VALUES (auth.uid(), 'duplicate_checkin_attempt', v_registration_id);
      RETURN QUERY SELECT 'already_checked_in'::text, v_name, v_application_number, v_email, NULL::timestamptz, v_policy;
      RETURN;
    END IF;
    INSERT INTO public.event_audit_logs(actor_id, action, registration_id)
    VALUES (auth.uid(), 'participant_checked_in', v_registration_id);
    RETURN QUERY SELECT 'checked_in'::text, v_name, v_application_number, v_email, v_time, v_policy;
    RETURN;
  END IF;

  INSERT INTO public.snack_distributions(registration_id, event_day, distributed_by)
  VALUES (v_registration_id, CASE WHEN v_policy = 'daily' THEN p_event_day ELSE 0 END, auth.uid())
  ON CONFLICT (registration_id, event_day) DO NOTHING;
  IF NOT FOUND THEN
    INSERT INTO public.event_audit_logs(actor_id, action, registration_id, details)
    VALUES (auth.uid(), 'duplicate_snack_attempt', v_registration_id, jsonb_build_object('event_day', p_event_day));
    RETURN QUERY SELECT 'already_distributed'::text, v_name, v_application_number, v_email, NULL::timestamptz, v_policy;
    RETURN;
  END IF;
  INSERT INTO public.event_audit_logs(actor_id, action, registration_id, details)
  VALUES (auth.uid(), 'snack_distributed', v_registration_id, jsonb_build_object('event_day', p_event_day, 'policy', v_policy));
  RETURN QUERY SELECT 'snack_distributed'::text, v_name, v_application_number, v_email, v_time, v_policy;
END;
$$;

CREATE OR REPLACE FUNCTION public.event_operations_summary()
RETURNS TABLE(total_registered bigint, checked_in bigint, snacks_distributed bigint, pending_checkin bigint, snack_policy text, volunteers jsonb, recent_activity jsonb)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_policy text;
BEGIN
  IF public.event_actor_permission() <> 'admin' THEN RAISE EXCEPTION 'Admin access required'; END IF;
  SELECT snack_policy INTO v_policy FROM public.event_operations_settings WHERE id = 1;
  RETURN QUERY SELECT
    (SELECT count(*) FROM public.registrations WHERE status = 'confirmed'),
    (SELECT count(*) FROM public.event_attendance),
    (SELECT count(*) FROM public.snack_distributions),
    (SELECT count(*) FROM public.registrations r WHERE r.status = 'confirmed' AND NOT EXISTS (SELECT 1 FROM public.event_attendance a WHERE a.registration_id = r.id)),
    COALESCE(v_policy, 'event'),
    (SELECT COALESCE(jsonb_agg(jsonb_build_object('user_id', v.user_id, 'email', p.email, 'name', p.full_name, 'permission', v.permission, 'is_active', v.is_active) ORDER BY p.email), '[]'::jsonb)
       FROM public.event_volunteers v JOIN public.profiles p ON p.id = v.user_id),
    (SELECT COALESCE(jsonb_agg(jsonb_build_object('action', l.action, 'created_at', l.created_at, 'email', p.email, 'registration_id', l.registration_id, 'details', l.details) ORDER BY l.created_at DESC), '[]'::jsonb)
       FROM (SELECT * FROM public.event_audit_logs ORDER BY created_at DESC LIMIT 50) l LEFT JOIN public.profiles p ON p.id = l.actor_id);
END;
$$;

REVOKE ALL ON FUNCTION public.event_actor_permission() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_upsert_event_volunteer(text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_event_volunteer_active(uuid, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_snack_policy(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.event_scan_pass(uuid, text, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.event_operations_summary() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.event_actor_permission() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_upsert_event_volunteer(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_event_volunteer_active(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_snack_policy(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.event_scan_pass(uuid, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.event_operations_summary() TO authenticated;
