import AsyncStorage from "@react-native-async-storage/async-storage";
import { initialDefaultSlotPrice } from "@/constants/pricing";
import type { Language } from "@/constants/translations";
import type { AdminUserSettings, ServiceResult } from "@/types/database";
import { hasSupabaseConfig, requireSupabase, toServiceError } from "./supabase";

export type NotificationSettings = {
  booking: boolean;
  accepted: boolean;
  rejected: boolean;
  onHold: boolean;
  summary: boolean;
};

export type AdminSettings = {
  language: Language;
  notifications: NotificationSettings;
  maxSlots: number;
  defaultSlotPrice: number;
};

const defaultSettings: AdminSettings = {
  language: "en",
  notifications: {
    booking: true,
    accepted: true,
    rejected: true,
    onHold: true,
    summary: true
  },
  maxSlots: 10,
  defaultSlotPrice: initialDefaultSlotPrice
};

function storageKey(adminId: string) {
  return `singha.adminSettings.${adminId}`;
}

function normalizeLanguage(value: unknown): Language {
  return value === "si" ? "si" : "en";
}

function fromRow(row: AdminUserSettings | null | undefined): Partial<AdminSettings> {
  if (!row) return {};
  return {
    language: normalizeLanguage(row.language),
    notifications: {
      booking: row.notify_new_booking,
      accepted: row.notify_accepted,
      rejected: row.notify_rejected,
      onHold: row.notify_on_hold,
      summary: row.notify_daily_summary
    },
    maxSlots: row.max_slots_per_booking,
    defaultSlotPrice: Number(row.default_slot_price ?? initialDefaultSlotPrice)
  };
}

function toRow(adminId: string, settings: AdminSettings) {
  return {
    admin_user_id: adminId,
    language: settings.language,
    notify_new_booking: settings.notifications.booking,
    notify_accepted: settings.notifications.accepted,
    notify_rejected: settings.notifications.rejected,
    notify_on_hold: settings.notifications.onHold,
    notify_daily_summary: settings.notifications.summary,
    max_slots_per_booking: settings.maxSlots,
    default_slot_price: settings.defaultSlotPrice
  };
}

async function readLocalSettings(adminId: string): Promise<Partial<AdminSettings>> {
  const stored = await AsyncStorage.getItem(storageKey(adminId));
  if (!stored) return {};
  const parsed = JSON.parse(stored) as Partial<AdminSettings>;
  return {
    ...parsed,
    language: normalizeLanguage(parsed.language),
    notifications: parsed.notifications ?? defaultSettings.notifications,
    maxSlots: typeof parsed.maxSlots === "number" ? parsed.maxSlots : undefined,
    defaultSlotPrice: typeof parsed.defaultSlotPrice === "number" ? parsed.defaultSlotPrice : undefined
  };
}

async function writeLocalSettings(adminId: string, settings: AdminSettings) {
  await AsyncStorage.setItem(storageKey(adminId), JSON.stringify(settings));
}

export function getDefaultAdminSettings(): AdminSettings {
  return defaultSettings;
}

export async function loadAdminSettings(adminId: string): Promise<ServiceResult<AdminSettings>> {
  try {
    const localSettings = await readLocalSettings(adminId).catch(() => ({}));
    let settings: AdminSettings = { ...defaultSettings, ...localSettings };

    if (hasSupabaseConfig) {
      const { data, error } = await requireSupabase()
        .from("admin_user_settings")
        .select("*")
        .eq("admin_user_id", adminId)
        .maybeSingle();
      if (error) throw error;
      settings = { ...settings, ...fromRow(data as AdminUserSettings | null) };
      await writeLocalSettings(adminId, settings).catch(() => {});
    }

    return { data: settings, error: null };
  } catch (error) {
    const fallback = await readLocalSettings(adminId).catch(() => ({}));
    return { data: { ...defaultSettings, ...fallback }, error: toServiceError(error) };
  }
}

export async function saveAdminSettings(adminId: string, settings: AdminSettings): Promise<ServiceResult<AdminSettings>> {
  const normalized: AdminSettings = {
    language: normalizeLanguage(settings.language),
    notifications: settings.notifications,
    maxSlots: Math.min(Math.max(settings.maxSlots, 1), 50),
    defaultSlotPrice: settings.defaultSlotPrice > 0 ? settings.defaultSlotPrice : initialDefaultSlotPrice
  };

  try {
    await writeLocalSettings(adminId, normalized);

    if (hasSupabaseConfig) {
      const { error } = await requireSupabase()
        .from("admin_user_settings")
        .upsert(toRow(adminId, normalized), { onConflict: "admin_user_id" });
      if (error) throw error;
    }

    return { data: normalized, error: null };
  } catch (error) {
    return { data: normalized, error: toServiceError(error) };
  }
}
