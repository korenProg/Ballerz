import type { ComponentProps } from "react";
import { Pressable, StyleSheet } from "react-native";
import { Text } from "./Text";
import { Ionicons } from "@expo/vector-icons";
import { T, RADIUS, SPACE } from "../../constants/theme";

type Variant = "primary" | "secondary" | "destructive";
const FG: Record<Variant, string> = { primary: "#000", secondary: T.text, destructive: T.red };

export default function Button({
  label,
  onPress,
  variant = "primary",
  icon,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: ComponentProps<typeof Ionicons>["name"];
  disabled?: boolean;
}) {
  const fg = disabled ? T.textFaint : FG[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        variant === "primary" ? styles.primary : styles.neutral,
        disabled ? styles.disabled : null,
        pressed && !disabled ? styles.pressed : null,
      ]}
    >
      {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACE.sm,
    height: 50,
    borderRadius: RADIUS.control,
  },
  primary: { backgroundColor: T.accent },
  neutral: { backgroundColor: T.surfaceAlt },
  disabled: { backgroundColor: T.surfaceAlt },
  pressed: { opacity: 0.7 },
  label: { fontSize: 15, fontWeight: "700" },
});
