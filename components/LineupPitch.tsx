import { useState } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Text } from "./ui/Text";
import Crest from "./Crest";
import PlayerAvatar from "./PlayerAvatar";
import { T, SPACE, RADIUS } from "../constants/theme";
import { ratingColor } from "../utils/rating";
import { groupLineup, formation, pitchName, LINES, type Line } from "../utils/lineup";
import type { GamePlayer } from "../types/games";
import type { Player } from "../types/players";

export type PitchSide = { name: string; color: string; logo?: string; players: GamePlayer[] };

// FotMob-style dark pitch and its chalk lines.
const GRASS = "#1A3125";
const CHALK = "rgba(255,255,255,0.14)";
const AVATAR = 38;

function TeamBar({ side }: { side: PitchSide }) {
  const shape = formation(groupLineup(side.players));
  return (
    <View style={styles.teamBar}>
      <Crest name={side.name} color={side.color} logo={side.logo} size={20} />
      <Text style={styles.teamName} numberOfLines={1}>
        {side.name}
      </Text>
      {shape ? <Text style={styles.formation}>{shape}</Text> : null}
    </View>
  );
}

function PitchPlayer({
  player,
  color,
  roster,
  onPress,
}: {
  player: GamePlayer;
  color: string;
  roster: Map<string, Player>;
  onPress: (id: string) => void;
}) {
  // Photo and rating come from the live roster; the name and position are the
  // game's own snapshot, so a deleted player still shows (just not tappable).
  const live = roster.get(player.id);
  return (
    <Pressable
      accessibilityRole={live ? "button" : undefined}
      accessibilityLabel={`${player.name}, ${player.position}${live ? `, rated ${live.ovr}` : ""}`}
      disabled={!live}
      onPress={() => onPress(player.id)}
      style={({ pressed }) => [styles.player, pressed ? styles.pressed : null]}
    >
      <View>
        <View style={[styles.ring, { borderColor: color }]}>
          <PlayerAvatar name={player.name} photo={live?.photo} size={AVATAR} />
        </View>
        {live ? (
          <View style={[styles.rating, { backgroundColor: ratingColor(live.ovr) }]}>
            <Text style={styles.ratingTxt}>{live.ovr}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.playerName} numberOfLines={1}>
        {pitchName(player.name)}
      </Text>
    </Pressable>
  );
}

// One team's half: its keeper on its own goal line, forwards towards halfway.
function Half({
  side,
  order,
  roster,
  onPlayerPress,
}: {
  side: PitchSide;
  order: readonly Line[];
  roster: Map<string, Player>;
  onPlayerPress: (id: string) => void;
}) {
  const lines = groupLineup(side.players);
  const rows = order.filter((l) => lines[l].length > 0);
  return (
    <View style={styles.half}>
      {rows.length === 0 ? (
        <Text style={styles.noLineup}>No lineup</Text>
      ) : (
        rows.map((l) => (
          <View key={l} style={styles.line}>
            {lines[l].map((p) => (
              <PitchPlayer key={p.id} player={p} color={side.color} roster={roster} onPress={onPlayerPress} />
            ))}
          </View>
        ))
      )}
    </View>
  );
}

// Both lineups on one vertical pitch, as FotMob draws them: home in the top
// half, away in the bottom half, each with its crest and formation outside.
export default function LineupPitch({
  home,
  away,
  roster,
  onPlayerPress,
}: {
  home: PitchSide;
  away: PitchSide;
  roster: readonly Player[];
  onPlayerPress: (id: string) => void;
}) {
  const [width, setWidth] = useState(0);
  const byId = new Map(roster.map((p) => [p.id, p]));
  const box = { width: width * 0.52, height: width * 0.2 };
  const goalArea = { width: width * 0.26, height: width * 0.08 };
  const circle = width * 0.3;

  return (
    <View style={styles.wrap}>
      <TeamBar side={home} />
      <View style={styles.pitch} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 ? (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <View style={[styles.mark, styles.boxTop, box, { left: (width - box.width) / 2 }]} />
            <View style={[styles.mark, styles.boxTop, goalArea, { left: (width - goalArea.width) / 2 }]} />
            <View style={styles.halfway} />
            <View
              style={[
                styles.mark,
                styles.circle,
                { width: circle, height: circle, borderRadius: circle / 2, marginLeft: -circle / 2, marginTop: -circle / 2 },
              ]}
            />
            <View style={[styles.mark, styles.boxBottom, box, { left: (width - box.width) / 2 }]} />
            <View style={[styles.mark, styles.boxBottom, goalArea, { left: (width - goalArea.width) / 2 }]} />
          </View>
        ) : null}
        <Half side={home} order={LINES} roster={byId} onPlayerPress={onPlayerPress} />
        <Half side={away} order={[...LINES].reverse()} roster={byId} onPlayerPress={onPlayerPress} />
      </View>
      <TeamBar side={away} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: SPACE.sm },
  teamBar: { flexDirection: "row", alignItems: "center", gap: SPACE.sm, paddingHorizontal: SPACE.xs },
  teamName: { flex: 1, fontSize: 15, fontWeight: "600", color: T.text },
  formation: { fontSize: 14, fontWeight: "500", color: T.textDim, fontVariant: ["tabular-nums"] },

  pitch: { backgroundColor: GRASS, borderRadius: RADIUS.card, overflow: "hidden" },
  mark: { position: "absolute", borderColor: CHALK, borderWidth: 1 },
  boxTop: { top: 0, borderTopWidth: 0 },
  boxBottom: { bottom: 0, borderBottomWidth: 0 },
  halfway: { position: "absolute", left: 0, right: 0, top: "50%", height: 1, backgroundColor: CHALK },
  circle: { left: "50%", top: "50%" },

  half: { minHeight: 240, justifyContent: "space-evenly", paddingVertical: SPACE.md },
  line: { flexDirection: "row", justifyContent: "space-evenly", paddingVertical: SPACE.sm },
  noLineup: { fontSize: 13, fontWeight: "500", color: T.textFaint, textAlign: "center" },

  player: { width: 72, alignItems: "center", gap: 4 },
  pressed: { opacity: 0.6 },
  ring: { borderWidth: 2, borderRadius: AVATAR / 2 + 2 },
  rating: {
    position: "absolute",
    top: -4,
    right: -12,
    minWidth: 24,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    alignItems: "center",
  },
  ratingTxt: { fontSize: 11, fontWeight: "700", color: "#000", fontVariant: ["tabular-nums"] },
  playerName: { fontSize: 12, fontWeight: "600", color: T.text, maxWidth: 72 },
});
