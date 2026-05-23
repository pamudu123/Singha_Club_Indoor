import { Pressable, Text, View } from "react-native";

export function SegmentedFilter<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { label: string; value: T; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <View
      className={`flex-row flex-wrap gap-3${className ? ` ${className}` : ""}`}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            className={`min-h-12 flex-row items-center justify-center rounded-xl border px-5 ${active ? "border-singha-600 bg-green-50" : "border-line bg-white"}`}
            onPress={() => onChange(option.value)}
          >
            <Text
              className={`text-base ${active ? "font-semibold text-singha-700" : "text-ink"}`}
            >
              {option.label}
            </Text>
            {typeof option.count === "number" ? (
              <View className="ml-3 rounded-full border border-line bg-white px-3 py-1">
                <Text className="text-sm text-ink">{option.count}</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
