import { blockedSlots, bookings } from "@/constants/mockData";
import type { Booking, ServiceResult } from "@/types/database";
import { todayISO } from "./date";
import { hasSupabaseConfig, requireSupabase, toServiceError } from "./supabase";

export type DashboardSummary = {
  todayBookings: number;
  pendingRequests: number;
  onHoldBookings: number;
  todayRevenue: number;
  weekRevenue: number;
  availableSlotsToday: number;
  blockedSlotsToday: number;
  nextUpcomingBooking: Booking | null;
  recentActivity: Array<{ id: string; title: string; subtitle: string; time: string; tone: "green" | "orange" | "red" }>;
};

export async function getDashboardSummary(): Promise<ServiceResult<DashboardSummary>> {
  if (!hasSupabaseConfig) {
    return {
      data: {
        todayBookings: 18,
        pendingRequests: bookings.filter((booking) => booking.status === "submitted").length,
        onHoldBookings: bookings.filter((booking) => booking.status === "on_hold").length,
        todayRevenue: 32450,
        weekRevenue: 248750,
        availableSlotsToday: 26,
        blockedSlotsToday: blockedSlots.length,
        nextUpcomingBooking: bookings[0],
        recentActivity: [
          {
            id: "a1",
            title: "New booking received for 5:00 PM today",
            subtitle: "Track 2 - Corporate Match",
            time: "9:25 AM",
            tone: "green"
          },
          {
            id: "a2",
            title: "Booking request pending approval",
            subtitle: "Tomorrow, 8:30 PM - Track 1",
            time: "8:47 AM",
            tone: "orange"
          },
          {
            id: "a3",
            title: "Slot blocked by admin",
            subtitle: "May 24, 10:00 PM - 11:00 PM",
            time: "Yesterday",
            tone: "red"
          }
        ]
      },
      error: null
    };
  }

  try {
    const client = requireSupabase();
    const today = todayISO();
    const [todayBookings, pending, onHold, revenue, blocked, activity] = await Promise.all([
      client.from("bookings").select("booking_id", { count: "exact", head: true }).eq("booking_date", today),
      client.from("bookings").select("booking_id", { count: "exact", head: true }).eq("status", "submitted"),
      client.from("bookings").select("booking_id", { count: "exact", head: true }).eq("status", "on_hold"),
      client.from("bookings").select("total_price").eq("booking_date", today).eq("status", "accepted"),
      client.from("blocked_slots").select("id", { count: "exact", head: true }).eq("slot_date", today),
      client.from("admin_activity_logs").select("*").order("created_at", { ascending: false }).limit(3)
    ]);

    const todayRevenue = (revenue.data ?? []).reduce((sum, row) => sum + Number(row.total_price ?? 0), 0);

    return {
      data: {
        todayBookings: todayBookings.count ?? 0,
        pendingRequests: pending.count ?? 0,
        onHoldBookings: onHold.count ?? 0,
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
        pending.error?.message ??
        onHold.error?.message ??
        revenue.error?.message ??
        blocked.error?.message ??
        activity.error?.message ??
        null
    };
  } catch (error) {
    return { data: null, error: toServiceError(error) };
  }
}
