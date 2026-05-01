import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Polygon, Line, Circle, Text as SvgText } from "react-native-svg";
import { useAppStats, useRivalry, useLastGameRadar } from "../../store/selectors";
import { T } from "../../constants/theme";
import { TopBar } from "@/components/TopBar";

// ─── Radar Chart ──────────────────────────────────────────────────────────────

const AXES = ["PAC", "SHO", "PAS", "DRI", "DEF", "PHY"] as const;
const RADAR_SIZE = 180;
const CENTER = RADAR_SIZE / 2;
const RADIUS = 70;

function point(angle: number, r: number): { x: number; y: number } {
  const rad = (angle - 90) * (Math.PI / 180);
  return { x: CENTER + r * Math.cos(rad), y: CENTER + r * Math.sin(rad) };
}

function hexPoints(values: number[], maxVal = 100): string {
  return AXES.map((_, i) => {
    const { x, y } = point(i * 60, (values[i] / maxVal) * RADIUS);
    return `${x},${y}`;
  }).join(" ");
}

function RadarChart({ home, away }: {
  home: { color: string; pac: number; sho: number; pas: number; dri: number; def: number; phy: number };
  away: { color: string; pac: number; sho: number; pas: number; dri: number; def: number; phy: number };
}) {
  const gridLevels = [0.25, 0.5, 0.75, 1];
  const homeVals = [home.pac, home.sho, home.pas, home.dri, home.def, home.phy];
  const awayVals = [away.pac, away.sho, away.pas, away.dri, away.def, away.phy];

  return (
    <Svg width={RADAR_SIZE} height={RADAR_SIZE}>
      {gridLevels.map((level) => (
        <Polygon
          key={level}
          points={hexPoints([100, 100, 100, 100, 100, 100].map((v) => v * level))}
          fill="none"
          stroke={T.border}
          strokeWidth={1}
        />
      ))}

      {AXES.map((_, i) => {
        const outer = point(i * 60, RADIUS);
        return (
          <Line
            key={i}
            x1={CENTER} y1={CENTER}
            x2={outer.x} y2={outer.y}
            stroke={T.border}
            strokeWidth={1}
          />
        );
      })}

      <Polygon
        points={hexPoints(awayVals)}
        fill={away.color + "22"}
        stroke={away.color}
        strokeWidth={1.5}
      />

      <Polygon
        points={hexPoints(homeVals)}
        fill={home.color + "22"}
        stroke={home.color}
        strokeWidth={1.5}
      />

      <Circle cx={CENTER} cy={CENTER} r={3} fill={T.textMuted} />

      {AXES.map((label, i) => {
        const { x, y } = point(i * 60, RADIUS + 14);
        return (
          <SvgText
            key={label}
            x={x} y={y}
            textAnchor="middle"
            alignmentBaseline="middle"
            fontSize={9}
            fontWeight="700"
            fill={T.textMuted}
          >
            {label}
          </SvgText>
        );
      })}
    </Svg>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function StatsScreen() {
  const { gamesCount, totalGoals } = useAppStats();
  const rivalry = useRivalry();
  const radar = useLastGameRadar();

  return (
    <View style={s.safe}>
      <TopBar title="Stats" />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        <View style={s.totalStrip}>
          <View style={s.totalItem}>
            <Text style={[s.totalVal, { color: "#60a5fa" }]}>{gamesCount}</Text>
            <Text style={s.totalLbl}>GAMES</Text>
          </View>
          <View style={s.totalDivider} />
          <View style={s.totalItem}>
            <Text style={[s.totalVal, { color: T.accent }]}>{totalGoals}</Text>
            <Text style={s.totalLbl}>GOALS</Text>
          </View>
          <View style={s.totalDivider} />
          <View style={s.totalItem}>
            <Text style={[s.totalVal, { color: "#a78bfa" }]}>
              {gamesCount > 0 ? (totalGoals / gamesCount).toFixed(1) : "—"}
            </Text>
            <Text style={s.totalLbl}>AVG/GAME</Text>
          </View>
        </View>

        {rivalry && (
          <>
            <Text style={s.sectionEyebrow}>RIVALRY</Text>
            <View style={s.card}>
              <View style={s.rivalryHeader}>
                <View style={s.rivalryBadge}>
                  <Ionicons name="flame" size={11} color={T.accent} />
                  <Text style={s.rivalryBadgeTxt}>TOP MATCHUP</Text>
                </View>
                <Text style={s.rivalryCount}>{rivalry.count} games</Text>
              </View>
              <View style={s.rivalryTeams}>
                <Text style={s.rivalryTeamName}>{rivalry.home}</Text>
                <Text style={s.rivalryVs}>vs</Text>
                <Text style={[s.rivalryTeamName, { textAlign: "right" }]}>{rivalry.away}</Text>
              </View>
              <View style={s.rivalryRecord}>
                <View style={s.recordItem}>
                  <Text style={[s.recordVal, { color: "#4ade80" }]}>{rivalry.homeWins}</Text>
                  <Text style={s.recordLbl}>W</Text>
                </View>
                <View style={s.recordItem}>
                  <Text style={[s.recordVal, { color: T.textMuted }]}>{rivalry.draws}</Text>
                  <Text style={s.recordLbl}>D</Text>
                </View>
                <View style={s.recordItem}>
                  <Text style={[s.recordVal, { color: "#f87171" }]}>{rivalry.awayWins}</Text>
                  <Text style={s.recordLbl}>L</Text>
                </View>
              </View>
              {rivalry.lastGame && (
                <View style={s.rivalryLast}>
                  <Text style={s.rivalryLastLbl}>Last result</Text>
                  <Text style={s.rivalryLastScore}>
                    {rivalry.lastGame.homeScore} – {rivalry.lastGame.awayScore}
                  </Text>
                </View>
              )}
            </View>
          </>
        )}

        {radar && (
          <>
            <Text style={s.sectionEyebrow}>LAST MATCH COMPARISON</Text>
            <View style={s.card}>
              <View style={s.radarLegend}>
                <View style={s.legendItem}>
                  <View style={[s.legendDot, { backgroundColor: radar.home.color }]} />
                  <Text style={s.legendName}>{radar.home.label}</Text>
                </View>
                <View style={s.legendItem}>
                  <View style={[s.legendDot, { backgroundColor: radar.away.color }]} />
                  <Text style={s.legendName}>{radar.away.label}</Text>
                </View>
              </View>
              <View style={s.radarWrap}>
                <RadarChart home={radar.home} away={radar.away} />
              </View>
            </View>
          </>
        )}

        {gamesCount === 0 && (
          <View style={s.emptyCard}>
            <Ionicons name="stats-chart-outline" size={32} color={T.textMuted} />
            <Text style={s.emptyTitle}>No stats yet</Text>
            <Text style={s.emptySubtitle}>Play some games to see your league stats here</Text>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: T.bg },
  content: { paddingHorizontal: 16, paddingBottom: 16 },

  pageTitle: { color: T.textPrimary, fontSize: 22, fontWeight: "900", paddingTop: 14, marginBottom: 16 },

  sectionEyebrow: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 2,
    color: T.textMuted,
    textTransform: "uppercase",
    marginBottom: 8,
    marginTop: 20,
    borderLeftWidth: 2,
    borderLeftColor: T.accent,
    paddingLeft: 6,
  },

  totalStrip:   { flexDirection: "row", backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: T.radius.card, overflow: "hidden", marginBottom: 4 },
  totalItem:    { flex: 1, paddingVertical: 14, alignItems: "center" },
  totalDivider: { width: 1, backgroundColor: T.border },
  totalVal:     { fontSize: 22, fontWeight: "800" },
  totalLbl:     { fontSize: 8, color: T.textMuted, fontWeight: "700", letterSpacing: 1, marginTop: 2 },

  card:   { backgroundColor: T.surface, borderRadius: T.radius.card, borderWidth: 1, borderColor: T.border, padding: 14 },

  rivalryHeader:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  rivalryBadge:    { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: T.accentMuted, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: T.accentBorder },
  rivalryBadgeTxt: { color: T.accent, fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  rivalryCount:    { color: T.textMuted, fontSize: 11, fontWeight: "600" },
  rivalryTeams:    { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  rivalryTeamName: { flex: 1, color: T.textPrimary, fontSize: 15, fontWeight: "800" },
  rivalryVs:       { color: T.textMuted, fontSize: 11, fontWeight: "700", paddingHorizontal: 12 },
  rivalryRecord:   { flexDirection: "row", gap: 20, marginBottom: 10 },
  recordItem:      { alignItems: "center" },
  recordVal:       { fontSize: 20, fontWeight: "900" },
  recordLbl:       { fontSize: 9, color: T.textMuted, fontWeight: "700", letterSpacing: 1, marginTop: 2 },
  rivalryLast:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTopWidth: 1, borderTopColor: T.border },
  rivalryLastLbl:  { color: T.textMuted, fontSize: 11 },
  rivalryLastScore:{ color: T.textPrimary, fontSize: 15, fontWeight: "800" },

  radarLegend:  { flexDirection: "row", gap: 16, marginBottom: 12 },
  legendItem:   { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot:    { width: 8, height: 8, borderRadius: 4 },
  legendName:   { color: T.textSecondary, fontSize: 12, fontWeight: "600" },
  radarWrap:    { alignItems: "center" },

  emptyCard: { marginTop: 24, backgroundColor: T.surface, borderRadius: T.radius.card, borderWidth: 1, borderColor: T.border, padding: 28, alignItems: "center", gap: 10 },
  emptyTitle: { color: T.textPrimary, fontSize: 15, fontWeight: "800" },
  emptySubtitle: { color: T.textMuted, fontSize: 13, textAlign: "center" },
});
