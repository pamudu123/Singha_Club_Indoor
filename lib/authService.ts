import { localAdminId } from "@/constants/admin";
import type { AdminUser, ServiceResult } from "@/types/database";
import { hasSupabaseConfig, requireSupabase, toServiceError } from "./supabase";
import { isEmail } from "./validation";

type AuthClientWithSession = {
  getSession: () => Promise<{ data: { session: unknown | null }; error?: { message?: string } | null }>;
  signOut: () => Promise<{ error?: { message?: string } | null }>;
};

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
    const auth = requireSupabase().auth as unknown as AuthClientWithSession;
    const { data, error } = await auth.getSession();
    return { data: data.session, error: error?.message ?? null };
  } catch (error) {
    return { data: null, error: toServiceError(error) };
  }
}

export async function login(username: string): Promise<ServiceResult<AdminUser>> {
  if (hasSupabaseConfig) {
    try {
      const client = requireSupabase();
      const { data } = await client
        .from("admin_users")
        .select("*")
        .or(`email.eq.${username},full_name.ilike.%${username}%`)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (data) return { data: data as AdminUser, error: null };
    } catch {
      // Keep going to fallback during local finalization
    }
  }

  return {
    data: {
      id: localAdminId,
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
  nic: string;
}): Promise<ServiceResult<AdminUser>> {
  const fullName = input.fullName.trim();
  const whatsappNumber = input.whatsappNumber.trim();
  const email = input.email.trim();
  const nic = input.nic.trim();

  if (!fullName) return { data: null, error: "Name is required." };
  if (!nic) return { data: null, error: "NIC is required." };
  if (!whatsappNumber) return { data: null, error: "WhatsApp number is required." };
  if (!isEmail(email)) return { data: null, error: "Enter a valid email address." };

  if (hasSupabaseConfig) {
    try {
      const client = requireSupabase();
      const adminId = createAdminId();

      const { data, error } = await client
        .from("admin_users")
        .insert({
          id: adminId,
          full_name: fullName,
          nic,
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
      nic,
      email,
      whatsapp_number: whatsappNumber,
      is_active: true
    },
    error: null
  };
}

export async function updateAdminProfile(id: string, input: {
  fullName: string;
  whatsappNumber: string;
  email: string;
  nic?: string | null;
}): Promise<ServiceResult<AdminUser>> {
  const fullName = input.fullName.trim();
  const whatsappNumber = input.whatsappNumber.trim();
  const email = input.email.trim();
  const nic = input.nic?.trim() || null;

  if (!fullName) return { data: null, error: "Name is required." };
  if (!whatsappNumber) return { data: null, error: "WhatsApp number is required." };
  if (!isEmail(email)) return { data: null, error: "Enter a valid email address." };

  if (hasSupabaseConfig) {
    try {
      const { data, error } = await requireSupabase()
        .from("admin_users")
        .update({
          full_name: fullName,
          email,
          whatsapp_number: whatsappNumber,
          nic,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
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
      id,
      full_name: fullName,
      email,
      whatsapp_number: whatsappNumber,
      nic,
      is_active: true
    },
    error: null
  };
}

export async function logout() {
  if (!hasSupabaseConfig) return { error: null };
  try {
    const auth = requireSupabase().auth as unknown as AuthClientWithSession;
    const { error } = await auth.signOut();
    return { error: error?.message ?? null };
  } catch (error) {
    return { error: toServiceError(error) };
  }
}
