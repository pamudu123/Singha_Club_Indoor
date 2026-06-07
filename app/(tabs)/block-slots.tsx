import { ChevronDown, ChevronRight, LockKeyhole, PlusCircle, Trash2, X } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { AppButton } from "@/components/ui/AppButton";
import { Card } from "@/components/ui/Card";
import { DatePickerField } from "@/components/ui/DatePickerField";
import { Screen } from "@/components/ui/Screen";
import { SelectField } from "@/components/ui/SelectField";
import { LoadingState } from "@/components/ui/StateView";
import { localAdminId } from "@/constants/admin";
import { slotTimes } from "@/constants/booking";
import { colors } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useLanguage } from "@/hooks/useLanguage";
import { useTracks } from "@/hooks/useTracks";
import { addDays, displayTime, displayTimeToDb, formatDateLabel, makeThirtyMinuteSlots, todayISO } from "@/lib/date";
import { createBlockedSlots, deleteBlockedSlot, listBlockedSlots } from "@/lib/scheduleService";
import type { BlockedSlot } from "@/types/database";

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
  const [slotEndDate, setSlotEndDate] = useState(todayISO());
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("20:00");
  const [reason, setReason] = useState<Reason>("Maintenance");
  const [formOpen, setFormOpen] = useState(false);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { tracks, trackOptions, error: tracksError, loading: tracksLoading } = useTracks();
  const slots = useMemo(() => makeThirtyMinuteSlots(startTime, endTime), [startTime, endTime]);
  const blockDates = useMemo(() => makeDateRange(slotDate, slotEndDate), [slotDate, slotEndDate]);
  const { data: futureBlockedSlots, error: futureError, loading: futureLoading, refresh: refreshFutureBlockedSlots } = useAsyncData(
    () => listBlockedSlots({ fromDate: todayISO() }),
    []
  );
  const { data: existingBlockedSlots, error: formError, loading: formBlockedLoading, refresh: refreshFormBlockedSlots } = useAsyncData(
    () => (formOpen && track && blockDates.length ? listBlockedSlots({ trackId: track, fromDate: slotDate, toDate: slotEndDate }) : Promise.resolve({ data: [], error: null })),
    [blockDates.length, formOpen, slotDate, slotEndDate, track]
  );
  const blockedDayGroups = useMemo(() => groupBlockedSlotsByDate(futureBlockedSlots ?? []), [futureBlockedSlots]);
  const existingSlotKeys = useMemo(
    () => new Set((existingBlockedSlots ?? []).filter((slot) => slot.slot_date >= slotDate && slot.slot_date <= slotEndDate).map((slot) => `${slot.slot_date}-${slot.start_time}-${slot.end_time}`)),
    [existingBlockedSlots, slotDate, slotEndDate]
  );
  const candidateBlockedSlots = useMemo(
    () => blockDates.flatMap((date) => slots.map((slot) => ({ date, startTime: slot.startTime, endTime: slot.endTime }))),
    [blockDates, slots]
  );
  const newBlockedSlots = useMemo(
    () => candidateBlockedSlots.filter((slot) => !existingSlotKeys.has(`${slot.date}-${slot.startTime}-${slot.endTime}`)),
    [candidateBlockedSlots, existingSlotKeys]
  );
  const duplicateSlotCount = candidateBlockedSlots.length - newBlockedSlots.length;
  const summaryTimeRange = useMemo(
    () => (slots.length ? `${displayTime(slots[0].startTime)} - ${displayTime(slots[slots.length - 1].endTime)}` : ""),
    [slots]
  );

  useEffect(() => {
    if (slotEndDate < slotDate) setSlotEndDate(slotDate);
  }, [slotDate, slotEndDate]);

  useEffect(() => {
    if (track && tracks.length && !tracks.some((item) => item.id === track)) setTrack(tracks[0].id);
    if (!track && tracks[0]) setTrack(tracks[0].id);
  }, [track, tracks]);

  function resetForm() {
    const currentToday = todayISO();
    setTrack(tracks[0]?.id ?? "");
    setSlotDate(currentToday);
    setSlotEndDate(currentToday);
    setStartTime("18:00");
    setEndTime("20:00");
    setReason("Maintenance");
  }

  function openAddForm() {
    resetForm();
    setFormOpen(true);
  }

  function closeForm() {
    resetForm();
    setFormOpen(false);
  }

  async function submit() {
    if (!track) {
      Alert.alert(t("create.trackRequired"), t("block.trackRequiredMessage"));
      return;
    }
    if (formBlockedLoading) {
      return;
    }
    if (!blockDates.length) {
      Alert.alert(t("block.invalidDateRange"), t("block.invalidDateRangeMessage"));
      return;
    }
    if (!slots.length) {
      Alert.alert(t("block.invalidRange"), t("block.invalidRangeMessage"));
      return;
    }
    if (!newBlockedSlots.length) {
      Alert.alert(t("block.alreadyBlocked"), t("block.alreadyBlockedMessage"));
      return;
    }
    setLoading(true);
    const result = await createBlockedSlots({
      trackId: track,
      slotDates: blockDates,
      slots,
      reason,
      adminId: admin?.id ?? localAdminId
    });
    setLoading(false);
    if (result.error) Alert.alert(t("block.failed"), result.error);
    else {
      Alert.alert(t("block.saved"), t("block.savedMessage", { count: result.insertedCount ?? newBlockedSlots.length }));
      setFormOpen(false);
      setExpandedDate(slotDate);
      resetForm();
      refreshFormBlockedSlots();
      refreshFutureBlockedSlots();
    }
  }

  async function removeBlockedSlot(slotId: string) {
    setDeletingId(slotId);
    const result = await deleteBlockedSlot(slotId);
    setDeletingId(null);
    if (result.error) Alert.alert(t("block.removeFailed"), result.error);
    else {
      refreshFormBlockedSlots();
      refreshFutureBlockedSlots();
    }
  }

  return (
    <Screen>
      <AppHeader title={t("block.title")} subtitle={t("app.subtitle")} showBack />

      <View className="mb-5 flex-row items-center justify-between">
        <Text className="flex-1 text-base text-ink">{t("block.futureDays")}</Text>
        <AppButton title={t("block.addBlockingSlots")} icon={PlusCircle} className="ml-3" onPress={openAddForm} />
      </View>

      {formOpen ? (
        <Card className="mb-5">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-xl font-bold text-ink">{t("block.addBlockingSlots")}</Text>
            <Pressable className="h-10 w-10 items-center justify-center rounded-xl border border-line" onPress={closeForm}>
              <X size={20} color={colors.muted} />
            </Pressable>
          </View>
          <View className="gap-4">
            <SelectField label={t("create.track")} value={track} onChange={setTrack} options={trackOptions} />
            {tracksLoading ? <Text className="text-muted">{t("create.loadingTracks")}</Text> : null}
            {tracksError ? <Text className="text-red-500">{tracksError}</Text> : null}
            <DatePickerField label={t("block.fromDate")} value={slotDate} onChange={setSlotDate} minDate={todayISO()} />
            <DatePickerField label={t("block.toDate")} value={slotEndDate} onChange={setSlotEndDate} minDate={slotDate} />
            <SelectField label={t("block.startTime")} value={startTime} onChange={setStartTime} options={timeOptions} />
            <SelectField label={t("block.endTime")} value={endTime} onChange={setEndTime} options={timeOptions} />
            <SelectField label={t("block.reason")} value={reason} onChange={setReason} options={reasonOptions.map((item) => ({ label: t(reasonKeyMap[item]), value: item }))} />
          </View>
          <Text className="mt-4 text-muted">{t("block.note")}</Text>
          <View className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4">
            <View className="flex-row items-center">
              <LockKeyhole size={22} color="#f04438" />
              <Text className="ml-3 flex-1 text-base font-semibold text-ink">{t("block.summary", { days: blockDates.length, slots: slots.length, total: candidateBlockedSlots.length })}</Text>
            </View>
            {summaryTimeRange ? <Text className="mt-2 text-muted">{summaryTimeRange}</Text> : null}
            {duplicateSlotCount > 0 ? <Text className="mt-2 text-sm text-muted">{t("block.duplicatesSkipped", { count: duplicateSlotCount })}</Text> : null}
            {!formBlockedLoading && candidateBlockedSlots.length > 0 && newBlockedSlots.length === 0 ? <Text className="mt-2 text-sm text-muted">{t("block.noNewSlots")}</Text> : null}
          </View>
          {formError ? <Text className="mt-3 text-sm text-red-500">{formError}</Text> : null}
          <View className="mt-5 flex-row gap-3">
            <AppButton className="flex-1" title={t("common.cancel")} variant="ghost" onPress={closeForm} />
            <AppButton className="flex-1" title={t("block.action")} icon={LockKeyhole} loading={loading || formBlockedLoading} disabled={formBlockedLoading || newBlockedSlots.length === 0} onPress={submit} />
          </View>
        </Card>
      ) : null}

      {futureLoading ? <LoadingState label={t("block.loading")} /> : null}
      {futureError ? <Text className="py-4 text-red-500">{futureError}</Text> : null}
      {!futureLoading && !futureError && blockedDayGroups.length === 0 ? <Text className="rounded-xl bg-surface p-4 text-muted">{t("block.noFutureBlockedDays")}</Text> : null}

      {blockedDayGroups.map((group) => {
        const expanded = expandedDate === group.date;
        return (
          <Card key={group.date} className="mb-4">
            <Pressable className="flex-row items-center justify-between" onPress={() => setExpandedDate(expanded ? null : group.date)}>
              <View className="flex-1">
                <Text className="text-xl font-bold text-ink">{formatDateLabel(group.date, locale)}</Text>
                <Text className="mt-1 text-muted">{t("block.blockedSlotCount", { count: group.slots.length })}</Text>
              </View>
              {expanded ? <ChevronDown size={24} color={colors.ink} /> : <ChevronRight size={24} color={colors.ink} />}
            </Pressable>

            {expanded ? (
              <View className="mt-3 border-t border-line">
                {group.slots.map((slot) => (
                  <View key={slot.id} className="flex-row items-center py-4">
                    <View className="h-12 w-12 items-center justify-center rounded-full bg-red-50">
                      <LockKeyhole size={24} color="#f04438" />
                    </View>
                    <View className="ml-4 flex-1">
                      <Text className="text-base font-semibold text-ink">
                        {displayTime(slot.start_time)} - {displayTime(slot.end_time)}
                      </Text>
                      <Text className="mt-1 text-muted">
                        {slot.tracks?.track_name ?? t("common.track")} - {reasonKeyMap[slot.reason as Reason] ? t(reasonKeyMap[slot.reason as Reason]) : slot.reason}
                      </Text>
                    </View>
                    <Pressable className="h-11 w-11 items-center justify-center rounded-xl border border-red-200" disabled={deletingId === slot.id} onPress={() => removeBlockedSlot(slot.id)}>
                      <Trash2 size={21} color="#f04438" />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null}
          </Card>
        );
      })}
    </Screen>
  );
}

function makeDateRange(startDate: string, endDate: string) {
  if (endDate < startDate) return [];
  const dates: string[] = [];
  let cursor = startDate;
  while (cursor <= endDate) {
    dates.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return dates;
}

function groupBlockedSlotsByDate(slots: BlockedSlot[]) {
  const groups = new Map<string, BlockedSlot[]>();
  slots.forEach((slot) => {
    const group = groups.get(slot.slot_date) ?? [];
    group.push(slot);
    groups.set(slot.slot_date, group);
  });

  return [...groups.entries()].map(([date, slots]) => ({ date, slots }));
}
