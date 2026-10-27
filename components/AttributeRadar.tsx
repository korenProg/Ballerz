import { View, StyleSheet } from "react-native";
import { Text } from "./ui/Text";
import Svg, { Polygon, Line } from "react-native-svg";
import { T } from "../constants/theme";

// One shape on the radar: a value per corner, in `labels` order.
export type RadarSeries = { color: string; values: readonly number[]; name?: string };

const MAX = 99;
// Room around the hexagon for each corner's label and value.
const PAD = 40;
const LABEL_W = 64;
const LABEL_H = 34;

// FIFA-style hexagon: one corner per attribute, clockwise from the top, with
// faint rings at a third, two thirds and full scale. With two series (a team
// comparison) both shapes overlap and each corner shows both values in the
// series' colours.
export default function AttributeRadar({
  labels,
  series,
  size,
}: {
  labels: readonly string[];
  series: readonly RadarSeries[];
  size: number;
}) {
  const c = size / 2;
  const r = c - PAD;
  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / labels.length;
  const point = (i: number, scale: number) => ({
    x: c + Math.cos(angle(i)) * r * scale,
    y: c + Math.sin(angle(i)) * r * scale,
  });
  const join = (pts: { x: number; y: number }[]) => pts.map((p) => `${p.x},${p.y}`).join(" ");
  const ring = (scale: number) => join(labels.map((_, i) => point(i, scale)));
  const single = series.length === 1;

  return (
    <View
      style={{ width: size, height: size }}
      accessible
      accessibilityLabel={labels
        .map((l, i) => `${l} ${series.map((s) => (s.name ? `${s.name} ${s.values[i]}` : s.values[i])).join(", ")}`)
        .join("; ")}
    >
      <Svg width={size} height={size}>
        {[1 / 3, 2 / 3, 1].map((s) => (
          <Polygon key={s} points={ring(s)} fill="none" stroke={T.divider} strokeWidth={1} />
        ))}
        {labels.map((_, i) => {
          const p = point(i, 1);
          return <Line key={i} x1={c} y1={c} x2={p.x} y2={p.y} stroke={T.divider} strokeWidth={1} />;
        })}
        {series.map((s, si) => (
          <Polygon
            key={si}
            points={join(s.values.map((v, i) => point(i, Math.max(0, Math.min(v, MAX)) / MAX)))}
            fill={s.color}
            fillOpacity={single ? 0.22 : 0.16}
            stroke={s.color}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        ))}
      </Svg>
      {labels.map((label, i) => {
        const x = c + Math.cos(angle(i)) * (r + PAD / 2 + 2);
        const y = c + Math.sin(angle(i)) * (r + PAD / 2 + 2);
        return (
          <View
            key={label}
            style={[styles.label, { left: x - LABEL_W / 2, top: y - LABEL_H / 2 }]}
            importantForAccessibility="no-hide-descendants"
          >
            <View style={styles.values}>
              {series.map((s, si) => (
                <Text key={si} style={[styles.value, single ? null : { color: s.color }]}>
                  {s.values[i]}
                </Text>
              ))}
            </View>
            <Text style={styles.name}>{label}</Text>
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
  values: { flexDirection: "row", gap: 6 },
  value: { fontSize: 15, fontWeight: "700", color: T.text, fontVariant: ["tabular-nums"] },
  name: { fontSize: 11, fontWeight: "500", color: T.textFaint, letterSpacing: 0.4 },
});
