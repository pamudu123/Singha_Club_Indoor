import { router } from "expo-router";
import { Bell, CheckCircle2, LogOut, Mail, MessageCircle, Settings2, User, XCircle } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Switch, Text, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/lib/authService";

export default function SettingsScreen() {
  const { admin, setAdmin } = useAuth();
  const [notifications, setNotifications] = useState({
    booking: true,
    accepted: true,
    rejected: true,
    onHold: true,
    summary: true
  });

  async function onLogout() {
    await logout();
    setAdmin(null);
    router.replace("/(auth)/login");
  }

  return (
    <Screen>
      <AppHeader title="Settings" subtitle="Manage your club and preferences" />
      <SettingsSection title="Notifications" subtitle="Choose what you want to be notified about." icon={Bell}>
        <ToggleRow title="New Booking" value={notifications.booking} onValueChange={(booking) => setNotifications((value) => ({ ...value, booking }))} />
        <ToggleRow title="Accepted" value={notifications.accepted} onValueChange={(accepted) => setNotifications((value) => ({ ...value, accepted }))} />
        <ToggleRow title="Rejected" value={notifications.rejected} onValueChange={(rejected) => setNotifications((value) => ({ ...value, rejected }))} />
        <ToggleRow title="On Hold" value={notifications.onHold} onValueChange={(onHold) => setNotifications((value) => ({ ...value, onHold }))} />
        <ToggleRow title="Daily Summary" value={notifications.summary} onValueChange={(summary) => setNotifications((value) => ({ ...value, summary }))} />
      </SettingsSection>

      <SettingsSection title="User Details" subtitle="Update your personal information." icon={User}>
        <InfoRow icon={User} label="Name" value={admin?.full_name ?? "Local Admin"} />
        <InfoRow icon={MessageCircle} label="WhatsApp Number" value={admin?.whatsapp_number ?? "+94 77 123 4567"} />
        <InfoRow icon={Mail} label="Email" value={admin?.email ?? "admin@singha.club"} />
      </SettingsSection>

      <SettingsSection title="Booking Settings" subtitle="Configure default booking preferences." icon={Settings2}>
        <InfoRow icon={CheckCircle2} label="Default Currency" value="LKR" />
        <InfoRow icon={CheckCircle2} label="Slot Duration" value="30 Minutes" />
        <InfoRow icon={CheckCircle2} label="Maximum Slots Per Booking" value="10" />
        <InfoRow icon={CheckCircle2} label="Booking Buffer" value="15 Minutes" />
      </SettingsSection>

      <SettingsSection title="Admin Profile" subtitle="Manage your admin account." icon={User}>
        <Pressable className="flex-row items-center border-t border-line py-4" onPress={onLogout}>
          <LogOut size={22} color="#f04438" />
          <Text className="ml-4 text-lg font-semibold text-red-500">Logout</Text>
        </Pressable>
      </SettingsSection>
    </Screen>
  );
}

function SettingsSection({ title, subtitle, icon: Icon, children }: { title: string; subtitle: string; icon: typeof Bell; children: React.ReactNode }) {
  return (
    <Card className="mb-5">
      <View className="mb-2 flex-row items-start justify-between">
        <View>
          <Text className="text-xl font-bold text-ink">{title}</Text>
          <Text className="mt-1 text-muted">{subtitle}</Text>
        </View>
        <View className="h-12 w-12 items-center justify-center rounded-full bg-green-50">
          <Icon size={24} color="#087d24" />
        </View>
      </View>
      {children}
    </Card>
  );
}

function ToggleRow({ title, value, onValueChange }: { title: string; value: boolean; onValueChange: (value: boolean) => void }) {
  return (
    <View className="flex-row items-center justify-between border-t border-line py-4">
      <Text className="text-lg text-ink">{title}</Text>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: "#087d24", false: "#d0d5dd" }} />
    </View>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof XCircle; label: string; value: string }) {
  return (
    <View className="flex-row items-center border-t border-line py-4">
      <Icon size={22} color="#087d24" />
      <Text className="ml-4 flex-1 text-lg text-ink">{label}</Text>
      <Text className="max-w-[48%] text-right text-muted" numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}
