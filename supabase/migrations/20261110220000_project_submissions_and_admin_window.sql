-- Project submissions and admin-controlled submission window.
create table if not exists public.project_submission_settings (
  id smallint primary key default 1 check (id = 1),
  is_open boolean not null default false,
  closes_at timestamptz,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);
insert into public.project_submission_settings (id, is_open) values (1, false) on conflict (id) do nothing;

create table if not exists public.project_submissions (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null unique references public.registrations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  project_title text not null check (char_length(project_title) between 3 and 120),
  problem_statement_id uuid not null references public.problem_statements(id),
  description text not null check (char_length(description) between 20 and 3000),
  solution_features text not null check (char_length(solution_features) between 10 and 3000),
  github_url text not null,
  production_url text not null,
  presentation_path text not null,
  status text not null default 'pending' check (status in ('pending','under_review','shortlisted','rejected','winner')),
  score numeric(5,2) check (score is null or (score >= 0 and score <= 100)),
  judge_remarks text,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.project_submission_settings enable row level security;
alter table public.project_submissions enable row level security;
revoke all on public.project_submission_settings, public.project_submissions from anon, public;
grant select on public.project_submission_settings to authenticated;
grant select, insert, update on public.project_submissions to authenticated;

create policy "Authenticated users read submission window" on public.project_submission_settings for select to authenticated using (true);
create policy "Admins manage submission window" on public.project_submission_settings for all to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "Students read own submissions and admins read all" on public.project_submissions for select to authenticated
using (user_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "Students create own submission while open" on public.project_submissions for insert to authenticated with check (
  user_id = auth.uid()
  and exists (select 1 from public.registrations r where r.id = registration_id and r.created_by = auth.uid() and r.status = 'confirmed')
  and exists (select 1 from public.project_submission_settings s where s.id = 1 and s.is_open and (s.closes_at is null or s.closes_at > now()))
);
create policy "Students edit own submission while open" on public.project_submissions for update to authenticated
using (user_id = auth.uid() and exists (select 1 from public.project_submission_settings s where s.id = 1 and s.is_open and (s.closes_at is null or s.closes_at > now())))
with check (user_id = auth.uid()
  and exists (select 1 from public.registrations r where r.id = registration_id and r.created_by = auth.uid() and r.status = 'confirmed')
  and exists (select 1 from public.project_submission_settings s where s.id = 1 and s.is_open and (s.closes_at is null or s.closes_at > now())));
create policy "Admins update submission reviews" on public.project_submissions for update to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create or replace function public.guard_project_submission()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare v_is_admin boolean; v_open boolean; v_closes_at timestamptz;
begin
  select exists(select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin') into v_is_admin;
  if tg_op = 'INSERT' or not v_is_admin then
    select s.is_open, s.closes_at into v_open, v_closes_at from public.project_submission_settings s where s.id = 1;
    if not coalesce(v_open, false) or (v_closes_at is not null and v_closes_at <= now()) then raise exception 'Project submissions are currently closed'; end if;
  end if;
  if tg_op = 'INSERT' then
    if new.user_id <> auth.uid() or not exists (select 1 from public.registrations r where r.id = new.registration_id and r.created_by = auth.uid() and r.status = 'confirmed') then raise exception 'A confirmed personal registration is required'; end if;
    new.status := 'pending'; new.score := null; new.judge_remarks := null; new.submitted_at := now(); new.updated_at := now();
  else
    if not v_is_admin and (new.user_id <> old.user_id or new.registration_id <> old.registration_id or new.status <> old.status or new.score is distinct from old.score or new.judge_remarks is distinct from old.judge_remarks) then raise exception 'Only admins can change review fields'; end if;
    new.updated_at := now();
  end if;
  return new;
end;
$$;
create trigger project_submission_guard before insert or update on public.project_submissions for each row execute function public.guard_project_submission();
revoke all on function public.guard_project_submission() from public, anon, authenticated;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('project-presentations','project-presentations',false,15728640,array['application/vnd.openxmlformats-officedocument.presentationml.presentation','application/vnd.ms-powerpoint'])
on conflict (id) do update set public=false,file_size_limit=15728640,allowed_mime_types=excluded.allowed_mime_types;
create policy "Student upload project presentation" on storage.objects for insert to authenticated with check (
 bucket_id='project-presentations' and (storage.foldername(name))[1]=auth.uid()::text
 and exists(select 1 from public.project_submission_settings s where s.id=1 and s.is_open and (s.closes_at is null or s.closes_at>now())));
create policy "Student update project presentation" on storage.objects for update to authenticated
using(bucket_id='project-presentations' and (storage.foldername(name))[1]=auth.uid()::text)
with check(bucket_id='project-presentations' and (storage.foldername(name))[1]=auth.uid()::text
 and exists(select 1 from public.project_submission_settings s where s.id=1 and s.is_open and (s.closes_at is null or s.closes_at>now())));
create policy "Students and admins read project presentations" on storage.objects for select to authenticated using (
 bucket_id='project-presentations' and ((storage.foldername(name))[1]=auth.uid()::text
 or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')));
