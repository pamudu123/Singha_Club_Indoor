import { bookings as mockBookings } from "@/constants/mockData";
import type { Booking, BookingStatus, CreateBookingInput, ServiceResult } from "@/types/database";
import { hasSupabaseConfig, requireSupabase, toServiceError } from "./supabase";

let localBookings = [...mockBookings];

const bookingSelect = `
  booking_id,
  booking_reference,
  customer_nic,
  booking_date,
  number_of_people,
  status,
  remarks,
  total_price,
  currency,
  created_at,
  customers (
    nic,
    full_name,
    email,
    whatsapp_number
  ),
  booking_slots (
    id,
    track_id,
    slot_date,
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
    id,
    payment_method,
    payment_proof_path
  )
`;

export async function listBookings(status?: BookingStatus): Promise<ServiceResult<Booking[]>> {
  if (!hasSupabaseConfig) {
    return { data: status ? localBookings.filter((booking) => booking.status === status) : localBookings, error: null };
  }

  try {
    let query = requireSupabase().from("bookings").select(bookingSelect).order("created_at", { ascending: false });
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    if (error) throw error;
    return { data: (data as unknown as Booking[]) ?? [], error: null };
  } catch (error) {
    return { data: null, error: toServiceError(error) };
  }
}

export async function getBooking(bookingId: string): Promise<ServiceResult<Booking>> {
  if (!hasSupabaseConfig) {
    return { data: localBookings.find((booking) => booking.booking_id === bookingId) ?? localBookings[0], error: null };
  }

  try {
    const { data, error } = await requireSupabase()
      .from("bookings")
      .select(bookingSelect)
      .eq("booking_id", bookingId)
      .single();
    if (error) throw error;
    return { data: data as unknown as Booking, error: null };
  } catch (error) {
    return { data: null, error: toServiceError(error) };
  }
}

export async function updateBookingStatus(input: {
  bookingId: string;
  oldStatus: BookingStatus;
  newStatus: BookingStatus;
  adminId: string;
  reason?: string;
}) {
  if (!hasSupabaseConfig) {
    localBookings = localBookings.map((booking) =>
      booking.booking_id === input.bookingId
        ? {
            ...booking,
            status: input.newStatus,
            accepted_by_admin_id: input.newStatus === "accepted" ? input.adminId : booking.accepted_by_admin_id,
            accepted_at: input.newStatus === "accepted" ? new Date().toISOString() : booking.accepted_at,
            rejected_by_admin_id: input.newStatus === "rejected" ? input.adminId : booking.rejected_by_admin_id,
            rejected_at: input.newStatus === "rejected" ? new Date().toISOString() : booking.rejected_at,
            rejection_reason: input.newStatus === "rejected" ? input.reason : booking.rejection_reason,
            on_hold_reason: input.newStatus === "on_hold" ? input.reason : booking.on_hold_reason,
            booking_slots:
              input.newStatus === "rejected"
                ? booking.booking_slots?.map((slot) => ({ ...slot, slot_status: "released" }))
                : booking.booking_slots
          }
        : booking
    );
    return { error: null };
  }

  try {
    const client = requireSupabase();
    const decisionFields =
      input.newStatus === "accepted"
        ? { accepted_by_admin_id: input.adminId, accepted_at: new Date().toISOString() }
        : input.newStatus === "rejected"
          ? { rejected_by_admin_id: input.adminId, rejected_at: new Date().toISOString(), rejection_reason: input.reason }
          : input.newStatus === "on_hold"
            ? { on_hold_reason: input.reason }
            : {};

    const { error } = await client
      .from("bookings")
      .update({ status: input.newStatus, ...decisionFields })
      .eq("booking_id", input.bookingId);
    if (error) throw error;

    if (input.newStatus === "rejected") {
      const { error: slotsError } = await client
        .from("booking_slots")
        .update({ slot_status: "released" })
        .eq("booking_id", input.bookingId);
      if (slotsError) throw slotsError;
    }

    const { error: historyError } = await client.from("booking_status_history").insert({
      booking_id: input.bookingId,
      old_status: input.oldStatus,
      new_status: input.newStatus,
      changed_by_admin_id: input.adminId,
      reason: input.reason ?? `Booking ${input.newStatus}`
    });
    if (historyError) throw historyError;

    const { error: activityError } = await client.from("admin_activity_logs").insert({
      admin_user_id: input.adminId,
      booking_id: input.bookingId,
      action_type: `booking_${input.newStatus}`,
      description: `Booking marked as ${input.newStatus}`
    });
    if (activityError) throw activityError;

    return { error: null };
  } catch (error) {
    return { error: toServiceError(error) };
  }
}

export async function createBooking(input: CreateBookingInput): Promise<ServiceResult<Booking>> {
  if (!hasSupabaseConfig) {
    const now = new Date().toISOString();
    const totalPrice = input.slots.reduce((sum, slot) => sum + slot.price, 0);
    const bookingId = `local-${Date.now()}`;
    const bookingReference = `SCB-${new Date().getFullYear()}-${String(localBookings.length + 1).padStart(6, "0")}`;
    const booking: Booking = {
      booking_id: bookingId,
      booking_reference: bookingReference,
      customer_nic: input.customer.nic,
      booking_date: input.bookingDate,
      number_of_people: input.numberOfPeople,
      status: input.createAsAccepted ? "accepted" : "submitted",
      remarks: input.remarks,
      total_price: totalPrice,
      currency: "LKR",
      accepted_by_admin_id: input.createAsAccepted ? input.adminId : null,
      accepted_at: input.createAsAccepted ? now : null,
      created_at: now,
      customers: input.customer,
      booking_slots: input.slots.map((slot, index) => ({
        id: `${bookingId}-slot-${index}`,
        booking_id: bookingId,
        track_id: input.trackId,
        slot_date: input.bookingDate,
        start_time: slot.startTime,
        end_time: slot.endTime,
        price_at_booking: slot.price,
        slot_status: "active"
      })),
      booking_payments: [
        {
          id: `${bookingId}-payment`,
          booking_id: bookingId,
          payment_method: input.paymentMethod,
          payment_proof_path: input.paymentProofPath ?? null
        }
      ]
    };
    localBookings = [booking, ...localBookings];
    return { data: booking, error: null };
  }

  try {
    const client = requireSupabase();
    const totalPrice = input.slots.reduce((sum, slot) => sum + slot.price, 0);
    const bookingReference = `SCB-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

    const { error: customerError } = await client.from("customers").upsert(input.customer);
    if (customerError) throw customerError;

    const { data: booking, error: bookingError } = await client
      .from("bookings")
      .insert({
        booking_reference: bookingReference,
        customer_nic: input.customer.nic,
        booking_date: input.bookingDate,
        number_of_people: input.numberOfPeople,
        status: input.createAsAccepted ? "accepted" : "submitted",
        remarks: input.remarks,
        total_price: totalPrice,
        currency: "LKR",
        accepted_by_admin_id: input.createAsAccepted ? input.adminId : null,
        accepted_at: input.createAsAccepted ? new Date().toISOString() : null
      })
      .select("*")
      .single();
    if (bookingError) throw bookingError;

    const { error: slotsError } = await client.from("booking_slots").insert(
      input.slots.map((slot) => ({
        booking_id: booking.booking_id,
        track_id: input.trackId,
        slot_date: input.bookingDate,
        start_time: slot.startTime,
        end_time: slot.endTime,
        price_at_booking: slot.price,
        slot_status: "active"
      }))
    );
    if (slotsError) throw slotsError;

    const { error: paymentError } = await client.from("booking_payments").insert({
      booking_id: booking.booking_id,
      payment_method: input.paymentMethod,
      payment_proof_path: input.paymentProofPath ?? null
    });
    if (paymentError) throw paymentError;

    const { error: historyError } = await client.from("booking_status_history").insert({
      booking_id: booking.booking_id,
      old_status: "submitted",
      new_status: input.createAsAccepted ? "accepted" : "submitted",
      changed_by_admin_id: input.adminId,
      reason: "Booking created by admin"
    });
    if (historyError) throw historyError;

    await client.from("admin_activity_logs").insert({
      admin_user_id: input.adminId,
      booking_id: booking.booking_id,
      action_type: "booking_created_by_admin",
      description: "Booking created by admin"
    });

    return { data: booking as Booking, error: null };
  } catch (error) {
    return { data: null, error: toServiceError(error) };
  }
}
