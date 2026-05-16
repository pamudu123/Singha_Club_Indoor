# Singha Sports Club Indoor Cricket Booking System

## Final Simplified Database Design

This database design supports the full booking flow for the indoor cricket booking system. It handles customer details, booking requests, selected 30 minute time slots, track pricing, blocked slots, admin approval, payment proof upload, booking status history, and admin activity logs.

---

# 1. Main purpose of the database

The database is designed to support:

```text
User booking form
Track selection
Date selection
30 minute time slot selection
Variable time slot pricing
Payment proof upload or pay on arrival
Admin approval, rejection, or on hold decision
Booking status tracking
Admin action tracking
Blocked/unavailable slots
```

The design is kept simple. It avoids unnecessary tables such as customer accounts, roles, notification logs, and separate PDF document records.

---

# 2. Final table list

The final design has **10 tables**:

```text
1. customers
2. bookings
3. booking_slots
4. tracks
5. slot_prices
6. blocked_slots
7. booking_payments
8. booking_status_history
9. admin_users
10. admin_activity_logs
```

---

# 3. Table details

## 3.1 `customers`

This table stores customer information from the booking form.

### Fields

```text
nic PK
full_name
email
whatsapp_number
created_at
updated_at
```

### Purpose

Each customer is identified by their NIC.

### Notes

You decided to use `nic` as the primary key. This means the same customer can be recognised using the NIC in future bookings.

### Relationship

```text
customers.nic → bookings.customer_nic
```

One customer can have many bookings.

---

## 3.2 `bookings`

This is the main booking table.

### Fields

```text
booking_id PK
booking_reference UNIQUE
customer_nic FK → customers.nic
booking_date
number_of_people
status
remarks
total_price
currency
accepted_by_admin_id FK → admin_users.id
accepted_at
rejected_by_admin_id FK → admin_users.id
rejected_at
rejection_reason
on_hold_reason
created_at
updated_at
```

### Purpose

This table stores the main booking request. It connects the customer, booking date, booking status, total price, and admin decision.

### Booking status values

```text
submitted
accepted
rejected
on_hold
```

### Important fields

#### `booking_reference`

This should be unique.

Example:

```text
SCB-2026-000123
```

#### `remarks`

This can store user notes such as:

```text
Need water bottles
School booking
Ladies cricket session
Special request
```

#### `total_price`

This stores the final calculated price of all selected slots.

#### `accepted_by_admin_id`

Stores which admin accepted the booking.

#### `rejected_by_admin_id`

Stores which admin rejected the booking.

---

## 3.3 `booking_slots`

This table stores the selected time slots for each booking.

### Fields

```text
id PK
booking_id FK → bookings.booking_id
track_id FK → tracks.id
slot_date
start_time
end_time
price_at_booking
slot_status
created_at
updated_at
```

### Purpose

One booking can include multiple 30 minute slots.

Example: If a user books from **1:30 PM to 3:00 PM**, it should create 3 rows:

```text
1:30 PM - 2:00 PM
2:00 PM - 2:30 PM
2:30 PM - 3:00 PM
```

### Why this is important

This makes it easy to:

```text
Show selected slots
Calculate total price
Check availability
Show booking duration
Release slots if rejected
```

### Suggested `slot_status` values

```text
active
released
```

You do not need `cancelled` because you decided not to support cancellation status.

---

## 3.4 `tracks`

This table stores the available cricket tracks.

### Fields

```text
id PK
track_name
description
is_active
created_at
updated_at
```

### Purpose

The system mainly has 2 tracks, but this table keeps the setup configurable.

Example:

```text
Track 1
Track 2
```

If the club adds another track later, you only add a new row.

---

## 3.5 `slot_prices`

This table stores pricing for each track and time range.

### Fields

```text
id PK
track_id FK → tracks.id
start_time
end_time
day_type
price
currency
effective_from
effective_to
is_active
created_at
updated_at
```

### Purpose

This table supports different prices for different slots.

Example:

```text
Track 1
01:30 PM - 02:00 PM
LKR 1000
```

### Why `effective_from` and `effective_to` are needed

Prices can change later. These fields allow price history.

Example:

```text
Old price:
01 Jan 2026 - 31 May 2026
LKR 1000

New price:
01 Jun 2026 - future
LKR 1200
```

Old bookings should keep the old price using `booking_slots.price_at_booking`.

### Suggested `day_type` values

```text
all_days
weekday
weekend
specific_day
```

For the first version, `all_days` may be enough.

---

## 3.6 `blocked_slots`

This table stores unavailable slots.

### Fields

```text
id PK
track_id FK → tracks.id
slot_date
start_time
end_time
reason
created_by_admin_id FK → admin_users.id
created_at
updated_at
```

### Purpose

Use this table when admin wants to block a 30 minute slot.

Example reasons:

```text
Maintenance
Private booking
School session
Club event
Unavailable
```

### Your decision

Blocked slots should be stored as 30 minute slots.

Example:

```text
Track 1
20 May 2026
01:30 PM - 02:00 PM
Maintenance
```

---

## 3.7 `booking_payments`

This table stores payment method and payment proof details.

### Fields

```text
id PK
booking_id FK → bookings.booking_id
payment_method
payment_proof_path
```

### Purpose

This table supports the two payment options in the UI:

```text
Upload payment proof
Pay on arrival
```

### Suggested `payment_method` values

```text
payment_proof
pay_on_arrival
```

### Example 1: Payment proof uploaded

```text
booking_id: SCB-2026-000123
payment_method: payment_proof
payment_proof_path: uploads/payment_proofs/SCB-2026-000123.jpg
```

### Example 2: Pay on arrival

```text
booking_id: SCB-2026-000124
payment_method: pay_on_arrival
payment_proof_path: null
```

### Important note

You decided not to add a separate payment review status. That is okay because the booking status itself will handle the final decision.

Example:

```text
submitted → accepted
submitted → rejected
submitted → on_hold
```

---

## 3.8 `booking_status_history`

This table stores every booking status change.

### Fields

```text
id PK
booking_id FK → bookings.booking_id
old_status
new_status
changed_by_admin_id FK → admin_users.id
reason
created_at
```

### Purpose

This table gives a clear history of booking decisions.

Example:

```text
submitted → on_hold
on_hold → accepted
submitted → rejected
```

### Why this is useful

It helps admins see:

```text
Who changed the booking status
When the status changed
Why the status changed
Previous booking status
New booking status
```

This is more detailed than only storing the latest status in `bookings`.

---

## 3.9 `admin_users`

This table stores admin and official login users.

### Fields

```text
id PK
full_name
nic
email
password_hash
is_active
created_at
updated_at
```

### Purpose

Admins can:

```text
Accept bookings
Reject bookings
Put bookings on hold
Block slots
Change prices
View booking records
Upload or manage payment proof details
```

### Notes

You decided no separate role field is needed.

So all admin users are treated the same for now.

---

## 3.10 `admin_activity_logs`

This table stores admin actions.

### Fields

```text
id PK
admin_user_id FK → admin_users.id
booking_id FK → bookings.booking_id
action_type
description
created_at
```

### Purpose

This is a general audit log.

Example actions:

```text
booking_created_by_admin
booking_accepted
booking_rejected
booking_put_on_hold
slot_blocked
price_changed
payment_proof_checked
```

### Difference from `booking_status_history`

`booking_status_history` only tracks booking status changes.

`admin_activity_logs` tracks wider admin actions.

---

# 4. Main relationships

## 4.1 Customer to booking

```text
customers.nic 1 → many bookings.customer_nic
```

One customer can make many bookings.

---

## 4.2 Booking to booking slots

```text
bookings.booking_id 1 → many booking_slots.booking_id
```

One booking can contain many 30 minute slots.

---

## 4.3 Track to booking slots

```text
tracks.id 1 → many booking_slots.track_id
```

One track can appear in many booking slot records.

---

## 4.4 Track to slot prices

```text
tracks.id 1 → many slot_prices.track_id
```

One track can have many price rules.

---

## 4.5 Track to blocked slots

```text
tracks.id 1 → many blocked_slots.track_id
```

One track can have many blocked slots.

---

## 4.6 Booking to payment

```text
bookings.booking_id 1 → many booking_payments.booking_id
```

For your simple system, this can practically be one payment record per booking.

---

## 4.7 Booking to status history

```text
bookings.booking_id 1 → many booking_status_history.booking_id
```

One booking can have many status changes.

---

## 4.8 Admin to booking decisions

```text
admin_users.id 1 → many bookings.accepted_by_admin_id
admin_users.id 1 → many bookings.rejected_by_admin_id
```

One admin can approve or reject many bookings.

---

## 4.9 Admin to blocked slots

```text
admin_users.id 1 → many blocked_slots.created_by_admin_id
```

One admin can create many blocked slots.

---

## 4.10 Admin to activity logs

```text
admin_users.id 1 → many admin_activity_logs.admin_user_id
```

One admin can have many activity log records.

---

# 5. Main booking flow

```text
Customer enters details
        ↓
Customer selects track and date
        ↓
Customer selects one or more 30 minute slots
        ↓
System calculates total price from slot_prices
        ↓
Customer uploads payment proof or selects pay on arrival
        ↓
Booking is created with status = submitted
        ↓
Admin reviews the booking
        ↓
Admin accepts, rejects, or puts booking on hold
        ↓
Status change is saved in booking_status_history
        ↓
Admin action is saved in admin_activity_logs
```

---

# 6. Price calculation flow

Example selected slots:

```text
Track 1
20 May 2026

01:30 PM - 02:00 PM = LKR 1000
02:00 PM - 02:30 PM = LKR 1000
02:30 PM - 03:00 PM = LKR 1000
```

The system calculates:

```text
Total price = 1000 + 1000 + 1000 = LKR 3000
```

Then stores:

```text
bookings.total_price = 3000
booking_slots.price_at_booking = price of each slot
```

This protects old bookings if prices change later.

---

# 7. Booking statuses

Use only these statuses:

```text
submitted
accepted
rejected
on_hold
```

## Meaning

### `submitted`

The user has submitted the booking request.

### `accepted`

Admin approved the booking.

### `rejected`

Admin rejected the booking.

### `on_hold`

Admin needs more time or more information before deciding.

---

# 8. Slot statuses

Suggested values:

```text
active
released
```

## Meaning

### `active`

The slot is currently reserved by a submitted, accepted, or on hold booking.

### `released`

The slot is no longer held, usually because the booking was rejected.

---

# 9. Payment handling

The UI has two payment options.

## Option 1: Upload payment proof

The user uploads an image or PDF.

Stored in:

```text
booking_payments.payment_proof_path
```

Example:

```text
uploads/payment_proofs/SCB-2026-000123.jpg
```

## Option 2: Pay on arrival

No upload is needed.

Stored as:

```text
payment_method = pay_on_arrival
payment_proof_path = null
```

---

# 10. Blocked slot handling

Admins can block unavailable 30 minute slots.

Example:

```text
Track 1
20 May 2026
06:00 PM - 06:30 PM
Reason: Maintenance
```

This is stored in:

```text
blocked_slots
```

Blocked slots should not appear as available in the UI.

---

# 11. Important constraints

## 11.1 `customers.nic`

```text
PRIMARY KEY
```

## 11.2 `bookings.booking_reference`

```text
UNIQUE
```

Example:

```text
SCB-2026-000123
```

## 11.3 Required foreign keys

```text
bookings.customer_nic → customers.nic
booking_slots.booking_id → bookings.booking_id
booking_slots.track_id → tracks.id
slot_prices.track_id → tracks.id
blocked_slots.track_id → tracks.id
blocked_slots.created_by_admin_id → admin_users.id
booking_payments.booking_id → bookings.booking_id
booking_status_history.booking_id → bookings.booking_id
booking_status_history.changed_by_admin_id → admin_users.id
admin_activity_logs.admin_user_id → admin_users.id
admin_activity_logs.booking_id → bookings.booking_id
```

---

# 12. Suggested indexes

These indexes will make the system faster.

```text
bookings.booking_reference
bookings.customer_nic
bookings.booking_date
bookings.status

booking_slots.booking_id
booking_slots.track_id
booking_slots.slot_date
booking_slots.start_time

slot_prices.track_id
slot_prices.start_time
slot_prices.effective_from
slot_prices.effective_to

blocked_slots.track_id
blocked_slots.slot_date
blocked_slots.start_time

booking_status_history.booking_id
admin_activity_logs.admin_user_id
admin_activity_logs.booking_id
```

---

# 13. Final key rules

```text
One booking can contain multiple 30 minute slots.
One booking_slots row represents one 30 minute slot.
Customers are identified by NIC.
Booking reference must be unique.
Prices can change over time using effective_from and effective_to.
Each booking slot stores price_at_booking.
Pay on arrival and payment proof are both supported.
Booking status values are submitted, accepted, rejected, and on_hold.
Blocked slots are stored as 30 minute slots.
Admin actions are stored in admin_activity_logs.
Booking status changes are stored in booking_status_history.
```

---

# 14. Final recommendation

This is a good simple design for your first version.

The only thing I would still be careful about is using `nic` as the primary key. It is workable, but if the user enters the wrong NIC, updating it later can be harder because bookings depend on it.

Since you want to keep NIC as primary key, the system should validate NIC carefully before saving the booking.
