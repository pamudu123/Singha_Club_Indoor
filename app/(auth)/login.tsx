import { Link, router } from "expo-router";
import { User } from "lucide-react-native";
import { useState } from "react";
import { Alert, Image, Text, View } from "react-native";
import { logo } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { login } from "@/lib/authService";
import { validateLogin } from "@/lib/validation";
import { AppButton } from "@/components/ui/AppButton";
import { FormField } from "@/components/ui/FormField";
import { Screen } from "@/components/ui/Screen";

export default function LoginScreen() {
  const { setAdmin } = useAuth();
  const { t, tv } = useLanguage();
  const [username, setUsername] = useState("Admin");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit() {
    const validation = validateLogin(username);
    setFormError(tv(validation));
    if (validation) return;

    setLoading(true);
    const result = await login(username);
    setLoading(false);
    if (result.error || !result.data) {
      Alert.alert(t("auth.loginFailed"), tv(result.error) ?? result.error ?? t("auth.tryAgain"));
      return;
    }
    setAdmin(result.data);
    router.replace("/(tabs)");
  }

  return (
    <Screen className="pt-10">
      <View className="items-center">
        <Image source={logo} className="h-28 w-28 rounded-2xl" resizeMode="contain" />
        <Text className="mt-6 text-center text-3xl font-bold text-ink">{t("app.clubNameTitle")}</Text>
        <Text className="mt-2 text-center text-base uppercase text-muted">{t("app.subtitle")}</Text>
      </View>

      <View className="mt-10 gap-5">
        <FormField label={t("auth.username")} icon={User} value={username} onChangeText={setUsername} autoCapitalize="none" error={formError} />
        <AppButton title={t("common.continue")} loading={loading} onPress={onSubmit} />
      </View>

      <Text className="mt-8 text-center text-muted">
        {t("auth.newAdmin")}{" "}
        <Link href="/(auth)/signup" className="font-semibold text-singha-700">
          {t("auth.createAccount")}
        </Link>
      </Text>
    </Screen>
  );
}
