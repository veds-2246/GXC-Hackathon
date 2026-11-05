alter table public.event_schedule_settings
  add column if not exists whatsapp_channel_url text;

comment on column public.event_schedule_settings.whatsapp_channel_url
  is 'Official WhatsApp Channel URL shown as a floating action on participant dashboards';
