# DB Connection Review - GPT

Date checked: 2026-05-24  
Source schema: `docs/db_check.md`  
App reviewed: Expo Router admin app under `app/`, `lib/`, `hooks/`, `types/`

## Summary

The app is connected to the main Supabase tables, and the current schema covers most of the admin workflow:

- Dashboard reads `bookings`, `blocked_slots`, and `admin_activity_logs`.
- Requests and booking detail read `bookings`, `customers`, `booking_slots`, `tracks`, and `booking_payments`.
- Create booking uploads payment proof files to Supabase Storage and then calls a database RPC.
- Schedule reads `tracks`, `booking_slots`, `bookings`, `customers`, and `blocked_slots`.
- Block slots writes `blocked_slots` and writes a basic activity log.
- Pricing reads/writes `slot_prices`.
- Settings updates admin profile fields in `admin_users`.

Main gaps:

1. `createBooking()` depends on `create_booking_atomic`, but that RPC/function is not shown in `docs/db_check.md`.
2. `booking_status_history` is written but never read/displayed in the app.
3. Several status decision columns in `bookings` are written but not selected back in `bookingSelect`, so the app cannot show accepted/rejected/on-hold metadata after save.
4. Settings controls for language, notification toggles, max slots, and default slot price are local-only and are not backed by DB columns/tables.
5. DB constraints/checks are not visible in `docs/db_check.md`; text status columns should be protected with check constraints or enums.
6. The app uses `slot_prices` for the pricing screen, but create-booking total still uses an in-memory default price, not the DB price rules.

## Screen to DB Navigation Check

| App area | DB objects used | Status | Notes |
|---|---|---:|---|
| Supabase client | `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` | OK | Uses anon/publishable key only. No service role key in `lib/supabase.ts`. |
| Login | `admin_users` | Partial | Login searches `admin_users` by email/full name and `is_active`. It does not use Supabase Auth password login. This matches the simple admin flow, but session recovery expects `auth.users.id`, so app restart/session restore is inconsistent. |
| Signup | `admin_users` | OK for simple flow | Saves `full_name`, `email`, `whatsapp_number`, `is_active`. Does not use `nic` or `password_hash`. |
| Dashboard | `bookings`, `blocked_slots`, `admin_activity_logs` | Partial | Counts and recent activity are DB-backed. `weekRevenue`, `availableSlotsToday`, and `nextUpcomingBooking` are still hardcoded/default values in service data. |
| Requests | `bookings`, `customers`, `booking_slots`, `tracks`, `booking_payments` | OK | Status/date/track/payment filters reach DB. Search is still client-side over loaded page only. |
| Booking detail | `bookings`, `customers`, `booking_slots`, `tracks`, `booking_payments`, `booking_status_history`, `admin_activity_logs` | Partial | Reads booking details and writes status/history/activity. Status update is not atomic; if history/activity insert fails after booking update, DB can be partially updated. |
| Create booking | Storage bucket `payment-proofs`, RPC `create_booking_atomic` | Needs DB object check | App no longer inserts six tables directly. It requires `create_booking_atomic` to exist and write `customers`, `bookings`, `booking_slots`, `booking_payments`, `booking_status_history`, `admin_activity_logs`. |
| Schedule | `tracks`, `booking_slots`, `bookings`, `customers`, `blocked_slots` | OK | Displays active booking slots and blocked slots by date. Uses hardcoded track IDs as an allow-list, so new DB tracks will not appear unless added to `constants/tracks.ts`. |
| Block slots | `blocked_slots`, `admin_activity_logs`, `tracks` | Partial | Insert/delete works. Delete does not create an activity log. Insert does not appear to check conflicts against active booking slots unless DB constraints/RPC handle it. |
| Pricing | `slot_prices`, `tracks` | Partial | Price rules are stored in DB. The "default price" card is local memory only and is not persisted. Create booking does not calculate price from `slot_prices`. |
| Reports | `bookings`, `booking_slots`, `blocked_slots` | OK/Partial | Revenue and occupancy are DB-driven. Capacity denominator is based on local constants, not track operating hours from DB. |
| Settings | `admin_users` | Partial | Name/email/WhatsApp save to DB. Language, notification toggles, and max slots are local-only. |

## Table by Table Findings

### `admin_users`

Used columns:

- `id`
- `full_name`
- `email`
- `whatsapp_number`
- `is_active`
- `created_at`, `updated_at` only through `select("*")`, not shown directly

Not currently used by app:

- `nic`
- `password_hash`

Findings:

- `password_hash` is not needed for the current app because there is no password form and no manual password check.
- `nic` is not collected for admin signup/settings.
- `email` is correctly validated before signup/profile save.
- If Supabase Auth session restore remains in the app, `admin_users.id` should match `auth.users.id`. If this simple no-password admin flow is intentional, session restore should use a local persisted admin id instead of Supabase Auth session.

### `customers`

Used columns:

- `nic`
- `full_name`
- `email`
- `whatsapp_number`

Not currently used by app:

- `created_at`
- `updated_at`

Findings:

- Customer email is captured and saved, but optional customer email is not validated in `validateBooking()`.
- `nic` is required and used as the customer primary key.

Recommended DB/app check:

- Add optional email validation in app, or add a DB check constraint if invalid customer email should be rejected.

### `bookings`

Used columns:

- `booking_id`
- `booking_reference`
- `customer_nic`
- `booking_date`
- `number_of_people`
- `status`
- `remarks`
- `total_price`
- `currency`
- `created_at`
- `accepted_by_admin_id`, `accepted_at`, `rejected_by_admin_id`, `rejected_at`, `rejection_reason`, `on_hold_reason` are written during status changes

Not selected/displayed in current booking query:

- `accepted_by_admin_id`
- `accepted_at`
- `rejected_by_admin_id`
- `rejected_at`
- `rejection_reason`
- `on_hold_reason`
- `updated_at`

Findings:

- These decision fields are useful and should stay in DB.
- The app writes them, but `bookingSelect` does not select them, so the UI cannot show approval time, rejection reason, or hold reason after refresh.
- `status` is text; add a check constraint for allowed values: `submitted`, `accepted`, `rejected`, `on_hold`.

### `booking_slots`

Used columns:

- `id`
- `booking_id`
- `track_id`
- `slot_date`
- `start_time`
- `end_time`
- `price_at_booking`
- `slot_status`

Not currently used by app:

- `created_at`
- `updated_at`

Findings:

- `price_at_booking` is used by reports and protects old bookings from later price changes.
- `slot_status` is used to release slots when a booking is rejected.
- Booking cards only show the first slot, so multi-slot bookings are not fully represented in the list card.
- Create booking allows evening slots only, while DB seed/data contains morning slots too.

Recommended DB constraints:

- Unique active slot guard, for example one active booking per `track_id + slot_date + start_time`.
- Check constraint for `slot_status in ('active', 'released')`.

### `booking_payments`

Used columns:

- `id`
- `booking_id`
- `payment_method`
- `payment_proof_path`

Not currently used by app:

- `created_at`
- `updated_at`

Findings:

- Payment proof upload is now connected to Supabase Storage bucket `payment-proofs`.
- `payment_proof_path` stores the returned relative path and booking detail opens a signed URL.
- `payment_method` is text; add a check constraint for `payment_proof`, `pay_on_arrival`.

Required Supabase object:

- Storage bucket `payment-proofs` must exist with upload/read policies suitable for the anon/authenticated client flow.

### `booking_status_history`

Used columns:

- Inserted on status update.
- Expected to be inserted by `create_booking_atomic` when a booking is created.

Not currently used by app:

- No screen reads or displays status history.

Findings:

- Keep this table. It is important audit data.
- Add a status history section in booking detail if admins need to see previous changes.
- `old_status` can be nullable in DB, but app currently sends the old status for updates.

### `admin_activity_logs`

Used columns:

- `id`
- `action_type`
- `description`
- `created_at`
- `admin_user_id`
- `booking_id`

Not fully used by app:

- Dashboard displays description/action only. It does not join to admin user or navigate by `booking_id`.
- Block-slot delete does not write an activity log.

Findings:

- Table is useful and connected.
- Add activity rows for unblock/delete actions if audit history matters.

### `blocked_slots`

Used columns:

- `id`
- `track_id`
- `slot_date`
- `start_time`
- `end_time`
- `reason`
- `created_by_admin_id`

Not currently used/displayed:

- `created_at`
- `updated_at`

Findings:

- Block slot insert/list/delete works against this table.
- DB should prevent duplicate blocked slots for the same track/date/start time.
- DB or RPC should prevent blocking an already active booked slot.

Recommended DB constraints:

- Unique guard on `track_id + slot_date + start_time`.
- Conflict check against active `booking_slots`.

### `slot_prices`

Used columns:

- `id`
- `track_id`
- `start_time`
- `end_time`
- `day_type`
- `price`
- `currency`
- `effective_from`
- `effective_to`
- `is_active`

Not currently used:

- `created_at`
- `updated_at`

Findings:

- Pricing management screen reads/writes this table.
- Create booking does not use this table to calculate price; it uses the local default price from `constants/pricing.ts`.
- `day_type` is text; add a check constraint for `all_days`, `weekday`, `weekend`, `specific_day`.
- If multiple active overlapping price rules exist, app has no DB-level protection visible in schema.

Recommended change:

- Move price calculation into `create_booking_atomic`, or add an app-side query that resolves the correct `slot_prices` row for booking date/time/track.

### `tracks`

Used columns:

- `id`
- `track_name`
- `is_active`
- `description` is present in type/fallback data but not shown in current UI

Not currently used/displayed:

- `created_at`
- `updated_at`

Findings:

- The app filters DB tracks by hardcoded `configuredTrackIds`. This is safe for a two-track app, but if a new track is added in Supabase only, it will not appear in the app.

## DB Objects or Fields to Add

### 1. Required: `create_booking_atomic` RPC

The app calls:

```ts
client.rpc("create_booking_atomic", {
  p_booking_reference,
  p_customer_nic,
  p_customer_full_name,
  p_customer_email,
  p_customer_whatsapp_number,
  p_booking_date,
  p_track_id,
  p_slots,
  p_number_of_people,
  p_payment_method,
  p_payment_proof_path,
  p_remarks,
  p_create_as_accepted,
  p_admin_id,
  p_currency
})
```

`docs/db_check.md` lists tables only, not this RPC. If the RPC is not actually created in Supabase, create booking will fail.

The RPC should:

1. Upsert `customers`.
2. Insert `bookings`.
3. Insert one or more `booking_slots`.
4. Insert `booking_payments`.
5. Insert `booking_status_history`.
6. Insert `admin_activity_logs`.
7. Reject conflicts with existing active `booking_slots`.
8. Reject conflicts with `blocked_slots`.
9. Return the new `booking_id` uuid.

### 2. Required: Storage bucket `payment-proofs`

The DB schema doc does not list storage buckets. The app requires this bucket:

```text
payment-proofs
```

It must allow upload, remove, and signed URL read for the app's client policy.

### 3. Recommended: persistent settings table

Current settings not saved to DB:

- Language
- Notification toggles
- Max slots per booking
- Default slot price lock/value

Simple option:

```sql
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
```

Better per-admin option:

```sql
create table if not exists public.admin_user_settings (
  admin_user_id uuid primary key references public.admin_users(id),
  language text not null default 'en',
  notify_new_booking boolean not null default true,
  notify_accepted boolean not null default true,
  notify_rejected boolean not null default true,
  notify_on_hold boolean not null default true,
  notify_daily_summary boolean not null default true,
  max_slots_per_booking int not null default 10,
  updated_at timestamptz not null default now()
);
```

### 4. Recommended: DB constraints for text statuses

Add check constraints or convert to enums for:

- `bookings.status`
- `booking_slots.slot_status`
- `booking_payments.payment_method`
- `slot_prices.day_type`

### 5. Recommended: conflict prevention indexes/constraints

Add guards for:

- One active booking slot per track/date/start time.
- One blocked slot per track/date/start time.
- No overlapping active price rules for the same track/day/time/effective date range.

## Columns Not Used by Current App UI

These columns are not necessarily wrong. Many are audit/system columns and should usually stay. This list only means the current app does not actively show or use them.

| Table | Columns not used directly in app UI |
|---|---|
| `admin_users` | `nic`, `password_hash`, `created_at`, `updated_at` |
| `customers` | `created_at`, `updated_at` |
| `bookings` | `accepted_by_admin_id`, `accepted_at`, `rejected_by_admin_id`, `rejected_at`, `rejection_reason`, `on_hold_reason`, `updated_at` |
| `booking_slots` | `created_at`, `updated_at` |
| `booking_payments` | `created_at`, `updated_at` |
| `booking_status_history` | Entire table is write-only from the app right now |
| `admin_activity_logs` | `admin_user_id`, `booking_id` are stored but not used for display/navigation |
| `blocked_slots` | `created_by_admin_id`, `created_at`, `updated_at` are not shown |
| `slot_prices` | `created_at`, `updated_at` |
| `tracks` | `description`, `created_at`, `updated_at` |

## App Changes Needed to Use Existing DB Better

1. Add decision fields to `bookingSelect` so booking detail can display approval/rejection/on-hold metadata.
2. Add a status history section in booking detail using `booking_status_history`.
3. Use `slot_prices` for create-booking price calculation, or make `create_booking_atomic` calculate authoritative prices.
4. Persist settings to `app_settings` or `admin_user_settings`.
5. Add activity log on unblock/delete blocked slot.
6. Validate optional customer email before saving.
7. If morning slots should be bookable by admins, update Create Booking to offer the full operating schedule.
8. If new tracks can be added from Supabase, remove or update the hardcoded `configuredTrackIds` filter.

## Verification Run

Command run:

```text
npm run typecheck
```

Result:

```text
tsc --noEmit passed
```
