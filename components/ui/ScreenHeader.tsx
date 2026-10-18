import type { ComponentProps, ReactNode } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { T, SPACE } from "../../constants/theme";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export type HeaderAction = { icon: IoniconName; label: string; onPress: () => void };

export const HEADER_H = 56;
const SIDE_W = 88;

// The bar fades from a faint grey at the top into the black page, and its
// divider glows in the middle and fades out towards both edges.
const BAR_FADE = ["#171717", T.bg] as const;
const DIVIDER_FADE = ["transparent", "#3D3D3D", "transparent"] as const;

// The round grey button used for every top-bar action. Exported so screens
// without a top bar (the step wizards) can still offer a matching close.
export function HeaderButton({ icon, label, onPress }: HeaderAction) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [styles.btn, pressed ? styles.btnPressed : null]}
    >
      <Ionicons name={icon} size={20} color={T.text} />
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
}: {
  title: string;
  subtitle?: string;
  nav?: "back" | "close";
  onNav?: () => void;
  crest?: ReactNode;
  actions?: HeaderAction[];
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      <LinearGradient colors={BAR_FADE} style={StyleSheet.absoluteFill} pointerEvents="none" />
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
            <HeaderButton key={a.label} icon={a.icon} label={a.label} onPress={a.onPress} />
          ))}
        </View>
      </View>
      <LinearGradient
        colors={DIVIDER_FADE}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.divider}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: T.bg },
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
  btnPressed: { backgroundColor: T.surfaceAlt },
  titles: { maxWidth: "100%", alignItems: "center" },
  title: { fontSize: 17, fontWeight: "700", color: T.text, textAlign: "center" },
  subtitle: { fontSize: 12, fontWeight: "400", color: T.textDim, textAlign: "center", marginTop: 1 },
});
