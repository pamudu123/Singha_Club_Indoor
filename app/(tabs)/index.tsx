import { router } from "expo-router";
import { BarChart3, CalendarPlus, CalendarRange, Clock3, Coins, LockKeyhole, PauseCircle, PlusCircle, Tags, Users } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/Card";
import { ErrorState, LoadingState } from "@/components/ui/StateView";
import { useAsyncData } from "@/hooks/useAsyncData";
import { formatCurrency, formatDateLabel, todayISO } from "@/lib/date";
import { getDashboardSummary } from "@/lib/dashboardService";
import { Screen } from "@/components/ui/Screen";

export default function DashboardScreen() {
  const { data, error, loading } = useAsyncData(getDashboardSummary, []);

  return (
    <Screen contentContainerClassName="pb-28">
      <AppHeader title="SINGHA SPORTS CLUB" subtitle="Indoor Cricket Booking System" />
      <View className="mb-5 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-bold text-ink">Good morning, Admin</Text>
          <Text className="mt-1 text-base text-muted">Here is what is happening today.</Text>
        </View>
        <Card className="px-4 py-3">
          <Text className="text-base font-semibold text-ink">{formatDateLabel(todayISO())}</Text>
          <Text className="text-sm text-muted">Today</Text>
        </Card>
      </View>

      {loading ? <LoadingState label="Loading dashboard..." /> : null}
      {error ? <ErrorState message={error} /> : null}
      {data ? (
        <>
          <View className="gap-3">
            <View className="flex-row gap-3">
              <StatCard title="Today's Bookings" value={String(data.todayBookings)} icon={CalendarRange} />
              <StatCard title="Pending Requests" value={String(data.pendingRequests)} icon={Clock3} tone="orange" />
            </View>
            <View className="flex-row gap-3">
              <StatCard title="On Hold" value={String(data.onHoldBookings)} icon={PauseCircle} tone="orange" />
              <StatCard title="Blocked Slots Today" value={String(data.blockedSlotsToday)} icon={LockKeyhole} tone="red" />
            </View>
          </View>

          <Text className="mb-3 mt-7 text-xl font-bold text-ink">Quick Actions</Text>
          <View className="flex-row flex-wrap gap-3">
            <QuickAction title="Create Booking" icon={CalendarPlus} onPress={() => router.push("/create-booking")} />
            <QuickAction title="Block Slot" icon={LockKeyhole} onPress={() => router.push("/block-slots")} />
            <QuickAction title="Change Price" icon={Tags} onPress={() => router.push("/pricing")} />
            <QuickAction title="Open Schedule" icon={CalendarRange} onPress={() => router.push("/(tabs)/schedule")} />
            <QuickAction title="View Requests" icon={Users} onPress={() => router.push("/(tabs)/requests")} />
          </View>


        </>
      ) : null}
    </Screen>
  );
}

function QuickAction({ title, icon: Icon, onPress }: { title: string; icon: typeof PlusCircle; onPress: () => void }) {
  return (
    <Pressable className="min-h-28 w-[31%] items-center justify-center rounded-2xl border border-line bg-white p-3 shadow-sm" onPress={onPress}>
      <Icon size={30} color="#087d24" />
      <Text className="mt-3 text-center text-sm font-medium text-ink">{title}</Text>
    </Pressable>
  );
}
