Good. Based on your answers, the best DB design is a **booking parent table + 30 minute booking slot child table**. This is better because one booking can contain many 30 minute slots, and each slot can have its own stored price.

Your admin side also needs approval, rejection, on hold status, PDF resend, WhatsApp/email delivery status, revenue view, busy slot view, and time slot price changes.  The confirmation PDF should be generated after official approval and sent to WhatsApp and email if available. 

## Final DB design direction

### 1. `customers`

No customer login is needed. This table only stores the booking form details.

```sql
customers
---------
id
full_name
nic
email
whatsapp_country_code
whatsapp_number
created_at
updated_at
```

Use this for the left side UI fields: name, NIC, email, WhatsApp number, number of people, and remarks.

---

### 2. `tracks`

Even though mainly there are 2 tracks, keep it configurable.

```sql
tracks
------
id
track_name
description
is_active
created_at
updated_at
```

Example:

```text
Track 1
Track 2
```

Later, if the club adds Track 3, you only add a new row.

---

### 3. `time_slots`

This stores the standard 30 minute slot structure.

```sql
time_slots
----------
id
start_time
end_time
slot_duration_minutes
is_active
created_at
updated_at
```

Example:

```text
06:00 AM to 06:30 AM
06:30 AM to 07:00 AM
07:00 AM to 07:30 AM
```

Since your UI may have many 30 minute tiles, this table keeps the slot system clean. Your UI file also mentions the problem of many tiles when using 30 minute intervals. 

---

### 4. `slot_prices`

This is very important for your case because prices can vary by time slot and can change later.

```sql
slot_prices
-----------
id
track_id
time_slot_id
day_type
price
currency
effective_from
effective_to
is_active
created_at
updated_at
```

`day_type` can be:

```text
all_days
weekday
weekend
specific_day
```

Why this table is needed:

```text
Track 1, 06:00 PM to 06:30 PM = LKR 1000
Track 1, 06:30 PM to 07:00 PM = LKR 1000
Track 1, 07:00 PM to 07:30 PM = LKR 1200
```

If price changes next month, do not edit the old price row. Add a new price row with a new `effective_from` date. This protects old booking records.

---

### 5. `bookings`

This is the main booking record.

```sql
bookings
--------
id
booking_reference
customer_id
booking_date
number_of_people
status
remarks
total_price
currency
created_by_admin_id
accepted_by_admin_id
accepted_at
rejected_by_admin_id
rejected_at
rejection_reason
on_hold_reason
created_at
updated_at
```

Use only these statuses, based on your decision:

```text
submitted
accepted
rejected
on_hold
```

Recommended booking reference format:

```text
SCB-2026-000123
```

---

### 6. `booking_slots`

This stores the selected 30 minute slots for one booking.

```sql
booking_slots
-------------
id
booking_id
track_id
time_slot_id
slot_date
start_time
end_time
price_at_booking
slot_status
created_at
updated_at
```

Example: If a user books 1:30 PM to 3:00 PM, the system creates 3 rows:

```text
01:30 PM to 02:00 PM
02:00 PM to 02:30 PM
02:30 PM to 03:00 PM
```

`price_at_booking` is important. Even if the admin changes prices later, the old booking still keeps the correct old price.

Suggested `slot_status` values:

```text
active
released
```

When booking is `submitted`, `on_hold`, or `accepted`, slots should stay `active`.
When booking is `rejected`, slots can become `released`.

---

### 7. `booking_status_history`

This keeps the full status history.

```sql
booking_status_history
----------------------
id
booking_id
old_status
new_status
changed_by_admin_id
reason
created_at
```

This helps the admin panel show what happened to each booking.

Example:

```text
submitted to on_hold
on_hold to accepted
submitted to rejected
```

---

### 8. `payments`

You need payment proof upload and pay on arrival. Keep this separate from booking status.

```sql
payments
--------
id
booking_id
payment_method
payment_proof_path
payment_review_status
reviewed_by_admin_id
reviewed_at
created_at
updated_at
```

Suggested `payment_method` values:

```text
payment_proof
pay_on_arrival
```

Suggested `payment_review_status` values:

```text
not_required
submitted
accepted
rejected
```

For `pay_on_arrival`, use:

```text
payment_method = pay_on_arrival
payment_review_status = not_required
```

The booking itself still needs admin approval.

---

### 9. `booking_item_requests`

Additional items have no prices, so keep this simple.

```sql
booking_item_requests
---------------------
id
booking_id
item_name
quantity
created_at
```

Example:

```text
Bats
Balls
Pads
Water bottles
```

No need for item pricing. The PDF can still mention that users should contact officials if extra arrangements are needed.

---

### 10. `booking_documents`

Use this instead of putting only `confirmation_pdf_path` inside the booking table. This is cleaner because the PDF can be regenerated.

```sql
booking_documents
-----------------
id
booking_id
document_type
file_name
file_path
generated_at
generated_by_admin_id
version_number
is_latest
created_at
```

Example `document_type`:

```text
booking_confirmation
```

The PDF file name can follow your requirement:

```text
Singha_Club_Booking_SCB-2026-000123.pdf
```

---

### 11. `notification_logs`

Use this for WhatsApp and email status.

```sql
notification_logs
-----------------
id
booking_id
document_id
channel
recipient
message_type
status
provider_message_id
sent_at
delivered_at
failed_at
failure_reason
resend_count
created_at
updated_at
```

Suggested `channel` values:

```text
whatsapp
email
```

Suggested `message_type` values:

```text
booking_submitted
booking_accepted
booking_rejected
booking_on_hold
confirmation_pdf
```

Suggested `status` values:

```text
pending
sent
delivered
failed
```

This supports:

```text
Resend PDF to WhatsApp
Resend PDF to email
View WhatsApp delivery status
View email delivery status
```

These are already part of your admin requirement. 

---

### 12. `admin_users`

```sql
admin_users
-----------
id
full_name
email
phone
password_hash
is_active
created_at
updated_at
```

---

### 13. `roles`

```sql
roles
-----
id
role_name
description
```

Example:

```text
super_admin
official
staff
```

---

### 14. `admin_user_roles`

```sql
admin_user_roles
----------------
id
admin_user_id
role_id
created_at
```

This is needed because your admin notes mention access management and roles. 

---

### 15. `admin_activity_logs`

This is useful for tracking important admin actions.

```sql
admin_activity_logs
-------------------
id
admin_user_id
booking_id
action_type
description
created_at
```

Example actions:

```text
booking_accepted
booking_rejected
booking_put_on_hold
booking_time_changed
pdf_resent_whatsapp
pdf_resent_email
price_changed
```

---

### 16. `blocked_slots`

Use this when admin wants to block slots manually.

```sql
blocked_slots
-------------
id
track_id
slot_date
start_time
end_time
reason
created_by_admin_id
created_at
```

This can be used for maintenance, private booking, or unavailable periods.

---

### 17. `system_settings`

```sql
system_settings
---------------
id
setting_key
setting_value
updated_by_admin_id
updated_at
```

Example:

```text
whatsapp_notification_enabled
email_notification_enabled
default_currency
booking_reference_prefix
```

Your admin requirement includes notification on/off and time slot price change settings. 

---

## Tables not needed now

You do **not** need these tables now:

```text
customer_accounts
customer_login_sessions
booking_categories
school_booking_types
ladies_cricket_categories
translation_texts
additional_item_prices
```

School support and ladies cricket can stay in the UI only. Remarks can handle special notes.

## Important rule for double booking

For the same `track_id`, `slot_date`, and `time_slot_id`, only one active booking slot should be allowed.

So this should not be allowed:

```text
Track 1
20 May 2026
01:30 PM to 02:00 PM
Two active bookings
```

The system should block that.

## Final recommended flow

1. User selects date, track, and one or more 30 minute slots.
2. System calculates total price from `slot_prices`.
3. User submits booking.
4. Booking status becomes `submitted`.
5. Admin checks booking and payment option.
6. Admin sets status to `accepted`, `rejected`, or `on_hold`.
7. If accepted, system generates PDF.
8. System sends PDF to WhatsApp and email if available.
9. Admin can resend PDF and check delivery status later.

The only remaining design decision is whether a `submitted` booking should immediately block the selected slots, or whether slots should be blocked only after admin acceptance. My recommendation is to block them at `submitted` to avoid two users requesting the same slot.
