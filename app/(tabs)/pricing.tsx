import { CheckCircle2, Lock, Pencil, PlusCircle, Trash2 } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
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
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useTracks } from "@/hooks/useTracks";
import { displayTime, displayTimeToDb, formatCurrency, formatDateLabel, todayISO } from "@/lib/date";
import { createSlotPrice, getDefaultCurrency, getDefaultSlotPrice, listSlotPrices, loadDefaultSlotPrice, markSlotPriceDeleted, updateDefaultSlotPrice, updateSlotPrice } from "@/lib/pricingService";
import { slotTimes } from "@/constants/booking";
import { localAdminId } from "@/constants/admin";
import type { DayType, SlotPrice } from "@/types/database";

type ActiveValue = "active" | "inactive";
type EffectiveToMode = "none" | "date";

const timeOptions = slotTimes.map((time) => ({ label: time, value: displayTimeToDb(time) }));
const dayTypeKeys: Record<DayType, string> = {
  all_days: "pricing.allDays",
  weekday: "pricing.weekday",
  weekend: "pricing.weekend",
  specific_day: "pricing.specificDay"
};

export default function PricingScreen() {
  const { admin } = useAuth();
  const { locale, t } = useLanguage();
  const [track, setTrack] = useState<string>("");
  const [editing, setEditing] = useState<SlotPrice | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("19:00");
  const [dayType, setDayType] = useState<DayType>("all_days");
  const [price, setPrice] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState(todayISO());
  const [effectiveTo, setEffectiveTo] = useState("");
  const [effectiveToMode, setEffectiveToMode] = useState<EffectiveToMode>("none");
  const [active, setActive] = useState<ActiveValue>("active");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [defaultPrice, setDefaultPrice] = useState(getDefaultSlotPrice());
  const [defaultPriceInput, setDefaultPriceInput] = useState(String(getDefaultSlotPrice()));
  const [defaultPriceUnlocked, setDefaultPriceUnlocked] = useState(false);
  const defaultCurrency = getDefaultCurrency();
  const adminId = admin?.id ?? localAdminId;
  const { tracks, trackOptions, error: tracksError, loading: tracksLoading } = useTracks();
  const { data, error, loading, refresh } = useAsyncData(
    () => (track ? listSlotPrices(track) : Promise.resolve({ data: [], error: null })),
    [track]
  );

  useEffect(() => {
    if (!track && tracks[0]) setTrack(tracks[0].id);
    if (track && tracks.length && !tracks.some((item) => item.id === track)) setTrack(tracks[0].id);
  }, [track, tracks]);

  useEffect(() => {
    loadDefaultSlotPrice(adminId).then((loadedPrice) => {
      setDefaultPrice(loadedPrice);
      setDefaultPriceInput(String(loadedPrice));
    });
  }, [adminId]);

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
    setFormOpen(true);
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
    setActive((slotPrice.status ?? (slotPrice.is_active ? "active" : "inactive")) === "active" ? "active" : "inactive");
    setFormOpen(true);
  }

  function toggleDefaultPriceLock() {
    if (defaultPriceUnlocked) {
      saveDefaultPrice();
      return;
    }

    setDefaultPriceInput(String(defaultPrice));
    setDefaultPriceUnlocked(true);
  }

  async function saveDefaultPrice() {
    const numericPrice = Number(defaultPriceInput);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      Alert.alert(t("pricing.invalidDefault"), t("pricing.invalidDefaultMessage"));
      return;
    }

    setDefaultPrice(numericPrice);
    await updateDefaultSlotPrice(numericPrice, adminId);
    setDefaultPriceUnlocked(false);
  }

  async function savePriceRule() {
    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      Alert.alert(t("pricing.invalidPrice"), t("pricing.invalidPriceMessage"));
      return;
    }
    if (startTime >= endTime) {
      Alert.alert(t("pricing.invalidTime"), t("pricing.invalidTimeMessage"));
      return;
    }
    if (effectiveFrom < todayISO()) {
      Alert.alert(t("pricing.invalidDate"), t("pricing.effectiveFromPast"));
      return;
    }
    if (effectiveToMode === "date" && effectiveTo < effectiveFrom) {
      Alert.alert(t("pricing.invalidDate"), t("pricing.effectiveToBeforeFrom"));
      return;
    }
    if (!track) {
      Alert.alert(t("create.trackRequired"), t("pricing.trackRequiredMessage"));
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
      Alert.alert(t("pricing.saveFailed"), result.error);
      return;
    }
    setFormOpen(false);
    setEditing(null);
    refresh();
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  function confirmDelete(slotPrice: SlotPrice) {
    Alert.alert(t("pricing.deleteRule"), t("pricing.deleteRuleMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("common.delete"), style: "destructive", onPress: () => deletePriceRule(slotPrice.id) }
    ]);
  }

  async function deletePriceRule(id: string) {
    setDeletingId(id);
    const result = await markSlotPriceDeleted(id);
    setDeletingId(null);

    if (result.error) {
      Alert.alert(t("pricing.deleteFailed"), result.error);
      return;
    }
    if (editing?.id === id) closeForm();
    refresh();
  }

  return (
    <Screen>
      <AppHeader title={t("pricing.title")} showBack />
      <SegmentedFilter
        value={track}
        onChange={setTrack}
        options={trackOptions}
      />
      {tracksLoading ? <LoadingState label={t("create.loadingTracks")} /> : null}
      {tracksError ? <ErrorState message={tracksError} /> : null}

      <Card className="mt-5">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-sm text-muted">{t("pricing.defaultPrice")}</Text>
            <View className="mt-2 h-12 justify-center">
              {defaultPriceUnlocked ? (
                <TextInput
                  className="h-12 rounded-xl border border-line bg-surface px-3 text-xl font-bold text-ink"
                  style={{ paddingTop: 0, paddingBottom: 0, lineHeight: 28, includeFontPadding: false }}
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
        <Text className="flex-1 text-base text-ink">{t("pricing.manage")}</Text>
        <AppButton title={t("common.addPriceRule")} icon={PlusCircle} className="ml-3" onPress={openAdd} />
      </View>

      {formOpen ? (
        <Card className="mb-5">
          <Text className="mb-4 text-xl font-bold text-ink">{editing ? t("common.editRule") : t("common.addPriceRule")}</Text>
          <View className="gap-4">
            <SelectField label={t("common.startTime")} value={startTime} onChange={setStartTime} options={timeOptions} />
            <SelectField label={t("common.endTime")} value={endTime} onChange={setEndTime} options={timeOptions} />
            <SelectField label={t("pricing.dayType")} value={dayType} onChange={setDayType} options={(Object.keys(dayTypeKeys) as DayType[]).map((value) => ({ label: t(dayTypeKeys[value]), value }))} />
            <FormField label={t("common.price")} value={price} onChangeText={setPrice} keyboardType="numeric" placeholder={String(defaultPrice)} />
            <DatePickerField label={t("pricing.effectiveFrom")} value={effectiveFrom} onChange={setEffectiveFrom} minDate={todayISO()} />
            <SegmentedFilter
              value={effectiveToMode}
              onChange={(value) => {
                setEffectiveToMode(value);
                if (value === "date" && !effectiveTo) setEffectiveTo(effectiveFrom);
              }}
              options={[
                { label: t("pricing.noEndDate"), value: "none" },
                { label: t("pricing.setEndDate"), value: "date" }
              ]}
            />
            {effectiveToMode === "date" ? <DatePickerField label={t("pricing.effectiveTo")} value={effectiveTo || effectiveFrom} onChange={setEffectiveTo} minDate={effectiveFrom} /> : null}
            <SegmentedFilter
              value={active}
              onChange={setActive}
              options={[
                { label: t("common.active"), value: "active" },
                { label: t("common.inactive"), value: "inactive" }
              ]}
            />
          </View>
          <View className="mt-5 flex-row gap-3">
            <AppButton className="flex-1" title={t("common.cancel")} variant="ghost" onPress={closeForm} />
            <AppButton className="flex-1" title={t("common.save")} loading={saving} onPress={savePriceRule} />
          </View>
        </Card>
      ) : null}

      {loading ? <LoadingState label={t("pricing.loading")} /> : null}
      {error ? <ErrorState message={error} /> : null}
      {data?.map((price) => (
        <Card key={price.id} className="mb-4">
          <View className="flex-row items-start justify-between">
            <View>
              <Text className="text-xl font-bold text-ink">
                {displayTime(price.start_time)} - {displayTime(price.end_time)}
              </Text>
              <Text className="mt-1 text-muted">{t(dayTypeKeys[price.day_type])}</Text>
            </View>
            <View className="items-end">
              <Text className="text-sm text-muted">{t("common.price")}</Text>
              <Text className="text-2xl font-bold text-ink">{formatCurrency(price.price, price.currency)}</Text>
              <Text className={`mt-1 font-semibold ${price.status === "active" || price.is_active ? "text-singha-700" : "text-muted"}`}>{price.status === "active" || price.is_active ? t("common.active") : t("common.inactive")}</Text>
            </View>
          </View>
          <View className="mt-4 flex-row justify-between border-t border-line pt-4">
            <Text className="text-muted">{t("common.from")} {formatDateLabel(price.effective_from, locale)}</Text>
            <Text className="text-muted">{price.effective_to ? t("pricing.to", { date: formatDateLabel(price.effective_to, locale) }) : t("pricing.noEndDate")}</Text>
          </View>
          <View className="mt-4 flex-row gap-3">
            <AppButton className="flex-1" title={t("common.editRule")} icon={Pencil} variant="secondary" onPress={() => openEdit(price)} />
            <AppButton className="flex-1" title={t("common.delete")} icon={Trash2} variant="danger" loading={deletingId === price.id} onPress={() => confirmDelete(price)} />
          </View>
        </Card>
      ))}
      <Text className="rounded-xl bg-green-50 p-4 text-singha-700">{t("pricing.note")}</Text>
    </Screen>
  );
}
