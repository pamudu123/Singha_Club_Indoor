import { router } from "expo-router";
import { Bell, CheckCircle2, Globe, Lock, LogOut, Mail, MessageCircle, Settings2, Unlock, User, XCircle } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, Switch, Text, TextInput, View, Alert } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { localAdminId } from "@/constants/admin";
import { languageLabels } from "@/constants/translations";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { logout, updateAdminProfile } from "@/lib/authService";
import { getDefaultAdminSettings, loadAdminSettings, saveAdminSettings, type AdminSettings, type NotificationSettings } from "@/lib/settingsService";
import { formatWhatsapp } from "@/lib/validation";

export default function SettingsScreen() {
  const { admin, setAdmin } = useAuth();
  const { lang, setLang, t, tv } = useLanguage();
  const defaultSettings = getDefaultAdminSettings();
  const [notifications, setNotifications] = useState<NotificationSettings>(defaultSettings.notifications);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState(admin?.full_name ?? "Local Admin");
  const [whatsapp, setWhatsapp] = useState(admin?.whatsapp_number ?? "+94 77 123 4567");
  const [email, setEmail] = useState(admin?.email ?? "admin@singha.club");
  const [nic, setNic] = useState(admin?.nic ?? "");
  const [maxSlots, setMaxSlots] = useState(defaultSettings.maxSlots);
  const [defaultSlotPrice, setDefaultSlotPrice] = useState(defaultSettings.defaultSlotPrice);
  const adminId = admin?.id ?? localAdminId;

  useEffect(() => {
    let cancelled = false;
    loadAdminSettings(adminId).then((result) => {
      if (cancelled || !result.data) return;
      setNotifications(result.data.notifications);
      setMaxSlots(result.data.maxSlots);
      setDefaultSlotPrice(result.data.defaultSlotPrice);
      setLang(result.data.language);
    });
    return () => {
      cancelled = true;
    };
  }, [adminId, setLang]);

  function persistSettings(nextSettings: AdminSettings) {
    saveAdminSettings(adminId, nextSettings).then((result) => {
      if (result.error) {
        console.warn("Could not save admin settings", result.error);
      }
    }).catch((error) => {
      console.warn("Could not save admin settings", error);
    });
  }

  function currentSettings(overrides: Partial<AdminSettings> = {}): AdminSettings {
    return {
      language: lang,
      notifications,
      maxSlots,
      defaultSlotPrice,
      ...overrides
    };
  }

  function updateNotifications(nextNotifications: NotificationSettings) {
    setNotifications(nextNotifications);
    persistSettings(currentSettings({ notifications: nextNotifications }));
  }

  function updateMaxSlots(nextMaxSlots: number) {
    setMaxSlots(nextMaxSlots);
    persistSettings(currentSettings({ maxSlots: nextMaxSlots }));
  }

  function updateLanguage(nextLanguage: "en" | "si") {
    setLang(nextLanguage);
    persistSettings(currentSettings({ language: nextLanguage }));
  }

  async function onLogout() {
    await logout();
    setAdmin(null);
    router.replace("/(auth)/login");
  }

  async function handleToggleLock() {
    if (isUnlocked) {
      setIsSaving(true);
      const res = await updateAdminProfile(admin?.id ?? localAdminId, {
        fullName: name,
        whatsappNumber: whatsapp,
        email,
        nic
      });
      setIsSaving(false);

      if (res.error) {
        Alert.alert(t("settings.error"), tv(res.error) ?? res.error);
        return;
      } else if (res.data) {
        setAdmin(res.data);
      }
      setIsUnlocked(false);
    } else {
      setName(admin?.full_name ?? "Local Admin");
      setWhatsapp(admin?.whatsapp_number ?? "+94 77 123 4567");
      setEmail(admin?.email ?? "admin@singha.club");
      setNic(admin?.nic ?? "");
      setIsUnlocked(true);
    }
  }

  return (
    <Screen>
      <AppHeader title={t("settings.title")} subtitle={t("settings.subtitle")} />
      
      <SettingsSection title={t("settings.language")} subtitle={t("settings.language.subtitle")} icon={Globe}>
        <SegmentedToggleRow 
          icon={Globe} 
          label={t("settings.language")} 
          options={[languageLabels.en, languageLabels.si]} 
          value={languageLabels[lang]} 
          onChange={(val) => updateLanguage(val === languageLabels.si ? "si" : "en")} 
        />
      </SettingsSection>

      <SettingsSection title={t("settings.notifications")} subtitle={t("settings.notifications.subtitle")} icon={Bell}>
        <ToggleRow title={t("settings.notifications.newBooking")} value={notifications.booking} onValueChange={(booking) => updateNotifications({ ...notifications, booking })} />
        <ToggleRow title={t("settings.notifications.accepted")} value={notifications.accepted} onValueChange={(accepted) => updateNotifications({ ...notifications, accepted })} />
        <ToggleRow title={t("settings.notifications.rejected")} value={notifications.rejected} onValueChange={(rejected) => updateNotifications({ ...notifications, rejected })} />
        <ToggleRow title={t("settings.notifications.onHold")} value={notifications.onHold} onValueChange={(onHold) => updateNotifications({ ...notifications, onHold })} />
        <ToggleRow title={t("settings.notifications.dailySummary")} value={notifications.summary} onValueChange={(summary) => updateNotifications({ ...notifications, summary })} />
      </SettingsSection>

      <SettingsSection 
        title={t("settings.userDetails")} 
        subtitle={t("settings.userDetails.subtitle")} 
        icon={User}
        rightElement={
          <Pressable onPress={handleToggleLock} disabled={isSaving} className="h-12 w-12 items-center justify-center rounded-full bg-singha-50">
            {isUnlocked ? <Unlock size={24} color="#087d24" /> : <Lock size={24} color="#667085" />}
          </Pressable>
        }
      >
        <InfoRow icon={User} label={t("settings.userDetails.name")} value={name} isEditable={isUnlocked} onChangeText={setName} />
        <InfoRow icon={User} label={t("settings.userDetails.nic")} value={nic} isEditable={isUnlocked} onChangeText={setNic} placeholder="-" />
        <InfoRow icon={MessageCircle} label={t("settings.userDetails.whatsapp")} value={whatsapp} isEditable={isUnlocked} onChangeText={(text) => setWhatsapp(formatWhatsapp(text))} keyboardType="phone-pad" />
        <InfoRow icon={Mail} label={t("settings.userDetails.email")} value={email} isEditable={isUnlocked} onChangeText={setEmail} keyboardType="email-address" />
      </SettingsSection>

      <SettingsSection title={t("settings.bookingSettings")} subtitle={t("settings.bookingSettings.subtitle")} icon={Settings2}>
        <StepperRow icon={CheckCircle2} label={t("settings.bookingSettings.maxSlots")} value={maxSlots} onDecrement={() => updateMaxSlots(Math.max(1, maxSlots - 1))} onIncrement={() => updateMaxSlots(Math.min(50, maxSlots + 1))} />
      </SettingsSection>

      <SettingsSection title={t("settings.adminProfile")} subtitle={t("settings.adminProfile.subtitle")} icon={User}>
        <Pressable className="flex-row items-center border-t border-line py-4" onPress={onLogout}>
          <LogOut size={22} color="#f04438" />
          <Text className="ml-4 text-lg font-semibold text-red-500">{t("settings.logout")}</Text>
        </Pressable>
      </SettingsSection>
    </Screen>
  );
}

function SettingsSection({ title, subtitle, icon: Icon, rightElement, children }: { title: string; subtitle: string; icon: typeof Bell; rightElement?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="mb-5">
      <View className="mb-2 flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-xl font-bold text-ink">{title}</Text>
          <Text className="mt-1 text-muted">{subtitle}</Text>
        </View>
        {rightElement || (
          <View className="h-12 w-12 items-center justify-center rounded-full bg-green-50">
            <Icon size={24} color="#087d24" />
          </View>
        )}
      </View>
      {children}
    </Card>
  );
}

function ToggleRow({ title, value, onValueChange }: { title: string; value: boolean; onValueChange: (value: boolean) => void }) {
  return (
    <View className="flex-row flex-wrap items-center justify-between gap-3 border-t border-line py-4">
      <Text className="flex-1 text-lg text-ink">{title}</Text>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: "#087d24", false: "#d0d5dd" }} />
    </View>
  );
}

function InfoRow({ icon: Icon, label, value, isEditable, onChangeText, keyboardType, placeholder }: { icon: typeof XCircle; label: string; value: string; isEditable?: boolean; onChangeText?: (t: string) => void; keyboardType?: any; placeholder?: string }) {
  return (
    <View className="flex-row items-center border-t border-line py-3">
      <Icon size={20} color="#087d24" />
      <Text className="ml-3 w-28 text-sm font-medium text-muted">{label}</Text>
      {isEditable ? (
        <TextInput
          className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 text-right text-base text-ink"
          style={{ height: 40, paddingTop: 0, paddingBottom: 0, lineHeight: 20, includeFontPadding: false }}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholder={placeholder}
        />
      ) : (
        <Text className="min-w-0 flex-1 text-right text-base text-ink" numberOfLines={1} ellipsizeMode="tail">
          {value || placeholder || "-"}
        </Text>
      )}
    </View>
  );
}

function SegmentedToggleRow({ icon: Icon, label, options, value, onChange }: { icon: typeof XCircle; label: string; options: string[]; value: string; onChange: (val: string) => void }) {
  return (
    <View className="flex-row flex-wrap items-center justify-between gap-3 border-t border-line py-4">
      <View className="min-w-40 flex-1 flex-row items-center">
        <Icon size={22} color="#087d24" />
        <Text className="ml-4 text-lg text-ink">{label}</Text>
      </View>
      <View className="flex-row flex-wrap items-center overflow-hidden rounded-lg border border-line bg-surface">
        {options.map((opt, i) => {
          const isSelected = value === opt;
          return (
            <Pressable
              key={opt}
              className={`px-3 py-1.5 ${isSelected ? "bg-singha-100" : "bg-transparent"} ${i > 0 ? "border-l border-line" : ""}`}
              onPress={() => onChange(opt)}
            >
              <Text className={`text-sm font-semibold ${isSelected ? "text-singha-700" : "text-muted"}`}>{opt}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function StepperRow({ icon: Icon, label, value, onIncrement, onDecrement }: { icon: typeof XCircle; label: string; value: number; onIncrement: () => void; onDecrement: () => void }) {
  return (
    <View className="flex-row flex-wrap items-center justify-between gap-3 border-t border-line py-4">
      <View className="min-w-40 flex-1 flex-row items-center">
        <Icon size={22} color="#087d24" />
        <Text className="ml-4 text-lg text-ink">{label}</Text>
      </View>
      <View className="flex-row items-center gap-4">
        <Pressable className="h-8 w-8 items-center justify-center rounded-full border border-line" onPress={onDecrement}>
          <Text className="text-xl text-ink">-</Text>
        </Pressable>
        <Text className="w-8 text-center text-lg font-semibold text-ink">{value}</Text>
        <Pressable className="h-8 w-8 items-center justify-center rounded-full border border-line" onPress={onIncrement}>
          <Text className="text-xl text-ink">+</Text>
        </Pressable>
      </View>
    </View>
  );
}
