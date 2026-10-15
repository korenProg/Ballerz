import type { ComponentProps } from "react";
import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { T } from "../../constants/theme";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export default function IconButton({
  icon,
  onPress,
  label,
  tone = "plain",
}: {
  icon: IoniconName;
  onPress: () => void;
  label: string;
  tone?: "plain" | "filled";
}) {
  const filled = tone === "filled";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        filled ? styles.filled : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <Ionicons name={icon} size={22} color={filled ? "#000" : T.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  filled: { backgroundColor: T.accent },
  pressed: { opacity: 0.6 },
});
