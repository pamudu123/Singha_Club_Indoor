import type { LucideIcon } from "lucide-react-native";
import { Check, ChevronDown } from "lucide-react-native";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useState } from "react";
import { colors } from "@/constants/theme";
import { useLanguage } from "@/hooks/useLanguage";

type SelectOption<T extends string> = {
  label: string;
  value: T;
};

type SelectFieldProps<T extends string> = {
  label: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  icon?: LucideIcon;
  error?: string | null;
  className?: string;
};

export function SelectField<T extends string>({ label, value, options, onChange, icon: Icon, error, className = "" }: SelectFieldProps<T>) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  function select(value: T) {
    onChange(value);
    setOpen(false);
  }

  return (
    <View className={className}>
      <Text className="mb-2 text-sm font-medium text-muted">{label}</Text>
      <Pressable
        className={`min-h-14 flex-row items-center rounded-xl border bg-white px-3 active:opacity-80 ${error ? "border-red-300" : "border-line"}`}
        onPress={() => setOpen(true)}
      >
        {Icon ? <Icon size={20} color={colors.muted} /> : null}
        <Text className={`${Icon ? "ml-3" : ""} flex-1 text-base text-ink`}>{selected?.label ?? t("common.selectOption")}</Text>
        <ChevronDown size={20} color={colors.muted} />
      </Pressable>
      {error ? <Text className="mt-1 text-sm text-red-500">{error}</Text> : null}

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <View className="flex-1 justify-end bg-black/30 px-4 pb-6">
          <Pressable className="absolute inset-0" onPress={() => setOpen(false)} />
          <View className="rounded-2xl border border-line bg-white p-4 shadow-lg">
            <Text className="mb-3 text-lg font-bold text-ink">{label}</Text>
            <ScrollView className="max-h-96" showsVerticalScrollIndicator={false}>
              {options.map((option) => {
                const active = option.value === value;
                return (
                  <Pressable key={option.value} className="min-h-12 flex-row items-center border-t border-line py-3" onPress={() => select(option.value)}>
                    <Text className={`flex-1 pr-3 text-base ${active ? "font-semibold text-singha-700" : "text-ink"}`}>{option.label}</Text>
                    {active ? <Check size={20} color={colors.green} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
