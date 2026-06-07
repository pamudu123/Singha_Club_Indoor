import AsyncStorage from "@react-native-async-storage/async-storage";
import { defaultCurrency, initialDefaultSlotPrice, type CurrencyCode } from "@/constants/pricing";
import { configuredTracks } from "@/constants/tracks";
import type { DayType, PriceRuleStatus, ServiceResult, SlotPrice } from "@/types/database";
import { getWritableSupabase, requireSupabase, toServiceError } from "./supabase";

let defaultSlotPrice = initialDefaultSlotPrice;
const defaultSlotPriceKey = "singha.defaultSlotPrice";

export function getDefaultSlotPrice() {
  return defaultSlotPrice;
}

export async function loadDefaultSlotPrice() {
  const storedPrice = await AsyncStorage.getItem(defaultSlotPriceKey);
  const numericPrice = storedPrice ? Number(storedPrice) : NaN;
  if (Number.isFinite(numericPrice) && numericPrice > 0) {
    defaultSlotPrice = numericPrice;
  }
  return defaultSlotPrice;
}

export async function updateDefaultSlotPrice(price: number) {
  defaultSlotPrice = price;
  await AsyncStorage.setItem(defaultSlotPriceKey, String(price));
}

export function getDefaultCurrency() {
  return defaultCurrency;
}

function decorateSlotPrice(slotPrice: SlotPrice): SlotPrice {
  const status = slotPrice.status ?? (slotPrice.is_active ? "active" : "inactive");
  return {
    ...slotPrice,
    status,
    is_active: status === "active",
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
        status,
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
      .neq("status", "delete")
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
        status: input.isActive ? "active" : "inactive",
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
  status?: PriceRuleStatus;
}) {
  try {
    const status = input.status ?? (typeof input.isActive === "boolean" ? (input.isActive ? "active" : "inactive") : undefined);
    const updates = {
      ...(input.startTime ? { start_time: input.startTime } : {}),
      ...(input.endTime ? { end_time: input.endTime } : {}),
      ...(input.dayType ? { day_type: input.dayType } : {}),
      ...(typeof input.price === "number" ? { price: input.price } : {}),
      ...(input.currency ? { currency: input.currency } : {}),
      ...(input.effectiveFrom ? { effective_from: input.effectiveFrom } : {}),
      ...(input.effectiveTo !== undefined ? { effective_to: input.effectiveTo } : {}),
      ...(status ? { status, is_active: status === "active" } : {})
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

export async function markSlotPriceDeleted(id: string) {
  return updateSlotPrice({ id, status: "delete" });
}
