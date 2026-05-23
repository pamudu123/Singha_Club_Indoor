import { StatusBar } from "expo-status-bar";
import { forwardRef } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View, type ScrollViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ScreenProps = ScrollViewProps & {
  children: React.ReactNode;
  scroll?: boolean;
};

export const Screen = forwardRef<ScrollView, ScreenProps>(function Screen({ children, scroll = true, className = "", ...props }, ref) {
  const content = scroll ? (
    <ScrollView ref={ref} className={`flex-1 ${className}`} contentContainerClassName="px-5 pb-28" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" {...props}>
      {children}
    </ScrollView>
  ) : (
    <View className={`flex-1 px-5 pb-6 ${className}`}>{children}</View>
  );

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-white">
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
});
