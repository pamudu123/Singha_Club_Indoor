import { configuredTrackIds, configuredTracks } from "@/constants/tracks";
import type { BlockedSlot, BookingSlot, ServiceResult, Track } from "@/types/database";
import { getWritableSupabase, requireSupabase, toServiceError } from "./supabase";

function decorateBlockedSlot(slot: BlockedSlot): BlockedSlot {
  return {
    ...slot,
    tracks: slot.tracks ?? configuredTracks.find((track) => track.id === slot.track_id) ?? null
  };
}

export async function listTracks(): Promise<ServiceResult<Track[]>> {
  try {
    const client = requireSupabase();
    const { data, error } = await client
      .from("tracks")
      .select("*")
      .eq("is_active", true)
      .in("id", configuredTrackIds);
    if (error) throw error;
    const tracks = ((data as Track[]) ?? []).sort((left, right) => configuredTrackIds.indexOf(left.id) - configuredTrackIds.indexOf(right.id));
    return { data: tracks.length > 0 ? tracks : configuredTracks, error: null };
  } catch (error) {
    return { data: configuredTracks, error: toServiceError(error) };
  }
}

export async function getDaySchedule(input: {
  selectedDate: string;
  trackId: string;
}): Promise<ServiceResult<{ bookingSlots: BookingSlot[]; blockedSlots: BlockedSlot[] }>> {
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

export async function listBlockedSlots(input?: { trackId?: string; slotDate?: string; fromDate?: string; toDate?: string }): Promise<ServiceResult<BlockedSlot[]>> {
  try {
    const client = requireSupabase();
    let query = client.from("blocked_slots").select("*, tracks ( id, track_name )").order("slot_date").order("start_time");
    if (input?.trackId) query = query.eq("track_id", input.trackId);
    if (input?.slotDate) query = query.eq("slot_date", input.slotDate);
    if (input?.fromDate) query = query.gte("slot_date", input.fromDate);
    if (input?.toDate) query = query.lte("slot_date", input.toDate);
    const { data, error } = await query;
    if (error) throw error;
    const remoteSlots = ((data as BlockedSlot[]) ?? []).map(decorateBlockedSlot);
    return { data: remoteSlots, error: null };
  } catch (error) {
    return { data: null, error: toServiceError(error) };
  }
}

export async function createBlockedSlots(input: {
  trackId: string;
  slotDate?: string;
  slotDates?: string[];
  slots: Array<{ startTime: string; endTime: string }>;
  reason: string;
  adminId: string;
}): Promise<{ error: string | null; insertedCount?: number }> {
  try {
    const client = getWritableSupabase();
    const slotDates = [...new Set(input.slotDates ?? (input.slotDate ? [input.slotDate] : []))].sort();
    if (!slotDates.length || !input.slots.length) {
      return { error: "Select at least one date and time slot." };
    }

    const { data: existingSlots, error: existingError } = await client
      .from("blocked_slots")
      .select("slot_date, start_time, end_time")
      .eq("track_id", input.trackId)
      .in("slot_date", slotDates)
      .in("start_time", input.slots.map((slot) => slot.startTime));
    if (existingError) throw existingError;

    const existingSlotKeys = new Set(
      ((existingSlots as Array<{ slot_date: string; start_time: string; end_time: string }> | null) ?? []).map((slot) => `${slot.slot_date}-${slot.start_time}-${slot.end_time}`)
    );

    const { data: bookedSlots, error: bookedError } = await client
      .from("booking_slots")
      .select("slot_date, start_time, end_time")
      .eq("track_id", input.trackId)
      .eq("slot_status", "active")
      .in("slot_date", slotDates)
      .in("start_time", input.slots.map((slot) => slot.startTime));
    if (bookedError) throw bookedError;

    if ((bookedSlots ?? []).length > 0) {
      return { error: "One or more selected slots already have active bookings." };
    }

    const slotsToInsert = slotDates.flatMap((slotDate) =>
      input.slots
        .filter((slot) => !existingSlotKeys.has(`${slotDate}-${slot.startTime}-${slot.endTime}`))
        .map((slot) => ({
          track_id: input.trackId,
          slot_date: slotDate,
          start_time: slot.startTime,
          end_time: slot.endTime,
          reason: input.reason,
          created_by_admin_id: input.adminId
        }))
    );
    if (!slotsToInsert.length) {
      return { error: "All selected slots are already blocked." };
    }

    const { error } = await client.from("blocked_slots").insert(slotsToInsert);
    if (error) throw error;

    const { error: activityError } = await client.from("admin_activity_logs").insert({
      admin_user_id: input.adminId,
      action_type: "slot_blocked",
      description: `Blocked ${slotsToInsert.length} slot(s) from ${slotDates[0]} to ${slotDates[slotDates.length - 1]}`
    });
    if (activityError) console.warn("Could not save slot block activity", activityError.message);

    return { error: null, insertedCount: slotsToInsert.length };
  } catch (error) {
    return { error: toServiceError(error) };
  }
}

export async function deleteBlockedSlot(slotId: string) {
  try {
    const { error } = await getWritableSupabase().from("blocked_slots").delete().eq("id", slotId);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: toServiceError(error) };
  }
}
