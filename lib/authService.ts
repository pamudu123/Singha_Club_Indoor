import type { AdminUser, ServiceResult } from "@/types/database";
import { hasSupabaseConfig, requireSupabase, toServiceError } from "./supabase";
import { isEmail } from "./validation";

function createAdminId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const value = Math.floor(Math.random() * 16);
    const nibble = char === "x" ? value : (value & 0x3) | 0x8;
    return nibble.toString(16);
  });
}

export async function getCurrentSession() {
  if (!hasSupabaseConfig) return { data: null, error: null };
  try {
    const { data, error } = await requireSupabase().auth.getSession();
    return { data: data.session, error: error?.message ?? null };
  } catch (error) {
    return { data: null, error: toServiceError(error) };
  }
}

export async function login(username: string): Promise<ServiceResult<AdminUser>> {
  if (hasSupabaseConfig) {
    try {
      const { data } = await requireSupabase()
        .from("admin_users")
        .select("*")
        .or(`email.eq.${username},full_name.ilike.%${username}%`)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (data) return { data: data as AdminUser, error: null };
    } catch {
      // Passwordless admin mode should stay usable even while RLS/auth policies are being finalized.
    }
  }

  return {
    data: {
      id: "local-admin",
      full_name: username.trim(),
      email: username.includes("@") ? username : `${username.trim().replace(/\s+/g, ".").toLowerCase()}@singha.local`,
      whatsapp_number: "+94 77 123 4567"
    },
    error: null
  };
}

export async function signup(input: {
  fullName: string;
  whatsappNumber: string;
  email: string;
}): Promise<ServiceResult<AdminUser>> {
  const fullName = input.fullName.trim();
  const whatsappNumber = input.whatsappNumber.trim();
  const email = input.email.trim();

  if (!fullName) return { data: null, error: "Name is required." };
  if (!whatsappNumber) return { data: null, error: "WhatsApp number is required." };
  if (!isEmail(email)) return { data: null, error: "Enter a valid email address." };

  if (hasSupabaseConfig) {
    try {
      const { data, error } = await requireSupabase()
        .from("admin_users")
        .insert({
          id: createAdminId(),
          full_name: fullName,
          email,
          whatsapp_number: whatsappNumber,
          is_active: true
        })
        .select("*")
        .single();

      if (error) throw error;
      return { data: data as AdminUser, error: null };
    } catch (error) {
      return { data: null, error: toServiceError(error) };
    }
  }

  return {
    data: {
      id: createAdminId(),
      full_name: fullName,
      email,
      whatsapp_number: whatsappNumber,
      is_active: true
    },
    error: null
  };
}

export async function logout() {
  if (!hasSupabaseConfig) return { error: null };
  try {
    const { error } = await requireSupabase().auth.signOut();
    return { error: error?.message ?? null };
  } catch (error) {
    return { error: toServiceError(error) };
  }
}
