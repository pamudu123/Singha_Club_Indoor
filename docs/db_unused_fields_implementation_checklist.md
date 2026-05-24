# DB Unused Fields Implementation Checklist

Date: 2026-05-24

This checklist converts `docs/db_unused_fields_app_connection_plan.md` into practical work items.

## Phase 1 - DB Cleanup

- [ ] Drop `admin_users.password_hash`.
- [ ] Confirm whether `admin_users.nic` is needed.
- [ ] Add or verify `updated_at` triggers for tables that have `updated_at`.
- [ ] Confirm foreign keys from decision/audit columns to `admin_users`.
- [ ] Confirm Supabase relationships allow joins from activity/history/blocked slots to `admin_users`.

SQL start:

```sql
alter table public.admin_users
drop column if exists password_hash;
```

## Phase 2 - Types

Update `types/database.ts`.

- [ ] Add `created_at` and `updated_at` to `BookingPayment`.
- [ ] Add `updated_at` to `BlockedSlot`.
- [ ] Add `created_at` and `updated_at` to `SlotPrice`.
- [ ] Add `created_at` and `updated_at` to `Track` if needed.
- [ ] Add nested admin user references for status history/activity/blocked slots.
- [ ] Keep `AdminUser.nic` optional unless the app starts collecting it.

## Phase 3 - Booking Detail

Files:

- `lib/bookingService.ts`
- `app/booking/[id].tsx`
- `types/database.ts`

Tasks:

- [ ] Select booking decision fields in `bookingSelect`.
- [ ] Select payment timestamps.
- [ ] Add `listBookingStatusHistory(bookingId)`.
- [ ] Show approval/rejection/on-hold reason metadata on Booking Detail.
- [ ] Show status history timeline.
- [ ] Format timestamps using a shared date/time helper.

Expected user value:

- Admin can see why a booking was rejected/on hold.
- Admin can see who changed the booking and when.

## Phase 4 - Dashboard Activity

Files:

- `lib/dashboardService.ts`
- `app/(tabs)/index.tsx`
- `types/database.ts`

Tasks:

- [ ] Join `admin_activity_logs` to `admin_users`.
- [ ] Return `bookingId` from dashboard service.
- [ ] Replace hardcoded `"Recent"` with formatted `created_at`.
- [ ] Let activity rows navigate to booking detail when `booking_id` exists.

Expected user value:

- Recent activity becomes actionable, not only decorative text.

## Phase 5 - Block Slots

Files:

- `lib/scheduleService.ts`
- `app/(tabs)/block-slots.tsx`
- `types/database.ts`

Tasks:

- [ ] Join `blocked_slots.created_by_admin_id` to admin name.
- [ ] Show created-by and created-at in existing blocked slots list.
- [ ] Insert `admin_activity_logs` row when removing a blocked slot.

Expected user value:

- Admin can see who blocked a slot and when.
- Unblock/delete actions are audited.

## Phase 6 - Pricing

Files:

- `lib/pricingService.ts`
- `app/(tabs)/pricing.tsx`
- `types/database.ts`

Tasks:

- [ ] Select `created_at` and `updated_at`.
- [ ] Show "Last changed" on price rule cards if `updated_at` exists.
- [ ] Decide whether default price should move to DB.

Contradiction:

- The pricing screen edits `slot_prices`, but create booking currently uses local `initialDefaultSlotPrice`. If accurate pricing matters, price calculation should come from DB or the `create_booking_atomic` RPC.

## Phase 7 - Tracks

Files:

- `hooks/useTracks.ts`
- `app/(tabs)/create-booking.tsx`
- `app/(tabs)/pricing.tsx`
- `app/(tabs)/schedule.tsx`

Tasks:

- [ ] Display `tracks.description` below selected track or in track context text.
- [ ] Decide whether to keep hardcoded `configuredTrackIds`.

Contradiction:

- If tracks are managed only in Supabase, the hardcoded ID allow-list prevents new tracks from showing in the app.

## Phase 8 - Settings Persistence

Current local-only settings:

- Language
- Notification toggles
- Max slots per booking
- Default price value/lock state

Tasks:

- [ ] Add `admin_user_settings` or `app_settings`.
- [ ] Load settings on Settings screen open.
- [ ] Save settings when toggles/stepper/language changes.
- [ ] Keep AsyncStorage fallback for offline/local mode if needed.

Recommended table:

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

## Suggested Build Order

1. Drop/ignore `password_hash`.
2. Add timestamp trigger verification in Supabase.
3. Update `types/database.ts`.
4. Connect booking decision fields and status history.
5. Connect dashboard activity navigation.
6. Connect blocked-slot creator/timestamps and unblock activity.
7. Connect pricing timestamps.
8. Connect track descriptions.
9. Add settings persistence table and service.

## Acceptance Checks

- [ ] Booking detail shows decision metadata for accepted/rejected/on-hold bookings.
- [ ] Booking detail shows status history timeline.
- [ ] Dashboard recent activity shows real time and opens booking detail when possible.
- [ ] Blocked slots show created-by and created-at.
- [ ] Removing a blocked slot creates an activity log.
- [ ] Pricing rules show last changed when available.
- [ ] Track descriptions appear in at least one app flow.
- [ ] `password_hash` is not used anywhere in app code.
- [ ] `npm run typecheck` passes.
