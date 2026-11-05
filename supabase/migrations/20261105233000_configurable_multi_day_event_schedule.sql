CREATE TABLE IF NOT EXISTS public.event_schedule_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  day_count integer NOT NULL DEFAULT 1 CHECK (day_count BETWEEN 1 AND 31),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);
ALTER TABLE public.event_schedule_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.event_schedule_settings FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.event_schedule_settings TO authenticated;

DROP POLICY IF EXISTS event_schedule_settings_read_authenticated ON public.event_schedule_settings;
CREATE POLICY event_schedule_settings_read_authenticated
ON public.event_schedule_settings FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS event_schedule_settings_admin_insert ON public.event_schedule_settings;
CREATE POLICY event_schedule_settings_admin_insert
ON public.event_schedule_settings FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'));

DROP POLICY IF EXISTS event_schedule_settings_admin_update ON public.event_schedule_settings;
CREATE POLICY event_schedule_settings_admin_update
ON public.event_schedule_settings FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'));

INSERT INTO public.event_schedule_settings (id, day_count)
VALUES (1, 1)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.event_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_number integer NOT NULL CHECK (day_number BETWEEN 1 AND 31),
  title text NOT NULL CHECK (length(trim(title)) > 0),
  venue text,
  timing text,
  pre_instructions text,
  display_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS event_details_day_order_idx
ON public.event_details(day_number, display_order, created_at);
ALTER TABLE public.event_details ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.event_details FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_details TO authenticated;

DROP POLICY IF EXISTS event_details_read_published ON public.event_details;
CREATE POLICY event_details_read_published
ON public.event_details FOR SELECT TO authenticated USING (is_published = true);

DROP POLICY IF EXISTS event_details_admin_read_all ON public.event_details;
CREATE POLICY event_details_admin_read_all
ON public.event_details FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'));

DROP POLICY IF EXISTS event_details_admin_insert ON public.event_details;
CREATE POLICY event_details_admin_insert
ON public.event_details FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'));

DROP POLICY IF EXISTS event_details_admin_update ON public.event_details;
CREATE POLICY event_details_admin_update
ON public.event_details FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'));

DROP POLICY IF EXISTS event_details_admin_delete ON public.event_details;
CREATE POLICY event_details_admin_delete
ON public.event_details FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'));

CREATE OR REPLACE FUNCTION public.validate_event_day_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $function$
DECLARE
  v_day_count integer;
BEGIN
  SELECT day_count INTO v_day_count FROM public.event_schedule_settings WHERE id = 1;
  IF v_day_count IS NULL OR NEW.day_number < 1 OR NEW.day_number > v_day_count THEN
    RAISE EXCEPTION 'Choose a day between 1 and the configured event day count (%).', COALESCE(v_day_count, 1);
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS event_details_validate_day_number ON public.event_details;
CREATE TRIGGER event_details_validate_day_number
BEFORE INSERT OR UPDATE OF day_number ON public.event_details
FOR EACH ROW EXECUTE FUNCTION public.validate_event_day_number();
REVOKE ALL ON FUNCTION public.validate_event_day_number() FROM PUBLIC, anon, authenticated;

-- Preserve any workshop details already entered, but migrate them as generic event entries.
INSERT INTO public.event_details (day_number, title, venue, timing, pre_instructions, is_published)
SELECT 1,
  CASE WHEN NULLIF(BTRIM(title), '') IS NULL OR BTRIM(title) IN ('Day 1 AI Workshop', 'AI Workshop')
    THEN 'Event details' ELSE BTRIM(title) END,
  venue, timing, pre_instructions, true
FROM public.event_workshop_settings
WHERE NULLIF(BTRIM(venue), '') IS NOT NULL
   OR NULLIF(BTRIM(timing), '') IS NOT NULL
   OR NULLIF(BTRIM(pre_instructions), '') IS NOT NULL
ON CONFLICT DO NOTHING;

DROP TABLE IF EXISTS public.event_workshop_settings;
