import type { Booking, BlockedSlot, SlotPrice, Track } from "@/types/database";

export const TRACK_1_ID = "00000000-0000-4000-8000-000000000101";
export const TRACK_2_ID = "00000000-0000-4000-8000-000000000102";

export const tracks: Track[] = [
  { id: TRACK_1_ID, track_name: "Track 1", description: "Main indoor net", is_active: true },
  { id: TRACK_2_ID, track_name: "Track 2", description: "Practice indoor net", is_active: true }
];

export const slotTimes = [
  "6:00 AM",
  "6:30 AM",
  "7:00 AM",
  "7:30 AM",
  "8:00 AM",
  "8:30 AM",
  "9:00 AM",
  "9:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "6:00 PM",
  "6:30 PM",
  "7:00 PM",
  "7:30 PM",
  "8:00 PM",
  "8:30 PM",
  "9:00 PM",
  "9:30 PM",
  "10:00 PM",
  "10:30 PM",
  "11:00 PM"
];

export const bookings: Booking[] = [
  {
    booking_id: "1",
    booking_reference: "BK-250523-001",
    customer_nic: "990123456V",
    booking_date: "2026-05-23",
    number_of_people: 12,
    status: "submitted",
    remarks: "Corporate match. Please arrange extra lights if possible.",
    total_price: 12000,
    currency: "LKR",
    created_at: "2026-05-16T08:00:00.000Z",
    customers: {
      nic: "990123456V",
      full_name: "Rahul Sharma",
      email: "rahul@example.com",
      whatsapp_number: "+94 77 123 4567"
    },
    booking_slots: [
      {
        id: "s1",
        booking_id: "1",
        track_id: TRACK_1_ID,
        slot_date: "2026-05-23",
        start_time: "18:00",
        end_time: "19:00",
        price_at_booking: 6000,
        slot_status: "active",
        tracks: tracks[0]
      },
      {
        id: "s2",
        booking_id: "1",
        track_id: TRACK_1_ID,
        slot_date: "2026-05-23",
        start_time: "19:00",
        end_time: "20:00",
        price_at_booking: 6000,
        slot_status: "active",
        tracks: tracks[0]
      }
    ],
    booking_payments: [{ id: "p1", booking_id: "1", payment_method: "payment_proof", payment_proof_path: null }]
  },
  {
    booking_id: "2",
    booking_reference: "BK-250523-002",
    customer_nic: "981112222V",
    booking_date: "2026-05-24",
    number_of_people: 8,
    status: "on_hold",
    remarks: "Need to confirm availability.",
    total_price: 4000,
    currency: "LKR",
    customers: {
      nic: "981112222V",
      full_name: "Arjun Mehta",
      email: "arjun@example.com",
      whatsapp_number: "+94 76 555 1212"
    },
    booking_slots: [
      {
        id: "s3",
        booking_id: "2",
        track_id: TRACK_2_ID,
        slot_date: "2026-05-24",
        start_time: "07:00",
        end_time: "08:00",
        price_at_booking: 4000,
        slot_status: "active",
        tracks: tracks[1]
      }
    ],
    booking_payments: [{ id: "p2", booking_id: "2", payment_method: "pay_on_arrival", payment_proof_path: null }]
  },
  {
    booking_id: "3",
    booking_reference: "BK-250523-003",
    customer_nic: "965551111V",
    booking_date: "2026-05-25",
    number_of_people: 10,
    status: "accepted",
    remarks: "Needs changing rooms for 10 people.",
    total_price: 6500,
    currency: "LKR",
    customers: {
      nic: "965551111V",
      full_name: "Vikram Singh",
      email: "vikram@example.com",
      whatsapp_number: "+94 75 222 7890"
    },
    booking_slots: [
      {
        id: "s4",
        booking_id: "3",
        track_id: TRACK_1_ID,
        slot_date: "2026-05-25",
        start_time: "20:00",
        end_time: "22:00",
        price_at_booking: 6500,
        slot_status: "active",
        tracks: tracks[0]
      }
    ],
    booking_payments: [{ id: "p3", booking_id: "3", payment_method: "payment_proof", payment_proof_path: null }]
  }
];

export const blockedSlots: BlockedSlot[] = [
  {
    id: "b1",
    track_id: TRACK_1_ID,
    slot_date: "2026-05-23",
    start_time: "19:00",
    end_time: "21:00",
    reason: "Maintenance",
    created_by_admin_id: "local-admin",
    created_at: "2026-05-16T08:00:00.000Z",
    tracks: tracks[0]
  },
  {
    id: "b2",
    track_id: TRACK_2_ID,
    slot_date: "2026-05-22",
    start_time: "09:30",
    end_time: "10:30",
    reason: "Staff Training",
    created_by_admin_id: "local-admin",
    tracks: tracks[1]
  }
];

export const slotPrices: SlotPrice[] = [
  {
    id: "pr1",
    track_id: TRACK_1_ID,
    start_time: "06:00",
    end_time: "08:00",
    day_type: "weekday",
    price: 700,
    currency: "LKR",
    effective_from: "2026-05-23",
    effective_to: "2026-12-31",
    is_active: true,
    tracks: tracks[0]
  },
  {
    id: "pr2",
    track_id: TRACK_1_ID,
    start_time: "08:00",
    end_time: "12:00",
    day_type: "weekday",
    price: 900,
    currency: "LKR",
    effective_from: "2026-05-23",
    effective_to: "2026-12-31",
    is_active: true,
    tracks: tracks[0]
  },
  {
    id: "pr3",
    track_id: TRACK_1_ID,
    start_time: "16:00",
    end_time: "22:00",
    day_type: "weekday",
    price: 1300,
    currency: "LKR",
    effective_from: "2026-05-23",
    effective_to: null,
    is_active: true,
    tracks: tracks[0]
  }
];
