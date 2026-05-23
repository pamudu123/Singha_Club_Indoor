## Table `admin_activity_logs`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `admin_user_id` | `uuid` |  Nullable |
| `booking_id` | `uuid` |  Nullable |
| `action_type` | `text` |  |
| `description` | `text` |  Nullable |
| `created_at` | `timestamptz` |  |

## Table `admin_users`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `full_name` | `text` |  |
| `nic` | `text` |  Nullable |
| `email` | `text` |  Unique |
| `password_hash` | `text` |  Nullable |
| `is_active` | `bool` |  |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `blocked_slots`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `track_id` | `uuid` |  |
| `slot_date` | `date` |  |
| `start_time` | `time` |  |
| `end_time` | `time` |  |
| `reason` | `text` |  Nullable |
| `created_by_admin_id` | `uuid` |  Nullable |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `booking_payments`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `booking_id` | `uuid` |  |
| `payment_method` | `text` |  |
| `payment_proof_path` | `text` |  Nullable |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `booking_slots`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `booking_id` | `uuid` |  |
| `track_id` | `uuid` |  |
| `slot_date` | `date` |  |
| `start_time` | `time` |  |
| `end_time` | `time` |  |
| `price_at_booking` | `numeric` |  |
| `slot_status` | `text` |  |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `booking_status_history`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `booking_id` | `uuid` |  |
| `old_status` | `text` |  Nullable |
| `new_status` | `text` |  |
| `changed_by_admin_id` | `uuid` |  Nullable |
| `reason` | `text` |  Nullable |
| `created_at` | `timestamptz` |  |

## Table `bookings`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `booking_id` | `uuid` | Primary |
| `booking_reference` | `text` |  Unique |
| `customer_nic` | `text` |  |
| `booking_date` | `date` |  |
| `number_of_people` | `int4` |  |
| `status` | `text` |  |
| `remarks` | `text` |  Nullable |
| `total_price` | `numeric` |  |
| `currency` | `text` |  |
| `accepted_by_admin_id` | `uuid` |  Nullable |
| `accepted_at` | `timestamptz` |  Nullable |
| `rejected_by_admin_id` | `uuid` |  Nullable |
| `rejected_at` | `timestamptz` |  Nullable |
| `rejection_reason` | `text` |  Nullable |
| `on_hold_reason` | `text` |  Nullable |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `customers`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `nic` | `text` | Primary |
| `full_name` | `text` |  |
| `email` | `text` |  Nullable |
| `whatsapp_number` | `text` |  |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `slot_prices`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `track_id` | `uuid` |  |
| `start_time` | `time` |  |
| `end_time` | `time` |  |
| `day_type` | `text` |  |
| `price` | `numeric` |  |
| `currency` | `text` |  |
| `effective_from` | `date` |  |
| `effective_to` | `date` |  Nullable |
| `is_active` | `bool` |  |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `tracks`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `track_name` | `text` |  Unique |
| `description` | `text` |  Nullable |
| `is_active` | `bool` |  |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |