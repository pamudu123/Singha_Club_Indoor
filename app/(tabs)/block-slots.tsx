import { LockKeyhole, Trash2 } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { AppButton } from "@/components/ui/AppButton";
import { Card } from "@/components/ui/Card";
import { DatePickerField } from "@/components/ui/DatePickerField";
import { SelectField } from "@/components/ui/SelectField";
import { Screen } from "@/components/ui/Screen";
import { localAdminId } from "@/constants/admin";
import { slotTimes } from "@/constants/booking";
import { useAuth } from "@/hooks/useAuth";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useLanguage } from "@/hooks/useLanguage";
import { useTracks } from "@/hooks/useTracks";
import { createBlockedSlots, deleteBlockedSlot, listBlockedSlots } from "@/lib/scheduleService";
import { displayTime, displayTimeToDb, formatDateLabel, makeThirtyMinuteSlots, todayISO } from "@/lib/date";

const reasonOptions = ["Maintenance", "Private event", "School session", "Club event", "Unavailable", "Other"] as const;
type Reason = (typeof reasonOptions)[number];
const reasonKeyMap: Record<Reason, string> = {
  Maintenance: "reason.maintenance",
  "Private event": "reason.privateEvent",
  "School session": "reason.schoolSession",
  "Club event": "reason.clubEvent",
  Unavailable: "reason.unavailable",
  Other: "reason.other"
};
const timeOptions = slotTimes.map((time) => ({ label: time, value: displayTimeToDb(time) }));

export default function BlockSlotsScreen() {
  const { admin } = useAuth();
  const { locale, t } = useLanguage();
  const [track, setTrack] = useState<string>("");
  const [slotDate, setSlotDate] = useState(todayISO());
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("20:00");
  const [reason, setReason] = useState<Reason>("Maintenance");
  const [loading, setLoading] = useState(false);
  const { tracks, trackOptions, error: tracksError, loading: tracksLoading } = useTracks();
  const slots = useMemo(() => makeThirtyMinuteSlots(startTime, endTime), [startTime, endTime]);
  const { data: existingBlockedSlots, error, loading: blockedLoading, refresh } = useAsyncData(
    () => (track ? listBlockedSlots({ trackId: track, slotDate }) : Promise.resolve({ data: [], error: null })),
    [track, slotDate]
  );

  useEffect(() => {
    if (!track && tracks[0]) setTrack(tracks[0].id);
    if (track && tracks.length && !tracks.some((item) => item.id === track)) setTrack(tracks[0].id);
  }, [track, tracks]);

  async function submit() {
    if (!track) {
      Alert.alert(t("create.trackRequired"), t("block.trackRequiredMessage"));
      return;
    }
    if (!slots.length) {
      Alert.alert(t("block.invalidRange"), t("block.invalidRangeMessage"));
      return;
    }
    setLoading(true);
    const result = await createBlockedSlots({
      trackId: track,
      slotDate,
      slots,
      reason,
      adminId: admin?.id ?? localAdminId
    });
    setLoading(false);
    if (result.error) Alert.alert(t("block.failed"), result.error);
    else {
      Alert.alert(t("block.saved"), t("block.savedMessage", { count: slots.length }));
      refresh();
    }
  }

  async function removeBlockedSlot(slotId: string) {
    const result = await deleteBlockedSlot(slotId);
    if (result.error) Alert.alert(t("block.removeFailed"), result.error);
    else refresh();
  }

  return (
    <Screen>
      <AppHeader title={t("block.title")} subtitle={t("app.subtitle")} showBack />
      <Card>
        <View className="gap-4">
          <SelectField
            label={t("create.track")}
            value={track}
            onChange={setTrack}
            options={trackOptions}
          />
          {tracksLoading ? <Text className="text-muted">{t("create.loadingTracks")}</Text> : null}
          {tracksError ? <Text className="text-red-500">{tracksError}</Text> : null}
          <DatePickerField label={t("block.date")} value={slotDate} onChange={setSlotDate} />
          <SelectField label={t("block.startTime")} value={startTime} onChange={setStartTime} options={timeOptions} />
          <SelectField label={t("block.endTime")} value={endTime} onChange={setEndTime} options={timeOptions} />
          <SelectField label={t("block.reason")} value={reason} onChange={setReason} options={reasonOptions.map((item) => ({ label: t(reasonKeyMap[item]), value: item }))} />
        </View>
        <Text className="mt-4 text-muted">{t("block.note")}</Text>
        <Text className="mb-3 mt-6 text-xl font-bold text-ink">{t("block.toBeBlocked", { count: slots.length })}</Text>
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
        <AppButton className="mt-5" title={t("block.action")} icon={LockKeyhole} loading={loading} onPress={submit} />
      </Card>

      <Card className="mt-5">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-xl font-bold text-ink">{t("block.existing")}</Text>
          <Text className="font-semibold text-singha-700">{formatDateLabel(slotDate, locale)}</Text>
        </View>
        {blockedLoading ? <Text className="py-4 text-muted">{t("block.loading")}</Text> : null}
        {error ? <Text className="py-4 text-red-500">{error}</Text> : null}
        {!blockedLoading && existingBlockedSlots?.length === 0 ? <Text className="py-4 text-muted">{t("block.empty")}</Text> : null}
        {existingBlockedSlots?.map((slot) => (
          <View key={slot.id} className="flex-row items-center border-t border-line py-4">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <LockKeyhole size={24} color="#f04438" />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-base font-semibold text-ink">
                {displayTime(slot.start_time)} - {displayTime(slot.end_time)} - {slot.tracks?.track_name}
              </Text>
              <Text className="mt-1 text-muted">{reasonKeyMap[slot.reason as Reason] ? t(reasonKeyMap[slot.reason as Reason]) : slot.reason}</Text>
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
