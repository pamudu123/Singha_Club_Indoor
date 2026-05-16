import { ActivityIndicator, Pressable, Text, type PressableProps } from "react-native";
import type { LucideIcon } from "lucide-react-native";

type AppButtonProps = PressableProps & {
  title: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  loading?: boolean;
  icon?: LucideIcon;
};

export function AppButton({ title, variant = "primary", loading, icon: Icon, className = "", disabled, ...props }: AppButtonProps) {
  const styles = {
    primary: "bg-singha-600 border-singha-600",
    secondary: "bg-white border-singha-600",
    danger: "bg-red-50 border-red-200",
    ghost: "bg-white border-line"
  }[variant];
  const textStyles = {
    primary: "text-white",
    secondary: "text-singha-700",
    danger: "text-red-600",
    ghost: "text-ink"
  }[variant];

  return (
    <Pressable
      className={`min-h-12 flex-row items-center justify-center gap-2 rounded-xl border px-4 active:opacity-80 ${styles} ${disabled ? "opacity-50" : ""} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <ActivityIndicator color={variant === "primary" ? "#fff" : "#087d24"} /> : Icon ? <Icon size={19} color={variant === "primary" ? "#fff" : "#087d24"} /> : null}
      <Text className={`text-base font-semibold ${textStyles}`}>{title}</Text>
    </Pressable>
  );
}
