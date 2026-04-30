import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { T } from "../constants/theme";
import { useStore } from "../store";

type Row = {
  id: string;
  name: string;
  ovr: number;
  mvps: number;
  wins: number;
  losses: number;
};

export function Leaderboard({ limit }: { limit?: number }) {
  const players = useStore((s) => s.players);
  const games = useStore((s) => s.games);

  const rows = useMemo<Row[]>(() => {
    const ftGames = games.filter((g) => g.status === "FT");

    return [...players]
      .map((p) => {
        let wins = 0;
        let losses = 0;
        for (const g of ftGames) {
          const onHome = (g.homePlayers ?? []).some((gp) => gp.id === p.id);
          const onAway = (g.awayPlayers ?? []).some((gp) => gp.id === p.id);
          if (!onHome && !onAway) continue;
          const homeWon = g.homeScore > g.awayScore;
          const awayWon = g.awayScore > g.homeScore;
          if (onHome && homeWon) wins++;
          else if (onHome && awayWon) losses++;
          else if (onAway && awayWon) wins++;
          else if (onAway && homeWon) losses++;
        }
        return { id: p.id, name: p.name, ovr: p.ovr, mvps: p.mvps, wins, losses };
      })
      .sort((a, b) => b.ovr - a.ovr)
      .slice(0, limit ?? undefined);
  }, [players, games, limit]);

  if (rows.length === 0) return null;

  const ovrColor = (ovr: number) =>
    ovr >= 85 ? "#f59e0b" : ovr >= 70 ? "#60a5fa" : T.textMuted;

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={[s.hTxt, { width: COL_POS }]}>#</Text>
        <Text style={[s.hTxt, { flex: 1, marginLeft: 34 }]}>NAME</Text>
        <View style={[{ width: COL_MVP }, s.headerCell]}>
          <Ionicons name="star" size={9} color={T.accent} />
        </View>
        <Text style={[s.hTxt, { width: COL_STAT }]}>W</Text>
        <Text style={[s.hTxt, { width: COL_STAT }]}>L</Text>
        <Text style={[s.hTxt, { width: COL_OVR }]}>OVR</Text>
      </View>

      {/* Rows */}
      {rows.map((r, i) => {
        const isFirst = i === 0;
        const isLast = i === rows.length - 1;
        const color = ovrColor(r.ovr);
        return (
          <View key={r.id} style={[s.row, isFirst && s.rowFirst, isLast && s.rowLast]}>
            <Text style={[s.pos, isFirst && { color: "#f59e0b" }]}>{i + 1}</Text>

            <View style={s.nameCell}>
              <View style={[s.avatar, isFirst && { backgroundColor: "#f59e0b22", borderColor: "#f59e0b55" }]}>
                <Text style={s.avatarTxt}>
                  {r.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <Text style={s.nameText} numberOfLines={1}>{r.name}</Text>
            </View>

            <View style={[s.cell, { width: COL_MVP }]}>
              <Text style={[s.statVal, r.mvps > 0 && { color: T.accent }]}>{r.mvps}</Text>
            </View>

            <View style={[s.cell, { width: COL_STAT }]}>
              <Text style={[s.statVal, r.wins > 0 && { color: "#4ade80" }]}>{r.wins}</Text>
            </View>

            <View style={[s.cell, { width: COL_STAT }]}>
              <Text style={[s.statVal, r.losses > 0 && { color: "#f87171" }]}>{r.losses}</Text>
            </View>

            <View style={[s.cell, { width: COL_OVR }]}>
              <View style={[s.ovrBadge, { borderColor: color + "55" }]}>
                <Text style={[s.ovrTxt, { color }]}>{r.ovr}</Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const COL_POS = 28;
const COL_STAT = 36;
const COL_OVR = 48;
const COL_MVP = 36;

const s = StyleSheet.create({
  container: {
    backgroundColor: "#f5f5f7",
    borderRadius: T.radius.card,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    overflow: "hidden",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  hTxt: {
    fontSize: 8,
    fontWeight: "800",
    color: "#aaa",
    letterSpacing: 1,
    textAlign: "center",
  },
  headerCell: { alignItems: "center", justifyContent: "center" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  rowFirst: { backgroundColor: "rgba(245,158,11,0.06)" },
  rowLast: { borderBottomWidth: 0 },

  pos: { width: COL_POS, fontSize: 12, fontWeight: "800", color: "#bbb", textAlign: "center" },

  nameCell: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#e5e5e5",
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTxt: { fontSize: 9, fontWeight: "800", color: "#666" },
  nameText: { flex: 1, fontSize: 13, fontWeight: "700", color: "#111" },

  cell: { alignItems: "center" },
  statVal: { fontSize: 13, fontWeight: "700", color: "#aaa" },

  ovrBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
  },
  ovrTxt: { fontSize: 12, fontWeight: "900" },
});
