import { BarChart3, Coins, TrendingUp, Users } from "lucide-react-native";
import { Text, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { SegmentedFilter } from "@/components/SegmentedFilter";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/Card";
import { DatePickerField } from "@/components/ui/DatePickerField";
import { Screen } from "@/components/ui/Screen";
import { useState } from "react";
import { todayISO } from "@/lib/date";

const bars = [18750, 22300, 27850, 24100, 30200, 28600, 32450];
const labels = ["May 17", "May 18", "May 19", "May 20", "May 21", "May 22", "May 23"];

export default function ReportsScreen() {
  const [range, setRange] = useState<"today" | "week" | "month" | "track">("today");
  const [reportDate, setReportDate] = useState(todayISO());

  return (
    <Screen>
      <AppHeader title="SINGHA SPORTS CLUB" subtitle="Indoor Cricket Booking System" />
      <View className="mb-5 flex-row items-center justify-between">
        <View>
          <Text className="text-3xl font-bold text-ink">Reports</Text>
          <Text className="mt-1 text-base text-muted">Track performance and booking insights.</Text>
        </View>
      </View>
      <DatePickerField className="mb-5" label="Booking Date" value={reportDate} onChange={setReportDate} />

      <SegmentedFilter
        value={range}
        onChange={setRange}
        options={[
          { label: "Today", value: "today" },
          { label: "Week", value: "week" },
          { label: "Month", value: "month" },
          { label: "Track", value: "track" }
        ]}
      />

      <View className="mt-5 flex-row gap-3">
        <StatCard title="Total Revenue" value="LKR 32,450" icon={Coins} />
        <StatCard title="Accepted" value="18" icon={Users} tone="orange" />
      </View>
      <View className="mt-3 flex-row gap-3">
        <StatCard title="Occupancy" value="72%" icon={TrendingUp} />
        <StatCard title="Busy Slots" value="5" icon={BarChart3} />
      </View>

      <Card className="mt-6">
        <View className="mb-5 flex-row items-center justify-between">
          <Text className="text-xl font-bold text-ink">Revenue Overview</Text>
          <Text className="font-semibold text-singha-700">View full report</Text>
        </View>
        <View className="h-64 flex-row items-end justify-between">
          {bars.map((value, index) => (
            <View key={labels[index]} className="items-center">
              <Text className="mb-2 text-xs text-ink">LKR {Math.round(value / 1000)}K</Text>
              <View className="w-8 rounded-t-xl bg-singha-600" style={{ height: 50 + (value / 32450) * 130 }} />
              <Text className="mt-2 text-xs text-muted">{labels[index]}</Text>
            </View>
          ))}
        </View>
      </Card>

      <View className="mt-5 flex-row gap-3">
        <Card className="flex-1">
          <Text className="mb-3 text-lg font-bold text-ink">Busiest Time Slots</Text>
          {["7:00 PM - 8:00 PM", "8:00 PM - 9:00 PM", "6:00 PM - 7:00 PM", "9:00 PM - 10:00 PM"].map((slot, index) => (
            <View key={slot} className="flex-row items-center border-t border-line py-3">
              <View className="h-7 w-7 items-center justify-center rounded-full bg-singha-600">
                <Text className="font-bold text-white">{index + 1}</Text>
              </View>
              <Text className="ml-3 flex-1 text-sm text-ink">{slot}</Text>
            </View>
          ))}
        </Card>
        <Card className="flex-1">
          <Text className="text-lg font-bold text-ink">Status Breakdown</Text>
          <View className="mt-5 items-center justify-center">
            <View className="h-32 w-32 items-center justify-center rounded-full border-[24px] border-singha-600">
              <Text className="font-bold text-ink">64%</Text>
            </View>
            <Text className="mt-4 text-muted">Accepted bookings</Text>
          </View>
        </Card>
      </View>
    </Screen>
  );
}
