Below is the full connection plan for your **mobile admin app + Supabase database**.

# 1. Overall connection architecture

Use this structure:

```text
Mobile App
   ↓
Supabase Auth
   ↓
Supabase Client
   ↓
Supabase PostgreSQL Tables

Mobile App
   ↓
Supabase Storage
   ↓
payment-proofs bucket
```

Your app should connect to Supabase using the official `@supabase/supabase-js` client. Supabase provides this client for JavaScript, React, and React Native apps. ([Supabase][1])

---

# 2. What each app screen connects to

## 2.1 Signup / Login screen

Use Supabase Auth.

### Signup collects

```text
Name
WhatsApp number
Email
Password
Re-enter password
```

### Flow

```text
Admin enters details
   ↓
App validates password and re-enter password
   ↓
Create Supabase Auth user
   ↓
Insert user details into admin_users table
```

### Tables used

```text
auth.users
admin_users
```

For Supabase Auth, the app should not manually store raw passwords in your own table. Supabase Auth manages password hashing securely. So in your `admin_users` table, you can remove or ignore `password_hash`.

Recommended `admin_users`:

```text
id
full_name
nic
email
whatsapp_number
is_active
created_at
updated_at
```

Here, `admin_users.id` should be the same as the Supabase Auth user ID.

---

## 2.2 Dashboard screen

### Data needed

```text
Today’s bookings
Pending requests
On hold bookings
Today’s revenue
This week’s revenue
Available slots today
Blocked slots today
Next upcoming booking
Recent activity
```

### Tables used

```text
bookings
booking_slots
blocked_slots
admin_activity_logs
```

### Query examples

```js
// Today’s bookings
const { data, error } = await supabase
  .from('bookings')
  .select('*')
  .eq('booking_date', today);
```

```js
// Pending requests
const { data, error } = await supabase
  .from('bookings')
  .select('*')
  .eq('status', 'submitted');
```

```js
// Today’s revenue from accepted bookings
const { data, error } = await supabase
  .from('bookings')
  .select('total_price')
  .eq('booking_date', today)
  .eq('status', 'accepted');
```

---

## 2.3 Booking Requests screen

### Data needed

```text
Booking reference
Customer name
WhatsApp number
Track
Date
Time slots
Number of people
Total price
Payment method
Payment proof path
Status
Remarks
```

### Tables used

```text
bookings
customers
booking_slots
tracks
booking_payments
booking_status_history
admin_activity_logs
```

### Main query

```js
const { data, error } = await supabase
  .from('bookings')
  .select(`
    booking_id,
    booking_reference,
    booking_date,
    number_of_people,
    status,
    remarks,
    total_price,
    currency,
    customers (
      nic,
      full_name,
      email,
      whatsapp_number
    ),
    booking_slots (
      start_time,
      end_time,
      price_at_booking,
      slot_status,
      tracks (
        id,
        track_name
      )
    ),
    booking_payments (
      payment_method,
      payment_proof_path
    )
  `)
  .order('created_at', { ascending: false });
```

### Status filter

```js
const { data, error } = await supabase
  .from('bookings')
  .select('*')
  .eq('status', 'submitted');
```

### Time filter tiles

Your UI has:

```text
Today
Week
Month
All
```

Use these filters:

```js
// Today
.eq('booking_date', today)
```

```js
// Week
.gte('booking_date', weekStart)
.lte('booking_date', weekEnd)
```

```js
// Month
.gte('booking_date', monthStart)
.lte('booking_date', monthEnd)
```

```js
// All
// no date filter
```

---

# 3. Approve / Reject / On Hold connection

When admin clicks **Approve**, **Reject**, or **On Hold**, update three areas:

```text
bookings
booking_status_history
admin_activity_logs
```

## Approve booking

```js
const adminId = session.user.id;

const { error } = await supabase
  .from('bookings')
  .update({
    status: 'accepted',
    accepted_by_admin_id: adminId,
    accepted_at: new Date().toISOString()
  })
  .eq('booking_id', bookingId);
```

Then insert status history:

```js
await supabase.from('booking_status_history').insert({
  booking_id: bookingId,
  old_status: oldStatus,
  new_status: 'accepted',
  changed_by_admin_id: adminId,
  reason: 'Booking accepted by admin'
});
```

Then insert activity log:

```js
await supabase.from('admin_activity_logs').insert({
  admin_user_id: adminId,
  booking_id: bookingId,
  action_type: 'booking_accepted',
  description: 'Booking accepted by admin'
});
```

Same idea for `rejected` and `on_hold`.

For **Reject** and **On Hold**, ask the admin to enter a reason.

---

# 4. Create Booking screen connection

When admin creates a booking manually, write into these tables:

```text
customers
bookings
booking_slots
booking_payments
booking_status_history
admin_activity_logs
```

## Flow

```text
1. Upsert customer by NIC
2. Create booking
3. Create selected booking_slots
4. Create booking_payments
5. Create status history
6. Create admin activity log
```

## Step 1: Upsert customer

```js
await supabase.from('customers').upsert({
  nic,
  full_name: fullName,
  email,
  whatsapp_number: whatsappNumber
});
```

## Step 2: Create booking

```js
const { data: booking, error } = await supabase
  .from('bookings')
  .insert({
    booking_reference: bookingReference,
    customer_nic: nic,
    booking_date: bookingDate,
    number_of_people: numberOfPeople,
    status: createAsAccepted ? 'accepted' : 'submitted',
    remarks,
    total_price: totalPrice,
    currency: 'LKR',
    accepted_by_admin_id: createAsAccepted ? adminId : null,
    accepted_at: createAsAccepted ? new Date().toISOString() : null
  })
  .select()
  .single();
```

## Step 3: Create booking slots

```js
await supabase.from('booking_slots').insert(
  selectedSlots.map((slot) => ({
    booking_id: booking.booking_id,
    track_id: trackId,
    slot_date: bookingDate,
    start_time: slot.startTime,
    end_time: slot.endTime,
    price_at_booking: slot.price,
    slot_status: 'active'
  }))
);
```

## Step 4: Create payment row

```js
await supabase.from('booking_payments').insert({
  booking_id: booking.booking_id,
  payment_method: paymentMethod,
  payment_proof_path: paymentProofPath || null
});
```

---

# 5. Payment proof upload connection

Use Supabase Storage.

Create a bucket:

```text
payment-proofs
```

Supabase Storage supports file uploads through the client SDK. The standard upload method uses `supabase.storage.from(bucket).upload(path, file)`. ([Supabase][2])

## Upload flow

```text
User selects file
   ↓
App uploads file to Supabase Storage
   ↓
Supabase returns file path
   ↓
App saves file path in booking_payments.payment_proof_path
```

## Example

```js
const filePath = `${bookingReference}/payment-proof.jpg`;

const { data, error } = await supabase.storage
  .from('payment-proofs')
  .upload(filePath, file, {
    upsert: true
  });

if (error) throw error;

await supabase
  .from('booking_payments')
  .update({
    payment_proof_path: data.path
  })
  .eq('booking_id', bookingId);
```

---

# 6. Calendar / Schedule screen connection

### Data needed

```text
Selected date
Track 1 schedule
Track 2 schedule
Accepted bookings
Submitted bookings
On hold bookings
Blocked slots
Available slots
```

### Tables used

```text
booking_slots
bookings
tracks
blocked_slots
```

## Query booking slots for a day

```js
const { data: bookingSlots, error } = await supabase
  .from('booking_slots')
  .select(`
    id,
    slot_date,
    start_time,
    end_time,
    slot_status,
    bookings (
      booking_reference,
      status,
      number_of_people,
      customers (
        full_name
      )
    ),
    tracks (
      track_name
    )
  `)
  .eq('slot_date', selectedDate)
  .eq('track_id', selectedTrackId)
  .order('start_time');
```

## Query blocked slots

```js
const { data: blockedSlots, error } = await supabase
  .from('blocked_slots')
  .select('*')
  .eq('slot_date', selectedDate)
  .eq('track_id', selectedTrackId)
  .order('start_time');
```

Then the app combines:

```text
booking_slots + blocked_slots + slot_prices
```

to show:

```text
Accepted
Submitted
On hold
Blocked
Available
```

---

# 7. Block Slots screen connection

When admin blocks a time range, the app should convert the range into 30 minute slots.

Example:

```text
7:00 PM to 9:00 PM
```

becomes:

```text
7:00 PM to 7:30 PM
7:30 PM to 8:00 PM
8:00 PM to 8:30 PM
8:30 PM to 9:00 PM
```

## Insert blocked slots

```js
await supabase.from('blocked_slots').insert(
  slots.map((slot) => ({
    track_id: trackId,
    slot_date: slotDate,
    start_time: slot.startTime,
    end_time: slot.endTime,
    reason,
    created_by_admin_id: adminId
  }))
);
```

Also log the action:

```js
await supabase.from('admin_activity_logs').insert({
  admin_user_id: adminId,
  action_type: 'slot_blocked',
  description: `Blocked slots on ${slotDate}`
});
```

---

# 8. Pricing screen connection

### Tables used

```text
slot_prices
tracks
```

## Show price list

```js
const { data, error } = await supabase
  .from('slot_prices')
  .select(`
    id,
    start_time,
    end_time,
    day_type,
    price,
    currency,
    effective_from,
    effective_to,
    is_active,
    tracks (
      track_name
    )
  `)
  .eq('track_id', selectedTrackId)
  .order('start_time');
```

## Add new price rule

```js
await supabase.from('slot_prices').insert({
  track_id: trackId,
  start_time: startTime,
  end_time: endTime,
  day_type: dayType,
  price,
  currency: 'LKR',
  effective_from: effectiveFrom,
  effective_to: effectiveTo || null,
  is_active: true
});
```

Old bookings do not change because each booking slot stores:

```text
booking_slots.price_at_booking
```

---

# 9. Reports screen connection

### Tables used

```text
bookings
booking_slots
tracks
```

## Revenue report

```js
const { data, error } = await supabase
  .from('bookings')
  .select('booking_date, total_price, status')
  .gte('booking_date', startDate)
  .lte('booking_date', endDate)
  .eq('status', 'accepted');
```

Then the app calculates:

```text
daily revenue
weekly revenue
monthly revenue
```

## Busy time slots

```js
const { data, error } = await supabase
  .from('booking_slots')
  .select('start_time, end_time, slot_date, track_id')
  .gte('slot_date', startDate)
  .lte('slot_date', endDate)
  .eq('slot_status', 'active');
```

Then group by:

```text
start_time + end_time
```

---

# 10. Settings screen connection

## User Details

For admin signup and profile updates:

```text
Name
WhatsApp number
Email
Password
Re-enter password
```

Tables used:

```text
auth.users
admin_users
```

Update profile details:

```js
await supabase
  .from('admin_users')
  .update({
    full_name: fullName,
    whatsapp_number: whatsappNumber,
    email
  })
  .eq('id', adminId);
```

Update password:

```js
await supabase.auth.updateUser({
  password: newPassword
});
```

## Booking Settings

At the moment, your DB does not have a `settings` table.

For settings like:

```text
Default currency
Slot duration
Maximum slots per booking
Booking buffer
Notification ON/OFF
```

you should add a small table later:

```sql
create table public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
```

Example settings:

```text
default_currency = LKR
slot_duration_minutes = 30
max_slots_per_booking = 10
booking_buffer_minutes = 15
new_booking_notification = true
accepted_notification = true
rejected_notification = true
on_hold_notification = true
daily_summary_notification = true
```

---

# 11. Recommended connection files in app

Use this structure:

```text
src/
  lib/
    supabaseClient.js
  services/
    authService.js
    bookingService.js
    paymentService.js
    scheduleService.js
    pricingService.js
    reportService.js
    settingsService.js
```

## `supabaseClient.js`

For React / React Native:

```js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

For Expo React Native, Supabase recommends installing `@supabase/supabase-js` and the required React Native storage/url polyfill packages. ([Supabase][3])

---

# 12. Important security rule

Do not put this in the mobile app:

```text
SUPABASE_SERVICE_ROLE_KEY
```

Only use:

```text
SUPABASE_URL
SUPABASE_ANON_KEY
```

The service role key must only be used in a secure backend, never in a mobile or browser app.

---

# 13. Best simple development flow

For your first working version, do this:

```text
1. Connect app to Supabase
2. Build login/signup
3. Insert admin user into admin_users
4. Build Booking Requests list
5. Add approve/reject/on hold actions
6. Build Create Booking screen
7. Upload payment proof to Storage
8. Build Schedule screen
9. Build Block Slots screen
10. Build Pricing screen
11. Build Reports
12. Add settings table later
```

# 14. One important DB update needed

Because your Settings screen now has WhatsApp number for admin user, add this column:

```sql
alter table public.admin_users
add column if not exists whatsapp_number text;
```

And if you want settings saved in DB, add:

```sql
create table if not exists public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
```

That will complete the connection between your UI screens and Supabase.

[1]: https://supabase.com/docs/reference/javascript/installing?utm_source=chatgpt.com "JavaScript: Installing | Supabase Docs"
[2]: https://supabase.com/docs/guides/storage/uploads/standard-uploads?utm_source=chatgpt.com "Standard Uploads | Supabase Docs"
[3]: https://supabase.com/docs/guides/auth/quickstarts/react-native?utm_source=chatgpt.com "Use Supabase Auth with React Native | Supabase Docs"
