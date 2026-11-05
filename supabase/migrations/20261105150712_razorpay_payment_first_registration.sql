create table if not exists public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null default 'razorpay' check (provider = 'razorpay'),
  provider_order_id text not null unique,
  provider_payment_id text unique,
  amount_paise integer not null check (amount_paise = 7900),
  currency text not null default 'INR' check (currency = 'INR'),
  status text not null default 'created' check (status in ('created','pending','paid','failed','refunded')),
  registration_id uuid unique references public.registrations(id) on delete set null,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.payment_orders enable row level security;
revoke all on public.payment_orders from anon, authenticated;
grant select on public.payment_orders to authenticated;
create policy payment_orders_select_own on public.payment_orders
  for select to authenticated using (user_id = (select auth.uid()));
create index payment_orders_user_status_idx on public.payment_orders(user_id,status);

drop function if exists public.submit_hackathon_registration(uuid);
create or replace function public.submit_hackathon_registration(p_problem_statement_id uuid, p_payment_order_id uuid)
returns table(registration_id uuid, application_number text)
language plpgsql security definer set search_path = public, pg_temp
as $function$
declare
  v_user_id uuid := auth.uid();
  v_problem public.problem_statements%rowtype;
  v_profile public.profiles%rowtype;
  v_payment public.payment_orders%rowtype;
  v_registration_id uuid;
  v_application_number text;
begin
  if v_user_id is null then raise exception 'Please sign in before registering.'; end if;
  select * into v_payment from public.payment_orders where id=p_payment_order_id and user_id=v_user_id for update;
  if v_payment.id is null or v_payment.status <> 'paid' or v_payment.amount_paise <> 7900 then
    raise exception 'A verified ₹79 payment is required before registration.';
  end if;
  if v_payment.registration_id is not null then
    return query select r.id,r.application_number from public.registrations r where r.id=v_payment.registration_id;
    return;
  end if;
  select * into v_profile from public.profiles where id=v_user_id;
  if v_profile.id is null or nullif(trim(v_profile.full_name),'') is null or nullif(trim(v_profile.phone),'') is null
     or nullif(trim(v_profile.college),'') is null or nullif(trim(v_profile.branch),'') is null or nullif(trim(v_profile.study_year),'') is null then
    raise exception 'Complete your profile before registering (name, phone, college, branch and year).';
  end if;
  if exists(select 1 from public.registrations r where r.created_by=v_user_id and r.status <> 'cancelled') then
    raise exception 'You already have a hackathon application.';
  end if;
  select * into v_problem from public.problem_statements where id=p_problem_statement_id and is_active=true for update;
  if v_problem.id is null then raise exception 'This problem statement is no longer available.'; end if;
  if v_problem.max_slots is not null and v_problem.filled_slots >= v_problem.max_slots then
    raise exception 'This problem statement is full. Please choose another one.';
  end if;
  v_application_number := 'GXC26-' || lpad(nextval('public.application_number_seq')::text,6,'0');
  insert into public.registrations(registration_code,application_number,registration_type,created_by,status,base_fee_paise,coupon_discount_paise,amount_due_paise)
  values(v_application_number,v_application_number,'individual',v_user_id,'confirmed',7900,0,7900) returning id into v_registration_id;
  insert into public.registration_problem_statements(registration_id,problem_statement_id) values(v_registration_id,p_problem_statement_id);
  update public.problem_statements set filled_slots=filled_slots+1 where id=p_problem_statement_id;
  insert into public.payments(registration_id,provider,provider_order_id,provider_payment_id,amount_paise,currency,status,paid_at)
  values(v_registration_id,'razorpay',v_payment.provider_order_id,v_payment.provider_payment_id,7900,'INR','paid',v_payment.paid_at);
  update public.payment_orders set registration_id=v_registration_id,updated_at=now() where id=v_payment.id;
  return query select v_registration_id,v_application_number;
end;
$function$;
revoke all on function public.submit_hackathon_registration(uuid,uuid) from public,anon;
grant execute on function public.submit_hackathon_registration(uuid,uuid) to authenticated;
