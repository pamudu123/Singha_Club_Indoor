import { ActivityIndicator, Text, View } from "react-native";
import { AlertCircle, Inbox } from "lucide-react-native";
import { colors } from "@/constants/theme";

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <View className="items-center justify-center py-12">
      <ActivityIndicator color={colors.green} />
      <Text className="mt-3 text-muted">{label}</Text>
    </View>
  );
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <View className="items-center justify-center rounded-2xl border border-line bg-white p-8">
      <Inbox size={32} color={colors.muted} />
      <Text className="mt-3 text-lg font-semibold text-ink">{title}</Text>
      <Text className="mt-1 text-center text-muted">{message}</Text>
    </View>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <View className="flex-row items-center rounded-xl border border-red-200 bg-red-50 p-4">
      <AlertCircle size={20} color={colors.red} />
      <Text className="ml-3 flex-1 text-red-700">{message}</Text>
    </View>
  );
}
