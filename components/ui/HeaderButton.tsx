import type { ComponentProps } from "react";
import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { T, SHEET } from "../../constants/theme";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export type HeaderAction = {
  icon: IoniconName;
  label: string;
  onPress: () => void;
  // The confirming action (e.g. a sheet's ✓): accent-tinted.
  prominent?: boolean;
  disabled?: boolean;
};

// iOS 26+ draws the real Liquid Glass material; everywhere else (older iOS,
// Android, web) the buttons stay as the grey circles.
const GLASS = isLiquidGlassAvailable();

// The round button used for every top-bar action. Screens without a top bar
// (the step wizards) use it directly for a matching close.
export function HeaderButton({
  icon,
  label,
  onPress,
  prominent = false,
  disabled = false,
  onSheet = false,
}: HeaderAction & { onSheet?: boolean }) {
  const lit = prominent && !disabled;
  const glyph = <Ionicons name={icon} size={20} color={lit ? "#000" : T.text} />;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) =>
        GLASS
          ? [styles.glassHit, disabled ? styles.disabled : null, pressed ? styles.glassPressed : null]
          : [
              styles.btn,
              onSheet ? styles.btnOnSheet : null,
              pressed ? styles.btnPressed : null,
              lit ? styles.btnProminent : null,
              disabled ? styles.disabled : null,
            ]
      }
    >
      {GLASS ? (
        <GlassView
          style={styles.btn}
          glassEffectStyle="regular"
          colorScheme="dark"
          tintColor={lit ? T.accent : undefined}
          isInteractive
        >
          {glyph}
        </GlassView>
      ) : (
        glyph
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.surface,
  },
  btnOnSheet: { backgroundColor: SHEET.cell },
  btnPressed: { backgroundColor: T.surfaceAlt },
  btnProminent: { backgroundColor: T.accent },
  disabled: { opacity: 0.35 },
  // With glass, the GlassView is the visible circle; the Pressable just hosts it.
  glassHit: { width: 40, height: 40, borderRadius: 20 },
  glassPressed: { opacity: 0.8 },
});
