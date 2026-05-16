import { Check } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

export function SlotPicker({
  slots,
  selected,
  unavailable = [],
  onToggle
}: {
  slots: string[];
  selected: string[];
  unavailable?: string[];
  onToggle: (slot: string) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-3">
      {slots.map((slot) => {
        const active = selected.includes(slot);
        const disabled = unavailable.includes(slot);
        return (
          <Pressable
            key={slot}
            disabled={disabled}
            className={`min-h-12 min-w-[30%] flex-row items-center justify-center rounded-xl border px-3 ${
              disabled ? "border-line bg-gray-100" : active ? "border-singha-600 bg-green-50" : "border-line bg-white"
            }`}
            onPress={() => onToggle(slot)}
          >
            <Text className={`text-base ${disabled ? "text-muted" : active ? "font-semibold text-singha-700" : "text-ink"}`}>{slot}</Text>
            {active ? (
              <View className="ml-2 h-6 w-6 items-center justify-center rounded-full bg-singha-600">
                <Check size={15} color="#fff" />
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
