import type { ReactNode } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { TextInput } from "./Text";
import { Ionicons } from "@expo/vector-icons";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { T, SPACE } from "../../constants/theme";

// iOS 26+ draws the field as a real Liquid Glass capsule, matching the glass
// header buttons; older iOS, Android and web get the same capsule in grey.
const GLASS = isLiquidGlassAvailable();
const HEIGHT = 44;

function Capsule({ children }: { children: ReactNode }) {
  if (GLASS) {
    return (
      <GlassView style={styles.field} glassEffectStyle="regular" colorScheme="dark" isInteractive>
        {children}
      </GlassView>
    );
  }
  return <View style={[styles.field, styles.solid]}>{children}</View>;
}

// iOS-style search capsule: leading magnifier, and a filled ✕ that appears
// once there is text.
export default function SearchField({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
}) {
  return (
    <Capsule>
      <Ionicons name="search" size={17} color={T.textDim} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={T.textDim}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="never"
        keyboardAppearance="dark"
        selectionColor={T.accent}
        accessibilityLabel={placeholder}
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={10}
          onPress={() => onChangeText("")}
          style={({ pressed }) => (pressed ? styles.clearPressed : null)}
        >
          <Ionicons name="close-circle" size={18} color={T.textFaint} />
        </Pressable>
      ) : null}
    </Capsule>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.sm,
    height: HEIGHT,
    paddingHorizontal: 14,
    borderRadius: HEIGHT / 2,
    overflow: "hidden",
  },
  solid: { backgroundColor: T.surface },
  // outlineWidth: 0 drops the browser's focus rectangle on web; it is a no-op on native.
  input: { flex: 1, height: HEIGHT, fontSize: 16, fontWeight: "400", color: T.text, outlineWidth: 0 },
  clearPressed: { opacity: 0.6 },
});
