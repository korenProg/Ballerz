import { Platform, type TextStyle } from "react-native";

// FotMob-style dark palette.
// See docs/superpowers/specs/2026-10-13-fotmob-redesign-design.md section 1.
export const T = {
  bg: "#000000",
  surface: "#1A1A1A",
  surfaceAlt: "#262626",
  divider: "#2B2B2B",
  text: "#F2F2F2",
  textDim: "#A3A3A3",
  textFaint: "#8A8A8A",
  accent: "#2FD47A",
  red: "#F04438",
  yellow: "#F5C518",

  // Legacy names, remapped onto the new palette so every screen re-skins at
  // once. Removed in Task 7 when no file reads them.
  border: "#2B2B2B",
  textPrimary: "#F2F2F2",
  textSecondary: "#A3A3A3",
  textMuted: "#8A8A8A",
} as const;

export const SPACE = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;

export const RADIUS = { card: 16, control: 12, badge: 8, pill: 999 } as const;

export const TYPE = {
  screenTitle: { fontSize: 24, fontWeight: "700", color: T.text },
  sectionTitle: { fontSize: 17, fontWeight: "600", color: T.text },
  rowPrimary: { fontSize: 15, fontWeight: "600", color: T.text },
  rowSecondary: { fontSize: 13, fontWeight: "400", color: T.textDim },
  caption: { fontSize: 12, fontWeight: "500", color: T.textFaint },
  score: { fontSize: 40, fontWeight: "700", color: T.text, fontVariant: ["tabular-nums"] },
} satisfies Record<string, TextStyle>;

// League crest colors offered during onboarding and in League settings.
export const LEAGUE_COLORS = [
  "#0039a3",
  "#dc2626",
  "#059669",
  "#7c3aed",
  "#ea580c",
  "#0d9488",
  "#ca8a04",
  "#e11d48",
] as const;

export const TEAM_SIZES = [5, 6, 7, 8, 11] as const;

// Expo template leftovers, still imported by hooks/use-theme-color.
const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

export const Colors = {
  light: {
    text: "#11181C",
    background: "#fff",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: { sans: "system-ui", serif: "ui-serif", rounded: "ui-rounded", mono: "ui-monospace" },
  default: { sans: "normal", serif: "serif", rounded: "normal", mono: "monospace" },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
