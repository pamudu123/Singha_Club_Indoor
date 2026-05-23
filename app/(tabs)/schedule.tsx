import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { SegmentedFilter } from "@/components/SegmentedFilter";
import { Card } from "@/components/ui/Card";
import { DatePickerField } from "@/components/ui/DatePickerField";
import { StatusChip } from "@/components/ui/StatusChip";
import { ErrorState, LoadingState } from "@/components/ui/StateView";
import { Screen } from "@/components/ui/Screen";
import { addDays, displayTime, formatDateLabel, todayISO } from "@/lib/date";
import { getDaySchedule } from "@/lib/scheduleService";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useTracks } from "@/hooks/useTracks";
import type { BookingStatus } from "@/types/database";

export default function ScheduleScreen() {
  const [track, setTrack] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const { tracks, trackOptions, error: tracksError, loading: tracksLoading } = useTracks();
  const { data, error, loading } = useAsyncData(
    () =>
      track
        ? getDaySchedule({ selectedDate, trackId: track })
        : Promise.resolve({ data: { bookingSlots: [], blockedSlots: [] }, error: null }),
    [track, selectedDate]
  );

  useEffect(() => {
    if (!track && tracks[0]) setTrack(tracks[0].id);
    if (track && tracks.length && !tracks.some((item) => item.id === track)) setTrack(tracks[0].id);
  }, [track, tracks]);
  const dayStrip = [-3, -2, -1, 0, 1, 2, 3].map((offset) => {
    const date = addDays(selectedDate, offset);
    return {
      value: date,
      day: new Intl.DateTimeFormat("en-LK", { weekday: "short" }).format(new Date(`${date}T00:00:00`)),
      date: new Intl.DateTimeFormat("en-LK", { day: "2-digit" }).format(new Date(`${date}T00:00:00`))
    };
  });

  return (
    <Screen>
      <AppHeader title="Schedule" subtitle="View and manage court schedules" />
      <View className="mb-5 flex-row items-center justify-between">
        <Pressable className="h-12 w-12 items-center justify-center rounded-xl border border-line bg-white" onPress={() => setSelectedDate(addDays(selectedDate, -1))}>
          <ChevronLeft size={24} color="#101827" />
        </Pressable>
        {dayStrip.map((item) => {
          const active = item.value === selectedDate;
          return (
            <Pressable key={item.value} className={`items-center rounded-2xl px-3 py-2 ${active ? "bg-singha-600" : ""}`} onPress={() => setSelectedDate(item.value)}>
              <Text className={active ? "text-white" : "text-ink"}>{item.day}</Text>
              <Text className={`text-xl font-bold ${active ? "text-white" : "text-ink"}`}>{item.date}</Text>
            </Pressable>
          );
        })}
        <Pressable className="h-12 w-12 items-center justify-center rounded-xl border border-line bg-white" onPress={() => setSelectedDate(addDays(selectedDate, 1))}>
          <ChevronRight size={24} color="#101827" />
        </Pressable>
      </View>
      <Text className="mb-5 text-center text-xl font-semibold text-ink">{formatDateLabel(selectedDate)}</Text>
      <DatePickerField className="mb-5" label="Booking Date" value={selectedDate} onChange={setSelectedDate} />

      <SegmentedFilter
        value={track}
        onChange={setTrack}
        options={trackOptions}
      />

      {tracksLoading || loading ? <LoadingState label="Loading schedule..." /> : null}
      {tracksError || error ? <ErrorState message={tracksError ?? error ?? ""} /> : null}

      <Card className="mt-5">
        {data?.bookingSlots.map((slot) => {
          const status = slot.bookings?.status ?? "accepted";
          const booking = slot.bookings;
          return (
            <ScheduleRow
              key={slot.id}
              time={`${displayTime(slot.start_time)} - ${displayTime(slot.end_time)}`}
              title={booking?.booking_reference ?? "Booked slot"}
              subtitle={`${booking?.number_of_people ?? 0} people`}
              status={status as BookingStatus}
            />
          );
        })}
        {data?.blockedSlots.map((slot) => (
          <ScheduleRow key={slot.id} time={`${displayTime(slot.start_time)} - ${displayTime(slot.end_time)}`} title={slot.reason} subtitle="Unavailable" status="blocked" />
        ))}
      </Card>
    </Screen>
  );
}

function ScheduleRow({
  time,
  title,
  subtitle,
  status
}: {
  time: string;
  title: string;
  subtitle: string;
  status: BookingStatus | "blocked";
}) {
  const border = status === "blocked" ? "border-l-rose-500 bg-rose-50" : status === "submitted" || status === "on_hold" ? "border-l-orange-500 bg-orange-50" : "border-l-singha-600 bg-green-50";
  return (
    <View className={`mb-3 rounded-xl border border-l-4 p-4 ${border}`}>
      <View className="flex-row items-start justify-between">
        <View>
          <Text className="text-base text-ink">{time}</Text>
          <Text className="mt-2 text-lg font-bold text-ink">{title}</Text>
          <Text className="mt-1 text-muted">{subtitle}</Text>
        </View>
        <StatusChip status={status} />
      </View>
    </View>
  );
}
