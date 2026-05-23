import type { Booking, ServiceResult } from "@/types/database";
import { todayISO } from "./date";
import { requireSupabase, toServiceError } from "./supabase";

export type DashboardSummary = {
  todayBookings: number;
  todayPending: number;
  futureBookings: number;
  futurePending: number;
  todayRevenue: number;
  weekRevenue: number;
  availableSlotsToday: number;
  blockedSlotsToday: number;
  nextUpcomingBooking: Booking | null;
  recentActivity: Array<{ id: string; title: string; subtitle: string; time: string; tone: "green" | "orange" | "red" }>;
};

export async function getDashboardSummary(): Promise<ServiceResult<DashboardSummary>> {
  try {
    const client = requireSupabase();
    const today = todayISO();
    const [todayBookings, todayPending, futureBookings, futurePending, revenue, blocked, activity] = await Promise.all([
      client.from("bookings").select("booking_id", { count: "exact", head: true }).eq("booking_date", today).eq("status", "accepted"),
      client.from("bookings").select("booking_id", { count: "exact", head: true }).eq("booking_date", today).in("status", ["submitted", "on_hold"]),
      client.from("bookings").select("booking_id", { count: "exact", head: true }).gt("booking_date", today).eq("status", "accepted"),
      client.from("bookings").select("booking_id", { count: "exact", head: true }).gt("booking_date", today).in("status", ["submitted", "on_hold"]),
      client.from("bookings").select("total_price").eq("booking_date", today).eq("status", "accepted"),
      client.from("blocked_slots").select("id", { count: "exact", head: true }).eq("slot_date", today),
      client.from("admin_activity_logs").select("*").order("created_at", { ascending: false }).limit(3)
    ]);

    const todayRevenue = (revenue.data ?? []).reduce((sum, row) => sum + Number(row.total_price ?? 0), 0);

    return {
      data: {
        todayBookings: todayBookings.count ?? 0,
        todayPending: todayPending.count ?? 0,
        futureBookings: futureBookings.count ?? 0,
        futurePending: futurePending.count ?? 0,
        todayRevenue,
        weekRevenue: todayRevenue,
        availableSlotsToday: 0,
        blockedSlotsToday: blocked.count ?? 0,
        nextUpcomingBooking: null,
        recentActivity: (activity.data ?? []).map((item) => ({
          id: item.id,
          title: item.description,
          subtitle: item.action_type,
          time: "Recent",
          tone: "green" as const
        }))
      },
      error:
        todayBookings.error?.message ??
        todayPending.error?.message ??
        futureBookings.error?.message ??
        futurePending.error?.message ??
        revenue.error?.message ??
        blocked.error?.message ??
        activity.error?.message ??
        null
    };
  } catch (error) {
    return { data: null, error: toServiceError(error) };
  }
}
