import { Pressable, Text, View } from "react-native";
import { CalendarDays, Clock, CreditCard, Phone, Users } from "lucide-react-native";
import { colors } from "@/constants/theme";
import { displayTime, formatCurrency, formatDateLabel } from "@/lib/date";
import { useLanguage } from "@/hooks/useLanguage";
import type { Booking } from "@/types/database";
import { StatusChip } from "./ui/StatusChip";

type BookingCardProps = {
  booking: Booking;
  expanded?: boolean;
  onPress?: () => void;
};

export function BookingCard({ booking, expanded = false, onPress }: BookingCardProps) {
  const { locale, t } = useLanguage();
  const slot = booking.booking_slots?.[0];
  const payment = booking.booking_payments?.[0];

  return (
    <Pressable
      className={`mb-4 rounded-2xl border bg-white p-4 shadow-sm ${onPress ? "active:opacity-80" : ""} ${expanded ? "border-singha-600" : "border-line"}`}
      disabled={!onPress}
      onPress={onPress}
    >
      <View className="flex-row items-start">
        <View className="flex-1">
          <Text className="text-base font-bold text-singha-700">#{booking.booking_reference}</Text>
          <Text className="mt-2 text-xl font-bold text-ink">{booking.customers?.full_name ?? t("common.customer")}</Text>
          <Text className="mt-1 text-base text-ink">{slot?.tracks?.track_name ?? t("common.track")}</Text>
        </View>
        <View className="items-end gap-2">
          <StatusChip status={booking.status} isFree={booking.total_price === 0} />
          <Text className="text-lg font-bold text-ink">{formatCurrency(booking.total_price, booking.currency)}</Text>
          <View className="flex-row items-center">
            <CreditCard size={15} color={colors.muted} />
            <Text className="ml-2 text-sm text-muted">{payment?.payment_method === "pay_on_arrival" ? t("common.payOnArrival") : t("common.paymentProof")}</Text>
          </View>
        </View>
      </View>

      <View className="mt-4 flex-row flex-wrap gap-4">
        <Meta icon={CalendarDays} label={formatDateLabel(booking.booking_date, locale)} />
        <Meta icon={Clock} label={slot ? `${displayTime(slot.start_time)} - ${displayTime(slot.end_time)}` : t("booking.timePending")} />
        <Meta icon={Users} label={t("booking.people", { count: booking.number_of_people })} />
      </View>

      {booking.status === "rejected" && booking.rejection_reason ? (
        <Text className="mt-3 text-sm text-red-500">{t("booking.rejectionReason")}: {booking.rejection_reason}</Text>
      ) : null}
      {booking.status === "on_hold" && booking.on_hold_reason ? (
        <Text className="mt-3 text-sm text-orange-500">{t("booking.onHoldReason")}: {booking.on_hold_reason}</Text>
      ) : null}

      {expanded ? (
        <View className="mt-4 rounded-xl bg-gray-50 p-4">
          <Text className="font-semibold text-ink">{t("booking.customerInformation")}</Text>
          <View className="mt-3 flex-row items-center">
            <Phone size={16} color={colors.muted} />
            <Text className="ml-2 text-muted">{booking.customers?.whatsapp_number ?? t("booking.noWhatsapp")}</Text>
          </View>
          <Text className="mt-3 text-muted">{booking.remarks || t("booking.noRemarks")}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function Meta({ icon: Icon, label }: { icon: typeof CalendarDays; label: string }) {
  return (
    <View className="min-w-28 flex-row items-center">
      <Icon size={17} color={colors.muted} />
      <Text className="ml-2 text-sm text-muted">{label}</Text>
    </View>
  );
}
