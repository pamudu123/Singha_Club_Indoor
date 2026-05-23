import { BarChart3, ChevronLeft, ChevronRight, Coins, TrendingUp, Users } from "lucide-react-native";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import { AppHeader } from "@/components/AppHeader";
import { SegmentedFilter } from "@/components/SegmentedFilter";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { useState, useEffect, useCallback, useRef } from "react";
import { todayISO, formatCurrency } from "@/lib/date";
import { supabase, hasSupabaseConfig } from "@/lib/supabase";
import { slotTimes } from "@/constants/booking";
import { configuredTracks } from "@/constants/tracks";
import { colors } from "@/constants/theme";
import { useLanguage } from "@/hooks/useLanguage";

/* ─── Fallback mock data (shown when Supabase is not configured) ─── */
const barsDayMock = [8750, 10300, 12850, 10100, 15200, 14600, 16450];
const barsNightMock = [10000, 12000, 15000, 14000, 15000, 14000, 16000];
const NIGHT_CUTOFF = "14:00"; // Slots at or after 2 PM are "night"

/** Format "HH:MM" as short label e.g. "8 AM", "7 PM" (no minutes) */
function shortTime(time: string) {
  const [hourValue] = time.split(":").map(Number);
  const period = hourValue >= 12 ? "PM" : "AM";
  const hour = hourValue % 12 || 12;
  return `${hour} ${period}`;
}

const MONTH_KEYS = [
  "date.month.january",
  "date.month.february",
  "date.month.march",
  "date.month.april",
  "date.month.may",
  "date.month.june",
  "date.month.july",
  "date.month.august",
  "date.month.september",
  "date.month.october",
  "date.month.november",
  "date.month.december",
];

type TimeSlotRank = { label: string; count: number };

function trimEmptyChartEdges(labels: string[], dayValues: number[], nightValues: number[]) {
  const firstDataIndex = dayValues.findIndex((value, index) => value + (nightValues[index] ?? 0) > 0);
  if (firstDataIndex === -1) return { labels, dayValues, nightValues };

  let lastDataIndex = dayValues.length - 1;
  while (lastDataIndex > firstDataIndex && dayValues[lastDataIndex] + (nightValues[lastDataIndex] ?? 0) === 0) {
    lastDataIndex -= 1;
  }

  return {
    labels: labels.slice(firstDataIndex, lastDataIndex + 1),
    dayValues: dayValues.slice(firstDataIndex, lastDataIndex + 1),
    nightValues: nightValues.slice(firstDataIndex, lastDataIndex + 1)
  };
}

function getMockLabels(locale: string) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(2026, 4, 17 + index);
    return date.toLocaleDateString(locale, { month: "short", day: "numeric" });
  });
}

/* ─── Month Picker Component ─── */
function MonthPicker({
  value,
  onChange,
  className = "",
}: {
  value: { year: number; month: number };
  onChange: (v: { year: number; month: number }) => void;
  className?: string;
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(value.year);

  const label = `${t(MONTH_KEYS[value.month])} ${value.year}`;

  function select(month: number) {
    onChange({ year: viewYear, month });
    setOpen(false);
  }

  return (
    <View className={className}>
      <Text className="mb-2 text-sm font-medium text-muted">{t("reports.selectMonth")}</Text>
      <Pressable
        className="min-h-14 flex-row items-center rounded-xl border border-line bg-white px-4 active:opacity-80"
        onPress={() => {
          setViewYear(value.year);
          setOpen(true);
        }}
      >
        <Text className="flex-1 text-base text-ink">{label}</Text>
        <ChevronRight size={18} color={colors.muted} />
      </Pressable>

      <Modal
        transparent
        visible={open}
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/30 px-4 pb-6">
          <Pressable
            className="absolute inset-0"
            onPress={() => setOpen(false)}
          />
          <View className="rounded-2xl border border-line bg-white p-4 shadow-lg">
            {/* Year navigation */}
            <View className="mb-4 flex-row items-center justify-between">
              <Pressable
                className="h-11 w-11 items-center justify-center rounded-xl border border-line"
                onPress={() => setViewYear((y) => y - 1)}
              >
                <ChevronLeft size={22} color={colors.ink} />
              </Pressable>
              <Text className="text-lg font-bold text-ink">{viewYear}</Text>
              <Pressable
                className="h-11 w-11 items-center justify-center rounded-xl border border-line"
                onPress={() => setViewYear((y) => y + 1)}
              >
                <ChevronRight size={22} color={colors.ink} />
              </Pressable>
            </View>

            {/* Month grid */}
            <View className="flex-row flex-wrap">
              {MONTH_KEYS.map((monthKey, idx) => {
                const selected = viewYear === value.year && idx === value.month;
                const isFuture =
                  viewYear > new Date().getFullYear() ||
                  (viewYear === new Date().getFullYear() &&
                    idx > new Date().getMonth());
                return (
                  <Pressable
                    key={monthKey}
                    className={`h-12 basis-1/3 items-center justify-center rounded-xl ${selected ? "bg-singha-600" : ""} ${isFuture ? "opacity-30" : ""}`}
                    disabled={isFuture}
                    onPress={() => select(idx)}
                  >
                    <Text
                      className={`text-sm font-semibold ${selected ? "text-white" : "text-ink"}`}
                    >
                      {t(monthKey).slice(0, 3)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Cancel */}
            <Pressable
              className="mt-4 min-h-12 items-center justify-center rounded-xl border border-line bg-white"
              onPress={() => setOpen(false)}
            >
              <Text className="font-semibold text-ink">{t("common.cancel")}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ─── Main Reports Screen ─── */
export default function ReportsScreen() {
  const { locale, t } = useLanguage();
  const [range, setRange] = useState<"today" | "week" | "month" | "pick_month">(
    "today",
  );
  const [reportDate] = useState(todayISO());

  // Month picker state
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState({
    year: now.getFullYear(),
    month: now.getMonth(),
  });

  const [revenue, setRevenue] = useState(hasSupabaseConfig ? 0 : 32450);
  const [acceptedCount, setAcceptedCount] = useState(hasSupabaseConfig ? 0 : 18);
  const [occupancy, setOccupancy] = useState(hasSupabaseConfig ? 0 : 72);
  const [busySlots, setBusySlots] = useState(hasSupabaseConfig ? 0 : 5);
  const [utilization, setUtilization] = useState(hasSupabaseConfig ? 0 : 31);
  const [bookedHours, setBookedHours] = useState(hasSupabaseConfig ? 0 : 2.5);
  const [targetHours, setTargetHours] = useState(hasSupabaseConfig ? 0 : 8);

  const [barsDay, setBarsDay] = useState<number[]>(hasSupabaseConfig ? [0] : barsDayMock);
  const [barsNight, setBarsNight] = useState<number[]>(hasSupabaseConfig ? [0] : barsNightMock);
  const [labels, setLabels] = useState<string[]>(() => (hasSupabaseConfig ? [t("common.today")] : getMockLabels(locale)));

  // Real busiest time slots
  const [busiestSlots, setBusiestSlots] = useState<TimeSlotRank[]>(
    hasSupabaseConfig
      ? [{ label: t("common.noData"), count: 0 }]
      : [
          { label: "7:00 PM - 8:00 PM", count: 0 },
          { label: "8:00 PM - 9:00 PM", count: 0 },
          { label: "6:00 PM - 7:00 PM", count: 0 },
          { label: "9:00 PM - 10:00 PM", count: 0 },
        ]
  );

  // Real time breakdown
  const [timeBreakdownBars, setTimeBreakdownBars] = useState<number[]>(hasSupabaseConfig ? [0] : [4500, 8200, 12000, 6500, 2400]);
  const [timeBreakdownLabels, setTimeBreakdownLabels] = useState<string[]>(hasSupabaseConfig ? [t("common.noData")] : ["8 AM", "12 PM", "4 PM", "8 PM", "10 PM"]);

  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const scrollRef = useRef<any>(null);

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setLabels(getMockLabels(locale));
      setBusiestSlots((current) => current.map((slot) => (slot.label === "No data" ? { ...slot, label: t("common.noData") } : slot)));
      setTimeBreakdownLabels((current) => current.map((label) => (label === "No data" ? t("common.noData") : label)));
    }
  }, [locale, t]);

  const loadStats = useCallback(async () => {
    if (!hasSupabaseConfig) return;

    setIsLoading(true);
    setLoadError(null);

    try {
      const client = supabase!;
      let startDate = reportDate;
      let endDate = reportDate;

      if (range === "today") {
        startDate = todayISO();
        endDate = todayISO();
      } else if (range === "week") {
        // Fixed date mutation — clone before mutating
        const d = new Date(`${reportDate}T00:00:00`);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const start = new Date(d.getTime());
        start.setDate(diff);
        startDate = start.toISOString().split("T")[0];
        const end = new Date(start.getTime());
        end.setDate(start.getDate() + 6);
        endDate = end.toISOString().split("T")[0];
      } else if (range === "month") {
        const d = new Date(`${reportDate}T00:00:00`);
        startDate = new Date(d.getFullYear(), d.getMonth(), 1)
          .toISOString()
          .split("T")[0];
        endDate = new Date(d.getFullYear(), d.getMonth() + 1, 0)
          .toISOString()
          .split("T")[0];
      } else if (range === "pick_month") {
        startDate = new Date(selectedMonth.year, selectedMonth.month, 1)
          .toISOString()
          .split("T")[0];
        endDate = new Date(selectedMonth.year, selectedMonth.month + 1, 0)
          .toISOString()
          .split("T")[0];
      }

      // Fetch bookings with their slots for accurate day/night split
      const { data: bookings, error: bookingsError } = await client
        .from("bookings")
        .select(
          "booking_id, total_price, status, booking_date, booking_slots(id, start_time, end_time, price_at_booking, slot_status)",
        )
        .gte("booking_date", startDate)
        .lte("booking_date", endDate);

      if (bookingsError) throw bookingsError;

      // Fetch blocked slots for accurate occupancy
      const { data: blockedSlots, error: blockedError } = await client
        .from("blocked_slots")
        .select("id, slot_date")
        .gte("slot_date", startDate)
        .lte("slot_date", endDate);

      if (blockedError) throw blockedError;

      const allBookings = bookings || [];
      const acceptedBookings = allBookings.filter(
        (b) => b.status === "accepted",
      );
      const totalRevenue = acceptedBookings.reduce(
        (sum, b) => sum + (b.total_price || 0),
        0,
      );

      setRevenue(totalRevenue);
      setAcceptedCount(acceptedBookings.length);

      // Count active slots across all accepted bookings
      const allActiveSlots = acceptedBookings.flatMap((b) =>
        (b.booking_slots || []).filter((s: any) => s.slot_status === "active"),
      );
      const activeSlotsCount = allActiveSlots.length;
      setBusySlots(activeSlotsCount);

      // Derive max slots from constants, minus blocked slots
      const daysDiff = Math.max(
        1,
        Math.round(
          (new Date(endDate).getTime() - new Date(startDate).getTime()) /
            (1000 * 60 * 60 * 24),
        ) + 1,
      );
      const slotsPerDay = slotTimes.length * configuredTracks.length;
      const blockedCount = blockedSlots?.length || 0;
      const maxSlotsPossible = Math.max(
        1,
        daysDiff * slotsPerDay - blockedCount,
      );
      const occupancyPct = Math.min(
        100,
        Math.round((activeSlotsCount / maxSlotsPossible) * 100),
      );
      setOccupancy(occupancyPct || 0);

      // Dynamic utilisation calculations (denominator is 8 hours per day)
      const bookedHrs = activeSlotsCount * 0.5;
      const targetHrs = daysDiff * 8;
      const utilizationPct = Math.round((bookedHrs / targetHrs) * 100);
      setBookedHours(bookedHrs);
      setTargetHours(targetHrs);
      setUtilization(utilizationPct);

      // Real day/night revenue split using actual slot start_time
      const showDailyBars =
        range === "week" || range === "month" || range === "pick_month";
      if (showDailyBars) {
        const dateLabels: string[] = [];
        const dDay: number[] = [];
        const dNight: number[] = [];

        let cur = new Date(`${startDate}T00:00:00`);
        const endLimit = new Date(`${endDate}T00:00:00`);
        while (cur <= endLimit) {
          const dateStr = cur.toISOString().split("T")[0];
          const dateLabel = cur.toLocaleDateString(locale, {
            month: "short",
            day: "numeric",
          });
          dateLabels.push(dateLabel);

          const dayBookings = acceptedBookings.filter(
            (b) => b.booking_date === dateStr,
          );

          let dayRev = 0;
          let nightRev = 0;
          for (const booking of dayBookings) {
            for (const slot of booking.booking_slots || []) {
              const price = (slot as any).price_at_booking || 0;
              if ((slot as any).start_time < NIGHT_CUTOFF) {
                dayRev += price;
              } else {
                nightRev += price;
              }
            }
          }

          dDay.push(dayRev);
          dNight.push(nightRev);

          const next = new Date(cur.getTime());
          next.setDate(cur.getDate() + 1);
          cur = next;
        }
        if (range === "month" || range === "pick_month") {
          const compactChart = trimEmptyChartEdges(dateLabels, dDay, dNight);
          setLabels(compactChart.labels);
          setBarsDay(compactChart.dayValues);
          setBarsNight(compactChart.nightValues);
        } else {
          setLabels(dateLabels);
          setBarsDay(dDay);
          setBarsNight(dNight);
        }
      } else {
        // Single-day view (today)
        let dayRev = 0;
        let nightRev = 0;
        for (const booking of acceptedBookings) {
          for (const slot of booking.booking_slots || []) {
            const price = (slot as any).price_at_booking || 0;
            if ((slot as any).start_time < NIGHT_CUTOFF) {
              dayRev += price;
            } else {
              nightRev += price;
            }
          }
        }
        setLabels([t("common.today")]);
        setBarsDay([dayRev]);
        setBarsNight([nightRev]);
      }

      // Compute real busiest time slots
      const slotCounts: Record<string, number> = {};
      for (const booking of acceptedBookings) {
        for (const slot of booking.booking_slots || []) {
          const st = (slot as any).start_time as string;
          const et = (slot as any).end_time as string;
          const key = `${shortTime(st)} - ${shortTime(et)}`;
          slotCounts[key] = (slotCounts[key] || 0) + 1;
        }
      }
      const rankedSlots = Object.entries(slotCounts)
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);
      setBusiestSlots(
        rankedSlots.length > 0 ? rankedSlots : [{ label: t("common.noData"), count: 0 }],
      );

      // Compute real time breakdown
      const timeBuckets: Record<string, number> = {};
      for (const booking of acceptedBookings) {
        for (const slot of booking.booking_slots || []) {
          const st = (slot as any).start_time as string;
          const price = (slot as any).price_at_booking || 0;
          const hour = parseInt(st.split(":")[0], 10);
          const label = shortTime(`${String(hour).padStart(2, "0")}:00`);
          timeBuckets[label] = (timeBuckets[label] || 0) + price;
        }
      }
      const sortedBuckets = Object.entries(timeBuckets).sort((a, b) => {
        return a[0].localeCompare(b[0]);
      });
      if (sortedBuckets.length > 0) {
        setTimeBreakdownLabels(sortedBuckets.map(([l]) => l));
        setTimeBreakdownBars(sortedBuckets.map(([, v]) => v));
      } else {
        setTimeBreakdownLabels([t("common.noData")]);
        setTimeBreakdownBars([0]);
      }
    } catch (err) {
      console.error("Reports loading error:", err);
      setLoadError(t("reports.loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [locale, range, reportDate, selectedMonth, t]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const isDaily =
    range === "week" || range === "month" || range === "pick_month";

  const currentBarsDay = barsDay;
  const currentBarsNight = barsNight;
  const currentLabels = labels;
  const maxTotal = Math.max(
    ...currentBarsDay.map((d, i) => d + (currentBarsNight[i] ?? 0)),
    1,
  );

  // Time breakdown max for bar scaling
  const timeMax = Math.max(...timeBreakdownBars, 1);

  // Math for target utilisation SVG progress circle (radius 45)
  const clampedUtilization = Math.min(100, Math.max(0, utilization));
  const circleRadius = 45;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset =
    circumference - (clampedUtilization / 100) * circumference;

  return (
    <Screen
      ref={scrollRef}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={loadStats} />
      }
    >
      <AppHeader
        title={t("app.clubName")}
        subtitle={t("app.subtitle")}
      />
      <View className="mb-5 flex-row items-center justify-between">
        <View>
          <Text className="text-3xl font-bold text-ink">{t("reports.title")}</Text>
          <Text className="mt-1 text-base text-muted">
            {t("reports.subtitle")}
          </Text>
        </View>
      </View>
      <SegmentedFilter
        value={range}
        onChange={setRange}
        className="flex-nowrap"
        options={[
          { label: t("reports.today"), value: "today" },
          { label: t("common.week"), value: "week" },
          { label: t("reports.month"), value: "month" },
          { label: t("reports.pickMonth"), value: "pick_month" },
        ]}
      />

      {range === "pick_month" && (
        <MonthPicker
          className="mt-5"
          value={selectedMonth}
          onChange={setSelectedMonth}
        />
      )}

      {/* Error banner */}
      {loadError && (
        <View className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <Text className="text-sm text-red-600">{loadError}</Text>
        </View>
      )}

      {/* Loading overlay */}
      {isLoading && !loadError && (
        <View className="mt-6 items-center">
          <ActivityIndicator size="large" color="#087d24" />
          <Text className="mt-2 text-sm text-muted">{t("reports.loading")}</Text>
        </View>
      )}

      <View className="mt-5 flex-row gap-3">
        <StatCard
          title={t("reports.totalRevenue")}
          value={formatCurrency(revenue)}
          icon={Coins}
          info={t("reports.totalRevenueInfo")}
        />
        <StatCard
          title={t("common.accepted")}
          value={String(acceptedCount)}
          icon={Users}
          tone="orange"
          info={t("reports.acceptedInfo")}
        />
      </View>
      <View className="mt-3 flex-row gap-3">
        <StatCard
          title={t("reports.occupancy")}
          value={`${occupancy}%`}
          icon={TrendingUp}
          info={t("reports.occupancyInfo")}
        />
        <StatCard
          title={t("reports.busySlots")}
          value={String(busySlots)}
          icon={BarChart3}
          info={t("reports.busySlotsInfo")}
        />
      </View>

      <Card className="mt-6">
        <View className="mb-5 flex-row items-center justify-between">
          <View>
            <Text className="text-xl font-bold text-ink">{t("reports.revenueOverview")}</Text>
            <View className="flex-row items-center mt-2 gap-3">
              <View className="flex-row items-center gap-1">
                <View className="w-3 h-3 rounded-full bg-green-500" />
                <Text className="text-xs text-muted">{t("reports.dayBefore")}</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <View className="w-3 h-3 rounded-full bg-gray-400" />
                <Text className="text-xs text-muted">{t("reports.nightAfter")}</Text>
              </View>
            </View>
          </View>
        </View>
        {/* Empty state for chart */}
        {currentBarsDay.every(
          (d, i) => d + (currentBarsNight[i] ?? 0) === 0,
        ) ? (
          <View className="h-64 items-center justify-center">
            <Text className="text-lg font-semibold text-muted">
              {t("reports.noRevenue")}
            </Text>
            <Text className="mt-1 text-sm text-muted">
              {t("reports.noRevenueMessage")}
            </Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName={`h-56 flex-row items-end gap-5 px-1 ${isDaily ? "" : "justify-center flex-1"}`}>
            {currentBarsDay.map((dayVal, index) => {
              const nightVal = currentBarsNight[index] ?? 0;
              const total = dayVal + nightVal;
              // Guard against division by zero
              const dayHeightPercentage =
                total > 0 ? (dayVal / total) * 100 : 0;
              const nightHeightPercentage =
                total > 0 ? (nightVal / total) * 100 : 0;
              const barHeight = total > 0 ? 24 + (total / maxTotal) * 132 : 2;

              return (
                <View
                  key={`bar-${index}`}
                  className="w-11 items-center"
                  accessibilityLabel={t("reports.accessTotal", { label: currentLabels[index], total: Math.round(total / 1000), day: Math.round(dayVal / 1000), night: Math.round(nightVal / 1000) })}
                >
                  <Text className="mb-2 h-4 text-[10px] text-ink">
                    {total > 0 ? `LKR ${Math.round(total / 1000)}K` : ""}
                  </Text>
                  <View
                    className="w-7 rounded-t-xl overflow-hidden justify-end"
                    style={{ height: barHeight }}
                  >
                    <View
                      className="w-full bg-gray-400"
                      style={{ height: `${nightHeightPercentage}%` }}
                    />
                    <View
                      className="w-full bg-green-500"
                      style={{ height: `${dayHeightPercentage}%` }}
                    />
                  </View>
                  <Text className="mt-2 text-[10px] text-muted" numberOfLines={1}>
                    {currentLabels[index]}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        )}
      </Card>

      <View className="mt-5 flex-row flex-wrap gap-3">
        {/* Real busiest time slots */}
        <Card className="flex-1">
          <Text className="mb-3 text-lg font-bold text-ink">
            {t("reports.busiestSlots")}
          </Text>
          {busiestSlots.map((slot, index) => (
            <View
              key={`busy-${index}`}
              className="flex-row items-center border-t border-line py-3"
            >
              <View className="h-7 w-7 items-center justify-center rounded-full bg-singha-600">
                <Text className="font-bold text-white">{index + 1}</Text>
              </View>
              <Text className="ml-3 flex-1 text-sm text-ink">{slot.label}</Text>
              {slot.count > 0 && (
                <Text className="text-xs text-muted">
                  {t("reports.bookingsCount", { count: slot.count })}
                </Text>
              )}
            </View>
          ))}
        </Card>
        {/* Real target utilisation based on 8 hours/day capacity */}
        <Card className="flex-1">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-bold text-ink">
              {t("reports.targetUtilisation")}
            </Text>
            <Pressable
              onPress={() =>
                Alert.alert(
                  t("reports.targetUtilisation"),
                  t("reports.targetUtilisationInfo"),
                )
              }
              className="h-5 w-5 items-center justify-center rounded-full bg-gray-100 active:opacity-60"
              hitSlop={8}
              accessibilityLabel={t("reports.targetInfoLabel")}
            >
              <Text className="text-[11px] font-bold text-gray-500">?</Text>
            </Pressable>
          </View>
          <View className="mt-5 items-center justify-center">
            <View className="h-32 w-32 items-center justify-center relative">
              <Svg width={128} height={128} viewBox="0 0 128 128">
                {/* Background Circle (Grey for not utilised portion) */}
                <Circle
                  cx="64"
                  cy="64"
                  r="45"
                  stroke="#e5e7eb"
                  strokeWidth="14"
                  fill="transparent"
                />
                {/* Foreground Circle (Green for utilised portion) */}
                <Circle
                  cx="64"
                  cy="64"
                  r="45"
                  stroke="#087d24"
                  strokeWidth="14"
                  fill="transparent"
                  strokeDasharray={`${circumference}`}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  rotation="-90"
                  origin="64, 64"
                />
              </Svg>
              <View className="absolute inset-0 items-center justify-center">
                <Text className="font-bold text-ink text-center text-lg">
                  {utilization}%
                </Text>
              </View>
            </View>
            <Text className="mt-4 font-semibold text-ink">{t("reports.hoursBooked")}</Text>
            <Text className="mt-1 text-xs text-muted text-center">
              {t("reports.hoursTarget", { booked: bookedHours, target: targetHours })}
            </Text>
            <Text className="mt-1 text-[10px] text-muted italic">
              {t("reports.standardTarget")}
            </Text>
          </View>
        </Card>
      </View>

      {/* Real time breakdown chart */}
      <Card className="mt-5 mb-5">
        <View className="mb-5 flex-row items-center justify-between">
          <View>
            <Text className="text-xl font-bold text-ink">{t("reports.timeBreakdown")}</Text>
            <View className="flex-row items-center mt-2 gap-3">
              <View className="flex-row items-center gap-1">
                <View className="w-3 h-3 rounded-full bg-green-500" />
                <Text className="text-xs text-muted">{t("reports.day")}</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <View className="w-3 h-3 rounded-full bg-gray-400" />
                <Text className="text-xs text-muted">{t("reports.night")}</Text>
              </View>
            </View>
          </View>
        </View>
        {timeBreakdownBars.every((v) => v === 0) ? (
          <View className="h-64 items-center justify-center">
            <Text className="text-lg font-semibold text-muted">
              {t("reports.noTime")}
            </Text>
            <Text className="mt-1 text-sm text-muted">
              {t("reports.noTimeMessage")}
            </Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="h-56 flex-row items-end gap-5 px-1">
            {timeBreakdownBars.map((value, index) => {
              const label = timeBreakdownLabels[index];
              const isDay =
                label.includes("AM") ||
                label === "12:00 PM" ||
                label === "1:00 PM";
              return (
                <View
                  key={`time-${index}`}
                  className="w-11 items-center"
                  accessibilityLabel={t("reports.accessRevenue", { label, total: Math.round(value / 1000) })}
                >
                  <Text className="mb-2 h-4 text-[10px] text-ink">
                    {value > 0 ? `LKR ${Math.round(value / 1000)}K` : ""}
                  </Text>
                  <View
                    className={`w-7 rounded-t-xl ${isDay ? "bg-green-500" : "bg-gray-400"}`}
                    style={{ height: value > 0 ? 24 + (value / timeMax) * 132 : 2 }}
                  />
                  <Text className="mt-2 text-[10px] text-muted" numberOfLines={1}>{label}</Text>
                </View>
              );
            })}
          </ScrollView>
        )}
      </Card>
    </Screen>
  );
}
