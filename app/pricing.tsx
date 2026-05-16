import { Pencil, PlusCircle } from "lucide-react-native";
import { useState } from "react";
import { Alert, Modal, Pressable, Text, View } from "react-native";
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
import { displayTime, displayTimeToDb, formatCurrency, formatDateLabel, todayISO } from "@/lib/date";
import { createSlotPrice, listSlotPrices, updateSlotPrice } from "@/lib/pricingService";
import { slotTimes, tracks } from "@/constants/mockData";
import type { DayType, SlotPrice } from "@/types/database";

type ActiveValue = "active" | "inactive";

const timeOptions = slotTimes.map((time) => ({ label: time, value: displayTimeToDb(time) }));
const dayTypeOptions: { label: string; value: DayType }[] = [
  { label: "All days", value: "all_days" },
  { label: "Weekday", value: "weekday" },
  { label: "Weekend", value: "weekend" },
  { label: "Specific day", value: "specific_day" }
];

export default function PricingScreen() {
  const [track, setTrack] = useState<string>(tracks[0].id);
  const [editing, setEditing] = useState<SlotPrice | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("19:00");
  const [dayType, setDayType] = useState<DayType>("all_days");
  const [price, setPrice] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState(todayISO());
  const [effectiveTo, setEffectiveTo] = useState("");
  const [active, setActive] = useState<ActiveValue>("active");
  const [saving, setSaving] = useState(false);
  const { data, error, loading, refresh } = useAsyncData(() => listSlotPrices(track), [track]);

  function openAdd() {
    setEditing(null);
    setStartTime("18:00");
    setEndTime("19:00");
    setDayType("all_days");
    setPrice("");
    setEffectiveFrom(todayISO());
    setEffectiveTo("");
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
    setActive(slotPrice.is_active ? "active" : "inactive");
    setModalOpen(true);
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

    setSaving(true);
    const result = editing
      ? await updateSlotPrice({
          id: editing.id,
          startTime,
          endTime,
          dayType,
          price: numericPrice,
          currency: editing.currency,
          effectiveFrom,
          effectiveTo: effectiveTo || null,
          isActive: active === "active"
        })
      : await createSlotPrice({
          trackId: track,
          startTime,
          endTime,
          dayType,
          price: numericPrice,
          currency: "LKR",
          effectiveFrom,
          effectiveTo: effectiveTo || null,
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
      <AppHeader title="Pricing" showBack />
      <SegmentedFilter
        value={track}
        onChange={setTrack}
        options={[
          ...tracks.map((item) => ({ label: item.track_name, value: item.id }))
        ]}
      />
      <View className="my-5 flex-row items-center justify-between">
        <Text className="flex-1 text-base text-ink">Manage slot prices. Prices apply to new bookings only.</Text>
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
              <FormField label="Price" value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="1500" />
              <DatePickerField label="Effective From" value={effectiveFrom} onChange={setEffectiveFrom} />
              <FormField label="Effective To" value={effectiveTo} onChangeText={setEffectiveTo} placeholder="Leave blank for no end date" />
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
