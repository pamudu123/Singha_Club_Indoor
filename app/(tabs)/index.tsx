import { router } from "expo-router";
import { CalendarPlus, CalendarRange, Clock3, LockKeyhole, PauseCircle, PlusCircle, Tags, Users, ChevronDown, ChevronUp } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/Card";
import { ErrorState, LoadingState } from "@/components/ui/StateView";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useLanguage } from "@/hooks/useLanguage";
import { formatDateLabel, todayISO } from "@/lib/date";
import { getDashboardSummary } from "@/lib/dashboardService";
import { Screen } from "@/components/ui/Screen";

export default function DashboardScreen() {
  const { data, error, loading } = useAsyncData(getDashboardSummary, []);
  const { locale, t } = useLanguage();
  const [showUpcoming, setShowUpcoming] = useState(false);

  return (
    <Screen>
      <AppHeader title={t("app.clubName")} subtitle={t("app.subtitle")} />
      <View className="mb-5 flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-2xl font-bold text-ink" numberOfLines={2}>{t("dashboard.greeting")}</Text>
          <Text className="mt-1 text-base text-muted" numberOfLines={2}>{t("dashboard.todaySummary")}</Text>
        </View>
        <Card className="max-w-[42%] px-3 py-3">
          <Text className="text-right text-sm font-semibold text-ink" numberOfLines={2}>{formatDateLabel(todayISO(), locale)}</Text>
          <Text className="text-sm text-muted">{t("common.today")}</Text>
        </Card>
      </View>

      {loading ? <LoadingState label={t("dashboard.loading")} /> : null}
      {error ? <ErrorState message={error} /> : null}
      {data ? (
        <>
          <View className="gap-3">
            {/* Row 1: Today's Bookings and Today's Pending/On Hold */}
            <View className="flex-row gap-3">
              <StatCard title={t("dashboard.todayBookings")} value={String(data.todayBookings)} icon={CalendarRange} />
              <StatCard title={t("dashboard.todayPending")} value={String(data.todayPending)} icon={Clock3} tone="orange" />
            </View>

            {/* Collapsible Upcoming Section Header */}
            <Pressable 
              className="flex-row items-center justify-between mt-3 mb-1 px-4 py-3 rounded-2xl bg-gray-50 border border-line active:bg-gray-100/80" 
              onPress={() => setShowUpcoming(prev => !prev)}
            >
              <View className="flex-1 flex-row items-center gap-3 pr-2">
                <CalendarRange size={22} color="#087d24" />
                <Text className="flex-1 text-base font-bold text-ink" numberOfLines={2}>{t("dashboard.upcoming")}</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Text className="text-xs font-bold text-singha-700 uppercase">
                  {showUpcoming ? t("common.hide") : t("common.show")}
                </Text>
                {showUpcoming ? <ChevronUp size={16} color="#087d24" /> : <ChevronDown size={16} color="#087d24" />}
              </View>
            </Pressable>

            {/* Row 2: Future Bookings and Future Pending/On Hold (Collapsible) */}
            {showUpcoming ? (
              <View className="flex-row gap-3 mt-1">
                <StatCard title={t("dashboard.futureBookings")} value={String(data.futureBookings)} icon={CalendarRange} tone="green" />
                <StatCard title={t("dashboard.futurePending")} value={String(data.futurePending)} icon={PauseCircle} tone="orange" />
              </View>
            ) : null}
          </View>

          <Text className="mb-3 mt-7 text-xl font-bold text-ink">{t("dashboard.quickActions")}</Text>
          <View className="flex-row flex-wrap gap-3">
            <QuickAction title={t("dashboard.createBooking")} icon={CalendarPlus} onPress={() => router.push("/create-booking")} />
            <QuickAction title={t("dashboard.blockSlot")} icon={LockKeyhole} onPress={() => router.push("/block-slots")} />
            <QuickAction title={t("dashboard.changePrice")} icon={Tags} onPress={() => router.push("/pricing")} />
            <QuickAction title={t("dashboard.openSchedule")} icon={CalendarRange} onPress={() => router.push("/(tabs)/schedule")} />
            <QuickAction title={t("dashboard.viewRequests")} icon={Users} onPress={() => router.push("/(tabs)/requests")} />
          </View>


        </>
      ) : null}
    </Screen>
  );
}

function QuickAction({ title, icon: Icon, onPress }: { title: string; icon: typeof PlusCircle; onPress: () => void }) {
  return (
    <Pressable className="min-h-28 basis-[30%] flex-grow items-center justify-center rounded-2xl border border-line bg-white p-3 shadow-sm" onPress={onPress}>
      <Icon size={30} color="#087d24" />
      <Text className="mt-3 text-center text-sm font-medium text-ink">{title}</Text>
    </Pressable>
  );
}
