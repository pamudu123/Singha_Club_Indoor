import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";
import { CalendarDays, CreditCard, FileUp, Mail, MessageSquare, Phone, RotateCcw, User, Users } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { SlotPicker } from "@/components/SlotPicker";
import { AppButton } from "@/components/ui/AppButton";
import { Card } from "@/components/ui/Card";
import { DatePickerField } from "@/components/ui/DatePickerField";
import { FormField } from "@/components/ui/FormField";
import { SelectField } from "@/components/ui/SelectField";
import { Screen } from "@/components/ui/Screen";
import { localAdminId } from "@/constants/admin";
import { slotTimes } from "@/constants/booking";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useTracks } from "@/hooks/useTracks";
import { createBooking } from "@/lib/bookingService";
import { displayTimeToDb, formatCurrency, todayISO } from "@/lib/date";
import { getDefaultSlotPrice } from "@/lib/pricingService";
import { formatWhatsapp, validateBooking } from "@/lib/validation";
import { requireSupabase } from "@/lib/supabase";
import type { PaymentMethod } from "@/types/database";

export default function CreateBookingScreen() {
  const { admin } = useAuth();
  const { t, tv } = useLanguage();
  const scrollRef = useRef<ScrollView>(null);
  const [name, setName] = useState("");
  const [nic, setNic] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [track, setTrack] = useState<string>("");
  const [people, setPeople] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("payment_proof");
  const [remarks, setRemarks] = useState("");
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [proofName, setProofName] = useState<string | null>(null);
  const [proofAsset, setProofAsset] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [bookingDate, setBookingDate] = useState(todayISO());
  const { tracks, trackOptions, error: tracksError, loading: tracksLoading } = useTracks();
  const pricePerSlot = getDefaultSlotPrice();
  const totalPrice = selectedSlots.length * pricePerSlot;

  useEffect(() => {
    if (!track && tracks[0]) setTrack(tracks[0].id);
    if (track && tracks.length && !tracks.some((item) => item.id === track)) setTrack(tracks[0].id);
  }, [track, tracks]);

  const slotRows = useMemo(
    () =>
      [...selectedSlots].sort((left, right) => slotTimes.indexOf(left) - slotTimes.indexOf(right)).map((slot) => {
        const index = slotTimes.indexOf(slot);
        return {
          startTime: displayTimeToDb(slot),
          endTime: displayTimeToDb(slotTimes[index + 1] ?? slot),
          price: pricePerSlot
        };
      }),
    [pricePerSlot, selectedSlots]
  );

  function toggleSlot(slot: string) {
    setSelectedSlots((current) => (current.includes(slot) ? current.filter((item) => item !== slot) : [...current, slot]));
  }

  function cancelBooking() {
    setName("");
    setNic("");
    setWhatsapp("");
    setEmail("");
    setTrack(tracks[0]?.id ?? "");
    setPeople(1);
    setPaymentMethod("payment_proof");
    setRemarks("");
    setSelectedSlots([]);
    setProofName(null);
    setProofAsset(null);
    setBookingDate(todayISO());
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  async function pickProof() {
    const result = await DocumentPicker.getDocumentAsync({ type: ["image/*", "application/pdf"] });
    if (!result.canceled && result.assets && result.assets[0]) {
      setProofName(result.assets[0].name ?? t("create.paymentProofDefault"));
      setProofAsset(result.assets[0]);
    }
  }

  async function submit(createAsAccepted: boolean) {
    const validation = validateBooking({ name, nic, whatsapp, bookingDate, selectedSlots, people });
    if (validation) {
      Alert.alert(t("create.checkDetails"), tv(validation) ?? validation);
      return;
    }
    if (!track) {
      Alert.alert(t("create.trackRequired"), t("create.trackRequiredMessage"));
      return;
    }
    if (paymentMethod === "payment_proof" && !proofName) {
      Alert.alert(t("create.proofRequired"), t("create.proofRequiredMessage"));
      return;
    }

    setLoading(true);

    let storagePath = null;
    if (paymentMethod === "payment_proof" && proofAsset) {
      try {
        const fileUri = proofAsset.uri;
        const fileExt = proofAsset.name.split(".").pop() || "jpg";
        const fileName = `${Date.now()}_proof.${fileExt}`;

        const response = await fetch(fileUri);
        const blob = await response.blob();

        const { data: storageData, error: storageError } = await requireSupabase().storage
          .from("payment-proofs")
          .upload(fileName, blob, {
            contentType: proofAsset.mimeType || "image/jpeg",
            upsert: true
          });

        if (storageError) throw storageError;
        storagePath = storageData?.path || fileName;
      } catch (uploadError: any) {
        setLoading(false);
        Alert.alert(t("create.uploadFailed"), t("create.uploadFailedMessage", { message: uploadError.message }));
        return;
      }
    }

    const result = await createBooking({
      customer: { nic, full_name: name, email, whatsapp_number: whatsapp },
      bookingDate,
      trackId: track,
      slots: slotRows,
      numberOfPeople: people,
      paymentMethod,
      paymentProofPath: storagePath,
      remarks,
      createAsAccepted,
      adminId: admin?.id ?? localAdminId
    });
    setLoading(false);

    if (result.error) {
      Alert.alert(t("create.bookingFailed"), result.error);
      return;
    }

    Alert.alert(t("create.bookingSaved"), t("create.bookingSavedMessage"), [{ text: t("common.ok"), onPress: () => router.replace("/(tabs)") }]);
  }

  return (
    <Screen ref={scrollRef}>
      <AppHeader title={t("create.title")} subtitle={t("app.subtitle")} showBack />
      <Text className="mb-4 text-2xl font-bold text-ink">{t("create.details")}</Text>

      <View className="gap-4">
        <FormField label={t("create.customerName")} icon={User} value={name} onChangeText={setName} placeholder={t("create.customerNamePlaceholder")} />
        <FormField label={t("create.nic")} icon={CreditCard} value={nic} onChangeText={setNic} placeholder="990123456V" autoCapitalize="characters" />
        <FormField label={t("create.whatsapp")} icon={Phone} value={whatsapp} onChangeText={(text) => setWhatsapp(formatWhatsapp(text))} placeholder="012 345 6789" keyboardType="phone-pad" />
        <FormField label={t("create.email")} icon={Mail} value={email} onChangeText={setEmail} placeholder={t("create.emailPlaceholder")} keyboardType="email-address" autoCapitalize="none" />
        <SelectField
          label={t("create.track")}
          value={track}
          onChange={setTrack}
          options={trackOptions}
        />
        {tracksLoading ? <Text className="text-muted">{t("create.loadingTracks")}</Text> : null}
        {tracksError ? <Text className="text-red-500">{tracksError}</Text> : null}
        <DatePickerField label={t("create.bookingDate")} value={bookingDate} onChange={setBookingDate} />
      </View>

      <Card className="mt-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Users size={22} color="#667085" />
            <Text className="ml-3 text-base text-muted">{t("create.people")}</Text>
          </View>
          <View className="flex-row items-center gap-5">
            <Pressable className="h-10 w-10 items-center justify-center rounded-full border border-line" onPress={() => setPeople(Math.max(1, people - 1))}>
              <Text className="text-2xl text-ink">-</Text>
            </Pressable>
            <Text className="text-xl font-semibold text-ink">{people}</Text>
            <Pressable className="h-10 w-10 items-center justify-center rounded-full border border-line" onPress={() => setPeople(people + 1)}>
              <Text className="text-2xl text-ink">+</Text>
            </Pressable>
          </View>
        </View>
      </Card>

      <Text className="mb-3 mt-6 text-base font-semibold text-ink">{t("create.selectSlots")}</Text>
      <SlotPicker slots={slotTimes.slice(12, -1)} selected={selectedSlots} onToggle={toggleSlot} />

      <FormField className="mt-5" label={t("create.remarks")} icon={MessageSquare} value={remarks} onChangeText={setRemarks} placeholder={t("create.remarksPlaceholder")} multiline numberOfLines={3} />

      <Text className="mb-3 mt-6 text-2xl font-bold text-ink">{t("common.payment")}</Text>
      <View className="flex-row gap-3">
        <PaymentOption title={t("create.paymentProofUpload")} selected={paymentMethod === "payment_proof"} onPress={() => setPaymentMethod("payment_proof")} />
        <PaymentOption title={t("create.payOnArrival")} selected={paymentMethod === "pay_on_arrival"} onPress={() => setPaymentMethod("pay_on_arrival")} />
      </View>
      {paymentMethod === "payment_proof" ? (
        <Pressable className="mt-3 flex-row items-center rounded-xl border border-line bg-white p-4" onPress={pickProof}>
          <FileUp size={28} color="#087d24" />
          <View className="ml-4 flex-1">
            <Text className="font-semibold text-ink">{proofName ?? t("create.uploadProof")}</Text>
            <Text className="mt-1 text-muted">{t("create.fileTypes")}</Text>
          </View>
        </Pressable>
      ) : null}

      <Card className="mt-5">
        <Text className="text-xl font-bold text-ink">{t("create.summary")}</Text>
        <View className="mt-4 flex-row justify-between">
          <Summary label={t("create.totalDuration")} value={`${selectedSlots.length * 30} min`} />
          <Summary label={t("common.slots")} value={String(selectedSlots.length)} />
          <Summary label={t("create.totalPrice")} value={formatCurrency(totalPrice)} />
        </View>
      </Card>

      <View className="mt-5 gap-3">
        <AppButton title={t("create.title")} icon={CalendarDays} loading={loading} onPress={() => submit(false)} />
        <AppButton title={t("create.createAsAccepted")} variant="secondary" loading={loading} onPress={() => submit(true)} />
        <AppButton title={t("common.cancel")} icon={RotateCcw} variant="ghost" disabled={loading} onPress={cancelBooking} />
      </View>
    </Screen>
  );
}

function PaymentOption({ title, selected, onPress }: { title: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable className={`min-h-20 flex-1 justify-center rounded-xl border p-4 ${selected ? "border-singha-600 bg-green-50" : "border-line bg-white"}`} onPress={onPress}>
      <Text className={`font-semibold ${selected ? "text-singha-700" : "text-ink"}`}>{title}</Text>
    </Pressable>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text className="text-sm text-muted">{label}</Text>
      <Text className="mt-1 text-lg font-bold text-singha-700">{value}</Text>
    </View>
  );
}
