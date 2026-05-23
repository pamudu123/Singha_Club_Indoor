import { useLocalSearchParams } from "expo-router";
import { CheckCircle2, FileSearch, MessageCircle, PauseCircle, Phone, XCircle } from "lucide-react-native";
import { useState } from "react";
import { Alert, Linking, Modal, Pressable, Text, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { BookingCard } from "@/components/BookingCard";
import { AppButton } from "@/components/ui/AppButton";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { ErrorState, LoadingState } from "@/components/ui/StateView";
import { Screen } from "@/components/ui/Screen";
import { localAdminId } from "@/constants/admin";
import { useAuth } from "@/hooks/useAuth";
import { useAsyncData } from "@/hooks/useAsyncData";
import { getBooking, updateBookingStatus } from "@/lib/bookingService";
import type { BookingStatus } from "@/types/database";

export default function BookingDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { admin } = useAuth();
  const { data: booking, error, loading, refresh } = useAsyncData(() => getBooking(id), [id]);
  const [reasonStatus, setReasonStatus] = useState<BookingStatus | null>(null);
  const [reason, setReason] = useState("");

  async function setStatus(newStatus: BookingStatus, statusReason?: string) {
    if (!booking) return;
    const result = await updateBookingStatus({
      bookingId: booking.booking_id,
      oldStatus: booking.status,
      newStatus,
      adminId: admin?.id ?? localAdminId,
      reason: statusReason ?? (newStatus === "accepted" ? "Booking accepted by admin" : `Booking marked ${newStatus}`)
    });
    if (result.error) Alert.alert("Status update failed", result.error);
    else {
      Alert.alert("Booking updated", `Booking marked as ${newStatus}.`);
      refresh();
    }
  }

  function requestStatus(newStatus: BookingStatus) {
    if (newStatus === "accepted") {
      setStatus(newStatus);
      return;
    }
    setReasonStatus(newStatus);
    setReason(newStatus === "rejected" ? "Payment proof is unclear." : "Need to confirm availability.");
  }

  function submitReason() {
    if (!reasonStatus) return;
    if (!reason.trim()) {
      Alert.alert("Reason required", "Add a reason before updating this booking.");
      return;
    }
    setStatus(reasonStatus, reason.trim());
    setReasonStatus(null);
  }

  function viewPaymentProof() {
    const proofPath = booking?.booking_payments?.[0]?.payment_proof_path;
    if (!proofPath) {
      Alert.alert("No payment proof", "This booking does not have a payment proof file.");
      return;
    }
    if (/^https?:\/\//.test(proofPath) || proofPath.startsWith("file://")) {
      Linking.openURL(proofPath);
      return;
    }
    Alert.alert("Payment proof", proofPath);
  }

  return (
    <Screen>
      <AppHeader title="Booking Details" subtitle="Review request and customer details" showBack />
      {loading ? <LoadingState label="Loading booking..." /> : null}
      {error ? <ErrorState message={error} /> : null}
      {booking ? (
        <>
          <BookingCard booking={booking} expanded />
          <Card>
            <Text className="text-xl font-bold text-ink">Actions</Text>
            <View className="mt-4 gap-3">
              <View className="flex-row gap-3">
                <AppButton className="flex-1" title="Approve" icon={CheckCircle2} onPress={() => requestStatus("accepted")} />
                <AppButton className="flex-1" title="Reject" icon={XCircle} variant="danger" onPress={() => requestStatus("rejected")} />
              </View>
              <AppButton title="On Hold" icon={PauseCircle} variant="secondary" onPress={() => requestStatus("on_hold")} />
              <View className="flex-row gap-3">
                <AppButton className="flex-1" title="View Proof" icon={FileSearch} variant="ghost" onPress={viewPaymentProof} />
                <AppButton className="flex-1" title="Call" icon={Phone} variant="ghost" onPress={() => Linking.openURL(`tel:${booking.customers?.whatsapp_number ?? ""}`)} />
              </View>
              <AppButton title="WhatsApp" icon={MessageCircle} variant="ghost" onPress={() => Linking.openURL(`https://wa.me/${booking.customers?.whatsapp_number?.replace(/\D/g, "") ?? ""}`)} />
            </View>
          </Card>
          <Modal transparent visible={Boolean(reasonStatus)} animationType="fade" onRequestClose={() => setReasonStatus(null)}>
            <View className="flex-1 justify-end bg-black/30 px-4 pb-6">
              <Pressable className="absolute inset-0" onPress={() => setReasonStatus(null)} />
              <View className="rounded-2xl border border-line bg-white p-4 shadow-lg">
                <Text className="mb-4 text-xl font-bold text-ink">{reasonStatus === "rejected" ? "Reject Booking" : "Put Booking On Hold"}</Text>
                <FormField label="Reason" value={reason} onChangeText={setReason} multiline numberOfLines={3} />
                <View className="mt-5 flex-row gap-3">
                  <AppButton className="flex-1" title="Cancel" variant="ghost" onPress={() => setReasonStatus(null)} />
                  <AppButton className="flex-1" title="Save" variant={reasonStatus === "rejected" ? "danger" : "secondary"} onPress={submitReason} />
                </View>
              </View>
            </View>
          </Modal>
        </>
      ) : null}
    </Screen>
  );
}
