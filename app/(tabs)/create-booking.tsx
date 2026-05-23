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
import { useTracks } from "@/hooks/useTracks";
import { createBooking } from "@/lib/bookingService";
import { displayTimeToDb, formatCurrency, todayISO } from "@/lib/date";
import { getDefaultSlotPrice } from "@/lib/pricingService";
import { formatWhatsapp, validateBooking } from "@/lib/validation";
import type { PaymentMethod } from "@/types/database";

export default function CreateBookingScreen() {
  const { admin } = useAuth();
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
    setBookingDate(todayISO());
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  async function pickProof() {
    const result = await DocumentPicker.getDocumentAsync({ type: ["image/*", "application/pdf"] });
    if (!result.canceled) {
      setProofName(result.assets[0]?.name ?? "Payment proof");
    }
  }

  async function submit(createAsAccepted: boolean) {
    const validation = validateBooking({ name, nic, whatsapp, bookingDate, selectedSlots, people });
    if (validation) {
      Alert.alert("Check booking details", validation);
      return;
    }
    if (!track) {
      Alert.alert("Track required", "Add active tracks in Supabase before creating a booking.");
      return;
    }
    if (paymentMethod === "payment_proof" && !proofName) {
      Alert.alert("Payment proof required", "Upload a JPG, PNG, or PDF payment proof, or choose Pay on Arrival.");
      return;
    }

    setLoading(true);
    const result = await createBooking({
      customer: { nic, full_name: name, email, whatsapp_number: whatsapp },
      bookingDate,
      trackId: track,
      slots: slotRows,
      numberOfPeople: people,
      paymentMethod,
      paymentProofPath: proofName,
      remarks,
      createAsAccepted,
      adminId: admin?.id ?? localAdminId
    });
    setLoading(false);

    if (result.error) {
      Alert.alert("Booking failed", result.error);
      return;
    }

    Alert.alert("Booking saved", "The booking request was created successfully.", [{ text: "OK", onPress: () => router.replace("/(tabs)") }]);
  }

  return (
    <Screen ref={scrollRef}>
      <AppHeader title="Create Booking" subtitle="Indoor Cricket Booking System" />
      <Text className="mb-4 text-2xl font-bold text-ink">Booking Details</Text>

      <View className="gap-4">
        <FormField label="Customer Name *" icon={User} value={name} onChangeText={setName} placeholder="Customer full name" />
        <FormField label="NIC *" icon={CreditCard} value={nic} onChangeText={setNic} placeholder="990123456V" autoCapitalize="characters" />
        <FormField label="WhatsApp Number *" icon={Phone} value={whatsapp} onChangeText={(text) => setWhatsapp(formatWhatsapp(text))} placeholder="012 345 6789" keyboardType="phone-pad" />
        <FormField label="Email" icon={Mail} value={email} onChangeText={setEmail} placeholder="customer@email.com" keyboardType="email-address" autoCapitalize="none" />
        <SelectField
          label="Track *"
          value={track}
          onChange={setTrack}
          options={trackOptions}
        />
        {tracksLoading ? <Text className="text-muted">Loading tracks...</Text> : null}
        {tracksError ? <Text className="text-red-500">{tracksError}</Text> : null}
        <DatePickerField label="Booking Date *" value={bookingDate} onChange={setBookingDate} />
      </View>

      <Card className="mt-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Users size={22} color="#667085" />
            <Text className="ml-3 text-base text-muted">Number of People *</Text>
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

      <Text className="mb-3 mt-6 text-base font-semibold text-ink">Select Time Slots * (30 minutes each)</Text>
      <SlotPicker slots={slotTimes.slice(12, -1)} selected={selectedSlots} onToggle={toggleSlot} />

      <FormField className="mt-5" label="Remarks" icon={MessageSquare} value={remarks} onChangeText={setRemarks} placeholder="Special requests or internal note" multiline numberOfLines={3} />

      <Text className="mb-3 mt-6 text-2xl font-bold text-ink">Payment</Text>
      <View className="flex-row gap-3">
        <PaymentOption title="Payment Proof Upload" selected={paymentMethod === "payment_proof"} onPress={() => setPaymentMethod("payment_proof")} />
        <PaymentOption title="Pay on Arrival" selected={paymentMethod === "pay_on_arrival"} onPress={() => setPaymentMethod("pay_on_arrival")} />
      </View>
      {paymentMethod === "payment_proof" ? (
        <Pressable className="mt-3 flex-row items-center rounded-xl border border-line bg-white p-4" onPress={pickProof}>
          <FileUp size={28} color="#087d24" />
          <View className="ml-4 flex-1">
            <Text className="font-semibold text-ink">{proofName ?? "Upload payment proof"}</Text>
            <Text className="mt-1 text-muted">JPG, PNG, or PDF</Text>
          </View>
        </Pressable>
      ) : null}

      <Card className="mt-5">
        <Text className="text-xl font-bold text-ink">Booking Summary</Text>
        <View className="mt-4 flex-row justify-between">
          <Summary label="Total Duration" value={`${selectedSlots.length * 30} min`} />
          <Summary label="Slots" value={String(selectedSlots.length)} />
          <Summary label="Total Price" value={formatCurrency(totalPrice)} />
        </View>
      </Card>

      <View className="mt-5 gap-3">
        <AppButton title="Create Booking" icon={CalendarDays} loading={loading} onPress={() => submit(false)} />
        <AppButton title="Create as Accepted" variant="secondary" loading={loading} onPress={() => submit(true)} />
        <AppButton title="Cancel" icon={RotateCcw} variant="ghost" disabled={loading} onPress={cancelBooking} />
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
