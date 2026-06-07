create extension if not exists pgcrypto;

create table if not exists public.admin_user_settings (
  admin_user_id uuid primary key references public.admin_users(id) on delete cascade,
  language text not null default 'en',
  notify_new_booking boolean not null default true,
  notify_accepted boolean not null default true,
  notify_rejected boolean not null default true,
  notify_on_hold boolean not null default true,
  notify_daily_summary boolean not null default true,
  max_slots_per_booking int not null default 10 check (max_slots_per_booking between 1 and 50),
  default_slot_price numeric null check (default_slot_price is null or default_slot_price > 0),
  updated_at timestamptz not null default now()
);

alter table public.admin_user_settings enable row level security;

drop policy if exists "Allow active admins to read own settings" on public.admin_user_settings;
drop policy if exists "Allow active admins to insert own settings" on public.admin_user_settings;
drop policy if exists "Allow active admins to update own settings" on public.admin_user_settings;

create policy "Allow active admins to read own settings"
on public.admin_user_settings
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.admin_users
    where admin_users.id = admin_user_settings.admin_user_id
      and admin_users.is_active = true
  )
);

create policy "Allow active admins to insert own settings"
on public.admin_user_settings
for insert
to anon, authenticated
with check (
  exists (
    select 1
    from public.admin_users
    where admin_users.id = admin_user_settings.admin_user_id
      and admin_users.is_active = true
  )
);

create policy "Allow active admins to update own settings"
on public.admin_user_settings
for update
to anon, authenticated
using (
  exists (
    select 1
    from public.admin_users
    where admin_users.id = admin_user_settings.admin_user_id
      and admin_users.is_active = true
  )
)
with check (
  exists (
    select 1
    from public.admin_users
    where admin_users.id = admin_user_settings.admin_user_id
      and admin_users.is_active = true
  )
);

alter table public.bookings
  drop constraint if exists bookings_status_check;

alter table public.bookings
  add constraint bookings_status_check
  check (status in ('submitted', 'accepted', 'rejected', 'on_hold'));

alter table public.booking_slots
  drop constraint if exists booking_slots_slot_status_check;

alter table public.booking_slots
  add constraint booking_slots_slot_status_check
  check (slot_status in ('active', 'released'));

alter table public.booking_payments
  drop constraint if exists booking_payments_payment_method_check;

alter table public.booking_payments
  add constraint booking_payments_payment_method_check
  check (payment_method in ('payment_proof', 'pay_on_arrival'));

alter table public.slot_prices
  drop constraint if exists slot_prices_day_type_check;

alter table public.slot_prices
  add constraint slot_prices_day_type_check
  check (day_type in ('all_days', 'weekday', 'weekend', 'specific_day'));

create unique index if not exists booking_slots_one_active_slot_idx
on public.booking_slots (track_id, slot_date, start_time)
where slot_status = 'active';

create unique index if not exists blocked_slots_one_slot_idx
on public.blocked_slots (track_id, slot_date, start_time);

create index if not exists slot_prices_active_lookup_idx
on public.slot_prices (track_id, start_time, end_time, effective_from, effective_to)
where status = 'active';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_admin_users_updated_at on public.admin_users;
create trigger set_admin_users_updated_at
before update on public.admin_users
for each row execute function public.set_updated_at();

drop trigger if exists set_admin_user_settings_updated_at on public.admin_user_settings;
create trigger set_admin_user_settings_updated_at
before update on public.admin_user_settings
for each row execute function public.set_updated_at();

drop trigger if exists set_bookings_updated_at on public.bookings;
create trigger set_bookings_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

drop trigger if exists set_booking_slots_updated_at on public.booking_slots;
create trigger set_booking_slots_updated_at
before update on public.booking_slots
for each row execute function public.set_updated_at();

drop trigger if exists set_booking_payments_updated_at on public.booking_payments;
create trigger set_booking_payments_updated_at
before update on public.booking_payments
for each row execute function public.set_updated_at();

drop trigger if exists set_blocked_slots_updated_at on public.blocked_slots;
create trigger set_blocked_slots_updated_at
before update on public.blocked_slots
for each row execute function public.set_updated_at();

drop trigger if exists set_slot_prices_updated_at on public.slot_prices;
create trigger set_slot_prices_updated_at
before update on public.slot_prices
for each row execute function public.set_updated_at();

drop trigger if exists set_tracks_updated_at on public.tracks;
create trigger set_tracks_updated_at
before update on public.tracks
for each row execute function public.set_updated_at();

create or replace function public.prevent_blocked_slot_booking_conflict()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1
    from public.booking_slots
    where booking_slots.track_id = new.track_id
      and booking_slots.slot_date = new.slot_date
      and booking_slots.start_time = new.start_time
      and booking_slots.slot_status = 'active'
  ) then
    raise exception 'Cannot block a slot that already has an active booking.';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_blocked_slot_booking_conflict on public.blocked_slots;
create trigger prevent_blocked_slot_booking_conflict
before insert on public.blocked_slots
for each row execute function public.prevent_blocked_slot_booking_conflict();

create or replace function public.resolve_slot_price(
  p_track_id uuid,
  p_booking_date date,
  p_start_time time,
  p_end_time time
)
returns numeric
language plpgsql
stable
as $$
declare
  v_day_type text;
  v_price numeric;
begin
  v_day_type := case
    when extract(isodow from p_booking_date) in (6, 7) then 'weekend'
    else 'weekday'
  end;

  select slot_prices.price
  into v_price
  from public.slot_prices
  where slot_prices.track_id = p_track_id
    and slot_prices.start_time = p_start_time
    and slot_prices.end_time = p_end_time
    and slot_prices.status = 'active'
    and coalesce(slot_prices.is_active, true) = true
    and slot_prices.effective_from <= p_booking_date
    and (slot_prices.effective_to is null or slot_prices.effective_to >= p_booking_date)
    and slot_prices.day_type in ('all_days', v_day_type, 'specific_day')
  order by
    case
      when slot_prices.day_type = 'specific_day' and slot_prices.effective_from = p_booking_date then 1
      when slot_prices.day_type = v_day_type then 2
      when slot_prices.day_type = 'all_days' then 3
      else 4
    end,
    slot_prices.effective_from desc,
    slot_prices.created_at desc
  limit 1;

  if v_price is null then
    raise exception 'No active price rule found for the selected slot.';
  end if;

  return v_price;
end;
$$;

create or replace function public.create_booking_atomic(
  p_booking_reference text,
  p_customer_nic text,
  p_customer_full_name text,
  p_customer_email text,
  p_customer_whatsapp_number text,
  p_booking_date date,
  p_track_id uuid,
  p_slots jsonb,
  p_number_of_people int,
  p_payment_method text,
  p_payment_proof_path text,
  p_remarks text,
  p_create_as_accepted boolean,
  p_admin_id uuid,
  p_currency text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking_id uuid := gen_random_uuid();
  v_status text := case when p_create_as_accepted then 'accepted' else 'submitted' end;
  v_slot jsonb;
  v_start_time time;
  v_end_time time;
  v_price numeric;
  v_total_price numeric := 0;
begin
  if p_slots is null or jsonb_array_length(p_slots) = 0 then
    raise exception 'Select at least one time slot.';
  end if;

  if p_payment_method not in ('payment_proof', 'pay_on_arrival') then
    raise exception 'Invalid payment method.';
  end if;

  if not exists (
    select 1
    from public.admin_users
    where id = p_admin_id
      and is_active = true
  ) then
    raise exception 'Active admin is required.';
  end if;

  for v_slot in select * from jsonb_array_elements(p_slots)
  loop
    v_start_time := (v_slot->>'startTime')::time;
    v_end_time := (v_slot->>'endTime')::time;

    if exists (
      select 1
      from public.booking_slots
      where track_id = p_track_id
        and slot_date = p_booking_date
        and start_time = v_start_time
        and slot_status = 'active'
    ) then
      raise exception 'One or more selected slots are already booked.';
    end if;

    if exists (
      select 1
      from public.blocked_slots
      where track_id = p_track_id
        and slot_date = p_booking_date
        and start_time = v_start_time
    ) then
      raise exception 'One or more selected slots are blocked.';
    end if;

    v_price := public.resolve_slot_price(p_track_id, p_booking_date, v_start_time, v_end_time);
    v_total_price := v_total_price + v_price;
  end loop;

  insert into public.customers (nic, full_name, email, whatsapp_number)
  values (p_customer_nic, p_customer_full_name, p_customer_email, p_customer_whatsapp_number)
  on conflict (nic) do update
  set full_name = excluded.full_name,
      email = excluded.email,
      whatsapp_number = excluded.whatsapp_number;

  insert into public.bookings (
    booking_id,
    booking_reference,
    customer_nic,
    booking_date,
    number_of_people,
    status,
    remarks,
    total_price,
    currency,
    accepted_by_admin_id,
    accepted_at
  )
  values (
    v_booking_id,
    p_booking_reference,
    p_customer_nic,
    p_booking_date,
    p_number_of_people,
    v_status,
    p_remarks,
    v_total_price,
    p_currency,
    case when p_create_as_accepted then p_admin_id else null end,
    case when p_create_as_accepted then now() else null end
  );

  for v_slot in select * from jsonb_array_elements(p_slots)
  loop
    v_start_time := (v_slot->>'startTime')::time;
    v_end_time := (v_slot->>'endTime')::time;
    v_price := public.resolve_slot_price(p_track_id, p_booking_date, v_start_time, v_end_time);

    insert into public.booking_slots (
      booking_id,
      track_id,
      slot_date,
      start_time,
      end_time,
      price_at_booking,
      slot_status
    )
    values (
      v_booking_id,
      p_track_id,
      p_booking_date,
      v_start_time,
      v_end_time,
      v_price,
      'active'
    );
  end loop;

  insert into public.booking_payments (
    booking_id,
    payment_method,
    payment_proof_path
  )
  values (
    v_booking_id,
    p_payment_method,
    p_payment_proof_path
  );

  insert into public.booking_status_history (
    booking_id,
    old_status,
    new_status,
    changed_by_admin_id,
    reason
  )
  values (
    v_booking_id,
    null,
    v_status,
    p_admin_id,
    case when p_create_as_accepted then 'Booking created as accepted' else 'Booking submitted' end
  );

  insert into public.admin_activity_logs (
    admin_user_id,
    booking_id,
    action_type,
    description
  )
  values (
    p_admin_id,
    v_booking_id,
    case when p_create_as_accepted then 'booking_created_accepted' else 'booking_created' end,
    'Booking created from admin app'
  );

  return v_booking_id;
end;
$$;

insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

drop policy if exists "Allow payment proof uploads" on storage.objects;
drop policy if exists "Allow payment proof signed reads" on storage.objects;
drop policy if exists "Allow payment proof deletes" on storage.objects;

create policy "Allow payment proof uploads"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'payment-proofs');

create policy "Allow payment proof signed reads"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'payment-proofs');

create policy "Allow payment proof deletes"
on storage.objects
for delete
to anon, authenticated
using (bucket_id = 'payment-proofs');
