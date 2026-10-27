import type { ComponentProps, ReactNode } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { T, SPACE, SHEET } from "../../constants/theme";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export type HeaderAction = {
  icon: IoniconName;
  label: string;
  onPress: () => void;
  // The confirming action (e.g. a sheet's ✓): accent-tinted.
  prominent?: boolean;
  disabled?: boolean;
};

export const HEADER_H = 56;
const SIDE_W = 88;

// The bar fades from a faint grey at the top into the black page, and its
// divider glows in the middle and fades out towards both edges.
const BAR_FADE = ["#171717", T.bg] as const;
const DIVIDER_FADE = ["transparent", "#3D3D3D", "transparent"] as const;

// iOS 26+ draws the real Liquid Glass material; everywhere else (older iOS,
// Android, web) the buttons stay as the grey circles.
const GLASS = isLiquidGlassAvailable();

// The round button used for every top-bar action. Exported so screens
// without a top bar (the step wizards) can still offer a matching close.
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

// The one top bar every screen uses. Screens pass data, never their own
// buttons, so every bar has the same height, spacing and button style.
// It always pads the status-bar area itself so its gradient runs to the very
// top of the screen; wrap screens in SafeAreaView with edges={["bottom"]} only.
export default function ScreenHeader({
  title,
  subtitle,
  nav,
  onNav,
  crest,
  actions = [],
  sheet = false,
}: {
  title: string;
  subtitle?: string;
  nav?: "back" | "close";
  onNav?: () => void;
  crest?: ReactNode;
  actions?: HeaderAction[];
  // Inside an iOS sheet the screen starts below the status bar, so no top
  // inset, and the bar is drawn flat on the sheet colour.
  sheet?: boolean;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={sheet ? [styles.wrap, styles.wrapSheet] : [styles.wrap, { paddingTop: insets.top }]}>
      {/* A sheet's bar is flat on the sheet colour, as iOS draws it. */}
      {sheet ? null : (
        <LinearGradient colors={BAR_FADE} style={StyleSheet.absoluteFill} pointerEvents="none" />
      )}
      {/* Both side slots are always SIDE_W wide, even when empty, so the
          title block sits on the screen's true centre line. */}
      <View style={styles.bar}>
        {/* The crest lives in the left slot (where back/close sit on other
            pages) so it never pushes the title off the centre line. */}
        <View style={[styles.side, styles.sideLeft]}>
          {nav ? (
            <HeaderButton
              icon={nav === "close" ? "close" : "chevron-back"}
              label={nav === "close" ? "Close" : "Back"}
              onPress={onNav ?? (() => router.back())}
              onSheet={sheet}
            />
          ) : (
            crest ?? null
          )}
        </View>
        <View style={styles.center}>
          <View style={styles.titles}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={[styles.side, styles.sideRight]}>
          {actions.slice(0, 2).map((a) => (
            <HeaderButton key={a.label} {...a} onSheet={sheet} />
          ))}
        </View>
      </View>
      {sheet ? null : (
        <LinearGradient
          colors={DIVIDER_FADE}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.divider}
          pointerEvents="none"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: T.bg },
  wrapSheet: { backgroundColor: SHEET.bg, paddingTop: SPACE.sm },
  divider: { height: 1 },
  bar: {
    height: HEADER_H,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACE.lg,
  },
  // Fits two 40px buttons plus the gap between them.
  side: { width: SIDE_W, flexDirection: "row", alignItems: "center", gap: SPACE.sm },
  sideLeft: { justifyContent: "flex-start" },
  sideRight: { justifyContent: "flex-end" },
  center: { flex: 1, alignItems: "center", paddingHorizontal: SPACE.xs },
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
  titles: { maxWidth: "100%", alignItems: "center" },
  title: { fontSize: 17, fontWeight: "700", color: T.text, textAlign: "center" },
  subtitle: { fontSize: 12, fontWeight: "400", color: T.textDim, textAlign: "center", marginTop: 1 },
});
