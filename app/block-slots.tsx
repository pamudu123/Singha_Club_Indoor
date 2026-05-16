import { LockKeyhole, Trash2 } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { AppButton } from "@/components/ui/AppButton";
import { Card } from "@/components/ui/Card";
import { DatePickerField } from "@/components/ui/DatePickerField";
import { SelectField } from "@/components/ui/SelectField";
import { Screen } from "@/components/ui/Screen";
import { slotTimes, tracks } from "@/constants/mockData";
import { useAuth } from "@/hooks/useAuth";
import { useAsyncData } from "@/hooks/useAsyncData";
import { createBlockedSlots, deleteBlockedSlot, listBlockedSlots } from "@/lib/scheduleService";
import { displayTime, displayTimeToDb, formatDateLabel, makeThirtyMinuteSlots, todayISO } from "@/lib/date";

const reasonOptions = ["Maintenance", "Private event", "School session", "Club event", "Unavailable", "Other"] as const;
type Reason = (typeof reasonOptions)[number];
const timeOptions = slotTimes.map((time) => ({ label: time, value: displayTimeToDb(time) }));

export default function BlockSlotsScreen() {
  const { admin } = useAuth();
  const [track, setTrack] = useState<string>(tracks[0].id);
  const [slotDate, setSlotDate] = useState(todayISO());
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("20:00");
  const [reason, setReason] = useState<Reason>("Maintenance");
  const [loading, setLoading] = useState(false);
  const slots = useMemo(() => makeThirtyMinuteSlots(startTime, endTime), [startTime, endTime]);
  const { data: existingBlockedSlots, error, loading: blockedLoading, refresh } = useAsyncData(
    () => listBlockedSlots({ trackId: track, slotDate }),
    [track, slotDate]
  );

  async function submit() {
    if (!slots.length) {
      Alert.alert("Invalid time range", "End time must be after start time and use 30-minute intervals.");
      return;
    }
    setLoading(true);
    const result = await createBlockedSlots({
      trackId: track,
      slotDate,
      slots,
      reason,
      adminId: admin?.id ?? "local-admin"
    });
    setLoading(false);
    if (result.error) Alert.alert("Could not block slots", result.error);
    else {
      Alert.alert("Slots blocked", `${slots.length} slots are now unavailable.`);
      refresh();
    }
  }

  async function removeBlockedSlot(slotId: string) {
    const result = await deleteBlockedSlot(slotId);
    if (result.error) Alert.alert("Could not remove slot", result.error);
    else refresh();
  }

  return (
    <Screen>
      <AppHeader title="Block Slots" subtitle="Indoor Cricket Booking System" showBack />
      <Card>
        <View className="gap-4">
          <SelectField
            label="Track *"
            value={track}
            onChange={setTrack}
            options={tracks.map((item) => ({ label: item.track_name, value: item.id }))}
          />
          <DatePickerField label="Date *" value={slotDate} onChange={setSlotDate} />
          <SelectField label="Start Time *" value={startTime} onChange={setStartTime} options={timeOptions} />
          <SelectField label="End Time *" value={endTime} onChange={setEndTime} options={timeOptions} />
          <SelectField label="Reason *" value={reason} onChange={setReason} options={reasonOptions.map((item) => ({ label: item, value: item }))} />
        </View>
        <Text className="mt-4 text-muted">You can block slots in 30-minute intervals.</Text>
        <Text className="mb-3 mt-6 text-xl font-bold text-ink">Slots to be blocked ({slots.length})</Text>
        <View className="flex-row flex-wrap gap-3">
          {slots.map((slot) => (
            <View key={slot.startTime} className="min-h-16 min-w-[45%] flex-row items-center rounded-xl border border-red-200 bg-red-50 p-3">
              <LockKeyhole size={24} color="#f04438" />
              <Text className="ml-3 font-semibold text-ink">
                {displayTime(slot.startTime)} - {displayTime(slot.endTime)}
              </Text>
            </View>
          ))}
        </View>
        <AppButton className="mt-5" title="Block Slots" icon={LockKeyhole} loading={loading} onPress={submit} />
      </Card>

      <Card className="mt-5">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-xl font-bold text-ink">Existing Blocked Slots</Text>
          <Text className="font-semibold text-singha-700">{formatDateLabel(slotDate)}</Text>
        </View>
        {blockedLoading ? <Text className="py-4 text-muted">Loading blocked slots...</Text> : null}
        {error ? <Text className="py-4 text-red-500">{error}</Text> : null}
        {!blockedLoading && existingBlockedSlots?.length === 0 ? <Text className="py-4 text-muted">No blocked slots for this date and track.</Text> : null}
        {existingBlockedSlots?.map((slot) => (
          <View key={slot.id} className="flex-row items-center border-t border-line py-4">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <LockKeyhole size={24} color="#f04438" />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-base font-semibold text-ink">
                {displayTime(slot.start_time)} - {displayTime(slot.end_time)} - {slot.tracks?.track_name}
              </Text>
              <Text className="mt-1 text-muted">{slot.reason}</Text>
            </View>
            <Pressable className="h-11 w-11 items-center justify-center rounded-xl border border-red-200" onPress={() => removeBlockedSlot(slot.id)}>
              <Trash2 size={21} color="#f04438" />
            </Pressable>
          </View>
        ))}
      </Card>
    </Screen>
  );
}
