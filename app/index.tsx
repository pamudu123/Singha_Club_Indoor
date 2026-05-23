import { Redirect } from "expo-router";
import { useAuth } from "@/hooks/useAuth";

export default function Index() {
  const { admin, loading } = useAuth();
  
  if (loading) {
    return null; // Await session restoration quietly
  }

  return <Redirect href={admin ? "/(tabs)" : "/(auth)/login"} />;
}
