import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { Pressable, Text, View, ScrollView, Alert } from "react-native";
import { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { AppHeader } from "@/components/AppHeader";
import { DatePickerField } from "@/components/ui/DatePickerField";
import { ErrorState, LoadingState } from "@/components/ui/StateView";
import { Screen } from "@/components/ui/Screen";
import { addDays, formatDateLabel, todayISO, displayTimeToDb } from "@/lib/date";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useLanguage } from "@/hooks/useLanguage";
import { useTracks } from "@/hooks/useTracks";
import { slotTimes } from "@/constants/booking";
import { requireSupabase, hasSupabaseConfig } from "@/lib/supabase";
import type { BookingStatus, BookingSlot, BlockedSlot } from "@/types/database";

const toHHMM = (timeStr: string) => {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
};

export default function ScheduleScreen() {
  const { locale, t } = useLanguage();
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const { tracks, error: tracksError, loading: tracksLoading } = useTracks();

  const { data, error, loading, refresh } = useAsyncData(
    async () => {
      if (!hasSupabaseConfig) {
        return { data: { bookingSlots: [], blockedSlots: [] }, error: null };
      }
      const client = requireSupabase();
      const [bookingSlotsRes, blockedSlotsRes] = await Promise.all([
        client
          .from("booking_slots")
          .select(`
            id,
            booking_id,
            track_id,
            slot_date,
            start_time,
            end_time,
            price_at_booking,
            slot_status,
            bookings (
              booking_id,
              booking_reference,
              status,
              number_of_people,
              customers (
                full_name
              )
            )
          `)
          .eq("slot_date", selectedDate)
          .eq("slot_status", "active"),
        client
          .from("blocked_slots")
          .select("*")
          .eq("slot_date", selectedDate)
      ]);

      if (bookingSlotsRes.error) throw bookingSlotsRes.error;
      if (blockedSlotsRes.error) throw blockedSlotsRes.error;

      return {
        data: {
          bookingSlots: (bookingSlotsRes.data as unknown as BookingSlot[]) ?? [],
          blockedSlots: (blockedSlotsRes.data as BlockedSlot[]) ?? []
        },
        error: null
      };
    },
    [selectedDate]
  );

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const timeSlots = useMemo(() => {
    const slots: { startTime: string; endTime: string; label: string }[] = [];
    for (let i = 0; i < slotTimes.length; i++) {
      const startStr = slotTimes[i];
      const endStr = slotTimes[i + 1];
      if (!endStr) continue;

      // Skip the index 11 gap between 11:30 AM and 6:00 PM
      if (i === 11) continue;

      slots.push({
        startTime: displayTimeToDb(startStr),
        endTime: displayTimeToDb(endStr),
        label: startStr
      });
    }
    return slots;
  }, []);

  const dayStrip = useMemo(() => {
    return [-3, -2, -1, 0, 1, 2, 3].map((offset) => {
      const date = addDays(selectedDate, offset);
      return {
        value: date,
        day: new Intl.DateTimeFormat(locale, { weekday: "short" }).format(new Date(`${date}T00:00:00`)),
        date: new Intl.DateTimeFormat(locale, { day: "2-digit" }).format(new Date(`${date}T00:00:00`))
      };
    });
  }, [locale, selectedDate]);

  return (
    <Screen>
      <AppHeader title={t("schedule.title")} subtitle={t("schedule.subtitle")} />

      <View className="mb-5 flex-row items-center gap-2">
        <Pressable 
          className="h-12 w-12 items-center justify-center rounded-xl border border-line bg-white active:bg-gray-50" 
          onPress={() => setSelectedDate(addDays(selectedDate, -1))}
        >
          <ChevronLeft size={24} color="#101827" />
        </Pressable>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3 px-1 flex-row items-center">
          {dayStrip.map((item) => {
            const active = item.value === selectedDate;
            return (
              <Pressable 
                key={item.value} 
                className={`items-center rounded-2xl px-3 py-2 min-w-[55px] ${active ? "bg-singha-600 shadow-sm shadow-singha-400" : "bg-white border border-line"}`} 
                onPress={() => setSelectedDate(item.value)}
              >
                <Text className={active ? "text-white text-xs font-semibold" : "text-muted text-xs"}>{item.day}</Text>
                <Text className={`text-base font-bold ${active ? "text-white" : "text-ink"}`}>{item.date}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <Pressable 
          className="h-12 w-12 items-center justify-center rounded-xl border border-line bg-white active:bg-gray-50" 
          onPress={() => setSelectedDate(addDays(selectedDate, 1))}
        >
          <ChevronRight size={24} color="#101827" />
        </Pressable>
      </View>

      <Text className="mb-5 text-center text-xl font-bold text-ink">{formatDateLabel(selectedDate, locale)}</Text>
      <DatePickerField className="mb-6" label={t("schedule.goToDate")} value={selectedDate} onChange={setSelectedDate} />

      {tracksLoading || loading ? <LoadingState label={t("schedule.loading")} /> : null}
      {tracksError || error ? <ErrorState message={tracksError ?? error ?? ""} /> : null}

      {/* Track Headers Row */}
      <View className="flex-row items-center mb-3 pr-1">
        {/* Time Spacer */}
        <View className="w-16" />
        {tracks.map((track) => (
          <View key={track.id} className="flex-1 items-center bg-gray-50 border border-line rounded-xl py-2 mx-1 shadow-sm">
            <Text className="text-sm font-extrabold text-ink">{track.track_name}</Text>
          </View>
        ))}
      </View>

      {/* Timetable Rows ScrollView */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-10">
        {timeSlots.map((timeSlot) => {
          return (
            <View key={timeSlot.startTime} className="flex-row items-center mb-3 pr-1">
              {/* Time Column */}
              <View className="w-16 justify-center items-center">
                <Text className="text-[11px] font-bold text-ink text-center leading-4">{timeSlot.label.replace(" ", "\n")}</Text>
                <Text className="text-[9px] text-muted font-semibold mt-0.5">{t("schedule.thirtyMin")}</Text>
              </View>

              {/* Court Columns */}
              {tracks.map((trackItem) => {
                const bookedSlot = data?.bookingSlots.find(
                  (s) => s.track_id === trackItem.id && toHHMM(s.start_time) === timeSlot.startTime
                );

                const blockedSlot = data?.blockedSlots.find(
                  (s) => s.track_id === trackItem.id && toHHMM(s.start_time) === timeSlot.startTime
                );

                let status: BookingStatus | "blocked" | "available" = "available";
                let title = t("schedule.noBooking");
                let subtitle = t("schedule.tapToBook");

                if (blockedSlot) {
                  status = "blocked";
                  title = blockedSlot.reason || t("schedule.staffBlocked");
                  subtitle = t("common.unavailable");
                } else if (bookedSlot) {
                  const booking = bookedSlot.bookings;
                  status = (booking?.status as BookingStatus) ?? "accepted";
                  const isFuture = bookedSlot.slot_date > todayISO();
                  title = isFuture ? t("schedule.bookedSession") : (booking?.customers?.full_name ?? t("schedule.bookedSession"));
                  subtitle = booking?.booking_reference 
                    ? `#${booking.booking_reference.replace("SCB-2026-", "")}`
                    : t("common.details");
                }

                const handlePress = () => {
                  if (blockedSlot) {
                    Alert.alert(t("schedule.blockedSlotTitle"), t("schedule.blockedSlotMessage", { title }));
                  } else if (bookedSlot && bookedSlot.bookings?.booking_id) {
                    router.push(`/booking/${bookedSlot.bookings.booking_id}`);
                  } else {
                    Alert.alert(
                      t("schedule.availableSlotTitle"),
                      t("schedule.availableSlotMessage", { track: trackItem.track_name, time: timeSlot.label }),
                      [
                        { text: t("common.ok"), style: "cancel" },
                        { text: t("schedule.goToCreate"), onPress: () => router.replace("/(tabs)/create-booking") }
                      ]
                    );
                  }
                };

                return (
                  <View key={trackItem.id} className="flex-1 mx-1">
                    <ScheduleTile
                      title={title}
                      subtitle={subtitle}
                      status={status}
                      statusTextLabels={{
                        open: t("common.open"),
                        blocked: t("common.blocked"),
                        accepted: t("common.accepted"),
                        submitted: t("schedule.submittedShort"),
                        onHold: t("schedule.holdShort"),
                        rejected: t("schedule.rejectedShort")
                      }}
                      onPress={handlePress}
                    />
                  </View>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

interface TileProps {
  title: string;
  subtitle: string;
  status: BookingStatus | "blocked" | "available";
  statusTextLabels: {
    open: string;
    blocked: string;
    accepted: string;
    submitted: string;
    onHold: string;
    rejected: string;
  };
  onPress: () => void;
}

function ScheduleTile({ title, subtitle, status, statusTextLabels, onPress }: TileProps) {
  const isBlocked = status === "blocked";

  let bgClass = "bg-white border-line active:bg-gray-50";
  let textClass = "text-ink";
  let statusText = statusTextLabels.open;
  let statusColor = "text-emerald-600 bg-emerald-50";

  if (isBlocked) {
    bgClass = "bg-rose-50/60 border-rose-200 active:bg-rose-100/50";
    textClass = "text-rose-900";
    statusText = statusTextLabels.blocked;
    statusColor = "text-rose-700 bg-rose-100";
  } else if (status === "accepted") {
    bgClass = "bg-green-50/70 border-green-200 active:bg-green-100/60";
    textClass = "text-green-900";
    statusText = statusTextLabels.accepted;
    statusColor = "text-green-700 bg-green-100";
  } else if (status === "submitted" || status === "on_hold") {
    bgClass = "bg-amber-50/70 border-amber-200 active:bg-amber-100/60";
    textClass = "text-amber-900";
    statusText = status === "submitted" ? statusTextLabels.submitted : statusTextLabels.onHold;
    statusColor = "text-amber-700 bg-amber-100";
  } else if (status === "rejected") {
    bgClass = "bg-gray-50 border-gray-300 active:bg-gray-100";
    textClass = "text-gray-500 line-through";
    statusText = statusTextLabels.rejected;
    statusColor = "text-gray-500 bg-gray-100";
  }

  return (
    <Pressable
      onPress={onPress}
      className={`rounded-xl border p-2 flex-col justify-between shadow-sm transition-all duration-150 ${bgClass}`}
      style={{ height: 70 }}
    >
      <View>
        <Text className={`text-xs font-extrabold leading-4 ${textClass}`} numberOfLines={2}>
          {title}
        </Text>
      </View>
      <View className="flex-row items-center justify-between mt-1 pt-1 border-t border-black/5">
        <Text className="text-[9px] text-muted font-bold" numberOfLines={1}>
          {subtitle}
        </Text>
        <View className={`rounded-full px-1.5 py-0.5 ${statusColor}`}>
          <Text className="text-[8px] font-extrabold uppercase leading-3">{statusText}</Text>
        </View>
      </View>
    </Pressable>
  );
}
