
-- Day 1 AI workshop information maintained by admins.
CREATE TABLE IF NOT EXISTS public.event_workshop_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  title text NOT NULL DEFAULT 'Day 1 AI Workshop',
  venue text,
  timing text,
  pre_instructions text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);
ALTER TABLE public.event_workshop_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.event_workshop_settings FROM anon, authenticated;
GRANT SELECT, UPDATE ON public.event_workshop_settings TO authenticated;

DROP POLICY IF EXISTS event_workshop_settings_read_authenticated ON public.event_workshop_settings;
CREATE POLICY event_workshop_settings_read_authenticated
ON public.event_workshop_settings FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS event_workshop_settings_admin_update ON public.event_workshop_settings;
CREATE POLICY event_workshop_settings_admin_update
ON public.event_workshop_settings FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'));

INSERT INTO public.event_workshop_settings (id, title, venue, timing, pre_instructions)
VALUES (1, 'Day 1 AI Workshop', NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.problem_statements TO authenticated;

DROP POLICY IF EXISTS problem_statements_admin_read_all ON public.problem_statements;
CREATE POLICY problem_statements_admin_read_all
ON public.problem_statements FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'));

DROP POLICY IF EXISTS problem_statements_admin_insert ON public.problem_statements;
CREATE POLICY problem_statements_admin_insert
ON public.problem_statements FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'));

DROP POLICY IF EXISTS problem_statements_admin_update ON public.problem_statements;
CREATE POLICY problem_statements_admin_update
ON public.problem_statements FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'));

DROP POLICY IF EXISTS problem_statements_admin_delete ON public.problem_statements;
CREATE POLICY problem_statements_admin_delete
ON public.problem_statements FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'));

CREATE OR REPLACE FUNCTION public.select_registration_problem_statement(p_problem_statement_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_registration_id uuid;
  v_previous_problem_id uuid;
  v_problem public.problem_statements%rowtype;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Please sign in before selecting a problem statement.';
  END IF;

  SELECT r.id INTO v_registration_id
  FROM public.registrations r
  WHERE r.created_by = v_user_id AND r.status <> 'cancelled'
  ORDER BY r.created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF v_registration_id IS NULL THEN
    RAISE EXCEPTION 'Complete your hackathon registration before selecting a problem statement.';
  END IF;

  SELECT rps.problem_statement_id INTO v_previous_problem_id
  FROM public.registration_problem_statements rps
  WHERE rps.registration_id = v_registration_id
  LIMIT 1;

  IF v_previous_problem_id = p_problem_statement_id THEN
    RETURN p_problem_statement_id;
  END IF;

  SELECT * INTO v_problem
  FROM public.problem_statements
  WHERE id = p_problem_statement_id AND is_active = true
  FOR UPDATE;

  IF v_problem.id IS NULL THEN
    RAISE EXCEPTION 'This problem statement is unavailable. Refresh and choose another.';
  END IF;

  IF v_problem.max_slots IS NOT NULL AND v_problem.filled_slots >= v_problem.max_slots THEN
    RAISE EXCEPTION 'This problem statement has reached its selection limit.';
  END IF;

  DELETE FROM public.registration_problem_statements
  WHERE registration_id = v_registration_id;

  IF v_previous_problem_id IS NOT NULL THEN
    UPDATE public.problem_statements
    SET filled_slots = GREATEST(filled_slots - 1, 0)
    WHERE id = v_previous_problem_id;
  END IF;

  INSERT INTO public.registration_problem_statements (registration_id, problem_statement_id)
  VALUES (v_registration_id, p_problem_statement_id);

  UPDATE public.problem_statements
  SET filled_slots = filled_slots + 1
  WHERE id = p_problem_statement_id;

  RETURN p_problem_statement_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.select_registration_problem_statement(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.select_registration_problem_statement(uuid) TO authenticated;

REVOKE INSERT, UPDATE, DELETE ON public.registration_problem_statements FROM anon, authenticated;
GRANT SELECT ON public.registration_problem_statements TO authenticated;
