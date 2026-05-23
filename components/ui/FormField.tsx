import type { LucideIcon } from "lucide-react-native";
import { Text, TextInput, View, type TextInputProps } from "react-native";
import { colors } from "@/constants/theme";

type FormFieldProps = TextInputProps & {
  label: string;
  icon?: LucideIcon;
  error?: string | null;
};

export function FormField({ label, icon: Icon, error, className = "", ...props }: FormFieldProps) {
  return (
    <View className={className}>
      <Text className="mb-2 text-sm font-medium text-muted">{label}</Text>
      <View className={`min-h-14 flex-row rounded-xl border bg-white px-3 ${props.multiline ? "items-start" : "items-center"} ${error ? "border-red-300" : "border-line"}`}>
        {Icon ? <Icon size={20} color={colors.muted} className={props.multiline ? "mt-4" : ""} /> : null}
        <TextInput className={`${Icon ? "ml-3" : ""} flex-1 py-4 text-base text-ink`} placeholderTextColor="#98a2b3" textAlignVertical={props.multiline ? "top" : "center"} {...props} />
      </View>
      {error ? <Text className="mt-1 text-sm text-red-500">{error}</Text> : null}
    </View>
  );
}
