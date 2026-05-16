import { Redirect } from "expo-router";
import { useAuth } from "@/hooks/useAuth";

export default function Index() {
  const { admin } = useAuth();
  return <Redirect href={admin ? "/(tabs)" : "/(auth)/login"} />;
}
