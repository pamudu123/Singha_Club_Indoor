Below is a clean structure for the **admin mobile app**. This matches your database and booking workflow.

# Admin mobile app sections

## 1. Dashboard

This is the first screen after login. It should give a quick overview.

### Add these cards

```text
Today’s bookings
Pending booking requests
On hold bookings
Today’s revenue
This week’s revenue
Available slots today
Blocked slots today
Next upcoming booking
```

### Quick actions

```text
Create booking
Block slot
Change price
Open today’s schedule
View pending requests
```

### Useful alerts

```text
New booking request
Booking waiting for decision
Payment proof uploaded
Slots blocked today
Price changes starting today
```

---

## 2. Booking Requests

This section is for bookings submitted by users.

### List view

Show each booking as a card:

```text
Booking reference
Customer name
WhatsApp number
Track
Date
Time range
Number of people
Total price
Payment method
Status
Submitted time
```

### Filters

```text
Submitted
Accepted
Rejected
On hold
Today
Tomorrow
This week
Track 1
Track 2
Payment proof
Pay on arrival
```

### Booking detail page

When admin opens a booking, show:

```text
Customer name
NIC
WhatsApp number
Email
Booking reference
Track
Date
Selected 30 minute slots
Total duration
Total price
Payment method
Payment proof preview
Remarks
Current status
Status history
Admin activity history
```

### Actions

```text
Accept
Reject
On hold
Call customer
Open WhatsApp
View payment proof
Add admin note
```

For **Reject** and **On hold**, ask for a reason.

Example:

```text
Payment proof is unclear.
Customer requested a different time.
Need to confirm availability.
```

---

## 3. Calendar / Schedule

This section is for viewing bookings by date and track.

### Calendar view

```text
Monthly calendar
Daily schedule
Track wise schedule
```

### Day view

When admin selects a day, show:

```text
Track 1 schedule
Track 2 schedule
Accepted bookings
Submitted bookings
On hold bookings
Blocked slots
Available slots
```

### Slot display

Each 30 minute slot can show:

```text
Time
Status
Booking reference
Customer name
Price
```

### Suggested colours

```text
Green = accepted
Yellow = submitted
Orange = on hold
Red = blocked
Grey = available
```

### Actions from schedule

```text
Open booking
Create booking for selected slot
Block selected slot
Change selected slot
Open customer WhatsApp
```

---

## 4. Create Booking

This is for admins to create a booking manually.

Use this when a customer calls or sends a WhatsApp message.

### Form fields

```text
Customer name
NIC
Email
WhatsApp number
Track
Booking date
Selected 30 minute slots
Number of people
Payment method
Payment proof upload
Remarks
Total price
```

### Payment options

```text
Payment proof uploaded
Pay on arrival
```

### Admin options

```text
Create as submitted
Create as accepted
```

For example, if the customer has already paid and the official confirmed it, admin can create it directly as accepted.

### After create

Save to:

```text
customers
bookings
booking_slots
booking_payments
booking_status_history
admin_activity_logs
```

---

## 5. Block Slots

This section is for making slots unavailable.

### Form fields

```text
Track
Date
Start time
End time
Reason
```

Since your database stores blocked slots as 30 minute rows, the app can let admin select a time range and internally create multiple 30 minute blocked slot rows.

### Reasons

```text
Maintenance
Private event
School session
Club event
Unavailable
Other
```

### Blocked slot list

Show:

```text
Date
Track
Time
Reason
Created by
Created time
```

### Actions

```text
Create blocked slot
Remove blocked slot
Edit reason
```

---

## 6. Pricing

This section is for changing time slot prices.

### Price list

Show prices by:

```text
Track
Time slot
Day type
Price
Effective from
Effective to
Active / inactive
```

### Add or edit price

Fields:

```text
Track
Start time
End time
Day type
Price
Currency
Effective from
Effective to
Active status
```

### Day type options

```text
all_days
weekday
weekend
specific_day
```

### Important rule

Do not edit old prices directly if you want to keep history. Add a new price with a new `effective_from`.

Example:

```text
Old price:
01 Jan 2026 to 31 May 2026 = LKR 1000

New price:
01 Jun 2026 onwards = LKR 1200
```

Old bookings still keep their own price in:

```text
booking_slots.price_at_booking
```

---

## 7. Reports

This section is for club performance and management.

### Revenue reports

```text
Today’s revenue
Weekly revenue
Monthly revenue
Revenue by track
Revenue by time slot
Revenue by booking status
```

### Booking reports

```text
Total bookings
Accepted bookings
Rejected bookings
On hold bookings
Submitted bookings
Booking count by date
Booking count by track
```

### Busy slot reports

```text
Most booked time slots
Least booked time slots
Peak hours
Track usage percentage
Weekday vs weekend usage
```

### Useful charts

```text
Daily revenue bar chart
Monthly revenue bar chart
Busy time slot bar chart
Track usage pie chart
Booking status chart
```

### Filters

```text
Date range
Track
Booking status
Payment method
```

---

## 8. Settings

This section is for system configuration.

### Notification settings

```text
New booking notification ON/OFF
Booking accepted message ON/OFF
Booking rejected message ON/OFF
Booking on hold message ON/OFF
Daily summary notification ON/OFF
```

### Club details

```text
Club name
Address
WhatsApp number
Email
Google Maps link
Opening hours text
```

### Booking settings

```text
Default currency
Default slot duration = 30 minutes
Maximum slots per booking
Minimum advance booking time
Booking reference prefix
```

Example:

```text
SCB
```

### Admin settings

```text
Admin profile
Change password
Logout
Active/inactive admin users
```

### Storage/settings

```text
Payment proof upload size limit
Allowed file types: JPG, PNG, PDF
```

---

# Recommended bottom navigation

For a mobile app, keep the main bottom tabs simple:

```text
Dashboard
Requests
Schedule
Reports
Settings
```

Then keep these as buttons inside screens:

```text
Create Booking
Block Slots
Pricing
```

This avoids too many tabs on a small mobile screen.
