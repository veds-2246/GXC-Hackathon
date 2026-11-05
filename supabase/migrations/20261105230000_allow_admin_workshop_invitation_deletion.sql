GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_workshop_settings TO authenticated;

DROP POLICY IF EXISTS event_workshop_settings_admin_insert ON public.event_workshop_settings;
CREATE POLICY event_workshop_settings_admin_insert
ON public.event_workshop_settings FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS event_workshop_settings_admin_delete ON public.event_workshop_settings;
CREATE POLICY event_workshop_settings_admin_delete
ON public.event_workshop_settings FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
  )
);
