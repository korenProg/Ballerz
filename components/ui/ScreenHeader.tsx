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
// Inside a SafeAreaView that already pads the top, pass safeTop={false}.
export default function ScreenHeader({
  title,
  subtitle,
  nav,
  onNav,
  crest,
  actions = [],
  safeTop = true,
}: {
  title: string;
  subtitle?: string;
  nav?: "back" | "close";
  onNav?: () => void;
  crest?: ReactNode;
  actions?: HeaderAction[];
  safeTop?: boolean;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingTop: safeTop ? insets.top : 0 }]}>
      <LinearGradient colors={BAR_FADE} style={StyleSheet.absoluteFill} pointerEvents="none" />
      <View style={styles.bar}>
        {nav ? (
          <HeaderButton
            icon={nav === "close" ? "close" : "chevron-back"}
            label={nav === "close" ? "Close" : "Back"}
            onPress={onNav ?? (() => router.back())}
          />
        ) : null}
        {crest ?? null}
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
        {actions.slice(0, 2).map((a) => (
          <HeaderButton key={a.label} icon={a.icon} label={a.label} onPress={a.onPress} />
        ))}
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
  // The gap below the divider keeps page content from touching the bar.
  wrap: { backgroundColor: T.bg, marginBottom: SPACE.md },
  divider: { height: 1 },
  bar: {
    height: HEADER_H,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.md,
    paddingHorizontal: SPACE.lg,
  },
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.surface,
  },
  btnPressed: { backgroundColor: T.surfaceAlt },
  titles: { flex: 1, justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "700", color: T.text },
  subtitle: { fontSize: 13, fontWeight: "400", color: T.textDim, marginTop: 1 },
});
