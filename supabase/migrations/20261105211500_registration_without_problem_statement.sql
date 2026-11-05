drop function if exists public.submit_hackathon_registration(uuid, uuid);
create or replace function public.submit_hackathon_registration(p_payment_order_id uuid)
returns table(registration_id uuid, application_number text)
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_payment public.payment_orders%rowtype;
  v_registration_id uuid;
  v_application_number text;
begin
  if v_user_id is null then
    raise exception 'Please sign in before registering.';
  end if;
  select * into v_payment from public.payment_orders
  where id = p_payment_order_id and user_id = v_user_id for update;
  if v_payment.id is null or v_payment.status <> 'paid' or v_payment.amount_paise <> 7900 then
    raise exception 'A verified ₹79 payment is required before registration.';
  end if;
  if v_payment.registration_id is not null then
    return query select r.id, r.application_number from public.registrations r where r.id = v_payment.registration_id;
    return;
  end if;
  select * into v_profile from public.profiles where id = v_user_id;
  if v_profile.id is null
     or nullif(trim(v_profile.full_name), '') is null
     or nullif(trim(v_profile.phone), '') is null
     or nullif(trim(v_profile.college), '') is null
     or nullif(trim(v_profile.branch), '') is null
     or nullif(trim(v_profile.study_year), '') is null then
    raise exception 'Complete your profile before registering (name, phone, college, branch and year).';
  end if;
  if exists (select 1 from public.registrations r where r.created_by = v_user_id and r.status <> 'cancelled') then
    raise exception 'You already have a hackathon application.';
  end if;
  v_application_number := 'GXC26-' || lpad(nextval('public.application_number_seq')::text, 6, '0');
  insert into public.registrations(registration_code, application_number, registration_type, created_by, status, base_fee_paise, coupon_discount_paise, amount_due_paise)
  values (v_application_number, v_application_number, 'individual', v_user_id, 'confirmed', 7900, 0, 7900)
  returning id into v_registration_id;
  insert into public.payments(registration_id, provider, provider_order_id, provider_payment_id, amount_paise, currency, status, paid_at)
  values (v_registration_id, 'razorpay', v_payment.provider_order_id, v_payment.provider_payment_id, 7900, 'INR', 'paid', v_payment.paid_at);
  update public.payment_orders set registration_id = v_registration_id, updated_at = now() where id = v_payment.id;
  return query select v_registration_id, v_application_number;
end;
$function$;
revoke all on function public.submit_hackathon_registration(uuid) from public, anon;
grant execute on function public.submit_hackathon_registration(uuid) to authenticated;
