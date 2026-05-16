import { Link, router } from "expo-router";
import { User } from "lucide-react-native";
import { useState } from "react";
import { Alert, Image, Text, View } from "react-native";
import { logo } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { login } from "@/lib/authService";
import { validateLogin } from "@/lib/validation";
import { AppButton } from "@/components/ui/AppButton";
import { FormField } from "@/components/ui/FormField";
import { Screen } from "@/components/ui/Screen";

export default function LoginScreen() {
  const { setAdmin } = useAuth();
  const [username, setUsername] = useState("Admin");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit() {
    const validation = validateLogin(username);
    setFormError(validation);
    if (validation) return;

    setLoading(true);
    const result = await login(username);
    setLoading(false);
    if (result.error || !result.data) {
      Alert.alert("Login failed", result.error ?? "Please try again.");
      return;
    }
    setAdmin(result.data);
    router.replace("/(tabs)");
  }

  return (
    <Screen className="pt-10">
      <View className="items-center">
        <Image source={logo} className="h-28 w-28 rounded-2xl" resizeMode="contain" />
        <Text className="mt-6 text-center text-3xl font-bold text-ink">Singha Sports Club</Text>
        <Text className="mt-2 text-center text-base uppercase text-muted">Indoor Cricket Booking System</Text>
      </View>

      <View className="mt-10 gap-5">
        <FormField label="Username" icon={User} value={username} onChangeText={setUsername} autoCapitalize="words" error={formError} />
        <AppButton title="Continue" loading={loading} onPress={onSubmit} />
      </View>

      <Text className="mt-8 text-center text-muted">
        New admin?{" "}
        <Link href="/(auth)/signup" className="font-semibold text-singha-700">
          Create account
        </Link>
      </Text>
    </Screen>
  );
}
