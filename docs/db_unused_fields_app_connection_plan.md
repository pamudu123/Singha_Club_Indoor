# DB Unused Fields to App Connection Plan

Date: 2026-05-24  
Source notes: `docs/db_fix_v1.md`, `docs/DB_check_gpt.md`, current app code

## Decision Summary

`admin_users.password_hash` is not needed. The current app does not have password signup/login fields, and the previous direction was to save admin email directly with validation. Do not connect `password_hash` to the app.

Recommended DB action:

```sql
alter table public.admin_users
drop column if exists password_hash;
```

Important distinction:

- Some fields are genuinely unused and can be removed or ignored.
- Some fields are audit/system fields. They should stay in DB, but they do not need to appear everywhere in the UI.
- Some fields are already written by the app but not selected/displayed. These are the best first targets.

## Priority Order

1. Connect booking decision fields to Booking Detail.
2. Add booking status history timeline.
3. Add admin activity log detail/navigation.
4. Show blocked-slot creator and timestamps.
5. Show track descriptions in selectors/details.
6. Add timestamp support through DB triggers and selected detail views.
7. Decide whether admin `nic` is actually needed.
8. Drop `admin_users.password_hash`.

## Field-by-Field Plan

| Table | Field | Decision | App connection plan | Contradiction / note |
|---|---|---|---|---|
| `admin_users` | `password_hash` | Remove / do not connect | Drop from DB or leave ignored. Do not add password fields to app. | Adding this would contradict the current simple email-only admin flow. |
| `admin_users` | `nic` | Optional | If admin identity verification is required, add NIC input to signup/settings and save it through `authService.signup()` and `updateAdminProfile()`. | If admins do not need NIC, leave it unused or drop it. Do not add unnecessary admin profile friction. |
| `admin_users` | `created_at` | Keep | Show as "Joined" in Settings admin profile if useful. | Mostly system metadata. Not critical UI. |
| `admin_users` | `updated_at` | Keep | Show "Profile last updated" in Settings only if useful. Ensure DB trigger updates it. | Do not manually show this everywhere. |
| `customers` | `created_at` | Keep | In Booking Detail, show "Customer since" in customer section. | Useful but low priority. |
| `customers` | `updated_at` | Keep | Only useful for admin/audit views. Ensure trigger updates it. | Low priority. |
| `bookings` | `accepted_by_admin_id` | Connect | Select it in `bookingSelect`; join/display accepted admin name in Booking Detail. | Needs relation to `admin_users`; otherwise show id only, which is not useful. |
| `bookings` | `accepted_at` | Connect | Select it in `bookingSelect`; show accepted time/date on Booking Detail. | Useful for admin decisions. |
| `bookings` | `rejected_by_admin_id` | Connect | Select it in `bookingSelect`; join/display rejected admin name in Booking Detail. | Same admin join concern. |
| `bookings` | `rejected_at` | Connect | Select it in `bookingSelect`; show rejected time/date on Booking Detail. | Useful for audit. |
| `bookings` | `rejection_reason` | Connect | Select it in `bookingSelect`; show reason in Booking Detail when status is rejected. | Already written by app, so not displaying it loses context. |
| `bookings` | `on_hold_reason` | Connect | Select it in `bookingSelect`; show reason in Booking Detail when status is on hold. | Already written by app, so not displaying it loses context. |
| `bookings` | `updated_at` | Keep | Use for "Last updated" in Booking Detail and request cards if needed. Add trigger. | Better as metadata than a main UI field. |
| `booking_slots` | `created_at` | Keep | Show only in a booking debug/admin detail section if needed. | Not useful in normal booking cards. |
| `booking_slots` | `updated_at` | Keep | Use internally/audit after slot release. Add trigger. | Rejection releases slots, so `updated_at` can matter for audit. |
| `booking_payments` | `created_at` | Connect lightly | Show "Payment submitted/uploaded at" in Booking Detail payment section. | Useful for payment proof timing. |
| `booking_payments` | `updated_at` | Keep | Only needed if payment proof can be changed later. Add trigger. | If payment edits are not supported, low value in UI. |
| `booking_status_history` | entire table | Connect | Add timeline in Booking Detail: old status, new status, admin, reason, created time. | This is audit data and should stay. It is currently write-only. |
| `admin_activity_logs` | `admin_user_id` | Connect | Join admin name for dashboard recent activity and activity details. | Do not show raw UUID. |
| `admin_activity_logs` | `booking_id` | Connect | If present, recent activity row should navigate to `/booking/[id]`. | Currently dashboard activity is display-only. |
| `blocked_slots` | `created_by_admin_id` | Connect | Join admin name in Block Slots existing list. | If no admin relation is configured, fallback to "Admin". |
| `blocked_slots` | `created_at` | Connect lightly | Show blocked-created time in existing blocked slot row/detail. | Useful for audit. |
| `blocked_slots` | `updated_at` | Keep | Only useful if blocked slots can be edited. Add trigger. | Current app deletes/recreates, so low value. |
| `slot_prices` | `created_at` | Keep | Show in price rule detail only if needed. | Not important in normal pricing list. |
| `slot_prices` | `updated_at` | Connect lightly | Show "Last changed" on pricing rule card. Add trigger. | Useful because admins edit prices. |
| `tracks` | `description` | Connect | Show description in track selector options, schedule headers, pricing track context, or track management view. | Good user-facing field; currently hidden. |
| `tracks` | `created_at` | Keep | No normal UI needed. | System metadata. |
| `tracks` | `updated_at` | Keep | No normal UI needed unless track management is added. Add trigger. | System metadata. |

## Recommended UI Changes

### Booking Detail

Add a decision/audit section below the existing action card.

Show:

- Accepted by and accepted at when status is `accepted`.
- Rejected by, rejected at, and rejection reason when status is `rejected`.
- On-hold reason when status is `on_hold`.
- Last updated timestamp.
- Payment uploaded/submitted timestamp.
- Status history timeline.

Files to change:

- `lib/bookingService.ts`
- `types/database.ts`
- `app/booking/[id].tsx`
- `components/BookingCard.tsx` only if summary card should show a small reason/timestamp

### Dashboard Activity

Make recent activity more useful.

Show:

- Activity description.
- Admin name from `admin_users`.
- Created time instead of "Recent".
- Tap activity row to open booking detail when `booking_id` is not null.

Files to change:

- `lib/dashboardService.ts`
- `app/(tabs)/index.tsx`
- `types/database.ts`

### Block Slots

In the existing blocked slots list, show:

- Reason.
- Created by admin name.
- Created at time.

Also insert an activity log when a blocked slot is removed.

Files to change:

- `lib/scheduleService.ts`
- `app/(tabs)/block-slots.tsx`
- `types/database.ts`

### Pricing

Show `updated_at` as "Last changed" on each price rule card if DB trigger is available.

Also make the default price DB-backed later through `app_settings` or a dedicated pricing setting. Right now the default price is in app memory only.

Files to change:

- `lib/pricingService.ts`
- `app/(tabs)/pricing.tsx`
- `types/database.ts`

### Tracks

Use `tracks.description` in at least one visible place:

- Under track name in Create Booking selector context.
- Under track name in Pricing.
- In schedule track header tooltip/detail if a compact UI is needed.

Files to change:

- `hooks/useTracks.ts`
- `components/ui/SelectField.tsx` if option subtitles are needed
- `app/(tabs)/create-booking.tsx`
- `app/(tabs)/pricing.tsx`
- `app/(tabs)/schedule.tsx`

## Service-Layer Changes

### `lib/bookingService.ts`

Update `bookingSelect` to include:

```sql
accepted_by_admin_id,
accepted_at,
rejected_by_admin_id,
rejected_at,
rejection_reason,
on_hold_reason,
updated_at
```

Also include payment timestamps:

```sql
booking_payments (
  id,
  payment_method,
  payment_proof_path,
  created_at,
  updated_at
)
```

Add a function:

```ts
listBookingStatusHistory(bookingId: string)
```

It should read `booking_status_history` and join `admin_users` for the changed-by admin name.

### `lib/dashboardService.ts`

Change recent activity query from:

```ts
client.from("admin_activity_logs").select("*")
```

to a joined select:

```sql
id,
admin_user_id,
booking_id,
action_type,
description,
created_at,
admin_users (
  id,
  full_name
)
```

Then return `bookingId` and a real timestamp label.

### `lib/scheduleService.ts`

For blocked slots, select admin user:

```sql
*,
tracks ( id, track_name ),
admin_users (
  id,
  full_name
)
```

For deleting blocked slots, add an activity row after successful delete:

```ts
action_type: "slot_unblocked"
```

### `lib/pricingService.ts`

Select `created_at` and `updated_at` from `slot_prices` and expose them in `SlotPrice`.

## DB Changes

### Remove unused password column

```sql
alter table public.admin_users
drop column if exists password_hash;
```

### Add updated_at trigger if not already present

Many tables have `updated_at`, but the app does not set it manually. Prefer DB triggers so every update path is consistent.

Tables needing trigger coverage:

- `admin_users`
- `customers`
- `bookings`
- `booking_slots`
- `booking_payments`
- `blocked_slots`
- `slot_prices`
- `tracks`

### Optional settings table

If settings should persist:

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

## Contradictions to Watch

1. `password_hash` should not be connected if the chosen auth flow is email-only/simple admin. Connecting it would add a password system the app does not currently use.
2. `created_at` and `updated_at` should not be forced into every UI just because they exist. Use them in detail/audit views only.
3. `booking_status_history` and `admin_activity_logs` overlap but are not duplicates. Status history is for booking status changes; activity logs are for wider admin actions.
4. `admin_users.id` has a flow contradiction: signup creates a random UUID, while session recovery expects Supabase Auth user IDs. If the simple admin flow stays, remove/rework auth session recovery. If Supabase Auth returns, make `admin_users.id = auth.users.id`.
5. `tracks.description` is useful, but the app currently hard-filters tracks by `constants/tracks.ts`. DB-only new tracks will still not appear until that allow-list is changed.
6. `updated_at` fields are only meaningful if Supabase has triggers. Without triggers, showing them in the app can display stale values.
