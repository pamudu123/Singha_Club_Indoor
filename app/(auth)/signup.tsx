import { Link, router } from "expo-router";
import { Mail, Phone, User } from "lucide-react-native";
import { useState } from "react";
import { Alert, Image, Text, View } from "react-native";
import { logo } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { signup } from "@/lib/authService";
import { formatWhatsapp, validateSignup } from "@/lib/validation";
import { AppButton } from "@/components/ui/AppButton";
import { FormField } from "@/components/ui/FormField";
import { Screen } from "@/components/ui/Screen";

export default function SignupScreen() {
  const { setAdmin } = useAuth();
  const [fullName, setFullName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit() {
    const validation = validateSignup({ fullName, whatsappNumber, email });
    setFormError(validation);
    if (validation) return;

    setLoading(true);
    const result = await signup({ fullName, whatsappNumber, email });
    setLoading(false);
    if (result.error || !result.data) {
      Alert.alert("Signup failed", result.error ?? "Please try again.");
      return;
    }
    setAdmin(result.data);
    router.replace("/(tabs)");
  }

  return (
    <Screen className="pt-8">
      <View className="items-center">
        <Image source={logo} className="h-24 w-24 rounded-2xl" resizeMode="contain" />
        <Text className="mt-5 text-center text-3xl font-bold text-ink">Create Admin Account</Text>
        <Text className="mt-2 text-center text-muted">Add your club profile details.</Text>
      </View>

      <View className="mt-8 gap-4">
        <FormField label="Name" icon={User} value={fullName} onChangeText={setFullName} />
        <FormField label="WhatsApp Number" icon={Phone} value={whatsappNumber} onChangeText={(text) => setWhatsappNumber(formatWhatsapp(text))} placeholder="012 345 6789" keyboardType="phone-pad" />
        <FormField label="Email" icon={Mail} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" error={formError} />
        <AppButton title="Create Account" loading={loading} onPress={onSubmit} />
      </View>

      <Text className="mt-8 text-center text-muted">
        Already registered?{" "}
        <Link href="/(auth)/login" className="font-semibold text-singha-700">
          Login
        </Link>
      </Text>
    </Screen>
  );
}
