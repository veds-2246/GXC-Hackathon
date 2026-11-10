-- Reporting RPCs and explicit admin-only guard for event operations summary.
CREATE OR REPLACE FUNCTION public.event_operations_summary()
RETURNS TABLE(total_registered bigint, checked_in bigint, snacks_distributed bigint, pending_checkin bigint, snack_policy text, volunteers jsonb, recent_activity jsonb)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_policy text;
BEGIN
  IF public.event_actor_permission() IS DISTINCT FROM 'admin' THEN RAISE EXCEPTION 'Admin access required'; END IF;
  SELECT snack_policy INTO v_policy FROM public.event_operations_settings WHERE id = 1;
  RETURN QUERY SELECT
    (SELECT count(*) FROM public.registrations WHERE status = 'confirmed'),
    (SELECT count(*) FROM public.event_attendance),
    (SELECT count(*) FROM public.snack_distributions),
    (SELECT count(*) FROM public.registrations r WHERE r.status = 'confirmed' AND NOT EXISTS (SELECT 1 FROM public.event_attendance a WHERE a.registration_id = r.id)),
    COALESCE(v_policy, 'event'),
    (SELECT COALESCE(jsonb_agg(jsonb_build_object('user_id', v.user_id, 'email', p.email, 'name', p.full_name, 'permission', v.permission, 'is_active', v.is_active) ORDER BY p.email), '[]'::jsonb) FROM public.event_volunteers v JOIN public.profiles p ON p.id = v.user_id),
    (SELECT COALESCE(jsonb_agg(jsonb_build_object('action', l.action, 'created_at', l.created_at, 'email', p.email, 'registration_id', l.registration_id, 'details', l.details) ORDER BY l.created_at DESC), '[]'::jsonb) FROM (SELECT * FROM public.event_audit_logs ORDER BY created_at DESC LIMIT 50) l LEFT JOIN public.profiles p ON p.id = l.actor_id);
END;
$$;
CREATE OR REPLACE FUNCTION public.event_search_participants(p_query text DEFAULT '')
RETURNS TABLE(registration_id uuid, participant_name text, application_number text, participant_email text, checked_in_at timestamptz, snack_claims bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_permission text := public.event_actor_permission();
DECLARE v_query text := lower(trim(COALESCE(p_query, '')));
BEGIN
  IF v_permission IS NULL THEN RAISE EXCEPTION 'Volunteer access required'; END IF;
  IF length(v_query) > 120 THEN RAISE EXCEPTION 'Search query is too long'; END IF;
  RETURN QUERY SELECT r.id, COALESCE(NULLIF(r.name, ''), p.full_name, 'Participant'),
    COALESCE(r.application_number, r.registration_code, 'Pending'), COALESCE(r.email, p.email), a.checked_in_at,
    (SELECT count(*) FROM public.snack_distributions s WHERE s.registration_id = r.id)
  FROM public.registrations r LEFT JOIN public.profiles p ON p.id = r.created_by
  LEFT JOIN public.event_attendance a ON a.registration_id = r.id
  WHERE r.status = 'confirmed' AND (v_query = '' OR lower(COALESCE(r.name, p.full_name, '')) LIKE '%' || v_query || '%'
    OR lower(COALESCE(r.email, p.email, '')) LIKE '%' || v_query || '%'
    OR lower(COALESCE(r.application_number, r.registration_code, '')) LIKE '%' || v_query || '%')
  ORDER BY a.checked_in_at DESC NULLS LAST, r.created_at DESC LIMIT 100;
END;
$$;
CREATE OR REPLACE FUNCTION public.event_operations_export()
RETURNS TABLE(participant_name text, participant_email text, application_number text, checked_in_at timestamptz, checked_in_by_email text, snack_claims bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF public.event_actor_permission() IS DISTINCT FROM 'admin' THEN RAISE EXCEPTION 'Admin access required'; END IF;
  RETURN QUERY SELECT COALESCE(NULLIF(r.name, ''), p.full_name, 'Participant'), COALESCE(r.email, p.email),
    COALESCE(r.application_number, r.registration_code, 'Pending'), a.checked_in_at, staff.email,
    (SELECT count(*) FROM public.snack_distributions s WHERE s.registration_id = r.id)
  FROM public.registrations r LEFT JOIN public.profiles p ON p.id = r.created_by
  LEFT JOIN public.event_attendance a ON a.registration_id = r.id
  LEFT JOIN public.profiles staff ON staff.id = a.checked_in_by
  WHERE r.status = 'confirmed' ORDER BY r.created_at;
END;
$$;
REVOKE ALL ON FUNCTION public.event_search_participants(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.event_operations_export() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.event_search_participants(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.event_operations_export() TO authenticated;
