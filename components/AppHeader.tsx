import { Image, Pressable, Text, View } from "react-native";
import { ChevronLeft, Search, SlidersHorizontal } from "lucide-react-native";
import { router } from "expo-router";
import { colors, logo } from "@/constants/theme";

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  showSearch?: boolean;
  showFilter?: boolean;
  onSearchPress?: () => void;
  onFilterPress?: () => void;
};

export function AppHeader({ title, subtitle, showBack, showSearch, showFilter, onSearchPress, onFilterPress }: AppHeaderProps) {
  return (
    <View className="mb-5 flex-row items-center border-b border-line bg-white px-5 pb-4 pt-2">
      {showBack ? (
        <Pressable accessibilityLabel="Go back" className="mr-3 h-11 w-11 items-center justify-center rounded-full" onPress={() => router.back()}>
          <ChevronLeft size={30} color={colors.ink} />
        </Pressable>
      ) : null}
      <Image source={logo} className="h-16 w-16 rounded-xl" resizeMode="contain" />
      <View className="ml-3 flex-1">
        <Text className="text-2xl font-bold text-ink" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="mt-1 text-sm uppercase tracking-normal text-muted" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View className="flex-row items-center gap-2">
        {showSearch ? (
          <Pressable className="h-11 w-11 items-center justify-center rounded-full bg-white" onPress={onSearchPress}>
            <Search size={23} color={colors.ink} />
          </Pressable>
        ) : null}
        {showFilter ? (
          <Pressable className="h-11 w-11 items-center justify-center rounded-full bg-white" onPress={onFilterPress}>
            <SlidersHorizontal size={23} color={colors.ink} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
