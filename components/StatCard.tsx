import type { LucideIcon } from "lucide-react-native";
import { Text, View } from "react-native";
import { Card } from "./ui/Card";

type StatCardProps = {
  title: string;
  value: string;
  icon: LucideIcon;
  tone?: "green" | "orange" | "red";
  detail?: string;
};

export function StatCard({ title, value, icon: Icon, tone = "green", detail }: StatCardProps) {
  const toneClass = {
    green: "bg-green-50 text-singha-700",
    orange: "bg-orange-50 text-orange-600",
    red: "bg-red-50 text-red-600"
  }[tone];
  const iconColor = tone === "green" ? "#087d24" : tone === "orange" ? "#f79009" : "#f04438";

  return (
    <Card className="min-h-36 flex-1 justify-between">
      <View className={`h-12 w-12 items-center justify-center rounded-full ${toneClass.split(" ")[0]}`}>
        <Icon size={24} color={iconColor} />
      </View>
      <View>
        <Text className="text-3xl font-bold text-ink">{value}</Text>
        <Text className="mt-1 text-sm text-ink">{title}</Text>
        {detail ? <Text className="mt-2 text-sm font-medium text-singha-700">{detail}</Text> : null}
      </View>
    </Card>
  );
}
