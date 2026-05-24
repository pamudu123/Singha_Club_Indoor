import { defaultCurrency, initialDefaultSlotPrice, type CurrencyCode } from "@/constants/pricing";
import { configuredTracks } from "@/constants/tracks";
import type { DayType, ServiceResult, SlotPrice } from "@/types/database";
import { getWritableSupabase, requireSupabase, toServiceError } from "./supabase";

let defaultSlotPrice = initialDefaultSlotPrice;

export function getDefaultSlotPrice() {
  return defaultSlotPrice;
}

export function updateDefaultSlotPrice(price: number) {
  defaultSlotPrice = price;
}

export function getDefaultCurrency() {
  return defaultCurrency;
}

function decorateSlotPrice(slotPrice: SlotPrice): SlotPrice {
  return {
    ...slotPrice,
    tracks: slotPrice.tracks ?? configuredTracks.find((track) => track.id === slotPrice.track_id) ?? null
  };
}

export async function listSlotPrices(trackId: string): Promise<ServiceResult<SlotPrice[]>> {
  try {
    const client = requireSupabase();
    const { data, error } = await client
      .from("slot_prices")
      .select(
        `
        id,
        track_id,
        start_time,
        end_time,
        day_type,
        price,
        currency,
        effective_from,
        effective_to,
        is_active,
        created_at,
        updated_at,
        tracks (
          id,
          track_name
        )
      `
      )
      .eq("track_id", trackId)
      .order("start_time");
    if (error) throw error;
    return { data: ((data as unknown as SlotPrice[]) ?? []).map(decorateSlotPrice), error: null };
  } catch (error) {
    return { data: null, error: toServiceError(error) };
  }
}

export async function createSlotPrice(input: {
  trackId: string;
  startTime: string;
  endTime: string;
  dayType: DayType;
  price: number;
  currency: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  isActive: boolean;
}): Promise<ServiceResult<SlotPrice>> {
  try {
    const { data, error } = await getWritableSupabase()
      .from("slot_prices")
      .insert({
        track_id: input.trackId,
        start_time: input.startTime,
        end_time: input.endTime,
        day_type: input.dayType,
        price: input.price,
        currency: input.currency,
        effective_from: input.effectiveFrom,
        effective_to: input.effectiveTo ?? null,
        is_active: input.isActive
      })
      .select("*")
      .single();
    if (error) throw error;
    return { data: decorateSlotPrice(data as SlotPrice), error: null };
  } catch (error) {
    return { data: null, error: toServiceError(error) };
  }
}

export async function updateSlotPrice(input: {
  id: string;
  trackId?: string;
  startTime?: string;
  endTime?: string;
  dayType?: DayType;
  price?: number;
  currency?: string;
  effectiveFrom?: string;
  effectiveTo?: string | null;
  isActive?: boolean;
}) {
  try {
    const updates = {
      ...(input.startTime ? { start_time: input.startTime } : {}),
      ...(input.endTime ? { end_time: input.endTime } : {}),
      ...(input.dayType ? { day_type: input.dayType } : {}),
      ...(typeof input.price === "number" ? { price: input.price } : {}),
      ...(input.currency ? { currency: input.currency } : {}),
      ...(input.effectiveFrom ? { effective_from: input.effectiveFrom } : {}),
      ...(input.effectiveTo !== undefined ? { effective_to: input.effectiveTo } : {}),
      ...(typeof input.isActive === "boolean" ? { is_active: input.isActive } : {})
    };
    const { error } = await getWritableSupabase()
      .from("slot_prices")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", input.id);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: toServiceError(error) };
  }
}
