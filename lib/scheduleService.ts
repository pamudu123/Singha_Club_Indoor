import { blockedSlots as mockBlockedSlots, bookings, tracks as mockTracks } from "@/constants/mockData";
import type { BlockedSlot, BookingSlot, ServiceResult, Track } from "@/types/database";
import { hasSupabaseConfig, requireSupabase, toServiceError } from "./supabase";

let localBlockedSlots = [...mockBlockedSlots];

export async function listTracks(): Promise<ServiceResult<Track[]>> {
  if (!hasSupabaseConfig) return { data: mockTracks, error: null };

  try {
    const { data, error } = await requireSupabase().from("tracks").select("*").eq("is_active", true).order("id");
    if (error) throw error;
    return { data: (data as Track[]) ?? [], error: null };
  } catch (error) {
    return { data: null, error: toServiceError(error) };
  }
}

export async function getDaySchedule(input: {
  selectedDate: string;
  trackId: string;
}): Promise<ServiceResult<{ bookingSlots: BookingSlot[]; blockedSlots: BlockedSlot[] }>> {
  if (!hasSupabaseConfig) {
    return {
      data: {
        bookingSlots: bookings
          .flatMap((booking) =>
            (booking.booking_slots ?? []).map((slot) => ({
              ...slot,
              bookings: booking
            }))
          )
          .filter((slot) => slot.track_id === input.trackId && slot.slot_date === input.selectedDate && slot.slot_status === "active"),
        blockedSlots: localBlockedSlots.filter((slot) => slot.track_id === input.trackId && slot.slot_date === input.selectedDate)
      },
      error: null
    };
  }

  try {
    const client = requireSupabase();
    const [bookingSlots, blockedSlots] = await Promise.all([
      client
        .from("booking_slots")
        .select(
          `
          id,
          booking_id,
          track_id,
          slot_date,
          start_time,
          end_time,
          price_at_booking,
          slot_status,
          bookings (
            booking_reference,
            status,
            number_of_people,
            customers (
              full_name
            )
          ),
          tracks (
            id,
            track_name
          )
        `
        )
        .eq("slot_date", input.selectedDate)
        .eq("track_id", input.trackId)
        .order("start_time"),
      client
        .from("blocked_slots")
        .select("*, tracks ( id, track_name )")
        .eq("slot_date", input.selectedDate)
        .eq("track_id", input.trackId)
        .order("start_time")
    ]);

    if (bookingSlots.error) throw bookingSlots.error;
    if (blockedSlots.error) throw blockedSlots.error;

    return {
      data: {
        bookingSlots: (bookingSlots.data as unknown as BookingSlot[]) ?? [],
        blockedSlots: (blockedSlots.data as BlockedSlot[]) ?? []
      },
      error: null
    };
  } catch (error) {
    return { data: null, error: toServiceError(error) };
  }
}

export async function listBlockedSlots(input?: { trackId?: string; slotDate?: string }): Promise<ServiceResult<BlockedSlot[]>> {
  if (!hasSupabaseConfig) {
    const filtered = localBlockedSlots.filter((slot) => {
      const matchesTrack = input?.trackId ? slot.track_id === input.trackId : true;
      const matchesDate = input?.slotDate ? slot.slot_date === input.slotDate : true;
      return matchesTrack && matchesDate;
    });
    return { data: filtered, error: null };
  }

  try {
    let query = requireSupabase().from("blocked_slots").select("*, tracks ( id, track_name )").order("slot_date").order("start_time");
    if (input?.trackId) query = query.eq("track_id", input.trackId);
    if (input?.slotDate) query = query.eq("slot_date", input.slotDate);
    const { data, error } = await query;
    if (error) throw error;
    return { data: (data as BlockedSlot[]) ?? [], error: null };
  } catch (error) {
    return { data: null, error: toServiceError(error) };
  }
}

export async function createBlockedSlots(input: {
  trackId: string;
  slotDate: string;
  slots: Array<{ startTime: string; endTime: string }>;
  reason: string;
  adminId: string;
}) {
  if (!hasSupabaseConfig) {
    const now = new Date().toISOString();
    localBlockedSlots = [
      ...input.slots.map((slot, index) => ({
        id: `local-block-${Date.now()}-${index}`,
        track_id: input.trackId,
        slot_date: input.slotDate,
        start_time: slot.startTime,
        end_time: slot.endTime,
        reason: input.reason,
        created_by_admin_id: input.adminId,
        created_at: now,
        tracks: mockTracks.find((track) => track.id === input.trackId) ?? null
      })),
      ...localBlockedSlots
    ];
    return { error: null };
  }

  try {
    const client = requireSupabase();
    const { error } = await client.from("blocked_slots").insert(
      input.slots.map((slot) => ({
        track_id: input.trackId,
        slot_date: input.slotDate,
        start_time: slot.startTime,
        end_time: slot.endTime,
        reason: input.reason,
        created_by_admin_id: input.adminId
      }))
    );
    if (error) throw error;

    await client.from("admin_activity_logs").insert({
      admin_user_id: input.adminId,
      action_type: "slot_blocked",
      description: `Blocked slots on ${input.slotDate}`
    });

    return { error: null };
  } catch (error) {
    return { error: toServiceError(error) };
  }
}

export async function deleteBlockedSlot(slotId: string) {
  if (!hasSupabaseConfig) {
    localBlockedSlots = localBlockedSlots.filter((slot) => slot.id !== slotId);
    return { error: null };
  }

  try {
    const { error } = await requireSupabase().from("blocked_slots").delete().eq("id", slotId);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: toServiceError(error) };
  }
}
