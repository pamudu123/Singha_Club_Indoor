import type { LucideIcon } from "lucide-react-native";
import { Text, TextInput, View, type TextInputProps } from "react-native";
import { colors } from "@/constants/theme";

type FormFieldProps = TextInputProps & {
  label: string;
  icon?: LucideIcon;
  error?: string | null;
};

export function FormField({ label, icon: Icon, error, className = "", ...props }: FormFieldProps) {
  const { style, multiline, ...inputProps } = props;
  const inputStyle = [
    multiline
      ? {
          minHeight: 88,
          paddingTop: 10,
          paddingBottom: 10,
          lineHeight: 22,
          includeFontPadding: true
        }
      : {
          height: 42,
          paddingTop: 0,
          paddingBottom: 0,
          lineHeight: 20,
          includeFontPadding: false
        },
    style
  ];

  return (
    <View className={className}>
      <Text className="mb-2 text-sm font-medium text-muted">{label}</Text>
      <View className={`${multiline ? "min-h-24" : "h-12"} flex-row rounded-xl border bg-white px-3 ${multiline ? "items-start" : "items-center"} ${error ? "border-red-300" : "border-line"}`}>
        {Icon ? <Icon size={20} color={colors.muted} className={multiline ? "mt-4" : ""} /> : null}
        <TextInput
          className={`${Icon ? "ml-3" : ""} flex-1 text-base text-ink`}
          placeholderTextColor="#98a2b3"
          textAlignVertical={multiline ? "top" : "center"}
          multiline={multiline}
          style={inputStyle}
          {...inputProps}
        />
      </View>
      {error ? <Text className="mt-1 text-sm text-red-500">{error}</Text> : null}
    </View>
  );
}
