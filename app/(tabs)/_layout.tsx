import { Tabs } from "expo-router";
import { BarChart3, CalendarDays, Home, Settings, Users } from "lucide-react-native";
import { colors } from "@/constants/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          height: 72,
          paddingBottom: 12,
          paddingTop: 8,
          borderTopColor: colors.line,
          backgroundColor: "#fff"
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600"
        }
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Dashboard", tabBarIcon: ({ color }) => <Home color={color} size={24} /> }} />
      <Tabs.Screen name="requests" options={{ title: "Requests", tabBarIcon: ({ color }) => <Users color={color} size={24} /> }} />
      <Tabs.Screen name="schedule" options={{ title: "Schedule", tabBarIcon: ({ color }) => <CalendarDays color={color} size={24} /> }} />
      <Tabs.Screen name="reports" options={{ title: "Reports", tabBarIcon: ({ color }) => <BarChart3 color={color} size={24} /> }} />
      <Tabs.Screen name="settings" options={{ title: "Settings", tabBarIcon: ({ color }) => <Settings color={color} size={24} /> }} />
    </Tabs>
  );
}
