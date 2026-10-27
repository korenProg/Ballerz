import { View, StyleSheet } from "react-native";
import { Text } from "./ui/Text";
import Svg, { Polygon, Line } from "react-native-svg";
import { T } from "../constants/theme";

export type RadarAxis = { label: string; value: number };

const MAX = 99;
// Room around the hexagon for each corner's label and value.
const PAD = 40;
const LABEL_W = 56;
const LABEL_H = 34;

// FIFA-style hexagon: one corner per attribute, clockwise from the top, with
// faint rings at a third, two thirds and full scale.
export default function AttributeRadar({ axes, size }: { axes: readonly RadarAxis[]; size: number }) {
  const c = size / 2;
  const r = c - PAD;
  const point = (i: number, scale: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / axes.length;
    return { x: c + Math.cos(a) * r * scale, y: c + Math.sin(a) * r * scale };
  };
  const ring = (scale: number) =>
    axes.map((_, i) => point(i, scale)).map((p) => `${p.x},${p.y}`).join(" ");
  const shape = axes
    .map((ax, i) => point(i, Math.max(0, Math.min(ax.value, MAX)) / MAX))
    .map((p) => `${p.x},${p.y}`)
    .join(" ");

  return (
    <View
      style={{ width: size, height: size }}
      accessible
      accessibilityLabel={axes.map((ax) => `${ax.label} ${ax.value}`).join(", ")}
    >
      <Svg width={size} height={size}>
        {[1 / 3, 2 / 3, 1].map((s) => (
          <Polygon key={s} points={ring(s)} fill="none" stroke={T.divider} strokeWidth={1} />
        ))}
        {axes.map((_, i) => {
          const p = point(i, 1);
          return <Line key={i} x1={c} y1={c} x2={p.x} y2={p.y} stroke={T.divider} strokeWidth={1} />;
        })}
        <Polygon
          points={shape}
          fill={T.accent}
          fillOpacity={0.22}
          stroke={T.accent}
          strokeWidth={2}
          strokeLinejoin="round"
        />
      </Svg>
      {axes.map((ax, i) => {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / axes.length;
        const x = c + Math.cos(a) * (r + PAD / 2 + 2);
        const y = c + Math.sin(a) * (r + PAD / 2 + 2);
        return (
          <View
            key={ax.label}
            style={[styles.label, { left: x - LABEL_W / 2, top: y - LABEL_H / 2 }]}
            importantForAccessibility="no-hide-descendants"
          >
            <Text style={styles.value}>{ax.value}</Text>
            <Text style={styles.name}>{ax.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    position: "absolute",
    width: LABEL_W,
    height: LABEL_H,
    alignItems: "center",
    justifyContent: "center",
  },
  value: { fontSize: 15, fontWeight: "700", color: T.text, fontVariant: ["tabular-nums"] },
  name: { fontSize: 11, fontWeight: "500", color: T.textFaint, letterSpacing: 0.4 },
});
