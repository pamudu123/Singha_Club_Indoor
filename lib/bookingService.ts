import type { Booking, BookingStatus, BookingStatusHistory, CreateBookingInput, PaginatedResult, PaymentMethod, ServiceResult } from "@/types/database";
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
  updated_at,
  accepted_by_admin_id,
  accepted_at,
  rejected_by_admin_id,
  rejected_at,
  rejection_reason,
  on_hold_reason,
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
    payment_proof_path,
    created_at,
    updated_at
  )
`;

async function hydrateBookingAdminNames(client: ReturnType<typeof requireSupabase>, bookings: Booking[]) {
  const adminIds = [
    ...new Set(
      bookings
        .flatMap((booking) => [booking.accepted_by_admin_id, booking.rejected_by_admin_id])
        .filter((id): id is string => Boolean(id))
    )
  ];

  if (!adminIds.length) return bookings;

  const { data, error } = await client
    .from("admin_users")
    .select("id, full_name")
    .in("id", adminIds);
  if (error) {
    console.warn("Could not load booking admin names", error.message);
    return bookings;
  }

  const adminsById = new Map((data ?? []).map((admin) => [admin.id as string, { full_name: admin.full_name as string }]));
  return bookings.map((booking) => ({
    ...booking,
    accepted_admin: booking.accepted_by_admin_id ? adminsById.get(booking.accepted_by_admin_id) ?? null : null,
    rejected_admin: booking.rejected_by_admin_id ? adminsById.get(booking.rejected_by_admin_id) ?? null : null
  }));
}

async function hydrateHistoryAdminNames(client: ReturnType<typeof requireSupabase>, history: BookingStatusHistory[]) {
  const adminIds = [...new Set(history.map((entry) => entry.changed_by_admin_id).filter((id): id is string => Boolean(id)))];
  if (!adminIds.length) return history;

  const { data, error } = await client
    .from("admin_users")
    .select("id, full_name")
    .in("id", adminIds);
  if (error) {
    console.warn("Could not load booking history admin names", error.message);
    return history;
  }

  const adminsById = new Map((data ?? []).map((admin) => [admin.id as string, { full_name: admin.full_name as string }]));
  return history.map((entry) => ({
    ...entry,
    changed_by_admin: entry.changed_by_admin_id ? adminsById.get(entry.changed_by_admin_id) ?? null : null
  }));
}

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
    const items = await hydrateBookingAdminNames(client, ((data as unknown as Booking[]) ?? []));
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
    const [booking] = await hydrateBookingAdminNames(client, [data as unknown as Booking]);
    return { data: booking, error: null };
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
  isFree?: boolean;
}) {
  try {
    const client = getWritableSupabase();
    const decisionFields =
      input.newStatus === "accepted"
        ? { 
            accepted_by_admin_id: input.adminId, 
            accepted_at: new Date().toISOString(),
            ...(input.isFree ? { total_price: 0 } : {})
          }
        : input.newStatus === "rejected"
          ? { rejected_by_admin_id: input.adminId, rejected_at: new Date().toISOString(), rejection_reason: input.reason }
          : input.newStatus === "on_hold"
            ? { on_hold_reason: input.reason }
            : {};

    const { error } = await client
      .from("bookings")
      .update({ status: input.newStatus, updated_at: new Date().toISOString(), ...decisionFields })
      .eq("booking_id", input.bookingId);
    if (error) throw error;

    if (input.newStatus === "rejected") {
      const { error: slotsError } = await client
        .from("booking_slots")
        .update({ slot_status: "released", updated_at: new Date().toISOString() })
        .eq("booking_id", input.bookingId);
      if (slotsError) throw slotsError;
    }

    if (input.isFree && input.newStatus === "accepted") {
      const { error: slotsPriceError } = await client
        .from("booking_slots")
        .update({ price_at_booking: 0, updated_at: new Date().toISOString() })
        .eq("booking_id", input.bookingId);
      if (slotsPriceError) throw slotsPriceError;
    }

    const { error: historyError } = await client.from("booking_status_history").insert({
      booking_id: input.bookingId,
      old_status: input.oldStatus,
      new_status: input.newStatus,
      changed_by_admin_id: input.adminId,
      reason: input.reason ?? (input.isFree ? "Booking approved as free/complimentary" : `Booking ${input.newStatus}`)
    });
    if (historyError) throw historyError;

    const { error: activityError } = await client.from("admin_activity_logs").insert({
      admin_user_id: input.adminId,
      booking_id: input.bookingId,
      action_type: input.isFree && input.newStatus === "accepted" ? "booking_free_approved" : `booking_${input.newStatus}`,
      description: input.isFree && input.newStatus === "accepted" ? "Booking approved as complimentary/free" : `Booking marked as ${input.newStatus}`
    });
    if (activityError) throw activityError;

    return { error: null };
  } catch (error) {
    return { error: toServiceError(error) };
  }
}

export async function listBookingHistory(bookingId: string): Promise<ServiceResult<BookingStatusHistory[]>> {
  try {
    const client = requireSupabase();
    const { data, error } = await client
      .from("booking_status_history")
      .select(`
        id,
        booking_id,
        old_status,
        new_status,
        changed_by_admin_id,
        reason,
        created_at
      `)
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    const rows = (data as unknown as BookingStatusHistory[]) ?? [];
    return { data: await hydrateHistoryAdminNames(client, rows), error: null };
  } catch (error) {
    return { data: null, error: toServiceError(error) };
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
