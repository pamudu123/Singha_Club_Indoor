import { Tabs } from "expo-router";
import { BarChart3, CalendarDays, Home, Settings, Users } from "lucide-react-native";
import { colors } from "@/constants/theme";
import { useLanguage } from "@/hooks/useLanguage";

export default function TabsLayout() {
  const { t } = useLanguage();

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
      <Tabs.Screen name="index" options={{ title: t("tabs.dashboard"), tabBarIcon: ({ color }) => <Home color={color} size={24} /> }} />
      <Tabs.Screen name="requests" options={{ title: t("tabs.requests"), tabBarIcon: ({ color }) => <Users color={color} size={24} /> }} />
      <Tabs.Screen name="schedule" options={{ title: t("tabs.schedule"), tabBarIcon: ({ color }) => <CalendarDays color={color} size={24} /> }} />
      <Tabs.Screen name="reports" options={{ title: t("tabs.reports"), tabBarIcon: ({ color }) => <BarChart3 color={color} size={24} /> }} />
      <Tabs.Screen name="settings" options={{ title: t("tabs.settings"), tabBarIcon: ({ color }) => <Settings color={color} size={24} /> }} />
      <Tabs.Screen name="create-booking" options={{ href: null }} />
      <Tabs.Screen name="block-slots" options={{ href: null }} />
      <Tabs.Screen name="pricing" options={{ href: null }} />
    </Tabs>
  );
}
