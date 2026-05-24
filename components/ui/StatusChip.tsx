import { Text, View } from "react-native";
import { useLanguage } from "@/hooks/useLanguage";
import type { BookingStatus } from "@/types/database";

const statusStyles: Record<BookingStatus | "blocked" | "available" | "free", string> = {
  accepted: "bg-green-50 border-green-200 text-green-700",
  submitted: "bg-orange-50 border-orange-200 text-orange-700",
  on_hold: "bg-amber-50 border-amber-200 text-amber-700",
  rejected: "bg-red-50 border-red-200 text-red-600",
  blocked: "bg-rose-50 border-rose-200 text-rose-600",
  available: "bg-white border-line text-muted",
  free: "bg-emerald-50 border-emerald-200 text-emerald-700"
};

export function StatusChip({ status, isFree }: { status: BookingStatus | "blocked" | "available"; isFree?: boolean }) {
  const { t } = useLanguage();
  const activeStatus = isFree && status === "accepted" ? "free" : status;
  const [bg, border, text] = statusStyles[activeStatus].split(" ");
  return (
    <View className={`rounded-lg border px-3 py-1 ${bg} ${border}`}>
      <Text className={`text-xs font-semibold ${text}`}>{t(`status.${activeStatus}`)}</Text>
    </View>
  );
}
