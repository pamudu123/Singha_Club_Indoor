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