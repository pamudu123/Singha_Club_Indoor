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

const barsDay = [8750, 10300, 12850, 10100, 15200, 14600, 16450];
const barsNight = [10000, 12000, 15000, 14000, 15000, 14000, 16000];
const labels = ["May 17", "May 18", "May 19", "May 20", "May 21", "May 22", "May 23"];

const timeBars = [4500, 8200, 12000, 6500, 2400];
const timeLabels = ["8 AM", "12 PM", "4 PM", "8 PM", "10 PM"];

export default function ReportsScreen() {
  const [range, setRange] = useState<"today" | "week" | "month" | "custom">("today");
  const [reportDate, setReportDate] = useState(todayISO());

  const isDaily = range === "week" || range === "month";
  
  const currentBarsDay = isDaily ? barsDay : [16450];
  const currentBarsNight = isDaily ? barsNight : [16000];
  const currentLabels = isDaily ? labels : [range === "today" ? "Today" : "Selected Date"];
  const maxTotal = Math.max(...currentBarsDay.map((d, i) => d + currentBarsNight[i]), 1);

  return (
    <Screen>
      <AppHeader title="SINGHA SPORTS CLUB" subtitle="Indoor Cricket Booking System" />
      <View className="mb-5 flex-row items-center justify-between">
        <View>
          <Text className="text-3xl font-bold text-ink">Reports</Text>
          <Text className="mt-1 text-base text-muted">Track performance and booking insights.</Text>
        </View>
      </View>
      <SegmentedFilter
        value={range}
        onChange={setRange}
        options={[
          { label: "Today", value: "today" },
          { label: "Week", value: "week" },
          { label: "Month", value: "month" },
          { label: "Custom", value: "custom" }
        ]}
      />

      {range === "custom" && (
        <DatePickerField className="mt-5" label="Custom Date" value={reportDate} onChange={setReportDate} />
      )}

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
          <View>
            <Text className="text-xl font-bold text-ink">Revenue Overview</Text>
            <View className="flex-row items-center mt-2 gap-3">
              <View className="flex-row items-center gap-1">
                <View className="w-3 h-3 rounded-full bg-green-500" />
                <Text className="text-xs text-muted">Day (Upto 2PM)</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <View className="w-3 h-3 rounded-full bg-gray-400" />
                <Text className="text-xs text-muted">Night (After 2PM)</Text>
              </View>
            </View>
          </View>
          <Text className="font-semibold text-singha-700">View full report</Text>
        </View>
        <View className={`h-64 flex-row items-end ${isDaily ? "justify-between" : "justify-center"}`}>
          {currentBarsDay.map((dayVal, index) => {
            const nightVal = currentBarsNight[index];
            const total = dayVal + nightVal;
            const dayHeightPercentage = (dayVal / total) * 100;
            const nightHeightPercentage = (nightVal / total) * 100;
            const barHeight = 50 + (total / maxTotal) * 130;
            
            return (
              <View key={currentLabels[index]} className="items-center">
                <Text className="mb-2 text-xs text-ink">LKR {Math.round(total / 1000)}K</Text>
                <View className="w-8 rounded-t-xl overflow-hidden justify-end" style={{ height: barHeight }}>
                  <View className="w-full bg-gray-400" style={{ height: `${nightHeightPercentage}%` }} />
                  <View className="w-full bg-green-500" style={{ height: `${dayHeightPercentage}%` }} />
                </View>
                <Text className="mt-2 text-xs text-muted">{currentLabels[index]}</Text>
              </View>
            );
          })}
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

      <Card className="mt-5 mb-5">
        <View className="mb-5 flex-row items-center justify-between">
          <View>
            <Text className="text-xl font-bold text-ink">Time Breakdown</Text>
            <View className="flex-row items-center mt-2 gap-3">
              <View className="flex-row items-center gap-1">
                <View className="w-3 h-3 rounded-full bg-green-500" />
                <Text className="text-xs text-muted">Day</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <View className="w-3 h-3 rounded-full bg-gray-400" />
                <Text className="text-xs text-muted">Night</Text>
              </View>
            </View>
          </View>
        </View>
        <View className="h-64 flex-row items-end justify-between">
          {timeBars.map((value, index) => {
            const isDay = timeLabels[index].includes("AM") || timeLabels[index] === "12 PM" || timeLabels[index] === "1 PM" || timeLabels[index] === "2 PM";
            return (
              <View key={timeLabels[index]} className="items-center">
                <Text className="mb-2 text-xs text-ink">LKR {Math.round(value / 1000)}K</Text>
                <View 
                  className={`w-8 rounded-t-xl ${isDay ? "bg-green-500" : "bg-gray-400"}`} 
                  style={{ height: 50 + (value / Math.max(...timeBars, 1)) * 130 }} 
                />
                <Text className="mt-2 text-xs text-muted">{timeLabels[index]}</Text>
              </View>
            );
          })}
        </View>
      </Card>
    </Screen>
  );
}
