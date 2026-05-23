import { useLocalSearchParams, Redirect, router } from "expo-router";
import { CheckCircle2, FileSearch, MessageCircle, PauseCircle, Phone, XCircle } from "lucide-react-native";
import { useMemo, useState } from "react";
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
import { useLanguage } from "@/hooks/useLanguage";
import { getBooking, updateBookingStatus } from "@/lib/bookingService";
import { todayISO } from "@/lib/date";
import { getPaymentProofUrl } from "@/lib/paymentProofService";
import type { BookingStatus } from "@/types/database";

export default function BookingDetailsScreen() {
  const { id, recordIds, recordIndex } = useLocalSearchParams<{ id: string; recordIds?: string; recordIndex?: string }>();
  const { admin, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const { data: booking, error, loading, refresh } = useAsyncData(() => getBooking(id), [id]);
  const [reasonStatus, setReasonStatus] = useState<BookingStatus | null>(null);
  const [reason, setReason] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const recordIdList = useMemo(() => recordIds?.split(",").filter(Boolean) ?? [], [recordIds]);
  const currentRecordIndex = useMemo(() => {
    const indexFromParam = Number(recordIndex);
    if (Number.isInteger(indexFromParam) && indexFromParam >= 0) return indexFromParam;
    return recordIdList.indexOf(id);
  }, [id, recordIdList, recordIndex]);

  const isPastRecord = booking
    ? booking.booking_date < todayISO() || booking.status === "accepted" || booking.status === "rejected"
    : false;
  
  if (authLoading) {
    return null;
  }

  if (!admin) {
    return <Redirect href="/(auth)/login" />;
  }

  function navigateToNextRecord() {
    const nextId = currentRecordIndex >= 0 ? recordIdList[currentRecordIndex + 1] : undefined;
    if (!nextId) {
      if (recordIdList.length > 0) router.replace("/(tabs)/requests");
      else refresh();
      return;
    }
    router.replace({
      pathname: "/booking/[id]",
      params: {
        id: nextId,
        recordIds: recordIdList.join(","),
        recordIndex: String(currentRecordIndex + 1)
      }
    });
  }

  async function setStatus(newStatus: BookingStatus, statusReason?: string) {
    if (!booking || updatingStatus) return;
    setUpdatingStatus(true);
    const result = await updateBookingStatus({
      bookingId: booking.booking_id,
      oldStatus: booking.status,
      newStatus,
      adminId: admin?.id ?? localAdminId,
      reason: statusReason ?? (newStatus === "accepted" ? t("booking.acceptedReason") : t("booking.markedReason", { status: t(`status.${newStatus}`) }))
    });
    setUpdatingStatus(false);
    if (result.error) {
      Alert.alert(t("booking.statusUpdateFailed"), result.error);
      return;
    }
    setReasonStatus(null);
    navigateToNextRecord();
  }

  function requestStatus(newStatus: BookingStatus) {
    if (newStatus === "accepted") {
      setStatus(newStatus);
      return;
    }
    setReasonStatus(newStatus);
    setReason(newStatus === "rejected" ? t("booking.rejectDefaultReason") : t("booking.holdDefaultReason"));
  }

  function submitReason() {
    if (!reasonStatus) return;
    if (!reason.trim()) {
      Alert.alert(t("booking.reasonRequired"), t("booking.reasonRequiredMessage"));
      return;
    }
    setStatus(reasonStatus, reason.trim());
    setReasonStatus(null);
  }

  async function viewPaymentProof() {
    const proofPath = booking?.booking_payments?.[0]?.payment_proof_path;
    if (!proofPath) {
      Alert.alert(t("booking.noProof"), t("booking.noProofMessage"));
      return;
    }
    try {
      const proofUrl = await getPaymentProofUrl(proofPath);
      Linking.openURL(proofUrl);
    } catch (error) {
      Alert.alert(t("booking.noProof"), error instanceof Error ? error.message : t("booking.noProofMessage"));
    }
  }

  return (
    <Screen>
      <AppHeader title={t("booking.detailsTitle")} subtitle={t("booking.detailsSubtitle")} showBack />
      {loading ? <LoadingState label={t("booking.loading")} /> : null}
      {error ? <ErrorState message={error} /> : null}
      {booking ? (
        <>
          <BookingCard booking={booking} expanded />
          <Card>
            <Text className="text-xl font-bold text-ink">{t("common.actions")}</Text>
            {isPastRecord ? (
              <Text className="text-xs font-semibold text-muted bg-gray-50 border border-line rounded-lg p-2 text-center mt-2">
                {t("booking.actionsDisabled")}
              </Text>
            ) : null}
            <View className="mt-4 gap-3">
              <View className="flex-row gap-3">
                <AppButton className="flex-1" title={t("common.approve")} icon={CheckCircle2} disabled={isPastRecord || updatingStatus} loading={updatingStatus} onPress={() => requestStatus("accepted")} />
                <AppButton className="flex-1" title={t("common.reject")} icon={XCircle} variant="danger" disabled={isPastRecord || updatingStatus} onPress={() => requestStatus("rejected")} />
              </View>
              <AppButton title={t("common.onHold")} icon={PauseCircle} variant="secondary" disabled={isPastRecord || updatingStatus} onPress={() => requestStatus("on_hold")} />
              <View className="flex-row gap-3">
                <AppButton className="flex-1" title={t("booking.viewProof")} icon={FileSearch} variant="ghost" disabled={booking.booking_payments?.[0]?.payment_method === "pay_on_arrival"} onPress={viewPaymentProof} />
                <AppButton className="flex-1" title={t("common.call")} icon={Phone} variant="ghost" onPress={() => Linking.openURL(`tel:${booking.customers?.whatsapp_number ?? ""}`)} />
              </View>
              <AppButton title={t("common.whatsapp")} icon={MessageCircle} variant="ghost" onPress={() => Linking.openURL(`https://wa.me/${booking.customers?.whatsapp_number?.replace(/\D/g, "") ?? ""}`)} />
            </View>
          </Card>
          <Modal transparent visible={Boolean(reasonStatus)} animationType="fade" onRequestClose={() => setReasonStatus(null)}>
            <View className="flex-1 justify-end bg-black/30 px-4 pb-6">
              <Pressable className="absolute inset-0" onPress={() => setReasonStatus(null)} />
              <View className="rounded-2xl border border-line bg-white p-4 shadow-lg">
                <Text className="mb-4 text-xl font-bold text-ink">{reasonStatus === "rejected" ? t("booking.rejectTitle") : t("booking.holdTitle")}</Text>
                <FormField label={t("common.reason")} value={reason} onChangeText={setReason} multiline numberOfLines={3} />
                <View className="mt-5 flex-row gap-3">
                  <AppButton className="flex-1" title={t("common.cancel")} variant="ghost" onPress={() => setReasonStatus(null)} />
                  <AppButton className="flex-1" title={t("common.save")} variant={reasonStatus === "rejected" ? "danger" : "secondary"} loading={updatingStatus} onPress={submitReason} />
                </View>
              </View>
            </View>
          </Modal>
        </>
      ) : null}
    </Screen>
  );
}
