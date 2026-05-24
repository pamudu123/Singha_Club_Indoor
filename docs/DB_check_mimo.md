# DB Schema vs App Code Audit

> Generated: 2026-05-24
> Schema reference: docs/db_check.md
> Tables in DB: 10 | Tables queried by app: 10 | RPC functions: 1

---

## Table-by-Table Column Mapping

### 1. `admin_activity_logs`

| Column | DB Type | App Reads | App Writes | Status |
|--------|---------|-----------|------------|--------|
| id | uuid | via `*` | auto | OK |
| admin_user_id | uuid | via `*` | INSERT (bookingService:189, scheduleService:124) | OK |
| booking_id | uuid | via `*` | INSERT (bookingService:190) | OK |
| action_type | text | SELECT (dashboardService:47) | INSERT (bookingService:191, scheduleService:125) | OK |
| description | text | SELECT (dashboardService:46) | INSERT (bookingService:192, scheduleService:126) | OK |
| created_at | timestamptz | SELECT + ORDER BY (dashboardService:29) | auto | OK |

**Verdict: Fully used.**

---

### 2. `admin_users`

| Column | DB Type | App Reads | App Writes | Status |
|--------|---------|-----------|------------|--------|
| id | uuid | SELECT `*`, filter `.eq("id", ...)` (useAuth:26-27) | INSERT (authService:78) | OK |
| full_name | text | SELECT `*`, filter `.ilike` (authService:35) | INSERT (authService:79), UPDATE (authService:124) | OK |
| nic | text | via `*` | **NEVER WRITTEN** | **UNUSED** |
| email | text | SELECT `*`, filter `.eq` (authService:35) | INSERT (authService:80), UPDATE (authService:125) | OK |
| password_hash | text | via `*` | **NEVER WRITTEN** | **UNUSED / DEAD** |
| is_active | bool | filter `.eq("is_active", true)` (authService:36) | INSERT (authService:82) | OK |
| created_at | timestamptz | via `*` | auto | OK |
| updated_at | timestamptz | via `*` | **NEVER SET** | **STALE** |
| whatsapp_number | text | via `*` | INSERT (authService:81), UPDATE (authService:126) | OK |

**Issues:**
- **`nic`** - Column exists in DB, exposed in TS type, but **never written or read explicitly**. Dead column if not planned for use.
- **`password_hash`** - Column exists in DB but app uses Supabase Auth (`supabase.auth.getSession()`). **Never read or written**. Dead column.
- **`updated_at`** - App calls `.update({full_name, email, whatsapp_number})` but **never sets `updated_at`**. If DB has no auto-trigger, this column stays NULL forever.

---

### 3. `blocked_slots`

| Column | DB Type | App Reads | App Writes | Status |
|--------|---------|-----------|------------|--------|
| id | uuid | SELECT `*`, filter `.eq("id", ...)` (scheduleService:138) | auto | OK |
| track_id | uuid | SELECT, filter `.eq` (scheduleService:62,68,91) | INSERT (scheduleService:113) | OK |
| slot_date | date | SELECT, filter `.eq` (scheduleService:61,67,92) | INSERT (scheduleService:114) | OK |
| start_time | time | SELECT, ORDER BY (scheduleService:63,69) | INSERT (scheduleService:115) | OK |
| end_time | time | SELECT (scheduleService) | INSERT (scheduleService:116) | OK |
| reason | text | SELECT (schedule.tsx:195) | INSERT (scheduleService:117) | OK |
| created_by_admin_id | uuid | via `*` | INSERT (scheduleService:118) | OK |
| created_at | timestamptz | via `*` | auto | OK |
| updated_at | timestamptz | via `*` | **NEVER SET** | **STALE** |

**Issues:**
- **`updated_at`** - Never set on insert or update. No update operations exist on this table (only insert/delete).

---

### 4. `booking_payments`

| Column | DB Type | App Reads | App Writes | Status |
|--------|---------|-----------|------------|--------|
| id | uuid | SELECT (bookingService:37) | via RPC | OK |
| booking_id | uuid | SELECT (bookingService:77), filter `.eq` | via RPC | OK |
| payment_method | text | SELECT (bookingService:38), filter `.eq` (bookingService:78) | via RPC | OK |
| payment_proof_path | text | SELECT (bookingService:39) | via RPC | OK |
| created_at | timestamptz | **NEVER SELECTED** | auto | **UNUSED** |
| updated_at | timestamptz | **NEVER SELECTED** | **NEVER SET** | **UNUSED / STALE** |

**Issues:**
- **`created_at`**, **`updated_at`** - Never selected. App only reads `id, payment_method, payment_proof_path`.
- Inserts happen via `create_booking_atomic` RPC, so app doesn't directly set timestamps.

---

### 5. `booking_slots`

| Column | DB Type | App Reads | App Writes | Status |
|--------|---------|-----------|------------|--------|
| id | uuid | SELECT (scheduleService:39, schedule.tsx:39, reports:285) | via RPC | OK |
| booking_id | uuid | SELECT (scheduleService:40), filter `.eq` (bookingService:68,175) | via RPC | OK |
| track_id | uuid | SELECT, filter `.eq` (scheduleService:62, bookingService:68) | via RPC | OK |
| slot_date | date | SELECT, filter `.eq` (scheduleService:61, schedule.tsx:57) | via RPC | OK |
| start_time | time | SELECT, ORDER BY (scheduleService:63) | via RPC | OK |
| end_time | time | SELECT (scheduleService:45, reports:285) | via RPC | OK |
| price_at_booking | numeric | SELECT (scheduleService:46, reports:285) | via RPC | OK |
| slot_status | text | SELECT, filter `.eq("slot_status", "active")` (schedule.tsx:58) | UPDATE to "released" (bookingService:174) | OK |
| created_at | timestamptz | **NEVER SELECTED** | auto | **UNUSED** |
| updated_at | timestamptz | **NEVER SELECTED** | **NEVER SET** | **UNUSED / STALE** |

**Issues:**
- **`created_at`**, **`updated_at`** - Never selected. App only queries specific columns.
- `slot_status` UPDATE to "released" on rejection (bookingService:174) does **not set `updated_at`**.

---

### 6. `booking_status_history`

| Column | DB Type | App Reads | App Writes | Status |
|--------|---------|-----------|------------|--------|
| id | uuid | **NEVER READ** | auto | **WRITE-ONLY** |
| booking_id | uuid | **NEVER READ** | INSERT (bookingService:180) | **WRITE-ONLY** |
| old_status | text | **NEVER READ** | INSERT (bookingService:181) | **WRITE-ONLY** |
| new_status | text | **NEVER READ** | INSERT (bookingService:182) | **WRITE-ONLY** |
| changed_by_admin_id | uuid | **NEVER READ** | INSERT (bookingService:183) | **WRITE-ONLY** |
| reason | text | **NEVER READ** | INSERT (bookingService:184) | **WRITE-ONLY** |
| created_at | timestamptz | **NEVER READ** | auto | **WRITE-ONLY** |

**Issues:**
- **Entire table is write-only.** The app inserts status change records but never reads them. This table could power a "Booking History / Audit Trail" UI but is currently unused for display.

---

### 7. `bookings`

| Column | DB Type | App Reads | App Writes | Status |
|--------|---------|-----------|------------|--------|
| booking_id | uuid | SELECT, filter `.eq`, `.in` (bookingService:90,113,138) | via RPC | OK |
| booking_reference | text | SELECT (bookingService:8, schedule.tsx:49) | via RPC | OK |
| customer_nic | text | SELECT (bookingService:9) | via RPC | OK |
| booking_date | date | SELECT, filter `.eq`, `.gte`, `.lte` (bookingService:98-108) | via RPC | OK |
| number_of_people | int4 | SELECT (bookingService:11, schedule.tsx:50) | via RPC | OK |
| status | text | SELECT, filter `.eq`, `.in` (bookingService:95, dashboardService:23-26) | UPDATE (bookingService:167) | OK |
| remarks | text | SELECT (bookingService:13) | via RPC | OK |
| total_price | numeric | SELECT (bookingService:14, dashboardService:27, reports:285) | via RPC | OK |
| currency | text | SELECT (bookingService:15) | via RPC | OK |
| accepted_by_admin_id | uuid | via `bookingSelect` (not selected!) | UPDATE (bookingService:158) | **NEVER READ** |
| accepted_at | timestamptz | via `bookingSelect` (not selected!) | UPDATE (bookingService:158) | **NEVER READ** |
| rejected_by_admin_id | uuid | via `bookingSelect` (not selected!) | UPDATE (bookingService:160) | **NEVER READ** |
| rejected_at | timestamptz | via `bookingSelect` (not selected!) | UPDATE (bookingService:160) | **NEVER READ** |
| rejection_reason | text | via `bookingSelect` (not selected!) | UPDATE (bookingService:160) | **NEVER READ** |
| on_hold_reason | text | via `bookingSelect` (not selected!) | UPDATE (bookingService:162) | **NEVER READ** |
| created_at | timestamptz | SELECT, ORDER BY, cursor filter (bookingService:91,110) | auto | OK |
| updated_at | timestamptz | **NEVER SELECTED** | **NEVER SET** | **UNUSED / STALE** |

**Issues:**
- **`accepted_by_admin_id`, `accepted_at`, `rejected_by_admin_id`, `rejected_at`, `rejection_reason`, `on_hold_reason`** - All 6 columns are WRITTEN on status update but **NEVER READ**. The `bookingSelect` query string (bookingService:6-41) does not include them. These could be displayed in booking detail views.
- **`updated_at`** - Never set when status is updated. The update call at bookingService:167 only sets `status` + decision fields.

---

### 8. `customers`

| Column | DB Type | App Reads | App Writes | Status |
|--------|---------|-----------|------------|--------|
| nic | text | SELECT via relation (bookingService:18) | via RPC | OK |
| full_name | text | SELECT via relation (bookingService:19, scheduleService:52) | via RPC | OK |
| email | text | SELECT via relation (bookingService:20) | via RPC | OK |
| whatsapp_number | text | SELECT via relation (bookingService:21) | via RPC | OK |
| created_at | timestamptz | **NEVER SELECTED** | auto | **UNUSED** |
| updated_at | timestamptz | **NEVER SELECTED** | **NEVER SET** | **UNUSED / STALE** |

**Issues:**
- Table is **never directly queried** - only accessed via foreign key relation from `bookings`.
- **`created_at`**, **`updated_at`** - Never selected.

---

### 9. `slot_prices`

| Column | DB Type | App Reads | App Writes | Status |
|--------|---------|-----------|------------|--------|
| id | uuid | SELECT, filter `.eq` (pricingService:34,119) | auto | OK |
| track_id | uuid | SELECT, filter `.eq` (pricingService:35,50) | INSERT (pricingService:74) | OK |
| start_time | time | SELECT (pricingService:36), ORDER BY | INSERT (pricingService:75), UPDATE | OK |
| end_time | time | SELECT (pricingService:37) | INSERT (pricingService:76), UPDATE | OK |
| day_type | text | SELECT (pricingService:38) | INSERT (pricingService:77), UPDATE | OK |
| price | numeric | SELECT (pricingService:39) | INSERT (pricingService:78), UPDATE | OK |
| currency | text | SELECT (pricingService:40) | INSERT (pricingService:79), UPDATE | OK |
| effective_from | date | SELECT (pricingService:41) | INSERT (pricingService:80), UPDATE | OK |
| effective_to | date | SELECT (pricingService:42) | INSERT (pricingService:81), UPDATE | OK |
| is_active | bool | SELECT (pricingService:43) | INSERT (pricingService:82), UPDATE | OK |
| created_at | timestamptz | **NEVER SELECTED** | auto | **UNUSED** |
| updated_at | timestamptz | **NEVER SELECTED** | **NEVER SET** | **UNUSED / STALE** |

**Issues:**
- **`created_at`**, **`updated_at`** - Never selected. The `updateSlotPrice` function (pricingService:106-119) never sets `updated_at`.

---

### 10. `tracks`

| Column | DB Type | App Reads | App Writes | Status |
|--------|---------|-----------|------------|--------|
| id | uuid | SELECT `*`, filter `.in` (scheduleService:19) | N/A (no inserts) | OK |
| track_name | text | SELECT `*` (scheduleService:17, schedule.tsx:163) | N/A | OK |
| description | text | via `*` | N/A | **NEVER USED IN UI** |
| is_active | bool | filter `.eq("is_active", true)` (scheduleService:18) | N/A | OK |
| created_at | timestamptz | via `*` | N/A | **NEVER USED** |
| updated_at | timestamptz | via `*` | N/A | **NEVER USED** |

**Issues:**
- **`description`** - Exists in DB and TS type but never displayed in any UI component.
- `tracks` table has no app-side inserts/updates - data is managed directly in Supabase.

---

## RPC Functions

| Function | Location | Parameters |
|----------|----------|------------|
| `create_booking_atomic` | bookingService.ts:206 | p_booking_reference, p_customer_nic, p_customer_full_name, p_customer_email, p_customer_whatsapp_number, p_booking_date, p_track_id, p_slots, p_number_of_people, p_payment_method, p_payment_proof_path, p_remarks, p_create_as_accepted, p_admin_id, p_currency |

This RPC handles atomic booking creation (booking + customer upsert + slots + payment + status). The app does not directly INSERT into `bookings`, `customers`, `booking_slots`, or `booking_payments`.

---

## Storage Buckets

| Bucket | Usage | Files |
|--------|-------|-------|
| `payment-proofs` | Upload/download payment proof files | paymentProofService.ts |

---

## Summary of Findings

### UNUSED DB COLUMNS (exist in schema, never read or written by app)

| # | Table.Column | Notes |
|---|-------------|-------|
| 1 | `admin_users.nic` | ~~Never written, never read explicitly~~ → ✅ FIXED: Now collected during admin signup |
| 2 | `admin_users.password_hash` | App uses Supabase Auth, not password_hash. **Dead column - skip.** |
| 3 | `booking_payments.created_at` | Never selected |
| 4 | `booking_payments.updated_at` | Never selected/updated |
| 5 | `booking_slots.created_at` | Never selected |
| 6 | `booking_slots.updated_at` | Never selected/updated |
| 7 | `slot_prices.created_at` | Never selected |
| 8 | `slot_prices.updated_at` | Never selected/updated |
| 9 | `tracks.description` | Available via `*` but never rendered in UI |
| 10 | `tracks.created_at` | Never used |
| 11 | `tracks.updated_at` | Never used |
| 12 | `bookings.updated_at` | Never selected/updated |
| 13 | `blocked_slots.updated_at` | Never selected/updated |
| 14 | `customers.created_at` | Never selected |
| 15 | `customers.updated_at` | Never selected |

### ~~WRITE-ONLY COLUMNS~~ → FIXED (2026-05-24)

These columns were write-only. Now **read back** via `bookingSelect` with admin name joins:

| # | Table.Column | Status |
|---|-------------|--------|
| 1 | `bookings.accepted_by_admin_id` | ✅ In bookingSelect + shown in booking detail |
| 2 | `bookings.accepted_at` | ✅ In bookingSelect + shown in booking detail |
| 3 | `bookings.rejected_by_admin_id` | ✅ In bookingSelect + shown in booking detail |
| 4 | `bookings.rejected_at` | ✅ In bookingSelect + shown in booking detail |
| 5 | `bookings.rejection_reason` | ✅ In bookingSelect + shown in BookingCard + booking detail |
| 6 | `bookings.on_hold_reason` | ✅ In bookingSelect + shown in BookingCard + booking detail |

### ~~WRITE-ONLY TABLE~~ → FIXED (2026-05-24)

| # | Table | Status |
|---|-------|--------|
| 1 | `booking_status_history` | ✅ `listBookingHistory()` added in bookingService.ts + Status History UI in booking detail |

### ~~`updated_at` NEVER SET~~ → FIXED (2026-05-24)

All UPDATE calls now include `updated_at: new Date().toISOString()`:
- `admin_users` - authService.ts
- `booking_slots` - bookingService.ts
- `bookings` - bookingService.ts
- `slot_prices` - pricingService.ts

### MISSING APP FIELDS / SCHEMA GAPS

No fields were found that the app tries to use but don't exist in the DB schema. All app column references match the DB.

### ~~TS TYPE DEFINITION GAPS~~ → FIXED (2026-05-24)

| # | Missing From Type | Column | Status |
|---|------------------|--------|--------|
| 1 | `BlockedSlot` | `updated_at` | ✅ Already present |
| 2 | `BookingPayment` | `created_at` | ✅ Already present |
| 3 | `BookingPayment` | `updated_at` | ✅ Already present |
| 4 | `Booking` | `accepted_admin` | ✅ Added with admin name join |
| 5 | `Booking` | `rejected_admin` | ✅ Added with admin name join |
| 6 | `BookingStatusHistory` | `changed_by_admin` | ✅ Added with admin name join |

All types now correctly mirror their DB tables.

### NESTED RELATIONSHIPS USED

The app uses Supabase PostgREST nested selects to join related tables:

| # | Relation | FK | Used In |
|---|----------|-----|---------|
| 1 | `bookings -> customers` | `customer_nic` / `nic` | bookingSelect, scheduleService, schedule.tsx |
| 2 | `bookings -> booking_slots` | `booking_id` | bookingSelect, reports.tsx |
| 3 | `booking_slots -> bookings` | reverse | scheduleService, schedule.tsx |
| 4 | `booking_slots -> tracks` | `track_id` / `id` | bookingSelect, scheduleService, schedule.tsx |
| 5 | `bookings -> booking_payments` | `booking_id` | bookingSelect |
| 6 | `blocked_slots -> tracks` | `track_id` / `id` | scheduleService |
| 7 | `slot_prices -> tracks` | `track_id` / `id` | pricingService |

### DATA FLOW EFFICIENCY CONCERNS

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| 1 | Client-side status filtering | reports.tsx:283-304 | Fetches ALL bookings in date range, filters `status === "accepted"` in JS instead of adding `.eq("status", "accepted")` to the query |
| 2 | Client-side revenue sum | dashboardService:32 | Fetches all `total_price` values and sums in JS. Could use `.select("total_price")` with server-side aggregation if Supabase supports it |
| 3 | ~~Missing `bookingSelect` columns~~ | FIXED | ✅ Decision columns + admin name joins now in bookingSelect |
| 4 | `customers` table never directly queried | - | Only accessed via relation. If you need to search/list customers independently, a direct query would be needed |
| 5 | ~~`booking_status_history` never read~~ | FIXED | ✅ `listBookingHistory()` added + Status History UI in booking detail |
| 6 | `admin_users` nested join may hit RLS | bookingService | If `admin_users` RLS restricts access, `accepted_admin`/`rejected_admin` joins may return null even for authenticated admins. Verify RLS policies allow reading `admin_users.full_name` from the booking query context |
| 7 | `admin_users.nic` is nullable in DB | DB schema | Signup collects NIC but the DB column is nullable, so empty NIC will pass validation at DB level even if app requires it
