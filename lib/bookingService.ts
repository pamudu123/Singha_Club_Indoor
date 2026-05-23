import type { Booking, BookingStatus, CreateBookingInput, PaginatedResult, PaymentMethod, ServiceResult } from "@/types/database";
import { getDefaultCurrency } from "./pricingService";
import { getWritableSupabase, requireSupabase, toServiceError } from "./supabase";
import { todayISO } from "./date";

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

export function makeBookingReference() {
  return `SCB-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
}

export async function listBookings(filters?: {
  status?: BookingStatus | "all";
  dateFilter?: string;
  selectedDate?: string;
  dateStart?: string;
  dateEnd?: string;
  onlyFutureOrToday?: boolean;
  trackId?: string;
  paymentMethod?: PaymentMethod | "all";
  pageSize?: number;
  cursor?: string | null;
}): Promise<ServiceResult<PaginatedResult<Booking>>> {
  try {
    const client = requireSupabase();
    const pageSize = Math.min(Math.max(filters?.pageSize ?? 20, 1), 50);
    let bookingIds: string[] | null = null;

    if (filters?.trackId && filters.trackId !== "all") {
      const { data, error } = await client
        .from("booking_slots")
        .select("booking_id")
        .eq("track_id", filters.trackId)
        .eq("slot_status", "active");
      if (error) throw error;
      bookingIds = [...new Set((data ?? []).map((item) => item.booking_id as string))];
    }

    if (filters?.paymentMethod && filters.paymentMethod !== "all") {
      const { data, error } = await client
        .from("booking_payments")
        .select("booking_id")
        .eq("payment_method", filters.paymentMethod);
      if (error) throw error;
      const paymentIds = new Set((data ?? []).map((item) => item.booking_id as string));
      bookingIds = bookingIds ? bookingIds.filter((id) => paymentIds.has(id)) : [...paymentIds];
    }

    if (bookingIds && bookingIds.length === 0) {
      return { data: { items: [], nextCursor: null, totalCount: 0 }, error: null };
    }

    let query = client
      .from("bookings")
      .select(bookingSelect, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(0, pageSize - 1);
    
    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }
    if (filters?.dateStart) {
      query = query.gte("booking_date", filters.dateStart);
    }
    if (filters?.dateEnd) {
      query = query.lte("booking_date", filters.dateEnd);
    }
    if (filters?.dateFilter === "date" && filters.selectedDate) {
      query = query.eq("booking_date", filters.selectedDate);
    }
    if (filters?.onlyFutureOrToday) {
      query = query.gte("booking_date", todayISO());
    }
    if (filters?.cursor) {
      query = query.lt("created_at", filters.cursor);
    }
    if (bookingIds) {
      query = query.in("booking_id", bookingIds);
    }
    
    const { data, error, count } = await query;
    if (error) throw error;
    const items = (data as unknown as Booking[]) ?? [];
    return {
      data: {
        items,
        nextCursor: items.length === pageSize ? (items[items.length - 1].created_at ?? null) : null,
        totalCount: count ?? items.length
      },
      error: null
    };
  } catch (error) {
    return { data: null, error: toServiceError(error) };
  }
}

export async function getBooking(bookingId: string): Promise<ServiceResult<Booking>> {
  try {
    const client = requireSupabase();
    const { data, error } = await client
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
  try {
    const client = getWritableSupabase();
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
  try {
    const client = getWritableSupabase();
    const bookingReference = input.bookingReference ?? makeBookingReference();
    const { data: bookingId, error: rpcError } = await client.rpc("create_booking_atomic", {
      p_booking_reference: bookingReference,
      p_customer_nic: input.customer.nic,
      p_customer_full_name: input.customer.full_name,
      p_customer_email: input.customer.email ?? null,
      p_customer_whatsapp_number: input.customer.whatsapp_number,
      p_booking_date: input.bookingDate,
      p_track_id: input.trackId,
      p_slots: input.slots,
      p_number_of_people: input.numberOfPeople,
      p_payment_method: input.paymentMethod,
      p_payment_proof_path: input.paymentProofPath ?? null,
      p_remarks: input.remarks ?? null,
      p_create_as_accepted: input.createAsAccepted,
      p_admin_id: input.adminId,
      p_currency: getDefaultCurrency()
    });
    if (rpcError) throw rpcError;

    const bookingResult = await getBooking(String(bookingId));
    if (bookingResult.error || !bookingResult.data) throw new Error(bookingResult.error ?? "Booking was created but could not be loaded.");
    return { data: bookingResult.data, error: null };
  } catch (error) {
    return { data: null, error: toServiceError(error) };
  }
}
