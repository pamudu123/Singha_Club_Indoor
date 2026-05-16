import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(fileName) {
  const filePath = resolve(process.cwd(), fileName);
  if (!existsSync(filePath)) return;

  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...valueParts] = trimmed.split("=");
    if (!process.env[key]) {
      process.env[key] = valueParts.join("=").replace(/^['"]|['"]$/g, "");
    }
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.VITE_SUPABASE_ANON_KEY ??
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase config. Set EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, ANON_KEY, or PUBLISHABLE_KEY.");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const adminId = "00000000-0000-4000-8000-000000000001";
const track1Id = "00000000-0000-4000-8000-000000000101";
const track2Id = "00000000-0000-4000-8000-000000000102";
const now = "2026-05-16T09:30:00.000+05:30";

const tracks = [
  { id: track1Id, track_name: "Track 1", description: "Main indoor net", is_active: true },
  { id: track2Id, track_name: "Track 2", description: "Practice indoor net", is_active: true }
];

const adminUsers = [
  {
    id: adminId,
    full_name: "Local Admin",
    nic: "900000000V",
    email: "admin@singha.club",
    whatsapp_number: "+94 77 123 4567",
    is_active: true
  }
];

const customers = [
  { nic: "990123456V", full_name: "Kavindu Perera", email: "kavindu.perera@gmail.com", whatsapp_number: "+94 77 123 4567" },
  { nic: "981112222V", full_name: "Arjun Mehta", email: "arjun@example.com", whatsapp_number: "+94 76 555 1212" },
  { nic: "965551111V", full_name: "Vikram Singh", email: "vikram@example.com", whatsapp_number: "+94 75 222 7890" },
  { nic: "932221111V", full_name: "Nehan Kapoor", email: "nehan@example.com", whatsapp_number: "+94 71 444 7788" },
  { nic: "955551234V", full_name: "Tharindu Perera", email: "tharindu.perera@example.com", whatsapp_number: "+94 77 234 5678" }
];

const slotPrices = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    track_id: track1Id,
    start_time: "06:00",
    end_time: "08:00",
    day_type: "weekday",
    price: 700,
    currency: "LKR",
    effective_from: "2026-05-01",
    effective_to: "2026-12-31",
    is_active: true
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    track_id: track1Id,
    start_time: "08:00",
    end_time: "12:00",
    day_type: "weekday",
    price: 900,
    currency: "LKR",
    effective_from: "2026-05-01",
    effective_to: "2026-12-31",
    is_active: true
  },
  {
    id: "10000000-0000-4000-8000-000000000003",
    track_id: track1Id,
    start_time: "16:00",
    end_time: "22:00",
    day_type: "weekday",
    price: 1300,
    currency: "LKR",
    effective_from: "2026-05-01",
    effective_to: null,
    is_active: true
  },
  {
    id: "10000000-0000-4000-8000-000000000004",
    track_id: track2Id,
    start_time: "06:00",
    end_time: "12:00",
    day_type: "weekday",
    price: 800,
    currency: "LKR",
    effective_from: "2026-05-01",
    effective_to: null,
    is_active: true
  },
  {
    id: "10000000-0000-4000-8000-000000000005",
    track_id: track2Id,
    start_time: "16:00",
    end_time: "22:00",
    day_type: "weekend",
    price: 1500,
    currency: "LKR",
    effective_from: "2026-05-01",
    effective_to: null,
    is_active: true
  }
];

const bookings = [
  {
    booking_id: "20000000-0000-4000-8000-000000000001",
    booking_reference: "SCB-2026-000101",
    customer_nic: "990123456V",
    booking_date: "2026-05-16",
    number_of_people: 12,
    status: "submitted",
    remarks: "Corporate match. Please arrange extra lights if possible.",
    total_price: 5200,
    currency: "LKR",
    accepted_by_admin_id: null,
    accepted_at: null,
    rejected_by_admin_id: null,
    rejected_at: null,
    rejection_reason: null,
    on_hold_reason: null,
    created_at: "2026-05-16T08:10:00.000+05:30"
  },
  {
    booking_id: "20000000-0000-4000-8000-000000000002",
    booking_reference: "SCB-2026-000102",
    customer_nic: "981112222V",
    booking_date: "2026-05-16",
    number_of_people: 8,
    status: "accepted",
    remarks: "Morning practice session.",
    total_price: 2800,
    currency: "LKR",
    accepted_by_admin_id: adminId,
    accepted_at: "2026-05-16T08:35:00.000+05:30",
    rejected_by_admin_id: null,
    rejected_at: null,
    rejection_reason: null,
    on_hold_reason: null,
    created_at: "2026-05-16T07:45:00.000+05:30"
  },
  {
    booking_id: "20000000-0000-4000-8000-000000000003",
    booking_reference: "SCB-2026-000103",
    customer_nic: "965551111V",
    booking_date: "2026-05-17",
    number_of_people: 10,
    status: "on_hold",
    remarks: "Needs changing rooms for 10 people.",
    total_price: 4500,
    currency: "LKR",
    accepted_by_admin_id: null,
    accepted_at: null,
    rejected_by_admin_id: null,
    rejected_at: null,
    rejection_reason: null,
    on_hold_reason: "Waiting for payment confirmation.",
    created_at: "2026-05-16T09:00:00.000+05:30"
  },
  {
    booking_id: "20000000-0000-4000-8000-000000000004",
    booking_reference: "SCB-2026-000104",
    customer_nic: "932221111V",
    booking_date: "2026-05-18",
    number_of_people: 6,
    status: "rejected",
    remarks: "Requested unavailable private event time.",
    total_price: 3000,
    currency: "LKR",
    accepted_by_admin_id: null,
    accepted_at: null,
    rejected_by_admin_id: adminId,
    rejected_at: "2026-05-16T09:20:00.000+05:30",
    rejection_reason: "Track unavailable for private event.",
    on_hold_reason: null,
    created_at: "2026-05-15T18:00:00.000+05:30"
  }
];

const bookingSlots = [
  {
    id: "30000000-0000-4000-8000-000000000001",
    booking_id: "20000000-0000-4000-8000-000000000001",
    track_id: track1Id,
    slot_date: "2026-05-16",
    start_time: "18:00",
    end_time: "18:30",
    price_at_booking: 1300,
    slot_status: "active"
  },
  {
    id: "30000000-0000-4000-8000-000000000002",
    booking_id: "20000000-0000-4000-8000-000000000001",
    track_id: track1Id,
    slot_date: "2026-05-16",
    start_time: "18:30",
    end_time: "19:00",
    price_at_booking: 1300,
    slot_status: "active"
  },
  {
    id: "30000000-0000-4000-8000-000000000003",
    booking_id: "20000000-0000-4000-8000-000000000001",
    track_id: track1Id,
    slot_date: "2026-05-16",
    start_time: "19:00",
    end_time: "19:30",
    price_at_booking: 1300,
    slot_status: "active"
  },
  {
    id: "30000000-0000-4000-8000-000000000004",
    booking_id: "20000000-0000-4000-8000-000000000001",
    track_id: track1Id,
    slot_date: "2026-05-16",
    start_time: "19:30",
    end_time: "20:00",
    price_at_booking: 1300,
    slot_status: "active"
  },
  {
    id: "30000000-0000-4000-8000-000000000005",
    booking_id: "20000000-0000-4000-8000-000000000002",
    track_id: track2Id,
    slot_date: "2026-05-16",
    start_time: "07:00",
    end_time: "07:30",
    price_at_booking: 800,
    slot_status: "active"
  },
  {
    id: "30000000-0000-4000-8000-000000000006",
    booking_id: "20000000-0000-4000-8000-000000000002",
    track_id: track2Id,
    slot_date: "2026-05-16",
    start_time: "07:30",
    end_time: "08:00",
    price_at_booking: 800,
    slot_status: "active"
  },
  {
    id: "30000000-0000-4000-8000-000000000007",
    booking_id: "20000000-0000-4000-8000-000000000002",
    track_id: track2Id,
    slot_date: "2026-05-16",
    start_time: "08:00",
    end_time: "08:30",
    price_at_booking: 600,
    slot_status: "active"
  },
  {
    id: "30000000-0000-4000-8000-000000000008",
    booking_id: "20000000-0000-4000-8000-000000000002",
    track_id: track2Id,
    slot_date: "2026-05-16",
    start_time: "08:30",
    end_time: "09:00",
    price_at_booking: 600,
    slot_status: "active"
  },
  {
    id: "30000000-0000-4000-8000-000000000009",
    booking_id: "20000000-0000-4000-8000-000000000003",
    track_id: track1Id,
    slot_date: "2026-05-17",
    start_time: "20:00",
    end_time: "20:30",
    price_at_booking: 1500,
    slot_status: "active"
  },
  {
    id: "30000000-0000-4000-8000-000000000010",
    booking_id: "20000000-0000-4000-8000-000000000003",
    track_id: track1Id,
    slot_date: "2026-05-17",
    start_time: "20:30",
    end_time: "21:00",
    price_at_booking: 1500,
    slot_status: "active"
  },
  {
    id: "30000000-0000-4000-8000-000000000011",
    booking_id: "20000000-0000-4000-8000-000000000003",
    track_id: track1Id,
    slot_date: "2026-05-17",
    start_time: "21:00",
    end_time: "21:30",
    price_at_booking: 1500,
    slot_status: "active"
  },
  {
    id: "30000000-0000-4000-8000-000000000012",
    booking_id: "20000000-0000-4000-8000-000000000004",
    track_id: track2Id,
    slot_date: "2026-05-18",
    start_time: "19:00",
    end_time: "19:30",
    price_at_booking: 1500,
    slot_status: "released"
  },
  {
    id: "30000000-0000-4000-8000-000000000013",
    booking_id: "20000000-0000-4000-8000-000000000004",
    track_id: track2Id,
    slot_date: "2026-05-18",
    start_time: "19:30",
    end_time: "20:00",
    price_at_booking: 1500,
    slot_status: "released"
  }
];

const bookingPayments = [
  {
    id: "40000000-0000-4000-8000-000000000001",
    booking_id: "20000000-0000-4000-8000-000000000001",
    payment_method: "payment_proof",
    payment_proof_path: "payment-proofs/SCB-2026-000101/payment-proof.jpg"
  },
  {
    id: "40000000-0000-4000-8000-000000000002",
    booking_id: "20000000-0000-4000-8000-000000000002",
    payment_method: "pay_on_arrival",
    payment_proof_path: null
  },
  {
    id: "40000000-0000-4000-8000-000000000003",
    booking_id: "20000000-0000-4000-8000-000000000003",
    payment_method: "payment_proof",
    payment_proof_path: "payment-proofs/SCB-2026-000103/payment-proof.pdf"
  },
  {
    id: "40000000-0000-4000-8000-000000000004",
    booking_id: "20000000-0000-4000-8000-000000000004",
    payment_method: "pay_on_arrival",
    payment_proof_path: null
  }
];

const bookingStatusHistory = [
  {
    id: "50000000-0000-4000-8000-000000000001",
    booking_id: "20000000-0000-4000-8000-000000000001",
    old_status: "submitted",
    new_status: "submitted",
    changed_by_admin_id: adminId,
    reason: "Booking submitted from mobile app",
    created_at: "2026-05-16T08:10:00.000+05:30"
  },
  {
    id: "50000000-0000-4000-8000-000000000002",
    booking_id: "20000000-0000-4000-8000-000000000002",
    old_status: "submitted",
    new_status: "accepted",
    changed_by_admin_id: adminId,
    reason: "Payment confirmed by admin",
    created_at: "2026-05-16T08:35:00.000+05:30"
  },
  {
    id: "50000000-0000-4000-8000-000000000003",
    booking_id: "20000000-0000-4000-8000-000000000003",
    old_status: "submitted",
    new_status: "on_hold",
    changed_by_admin_id: adminId,
    reason: "Waiting for payment confirmation",
    created_at: "2026-05-16T09:05:00.000+05:30"
  },
  {
    id: "50000000-0000-4000-8000-000000000004",
    booking_id: "20000000-0000-4000-8000-000000000004",
    old_status: "submitted",
    new_status: "rejected",
    changed_by_admin_id: adminId,
    reason: "Track unavailable for private event",
    created_at: "2026-05-16T09:20:00.000+05:30"
  }
];

const blockedSlots = [
  {
    id: "60000000-0000-4000-8000-000000000001",
    track_id: track1Id,
    slot_date: "2026-05-16",
    start_time: "21:00",
    end_time: "21:30",
    reason: "Maintenance",
    created_by_admin_id: adminId,
    created_at: now
  },
  {
    id: "60000000-0000-4000-8000-000000000002",
    track_id: track1Id,
    slot_date: "2026-05-16",
    start_time: "21:30",
    end_time: "22:00",
    reason: "Maintenance",
    created_by_admin_id: adminId,
    created_at: now
  },
  {
    id: "60000000-0000-4000-8000-000000000003",
    track_id: track2Id,
    slot_date: "2026-05-17",
    start_time: "09:30",
    end_time: "10:00",
    reason: "Staff Training",
    created_by_admin_id: adminId,
    created_at: now
  },
  {
    id: "60000000-0000-4000-8000-000000000004",
    track_id: track2Id,
    slot_date: "2026-05-17",
    start_time: "10:00",
    end_time: "10:30",
    reason: "Staff Training",
    created_by_admin_id: adminId,
    created_at: now
  }
];

const activityLogs = [
  {
    id: "70000000-0000-4000-8000-000000000001",
    admin_user_id: adminId,
    booking_id: "20000000-0000-4000-8000-000000000002",
    action_type: "booking_accepted",
    description: "Accepted SCB-2026-000102 after confirming morning session.",
    created_at: "2026-05-16T08:35:00.000+05:30"
  },
  {
    id: "70000000-0000-4000-8000-000000000002",
    admin_user_id: adminId,
    booking_id: "20000000-0000-4000-8000-000000000003",
    action_type: "booking_on_hold",
    description: "Placed SCB-2026-000103 on hold for payment confirmation.",
    created_at: "2026-05-16T09:05:00.000+05:30"
  },
  {
    id: "70000000-0000-4000-8000-000000000003",
    admin_user_id: adminId,
    booking_id: null,
    action_type: "slot_blocked",
    description: "Blocked Track 1 maintenance slots on 2026-05-16.",
    created_at: "2026-05-16T09:30:00.000+05:30"
  }
];

async function upsert(table, rows, onConflict, selectColumn = "id") {
  const { error } = await supabase.from(table).upsert(rows, { onConflict }).select(selectColumn);
  if (error) {
    const rlsHint = error.message.toLowerCase().includes("row-level security")
      ? " Use SUPABASE_SERVICE_ROLE_KEY for this local seed script, or run docs/mobile_app/seed_mock_data.sql in the Supabase SQL editor."
      : "";
    throw new Error(`${table}: ${error.message}.${rlsHint}`);
  }
  console.log(`Seeded ${rows.length} ${table} row(s).`);
}

await upsert("tracks", tracks, "id");
await upsert("admin_users", adminUsers, "id");
await upsert("customers", customers, "nic", "nic");
await upsert("slot_prices", slotPrices, "id");
await upsert("bookings", bookings, "booking_id", "booking_id");
await upsert("booking_slots", bookingSlots, "id");
await upsert("booking_payments", bookingPayments, "id");
await upsert("booking_status_history", bookingStatusHistory, "id");
await upsert("blocked_slots", blockedSlots, "id");
await upsert("admin_activity_logs", activityLogs, "id");

console.log("Mock database seed complete.");
