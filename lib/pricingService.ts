import { slotPrices } from "@/constants/mockData";
import type { DayType, ServiceResult, SlotPrice } from "@/types/database";
import { hasSupabaseConfig, requireSupabase, toServiceError } from "./supabase";

let localSlotPrices = [...slotPrices];

export async function listSlotPrices(trackId: string): Promise<ServiceResult<SlotPrice[]>> {
  if (!hasSupabaseConfig) return { data: localSlotPrices.filter((price) => price.track_id === trackId), error: null };

  try {
    const { data, error } = await requireSupabase()
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
        tracks (
          id,
          track_name
        )
      `
      )
      .eq("track_id", trackId)
      .order("start_time");
    if (error) throw error;
    return { data: (data as unknown as SlotPrice[]) ?? [], error: null };
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
  if (!hasSupabaseConfig) {
    const price: SlotPrice = {
      id: `local-price-${Date.now()}`,
      track_id: input.trackId,
      start_time: input.startTime,
      end_time: input.endTime,
      day_type: input.dayType,
      price: input.price,
      currency: input.currency,
      effective_from: input.effectiveFrom,
      effective_to: input.effectiveTo ?? null,
      is_active: input.isActive
    };
    localSlotPrices = [...localSlotPrices, price];
    return { data: price, error: null };
  }

  try {
    const { data, error } = await requireSupabase()
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
    return { data: data as SlotPrice, error: null };
  } catch (error) {
    return { data: null, error: toServiceError(error) };
  }
}

export async function updateSlotPrice(input: {
  id: string;
  startTime?: string;
  endTime?: string;
  dayType?: DayType;
  price?: number;
  currency?: string;
  effectiveFrom?: string;
  effectiveTo?: string | null;
  isActive?: boolean;
}) {
  if (!hasSupabaseConfig) {
    localSlotPrices = localSlotPrices.map((price) =>
      price.id === input.id
        ? {
            ...price,
            start_time: input.startTime ?? price.start_time,
            end_time: input.endTime ?? price.end_time,
            day_type: input.dayType ?? price.day_type,
            price: input.price ?? price.price,
            currency: input.currency ?? price.currency,
            effective_from: input.effectiveFrom ?? price.effective_from,
            effective_to: input.effectiveTo === undefined ? price.effective_to : input.effectiveTo,
            is_active: input.isActive ?? price.is_active
          }
        : price
    );
    return { error: null };
  }

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
    const { error } = await requireSupabase()
      .from("slot_prices")
      .update(updates)
      .eq("id", input.id);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: toServiceError(error) };
  }
}
