import { Pressable, Text, View } from "react-native";
import { CalendarDays, ChevronRight, Clock, CreditCard, Phone, Users } from "lucide-react-native";
import { router } from "expo-router";
import { colors } from "@/constants/theme";
import { displayTime, formatCurrency, formatDateLabel } from "@/lib/date";
import type { Booking } from "@/types/database";
import { StatusChip } from "./ui/StatusChip";

export function BookingCard({ booking, expanded = false }: { booking: Booking; expanded?: boolean }) {
  const slot = booking.booking_slots?.[0];
  const payment = booking.booking_payments?.[0];

  return (
    <Pressable
      className={`mb-4 rounded-2xl border bg-white p-4 shadow-sm ${expanded ? "border-singha-600" : "border-line"}`}
      onPress={() => router.push(`/booking/${booking.booking_id}`)}
    >
      <View className="flex-row items-start">
        <View className="flex-1">
          <Text className="text-base font-bold text-singha-700">#{booking.booking_reference}</Text>
          <Text className="mt-2 text-xl font-bold text-ink">{booking.customers?.full_name ?? "Customer"}</Text>
          <Text className="mt-1 text-base text-ink">{slot?.tracks?.track_name ?? "Track"}</Text>
        </View>
        <View className="items-end gap-2">
          <StatusChip status={booking.status} />
          <Text className="text-lg font-bold text-ink">{formatCurrency(booking.total_price, booking.currency)}</Text>
          <View className="flex-row items-center">
            <CreditCard size={15} color={colors.muted} />
            <Text className="ml-2 text-sm text-muted">{payment?.payment_method === "pay_on_arrival" ? "Pay on arrival" : "Payment proof"}</Text>
          </View>
        </View>
        <ChevronRight size={24} color={colors.ink} />
      </View>

      <View className="mt-4 flex-row flex-wrap gap-4">
        <Meta icon={CalendarDays} label={formatDateLabel(booking.booking_date)} />
        <Meta icon={Clock} label={slot ? `${displayTime(slot.start_time)} - ${displayTime(slot.end_time)}` : "Time pending"} />
        <Meta icon={Users} label={`${booking.number_of_people} People`} />
      </View>

      {expanded ? (
        <View className="mt-4 rounded-xl bg-gray-50 p-4">
          <Text className="font-semibold text-ink">Customer Information</Text>
          <View className="mt-3 flex-row items-center">
            <Phone size={16} color={colors.muted} />
            <Text className="ml-2 text-muted">{booking.customers?.whatsapp_number ?? "No WhatsApp number"}</Text>
          </View>
          <Text className="mt-3 text-muted">{booking.remarks || "No remarks added."}</Text>
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
