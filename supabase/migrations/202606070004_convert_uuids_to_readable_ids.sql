-- 1. Create sequences for ID generation
CREATE SEQUENCE IF NOT EXISTS public.tracks_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS public.slot_prices_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS public.blocked_slots_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS public.bookings_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS public.booking_slots_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS public.booking_payments_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS public.booking_status_history_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS public.admin_activity_logs_seq START WITH 1;

-- 2. Drop existing foreign key constraints
ALTER TABLE public.blocked_slots DROP CONSTRAINT IF EXISTS blocked_slots_track_id_fkey;
ALTER TABLE public.booking_slots DROP CONSTRAINT IF EXISTS booking_slots_track_id_fkey;
ALTER TABLE public.booking_slots DROP CONSTRAINT IF EXISTS booking_slots_booking_id_fkey;
ALTER TABLE public.slot_prices DROP CONSTRAINT IF EXISTS slot_prices_track_id_fkey;
ALTER TABLE public.booking_payments DROP CONSTRAINT IF EXISTS booking_payments_booking_id_fkey;
ALTER TABLE public.booking_status_history DROP CONSTRAINT IF EXISTS booking_status_history_booking_id_fkey;
ALTER TABLE public.admin_activity_logs DROP CONSTRAINT IF EXISTS admin_activity_logs_booking_id_fkey;

-- 3. Drop indices that depend on UUID columns
DROP INDEX IF EXISTS public.booking_slots_one_active_slot_idx;
DROP INDEX IF EXISTS public.blocked_slots_one_slot_idx;

-- 4. Create temporary mapping tables for existing data migration
CREATE TEMP TABLE track_mapping AS
SELECT id::text AS old_id, 'TRK-' || lpad(row_number() over (order by created_at, id)::text, 4, '0') AS new_id
FROM public.tracks;

CREATE TEMP TABLE slot_prices_mapping AS
SELECT id::text AS old_id, 'PRC-' || lpad(row_number() over (order by created_at, id)::text, 5, '0') AS new_id
FROM public.slot_prices;

CREATE TEMP TABLE blocked_slots_mapping AS
SELECT id::text AS old_id, 'BLK-' || lpad(row_number() over (order by created_at, id)::text, 5, '0') AS new_id
FROM public.blocked_slots;

CREATE TEMP TABLE booking_mapping AS
SELECT booking_id::text AS old_id, 'BKG-' || to_char(booking_date, 'YYYYMMDD-') || lpad(row_number() over (partition by booking_date order by created_at, booking_id)::text, 4, '0') AS new_id
FROM public.bookings;

CREATE TEMP TABLE booking_slots_mapping AS
SELECT id::text AS old_id, 'BSL-' || lpad(row_number() over (order by created_at, id)::text, 6, '0') AS new_id
FROM public.booking_slots;

CREATE TEMP TABLE booking_payments_mapping AS
SELECT id::text AS old_id, 'PAY-' || lpad(row_number() over (order by created_at, id)::text, 5, '0') AS new_id
FROM public.booking_payments;

CREATE TEMP TABLE status_history_mapping AS
SELECT id::text AS old_id, 'HIS-' || lpad(row_number() over (order by created_at, id)::text, 5, '0') AS new_id
FROM public.booking_status_history;

CREATE TEMP TABLE activity_logs_mapping AS
SELECT id::text AS old_id, 'LOG-' || lpad(row_number() over (order by created_at, id)::text, 6, '0') AS new_id
FROM public.admin_activity_logs;

-- 5. Alter columns to TEXT type
ALTER TABLE public.tracks ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE public.slot_prices ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE public.slot_prices ALTER COLUMN track_id TYPE text USING track_id::text;
ALTER TABLE public.blocked_slots ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE public.blocked_slots ALTER COLUMN track_id TYPE text USING track_id::text;
ALTER TABLE public.bookings ALTER COLUMN booking_id TYPE text USING booking_id::text;
ALTER TABLE public.booking_slots ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE public.booking_slots ALTER COLUMN booking_id TYPE text USING booking_id::text;
ALTER TABLE public.booking_slots ALTER COLUMN track_id TYPE text USING track_id::text;
ALTER TABLE public.booking_payments ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE public.booking_payments ALTER COLUMN booking_id TYPE text USING booking_id::text;
ALTER TABLE public.booking_status_history ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE public.booking_status_history ALTER COLUMN booking_id TYPE text USING booking_id::text;
ALTER TABLE public.admin_activity_logs ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE public.admin_activity_logs ALTER COLUMN booking_id TYPE text USING booking_id::text;

-- 6. Update the references in child tables using mapping tables
-- blocked_slots track_id
UPDATE public.blocked_slots t
SET track_id = m.new_id
FROM track_mapping m
WHERE t.track_id = m.old_id;

-- booking_slots track_id & booking_id
UPDATE public.booking_slots t
SET track_id = m.new_id
FROM track_mapping m
WHERE t.track_id = m.old_id;

UPDATE public.booking_slots t
SET booking_id = m.new_id
FROM booking_mapping m
WHERE t.booking_id = m.old_id;

-- slot_prices track_id
UPDATE public.slot_prices t
SET track_id = m.new_id
FROM track_mapping m
WHERE t.track_id = m.old_id;

-- booking_payments booking_id
UPDATE public.booking_payments t
SET booking_id = m.new_id
FROM booking_mapping m
WHERE t.booking_id = m.old_id;

-- booking_status_history booking_id
UPDATE public.booking_status_history t
SET booking_id = m.new_id
FROM booking_mapping m
WHERE t.booking_id = m.old_id;

-- admin_activity_logs booking_id
UPDATE public.admin_activity_logs t
SET booking_id = m.new_id
FROM booking_mapping m
WHERE t.booking_id = m.old_id;

-- 7. Update primary keys in all tables using mapping tables
-- tracks
UPDATE public.tracks t
SET id = m.new_id
FROM track_mapping m
WHERE t.id = m.old_id;

-- slot_prices
UPDATE public.slot_prices t
SET id = m.new_id
FROM slot_prices_mapping m
WHERE t.id = m.old_id;

-- blocked_slots
UPDATE public.blocked_slots t
SET id = m.new_id
FROM blocked_slots_mapping m
WHERE t.id = m.old_id;

-- bookings
UPDATE public.bookings t
SET booking_id = m.new_id
FROM booking_mapping m
WHERE t.booking_id = m.old_id;

-- booking_slots
UPDATE public.booking_slots t
SET id = m.new_id
FROM booking_slots_mapping m
WHERE t.id = m.old_id;

-- booking_payments
UPDATE public.booking_payments t
SET id = m.new_id
FROM booking_payments_mapping m
WHERE t.id = m.old_id;

-- booking_status_history
UPDATE public.booking_status_history t
SET id = m.new_id
FROM status_history_mapping m
WHERE t.id = m.old_id;

-- admin_activity_logs
UPDATE public.admin_activity_logs t
SET id = m.new_id
FROM activity_logs_mapping m
WHERE t.id = m.old_id;

-- 8. Set PK defaults using the sequences
ALTER TABLE public.tracks ALTER COLUMN id SET DEFAULT 'TRK-' || lpad(nextval('public.tracks_seq')::text, 4, '0');
ALTER TABLE public.slot_prices ALTER COLUMN id SET DEFAULT 'PRC-' || lpad(nextval('public.slot_prices_seq')::text, 5, '0');
ALTER TABLE public.blocked_slots ALTER COLUMN id SET DEFAULT 'BLK-' || lpad(nextval('public.blocked_slots_seq')::text, 5, '0');
ALTER TABLE public.bookings ALTER COLUMN booking_id SET DEFAULT 'BKG-' || to_char(now(), 'YYYYMMDD-') || lpad(nextval('public.bookings_seq')::text, 4, '0');
ALTER TABLE public.booking_slots ALTER COLUMN id SET DEFAULT 'BSL-' || lpad(nextval('public.booking_slots_seq')::text, 6, '0');
ALTER TABLE public.booking_payments ALTER COLUMN id SET DEFAULT 'PAY-' || lpad(nextval('public.booking_payments_seq')::text, 5, '0');
ALTER TABLE public.booking_status_history ALTER COLUMN id SET DEFAULT 'HIS-' || lpad(nextval('public.booking_status_history_seq')::text, 5, '0');
ALTER TABLE public.admin_activity_logs ALTER COLUMN id SET DEFAULT 'LOG-' || lpad(nextval('public.admin_activity_logs_seq')::text, 6, '0');

-- 9. Synchronize sequences to match converted records count
SELECT setval('public.tracks_seq', coalesce(nullif((SELECT count(*) FROM public.tracks), 0), 1));
SELECT setval('public.slot_prices_seq', coalesce(nullif((SELECT count(*) FROM public.slot_prices), 0), 1));
SELECT setval('public.blocked_slots_seq', coalesce(nullif((SELECT count(*) FROM public.blocked_slots), 0), 1));
SELECT setval('public.bookings_seq', coalesce(nullif((SELECT count(*) FROM public.bookings), 0), 1));
SELECT setval('public.booking_slots_seq', coalesce(nullif((SELECT count(*) FROM public.booking_slots), 0), 1));
SELECT setval('public.booking_payments_seq', coalesce(nullif((SELECT count(*) FROM public.booking_payments), 0), 1));
SELECT setval('public.booking_status_history_seq', coalesce(nullif((SELECT count(*) FROM public.booking_status_history), 0), 1));
SELECT setval('public.admin_activity_logs_seq', coalesce(nullif((SELECT count(*) FROM public.admin_activity_logs), 0), 1));

-- 10. Re-create foreign key constraints
ALTER TABLE public.blocked_slots ADD CONSTRAINT blocked_slots_track_id_fkey FOREIGN KEY (track_id) REFERENCES public.tracks(id) ON DELETE CASCADE;
ALTER TABLE public.booking_slots ADD CONSTRAINT booking_slots_track_id_fkey FOREIGN KEY (track_id) REFERENCES public.tracks(id) ON DELETE CASCADE;
ALTER TABLE public.booking_slots ADD CONSTRAINT booking_slots_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(booking_id) ON DELETE CASCADE;
ALTER TABLE public.slot_prices ADD CONSTRAINT slot_prices_track_id_fkey FOREIGN KEY (track_id) REFERENCES public.tracks(id) ON DELETE CASCADE;
ALTER TABLE public.booking_payments ADD CONSTRAINT booking_payments_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(booking_id) ON DELETE CASCADE;
ALTER TABLE public.booking_status_history ADD CONSTRAINT booking_status_history_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(booking_id) ON DELETE CASCADE;
ALTER TABLE public.admin_activity_logs ADD CONSTRAINT admin_activity_logs_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(booking_id) ON DELETE CASCADE;

-- 11. Recreate unique indices with text type
CREATE UNIQUE INDEX IF NOT EXISTS booking_slots_one_active_slot_idx
ON public.booking_slots (track_id, slot_date, start_time)
WHERE slot_status = 'active';

CREATE UNIQUE INDEX IF NOT EXISTS blocked_slots_one_slot_idx
ON public.blocked_slots (track_id, slot_date, start_time);

-- 12. Recreate functions with new text parameter types
DROP FUNCTION IF EXISTS public.resolve_slot_price(uuid, date, time, time);
DROP FUNCTION IF EXISTS public.resolve_slot_price(text, date, time, time);

CREATE OR REPLACE FUNCTION public.resolve_slot_price(
  p_track_id text,
  p_booking_date date,
  p_start_time time,
  p_end_time time
)
RETURNS numeric
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_day_type text;
  v_price numeric;
BEGIN
  v_day_type := case
    when extract(isodow from p_booking_date) in (6, 7) then 'weekend'
    else 'weekday'
  END;

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
END;
$$;

DROP FUNCTION IF EXISTS public.create_booking_atomic(text, text, text, text, text, date, uuid, jsonb, integer, text, text, text, boolean, uuid, text);
DROP FUNCTION IF EXISTS public.create_booking_atomic(text, text, text, text, text, date, text, jsonb, integer, text, text, text, boolean, uuid, text);

CREATE OR REPLACE FUNCTION public.create_booking_atomic(
  p_booking_reference text,
  p_customer_nic text,
  p_customer_full_name text,
  p_customer_email text,
  p_customer_whatsapp_number text,
  p_booking_date date,
  p_track_id text,
  p_slots jsonb,
  p_number_of_people int,
  p_payment_method text,
  p_payment_proof_path text,
  p_remarks text,
  p_create_as_accepted boolean,
  p_admin_id uuid,
  p_currency text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking_id text := 'BKG-' || to_char(p_booking_date, 'YYYYMMDD-') || lpad(nextval('public.bookings_seq')::text, 4, '0');
  v_status text := case when p_create_as_accepted then 'accepted' else 'submitted' end;
  v_slot jsonb;
  v_start_time time;
  v_end_time time;
  v_price numeric;
  v_total_price numeric := 0;
BEGIN
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
END;
$$;
