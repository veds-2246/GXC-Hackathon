-- Record the actual scan time and present attendance time in 24-hour IST format.
ALTER TABLE public.event_attendance
  ALTER COLUMN checked_in_at SET DEFAULT clock_timestamp();

CREATE OR REPLACE FUNCTION private.event_scan_pass(p_token uuid, p_action text, p_event_day integer DEFAULT 1)
RETURNS TABLE(result text, participant_name text, application_number text, participant_email text, occurred_at timestamptz, snack_policy text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_permission text := private.event_actor_permission();
  v_registration_id uuid;
  v_name text;
  v_application_number text;
  v_email text;
  v_day_count integer;
  v_policy text;
  v_time timestamptz := clock_timestamp();
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
    INSERT INTO public.event_attendance(registration_id, checked_in_at, checked_in_by)
    VALUES (v_registration_id, v_time, auth.uid())
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
