import { CheckCircle2, Lock, Pencil, PlusCircle } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, Modal, Pressable, Text, TextInput, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { SegmentedFilter } from "@/components/SegmentedFilter";
import { AppButton } from "@/components/ui/AppButton";
import { Card } from "@/components/ui/Card";
import { DatePickerField } from "@/components/ui/DatePickerField";
import { FormField } from "@/components/ui/FormField";
import { SelectField } from "@/components/ui/SelectField";
import { ErrorState, LoadingState } from "@/components/ui/StateView";
import { Screen } from "@/components/ui/Screen";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useTracks } from "@/hooks/useTracks";
import { displayTime, displayTimeToDb, formatCurrency, formatDateLabel, todayISO } from "@/lib/date";
import { createSlotPrice, getDefaultCurrency, getDefaultSlotPrice, listSlotPrices, updateDefaultSlotPrice, updateSlotPrice } from "@/lib/pricingService";
import { slotTimes } from "@/constants/booking";
import type { DayType, SlotPrice } from "@/types/database";

type ActiveValue = "active" | "inactive";
type EffectiveToMode = "none" | "date";

const timeOptions = slotTimes.map((time) => ({ label: time, value: displayTimeToDb(time) }));
const dayTypeOptions: { label: string; value: DayType }[] = [
  { label: "All days", value: "all_days" },
  { label: "Weekday", value: "weekday" },
  { label: "Weekend", value: "weekend" },
  { label: "Specific day", value: "specific_day" }
];

export default function PricingScreen() {
  const [track, setTrack] = useState<string>("");
  const [editing, setEditing] = useState<SlotPrice | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("19:00");
  const [dayType, setDayType] = useState<DayType>("all_days");
  const [price, setPrice] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState(todayISO());
  const [effectiveTo, setEffectiveTo] = useState("");
  const [effectiveToMode, setEffectiveToMode] = useState<EffectiveToMode>("none");
  const [active, setActive] = useState<ActiveValue>("active");
  const [saving, setSaving] = useState(false);
  const [defaultPrice, setDefaultPrice] = useState(getDefaultSlotPrice());
  const [defaultPriceInput, setDefaultPriceInput] = useState(String(getDefaultSlotPrice()));
  const [defaultPriceUnlocked, setDefaultPriceUnlocked] = useState(false);
  const defaultCurrency = getDefaultCurrency();
  const { tracks, trackOptions, error: tracksError, loading: tracksLoading } = useTracks();
  const { data, error, loading, refresh } = useAsyncData(
    () => (track ? listSlotPrices(track) : Promise.resolve({ data: [], error: null })),
    [track]
  );

  useEffect(() => {
    if (!track && tracks[0]) setTrack(tracks[0].id);
    if (track && tracks.length && !tracks.some((item) => item.id === track)) setTrack(tracks[0].id);
  }, [track, tracks]);

  function openAdd() {
    setEditing(null);
    setStartTime("18:00");
    setEndTime("19:00");
    setDayType("all_days");
    setPrice(String(defaultPrice));
    setEffectiveFrom(todayISO());
    setEffectiveTo("");
    setEffectiveToMode("none");
    setActive("active");
    setModalOpen(true);
  }

  function openEdit(slotPrice: SlotPrice) {
    setEditing(slotPrice);
    setStartTime(slotPrice.start_time);
    setEndTime(slotPrice.end_time);
    setDayType(slotPrice.day_type);
    setPrice(String(slotPrice.price));
    setEffectiveFrom(slotPrice.effective_from);
    setEffectiveTo(slotPrice.effective_to ?? "");
    setEffectiveToMode(slotPrice.effective_to ? "date" : "none");
    setActive(slotPrice.is_active ? "active" : "inactive");
    setModalOpen(true);
  }

  function toggleDefaultPriceLock() {
    if (defaultPriceUnlocked) {
      saveDefaultPrice();
      return;
    }

    setDefaultPriceInput(String(defaultPrice));
    setDefaultPriceUnlocked(true);
  }

  function saveDefaultPrice() {
    const numericPrice = Number(defaultPriceInput);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      Alert.alert("Invalid default price", "Enter a default price greater than 0.");
      return;
    }

    setDefaultPrice(numericPrice);
    updateDefaultSlotPrice(numericPrice);
    setDefaultPriceUnlocked(false);
  }

  async function savePriceRule() {
    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      Alert.alert("Invalid price", "Enter a price greater than 0.");
      return;
    }
    if (startTime >= endTime) {
      Alert.alert("Invalid time range", "End time must be after start time.");
      return;
    }
    if (effectiveFrom < todayISO()) {
      Alert.alert("Invalid effective date", "Effective From cannot be before today.");
      return;
    }
    if (effectiveToMode === "date" && effectiveTo < effectiveFrom) {
      Alert.alert("Invalid effective date", "Effective To must be on or after Effective From.");
      return;
    }
    if (!track) {
      Alert.alert("Track required", "Add active tracks in Supabase before creating price rules.");
      return;
    }

    const effectiveToValue = effectiveToMode === "date" ? effectiveTo : null;
    setSaving(true);
    const result = editing
      ? await updateSlotPrice({
          id: editing.id,
          trackId: editing.track_id,
          startTime,
          endTime,
          dayType,
          price: numericPrice,
          currency: editing.currency,
          effectiveFrom,
          effectiveTo: effectiveToValue,
          isActive: active === "active"
        })
      : await createSlotPrice({
          trackId: track,
          startTime,
          endTime,
          dayType,
          price: numericPrice,
          currency: defaultCurrency,
          effectiveFrom,
          effectiveTo: effectiveToValue,
          isActive: active === "active"
        });
    setSaving(false);

    if (result.error) {
      Alert.alert("Could not save price rule", result.error);
      return;
    }
    setModalOpen(false);
    refresh();
  }

  return (
    <Screen>
      <AppHeader title="Pricing" />
      <SegmentedFilter
        value={track}
        onChange={setTrack}
        options={trackOptions}
      />
      {tracksLoading ? <LoadingState label="Loading tracks..." /> : null}
      {tracksError ? <ErrorState message={tracksError} /> : null}

      <Card className="mt-5">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-sm text-muted">Default price per slot</Text>
            <View className="mt-2 h-12 justify-center">
              {defaultPriceUnlocked ? (
                <TextInput
                  className="h-12 rounded-xl border border-line bg-surface px-3 text-xl font-bold text-ink"
                  value={defaultPriceInput}
                  onChangeText={setDefaultPriceInput}
                  keyboardType="numeric"
                />
              ) : (
                <Text className="text-2xl font-bold text-ink">{formatCurrency(defaultPrice, defaultCurrency)}</Text>
              )}
            </View>
          </View>
          <View className="ml-4 flex-row gap-2">
            <Pressable className={`h-12 w-12 items-center justify-center rounded-xl border ${defaultPriceUnlocked ? "border-singha-600 bg-singha-50" : "border-line bg-white"}`} onPress={toggleDefaultPriceLock}>
              {defaultPriceUnlocked ? <CheckCircle2 size={22} color="#087d24" /> : <Lock size={22} color="#667085" />}
            </Pressable>
          </View>
        </View>
      </Card>

      <View className="my-5 flex-row items-center justify-between">
        <Text className="flex-1 text-base text-ink">Manage slot prices by track, time, and effective date.</Text>
        <AppButton title="Add Price Rule" icon={PlusCircle} className="ml-3" onPress={openAdd} />
      </View>
      {loading ? <LoadingState label="Loading prices..." /> : null}
      {error ? <ErrorState message={error} /> : null}
      {data?.map((price) => (
        <Card key={price.id} className="mb-4">
          <View className="flex-row items-start justify-between">
            <View>
              <Text className="text-xl font-bold text-ink">
                {displayTime(price.start_time)} - {displayTime(price.end_time)}
              </Text>
              <Text className="mt-1 text-muted">{price.day_type.replace("_", " ")}</Text>
            </View>
            <View className="items-end">
              <Text className="text-sm text-muted">Price</Text>
              <Text className="text-2xl font-bold text-ink">{formatCurrency(price.price, price.currency)}</Text>
              <Text className={`mt-1 font-semibold ${price.is_active ? "text-singha-700" : "text-muted"}`}>{price.is_active ? "Active" : "Inactive"}</Text>
            </View>
          </View>
          <View className="mt-4 flex-row justify-between border-t border-line pt-4">
            <Text className="text-muted">From {formatDateLabel(price.effective_from)}</Text>
            <Text className="text-muted">{price.effective_to ? `To ${formatDateLabel(price.effective_to)}` : "No end date"}</Text>
          </View>
          <AppButton className="mt-4" title="Edit Rule" icon={Pencil} variant="secondary" onPress={() => openEdit(price)} />
        </Card>
      ))}
      <Text className="rounded-xl bg-green-50 p-4 text-singha-700">Note: Existing bookings retain their original slot price.</Text>

      <Modal transparent visible={modalOpen} animationType="fade" onRequestClose={() => setModalOpen(false)}>
        <View className="flex-1 justify-end bg-black/30 px-4 pb-6">
          <Pressable className="absolute inset-0" onPress={() => setModalOpen(false)} />
          <View className="max-h-[88%] rounded-2xl border border-line bg-white p-4 shadow-lg">
            <Text className="mb-4 text-xl font-bold text-ink">{editing ? "Edit Price Rule" : "Add Price Rule"}</Text>
            <View className="gap-4">
              <SelectField label="Start Time" value={startTime} onChange={setStartTime} options={timeOptions} />
              <SelectField label="End Time" value={endTime} onChange={setEndTime} options={timeOptions} />
              <SelectField label="Day Type" value={dayType} onChange={setDayType} options={dayTypeOptions} />
              <FormField label="Price" value={price} onChangeText={setPrice} keyboardType="numeric" placeholder={String(defaultPrice)} />
              <DatePickerField label="Effective From" value={effectiveFrom} onChange={setEffectiveFrom} minDate={todayISO()} />
              <SegmentedFilter
                value={effectiveToMode}
                onChange={(value) => {
                  setEffectiveToMode(value);
                  if (value === "date" && !effectiveTo) setEffectiveTo(effectiveFrom);
                }}
                options={[
                  { label: "No end date", value: "none" },
                  { label: "Set end date", value: "date" }
                ]}
              />
              {effectiveToMode === "date" ? <DatePickerField label="Effective To" value={effectiveTo || effectiveFrom} onChange={setEffectiveTo} minDate={effectiveFrom} /> : null}
              <SegmentedFilter
                value={active}
                onChange={setActive}
                options={[
                  { label: "Active", value: "active" },
                  { label: "Inactive", value: "inactive" }
                ]}
              />
            </View>
            <View className="mt-5 flex-row gap-3">
              <AppButton className="flex-1" title="Cancel" variant="ghost" onPress={() => setModalOpen(false)} />
              <AppButton className="flex-1" title="Save" loading={saving} onPress={savePriceRule} />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
