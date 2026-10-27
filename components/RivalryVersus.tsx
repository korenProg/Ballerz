import { View, Pressable, StyleSheet } from "react-native";
import { Text } from "./ui/Text";
import PlayerAvatar from "./PlayerAvatar";
import { T, SPACE } from "../constants/theme";
import type { PlayerRivalry } from "../utils/rivalries";
import type { Player } from "../types/players";

// Rival A's share of the bar is the accent, rival B's is white, draws grey.
const A_COLOR = T.accent;
const B_COLOR = T.text;

function Rival({
  rival,
  wins,
  color,
  roster,
  onOpen,
}: {
  rival: { id: string; name: string };
  wins: number;
  color: string;
  roster: readonly Player[];
  onOpen: (id: string) => void;
}) {
  const live = roster.find((p) => p.id === rival.id);
  return (
    <Pressable
      accessibilityRole={live ? "button" : undefined}
      accessibilityLabel={`${rival.name}, ${wins} wins`}
      disabled={!live}
      onPress={() => onOpen(rival.id)}
      style={({ pressed }) => [styles.side, pressed ? styles.pressed : null]}
    >
      <View style={[styles.ring, { borderColor: color }]}>
        <PlayerAvatar name={rival.name} photo={live?.photo} size={56} />
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {rival.name}
      </Text>
      <Text style={styles.num}>{wins}</Text>
      <Text style={styles.label}>Wins</Text>
    </Pressable>
  );
}

// Two players' record against each other: avatars either side with their
// wins, draws in the middle, and a bar split by who won more.
export default function RivalryVersus({
  rivalry,
  roster,
  onOpen,
}: {
  rivalry: PlayerRivalry;
  roster: readonly Player[];
  onOpen: (id: string) => void;
}) {
  const { a, b, winsA, winsB, draws, meetings } = rivalry;
  const segs = [
    { n: winsA, color: A_COLOR },
    { n: draws, color: T.surfaceAlt },
    { n: winsB, color: B_COLOR },
  ].filter((s) => s.n > 0);
  return (
    <View>
      <View style={styles.row}>
        <Rival rival={a} wins={winsA} color={A_COLOR} roster={roster} onOpen={onOpen} />
        <View style={styles.middle}>
          <Text style={styles.vs}>VS</Text>
          <Text style={styles.meetings}>{meetings} games</Text>
          <Text style={[styles.num, styles.drawNum]}>{draws}</Text>
          <Text style={styles.label}>Draws</Text>
        </View>
        <Rival rival={b} wins={winsB} color={B_COLOR} roster={roster} onOpen={onOpen} />
      </View>
      <View style={styles.bar}>
        {segs.map((s, i) => (
          <View key={i} style={{ flex: s.n, backgroundColor: s.color }} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-end" },
  side: { flex: 1, alignItems: "center", gap: 4 },
  pressed: { opacity: 0.6 },
  ring: { borderWidth: 2, borderRadius: 30, padding: 0 },
  name: { fontSize: 15, fontWeight: "600", color: T.text, maxWidth: "100%", marginTop: SPACE.xs },
  middle: { width: 76, alignItems: "center", gap: 4 },
  vs: { fontSize: 13, fontWeight: "700", color: T.textFaint, letterSpacing: 1 },
  meetings: { fontSize: 12, fontWeight: "500", color: T.textDim, fontVariant: ["tabular-nums"], marginBottom: 22 },
  num: { fontSize: 28, fontWeight: "700", color: T.text, fontVariant: ["tabular-nums"], marginTop: SPACE.xs },
  drawNum: { color: T.textDim },
  label: { fontSize: 12, fontWeight: "500", color: T.textFaint },
  bar: { flexDirection: "row", height: 6, borderRadius: 3, overflow: "hidden", gap: 2, marginTop: SPACE.lg },
});
