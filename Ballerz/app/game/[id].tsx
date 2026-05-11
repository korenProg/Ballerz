import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from "react-native";
import { PlayerPhoto } from "@/components/PlayerPhoto";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Polygon, Line, Text as SvgText, Circle } from "react-native-svg";
import { useStore } from "../../store";
import { T } from "../../constants/theme";
import { calculateOvr } from "../../utils/ovr";
import { GameExportSheet } from "@/components/GameExportSheet";

type Tab = "lineups" | "stats";

const TABS: { key: Tab; label: string }[] = [
  { key: "lineups", label: "Line Ups" },
  { key: "stats",   label: "Stats"    },
];

const FIELD_W = Dimensions.get("window").width - 32;
const FIELD_H = FIELD_W * 0.9;

function posGroup(pos: string): "gk" | "def" | "mid" | "fwd" {
  const p = pos.toUpperCase();
  if (p.includes("GK") || p === "KEEPER") return "gk";
  if (p.includes("ST") || p.includes("CF") || p.includes("LW") || p.includes("RW") ||
      p === "FWD" || p === "ATT" || p.includes("FW") || p.includes("ATT")) return "fwd";
  if (p.includes("CM") || p.includes("DM") || p.includes("AM") || p.includes("LM") ||
      p.includes("RM") || p === "MID") return "mid";
  return "def";
}

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function PlayerDot({ name, color, photo, size = 38 }: { name: string; color: string; photo?: string; size?: number }) {
  return (
    <View style={fd.playerWrap}>
      <View style={[fd.dot, { width: size, height: size, borderRadius: size / 2, backgroundColor: color, borderColor: "rgba(255,255,255,0.5)" }]}>
        <PlayerPhoto photo={photo} name={name} size={size} color="#fff" />
      </View>
      <Text style={fd.dotName} numberOfLines={1}>{name.split(" ")[0]}</Text>
    </View>
  );
}

function PlayerRow({ players, color }: { players: { id: string; name: string; photo?: string }[]; color: string }) {
  if (players.length === 0) return null;
  return (
    <View style={fd.row}>
      {players.map(p => <PlayerDot key={p.id} name={p.name} color={color} photo={p.photo} />)}
    </View>
  );
}

function FootballField({ players, teamColor, gamePlayerMap }: {
  players: { id: string; name: string }[];
  teamColor: string;
  gamePlayerMap: Record<string, string>;
}) {
  const gks  = players.filter(p => posGroup(gamePlayerMap[p.id] ?? "") === "gk");
  const defs = players.filter(p => posGroup(gamePlayerMap[p.id] ?? "") === "def");
  const mids = players.filter(p => posGroup(gamePlayerMap[p.id] ?? "") === "mid");
  const fwds = players.filter(p => posGroup(gamePlayerMap[p.id] ?? "") === "fwd");

  // fallback: if no GK tagged, treat first player as GK
  const allGrouped = [...gks, ...defs, ...mids, ...fwds];
  const ungrouped = players.filter(p => !allGrouped.find(a => a.id === p.id));

  return (
    <View style={[fd.field, { width: FIELD_W, height: FIELD_H }]}>
      {/* Grass stripes */}
      {Array.from({ length: 7 }).map((_, i) => (
        <View key={i} style={[fd.stripe, { top: (FIELD_H / 7) * i, height: FIELD_H / 7, backgroundColor: i % 2 === 0 ? "#2d7a2d" : "#2f852f" }]} />
      ))}

      {/* Field markings */}
      <View style={fd.outerBorder} />

      {/* Top penalty area */}
      <View style={[fd.penaltyBox, fd.penaltyTop]} />
      {/* Top goal area */}
      <View style={[fd.goalBox, fd.goalTop]} />

      {/* Center line */}
      <View style={fd.centerLine} />
      {/* Center circle */}
      <View style={fd.centerCircle} />
      {/* Center dot */}
      <View style={fd.centerDot} />

      {/* Bottom penalty area */}
      <View style={[fd.penaltyBox, fd.penaltyBottom]} />
      {/* Bottom goal area */}
      <View style={[fd.goalBox, fd.goalBottom]} />

      {/* Players — attack (top) to defense (bottom) */}
      <View style={fd.playersContainer}>
        <PlayerRow players={fwds} color={teamColor} />
        <PlayerRow players={mids} color={teamColor} />
        <PlayerRow players={[...defs, ...ungrouped]} color={teamColor} />
        <PlayerRow players={gks} color={teamColor} />
      </View>
    </View>
  );
}

// ── Radar chart ───────────────────────────────────────────────────────────────

const RADAR_ATTRS = [
  { key: "pac", label: "PAC" },
  { key: "sho", label: "SHO" },
  { key: "pas", label: "PAS" },
  { key: "dri", label: "DRI" },
  { key: "def", label: "DEF" },
  { key: "phy", label: "PHY" },
] as const;

const RADAR_SIZE = Dimensions.get("window").width - 120;
const RCX = RADAR_SIZE / 2;
const RCY = RADAR_SIZE / 2;
const MAX_R = RADAR_SIZE * 0.32;
const LABEL_R = MAX_R + 16;

function radarPoint(i: number, value: number, r = MAX_R) {
  const angle = (-90 + 60 * i) * (Math.PI / 180);
  const pct = Math.max(0, Math.min(100, value)) / 100;
  return { x: RCX + pct * r * Math.cos(angle), y: RCY + pct * r * Math.sin(angle) };
}

function toPoints(vals: number[]) {
  return vals.map((v, i) => radarPoint(i, v)).map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
}

function gridPoints(pct: number) {
  return Array.from({ length: 6 }, (_, i) => radarPoint(i, 100 * pct))
    .map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
}

function avgAttr(players: { pac: number; sho: number; pas: number; dri: number; def: number; phy: number }[], key: typeof RADAR_ATTRS[number]["key"]) {
  if (!players.length) return 0;
  return Math.round(players.reduce((s, p) => s + (p[key] ?? 0), 0) / players.length);
}

function teamStrength(players: { pac: number; sho: number; pas: number; dri: number; def: number; phy: number }[]) {
  if (!players.length) return { attack: 0, midfield: 0, defence: 0 };
  const avg = (fn: (p: typeof players[0]) => number) =>
    Math.round(players.reduce((s, p) => s + fn(p), 0) / players.length);
  return {
    attack:   avg(p => p.pac * 0.25 + p.sho * 0.45 + p.dri * 0.30),
    midfield: avg(p => p.pas * 0.45 + p.dri * 0.30 + p.pac * 0.25),
    defence:  avg(p => p.def * 0.55 + p.phy * 0.30 + p.pac * 0.15),
  };
}

function RadarChart({ homeVals, awayVals, homeColor, awayColor }: {
  homeVals: number[]; awayVals: number[]; homeColor: string; awayColor: string;
}) {
  const axisEnds = RADAR_ATTRS.map((_, i) => radarPoint(i, 100));
  const labelPts = RADAR_ATTRS.map((_, i) => {
    const angle = (-90 + 60 * i) * (Math.PI / 180);
    return { x: RCX + LABEL_R * Math.cos(angle), y: RCY + LABEL_R * Math.sin(angle) };
  });

  return (
    <Svg width={RADAR_SIZE} height={RADAR_SIZE}>
      {/* Grid rings */}
      {[0.25, 0.5, 0.75, 1].map((lvl, i) => (
        <Polygon key={i} points={gridPoints(lvl)} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
      ))}
      {/* Axis lines */}
      {axisEnds.map((pt, i) => (
        <Line key={i} x1={RCX} y1={RCY} x2={pt.x} y2={pt.y} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
      ))}
      {/* Away polygon */}
      <Polygon points={toPoints(awayVals)} fill={awayColor + "33"} stroke={awayColor} strokeWidth={2} strokeLinejoin="round" />
      {/* Home polygon */}
      <Polygon points={toPoints(homeVals)} fill={homeColor + "33"} stroke={homeColor} strokeWidth={2} strokeLinejoin="round" />
      {/* Center dot */}
      <Circle cx={RCX} cy={RCY} r={3} fill="rgba(255,255,255,0.2)" />
      {/* Axis labels */}
      {RADAR_ATTRS.map((attr, i) => (
        <SvgText
          key={attr.key}
          x={labelPts[i].x}
          y={labelPts[i].y}
          textAnchor="middle"
          alignmentBaseline="middle"
          fill="rgba(255,255,255,0.55)"
          fontSize={10}
          fontWeight="800"
        >
          {attr.label}
        </SvgText>
      ))}
    </Svg>
  );
}

export default function GameDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { games, players } = useStore();
  const game = games.find((g) => g.id === id);
  const [activeTab, setActiveTab] = useState<Tab>("lineups");
  const [lineupSide, setLineupSide] = useState<"home" | "away">("home");
  const [exportVisible, setExportVisible] = useState(false);

  if (!game) return null;

  const isFT = game.status === "FT";

  const homePlayers = (game.homePlayers ?? [])
    .map((p) => players.find((pl) => pl.id === p.id))
    .filter(Boolean) as typeof players;
  const awayPlayers = (game.awayPlayers ?? [])
    .map((p) => players.find((pl) => pl.id === p.id))
    .filter(Boolean) as typeof players;

  // map id → position for game context
  const homePositionMap: Record<string, string> = {};
  (game.homePlayers ?? []).forEach(p => { homePositionMap[p.id] = p.position; });
  const awayPositionMap: Record<string, string> = {};
  (game.awayPlayers ?? []).forEach(p => { awayPositionMap[p.id] = p.position; });

  const homeAvgOvr = homePlayers.length
    ? Math.round(homePlayers.reduce((sum, p) => sum + calculateOvr(p.pac, p.sho, p.pas, p.dri, p.def, p.phy), 0) / homePlayers.length)
    : null;
  const awayAvgOvr = awayPlayers.length
    ? Math.round(awayPlayers.reduce((sum, p) => sum + calculateOvr(p.pac, p.sho, p.pas, p.dri, p.def, p.phy), 0) / awayPlayers.length)
    : null;

  const homeWin = isFT && game.homeScore > game.awayScore;
  const awayWin = isFT && game.awayScore > game.homeScore;
  const isDraw  = isFT && game.homeScore === game.awayScore;

  const activePlayers = lineupSide === "home" ? homePlayers : awayPlayers;
  const activePositionMap = lineupSide === "home" ? homePositionMap : awayPositionMap;
  const activeColor = lineupSide === "home" ? game.homeColor : game.awayColor;
  const activeTeamName = lineupSide === "home" ? game.homeTeam : game.awayTeam;

  return (
    <View style={s.root}>
      <LinearGradient colors={[game.homeColor + "28", "transparent"]} style={s.ambientLeft} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} pointerEvents="none" />
      <LinearGradient colors={[game.awayColor + "28", "transparent"]} style={s.ambientRight} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} pointerEvents="none" />

      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={20} color={T.textSecondary} />
        </TouchableOpacity>
        <View style={s.headerMeta}>
          <Ionicons name="football-outline" size={11} color={T.textMuted} />
          <Text style={s.headerLeague}>{game.league}</Text>
          {game.location ? (<><Text style={s.headerDot}>·</Text><Text style={s.headerLeague}>{game.location}</Text></>) : null}
        </View>
        <TouchableOpacity onPress={() => setExportVisible(true)} style={s.shareBtn}>
          <Ionicons name="share-outline" size={20} color={T.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Score banner */}
      <View style={s.banner}>
        <View style={s.bannerTeam}>
          <View style={[s.teamShield, { borderColor: game.homeColor, backgroundColor: game.homeColor + "18" }]}>
            <Ionicons name="shield" size={22} color={game.homeColor} />
          </View>
          <Text style={s.bannerTeamName} numberOfLines={2}>{game.homeTeam}</Text>
          {homeWin && <View style={[s.winBadge, { backgroundColor: game.homeColor + "22", borderColor: game.homeColor + "55" }]}><Text style={[s.winBadgeTxt, { color: game.homeColor }]}>WIN</Text></View>}
        </View>

        <View style={s.bannerScore}>
          {isFT ? (
            <View style={s.bannerScoreRow}>
              <Text style={s.bannerScoreNum}>{game.homeScore}</Text>
              <Text style={s.bannerScoreSep}>–</Text>
              <Text style={s.bannerScoreNum}>{game.awayScore}</Text>
            </View>
          ) : (
            <Text style={s.bannerVs}>VS</Text>
          )}
          <View style={s.ftChipRow}>
            {isFT && <View style={s.ftChip}><Text style={s.ftChipTxt}>{isDraw ? "DRAW" : "FT"}</Text></View>}
            {!isFT && game.date && <Text style={s.bannerDate}>{game.date}</Text>}
          </View>
        </View>

        <View style={[s.bannerTeam, { alignItems: "flex-end" }]}>
          <View style={[s.teamShield, { borderColor: game.awayColor, backgroundColor: game.awayColor + "18" }]}>
            <Ionicons name="shield" size={22} color={game.awayColor} />
          </View>
          <Text style={[s.bannerTeamName, { textAlign: "right", alignSelf: "stretch" }]} numberOfLines={2}>{game.awayTeam}</Text>
          {awayWin && <View style={[s.winBadge, { backgroundColor: game.awayColor + "22", borderColor: game.awayColor + "55", alignSelf: "flex-end" }]}><Text style={[s.winBadgeTxt, { color: game.awayColor }]}>WIN</Text></View>}
        </View>
      </View>

      {/* Edit / Record result */}
      <TouchableOpacity style={s.editBtn} onPress={() => router.push(`/record-result?gameId=${game.id}`)} activeOpacity={0.75}>
        <Ionicons name={isFT ? "create-outline" : "checkmark-circle-outline"} size={14} color={T.textMuted} />
        <Text style={s.editBtnTxt}>{isFT ? "Edit result" : "Record result"}</Text>
      </TouchableOpacity>

      {/* Main tabs */}
      <View style={s.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity key={tab.key} style={[s.tab, activeTab === tab.key && s.tabActive]} onPress={() => setActiveTab(tab.key)} activeOpacity={0.7}>
            <Text style={[s.tabTxt, activeTab === tab.key && s.tabTxtActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Line Ups ── */}
      {activeTab === "lineups" && (
        <ScrollView contentContainerStyle={s.tabContent} showsVerticalScrollIndicator={false}>
          {homePlayers.length === 0 && awayPlayers.length === 0 ? (
            <View style={s.emptyState}>
              <Ionicons name="people-outline" size={32} color={T.textMuted} />
              <Text style={s.emptyTxt}>No line ups recorded</Text>
            </View>
          ) : (
            <>
              {/* Team switcher */}
              <View style={s.teamSwitcher}>
                <TouchableOpacity
                  style={[s.teamSwitchBtn, lineupSide === "home" && { backgroundColor: game.homeColor, borderColor: game.homeColor }]}
                  onPress={() => setLineupSide("home")}
                  activeOpacity={0.8}
                >
                  <View style={[s.switchDot, { backgroundColor: lineupSide === "home" ? "#fff" : game.homeColor }]} />
                  <Text style={[s.teamSwitchTxt, lineupSide === "home" && { color: "#fff" }]} numberOfLines={1}>{game.homeTeam}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.teamSwitchBtn, lineupSide === "away" && { backgroundColor: game.awayColor, borderColor: game.awayColor }]}
                  onPress={() => setLineupSide("away")}
                  activeOpacity={0.8}
                >
                  <View style={[s.switchDot, { backgroundColor: lineupSide === "away" ? "#fff" : game.awayColor }]} />
                  <Text style={[s.teamSwitchTxt, lineupSide === "away" && { color: "#fff" }]} numberOfLines={1}>{game.awayTeam}</Text>
                </TouchableOpacity>
              </View>

              {activePlayers.length === 0 ? (
                <View style={s.emptyState}>
                  <Text style={s.emptyTxt}>No players for {activeTeamName}</Text>
                </View>
              ) : (
                <View style={{ alignItems: "center" }}>
                  <FootballField
                    players={activePlayers}
                    teamColor={activeColor}
                    gamePlayerMap={activePositionMap}
                  />
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* ── Stats ── */}
      {activeTab === "stats" && (
        <ScrollView contentContainerStyle={s.tabContent} showsVerticalScrollIndicator={false}>
          {!isFT ? (
            <View style={s.emptyState}>
              <Ionicons name="stats-chart-outline" size={32} color={T.textMuted} />
              <Text style={s.emptyTxt}>Stats available after the game</Text>
            </View>
          ) : (
            <>{(() => {
                const hasMvp = game.mvp.name !== "—";
                const hasOvr = homeAvgOvr !== null && awayAvgOvr !== null;
                const hasPlayers = homePlayers.length > 0 || awayPlayers.length > 0;
                const hs = teamStrength(homePlayers);
                const as_ = teamStrength(awayPlayers);

                const statRows: { label: string; home: number; away: number }[] = [
                  ...(hasOvr ? [{ label: "AVG RATING", home: homeAvgOvr!, away: awayAvgOvr! }] : []),
                  ...(hasPlayers ? [
                    { label: "ATTACK",   home: hs.attack,   away: as_.attack },
                    { label: "MIDFIELD", home: hs.midfield, away: as_.midfield },
                    { label: "DEFENCE",  home: hs.defence,  away: as_.defence },
                  ] : []),
                ];

                return (
                  <>
                    {/* Unified stats card */}
                    <View style={s.statCard}>
                      {/* Team name headers */}
                      <View style={s.statTeamRow}>
                        <Text style={[s.statTeamName, { color: game.homeColor }]} numberOfLines={1}>{game.homeTeam}</Text>
                        <View style={{ flex: 1 }} />
                        <Text style={[s.statTeamName, { color: game.awayColor, textAlign: "right" }]} numberOfLines={1}>{game.awayTeam}</Text>
                      </View>

                      {/* MVP row */}
                      {hasMvp && (
                        <>
                          <View style={s.statDivider} />
                          <View style={s.statRow}>
                            <View style={s.statRowLeft}>
                              <Ionicons name="star" size={10} color={T.accent} />
                              <Text style={s.statRowLabelLeft}>MVP</Text>
                            </View>
                            <Text style={s.statRowValue}>{game.mvp.name}</Text>
                          </View>
                        </>
                      )}

                      {/* Bar stats */}
                      {statRows.map(({ label, home, away }) => {
                        const total = home + away || 1;
                        return (
                          <React.Fragment key={label}>
                            <View style={s.statDivider} />
                            <View style={s.statBarBlock}>
                              <View style={s.statBarNumbers}>
                                <Text style={[s.statBarNum, { color: game.homeColor }]}>{home}</Text>
                                <Text style={s.statRowLabel}>{label}</Text>
                                <Text style={[s.statBarNum, { color: game.awayColor }]}>{away}</Text>
                              </View>
                              <View style={s.statBarTrack}>
                                <View style={[s.statBarFill, { backgroundColor: game.homeColor, flex: home / total }]} />
                                <View style={[s.statBarFill, { backgroundColor: game.awayColor, flex: away / total }]} />
                              </View>
                            </View>
                          </React.Fragment>
                        );
                      })}
                    </View>

                    {/* Radar chart */}
                    {hasPlayers && (() => {
                      const homeVals = RADAR_ATTRS.map(a => avgAttr(homePlayers, a.key));
                      const awayVals = RADAR_ATTRS.map(a => avgAttr(awayPlayers, a.key));
                      return (
                        <View style={s.statCard}>
                          <Text style={s.statCardLabel}>AVG ATTRIBUTES</Text>
                          <View style={s.radarLegend}>
                            <View style={s.radarLegendItem}>
                              <View style={[s.radarLegendDot, { backgroundColor: game.homeColor }]} />
                              <Text style={s.radarLegendTxt} numberOfLines={1}>{game.homeTeam}</Text>
                            </View>
                            <View style={s.radarLegendItem}>
                              <View style={[s.radarLegendDot, { backgroundColor: game.awayColor }]} />
                              <Text style={s.radarLegendTxt} numberOfLines={1}>{game.awayTeam}</Text>
                            </View>
                          </View>
                          <View style={{ alignItems: "center" }}>
                            <RadarChart homeVals={homeVals} awayVals={awayVals} homeColor={game.homeColor} awayColor={game.awayColor} />
                          </View>
                        </View>
                      );
                    })()}
                  </>
                );
              })()}</>
          )}
        </ScrollView>
      )}
      <GameExportSheet game={game} visible={exportVisible} onClose={() => setExportVisible(false)} />
    </View>
  );
}

// ── Field styles ──────────────────────────────────────────────────────────────
const LINE = "rgba(255,255,255,0.55)";
const fd = StyleSheet.create({
  field: { borderRadius: 12, overflow: "hidden", position: "relative" },
  stripe: { position: "absolute", left: 0, right: 0 },

  outerBorder: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, borderWidth: 2, borderColor: LINE, borderRadius: 12 },

  penaltyBox: { position: "absolute", left: "20%", right: "20%", height: "22%", borderWidth: 1.5, borderColor: LINE, backgroundColor: "transparent" },
  penaltyTop: { top: 0, borderTopWidth: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 },
  penaltyBottom: { bottom: 0, borderBottomWidth: 0 },

  goalBox: { position: "absolute", left: "35%", right: "35%", height: "9%", borderWidth: 1.5, borderColor: LINE, backgroundColor: "transparent" },
  goalTop: { top: 0, borderTopWidth: 0 },
  goalBottom: { bottom: 0, borderBottomWidth: 0 },

  centerLine: { position: "absolute", left: 0, right: 0, top: "50%", height: 1.5, backgroundColor: LINE },
  centerCircle: { position: "absolute", width: FIELD_W * 0.28, height: FIELD_W * 0.28, borderRadius: FIELD_W * 0.14, borderWidth: 1.5, borderColor: LINE, top: "50%", left: "50%", marginTop: -(FIELD_W * 0.14), marginLeft: -(FIELD_W * 0.14) },
  centerDot: { position: "absolute", width: 7, height: 7, borderRadius: 3.5, backgroundColor: LINE, top: "50%", left: "50%", marginTop: -3.5, marginLeft: -3.5 },

  playersContainer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, paddingVertical: 18, paddingHorizontal: 8, justifyContent: "space-around" },
  row: { flexDirection: "row", justifyContent: "space-around", alignItems: "center" },

  playerWrap: { alignItems: "center", gap: 3, maxWidth: 52 },
  dot: { borderWidth: 2, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 4, elevation: 4 },
  dotInitials: { color: "#fff", fontWeight: "900" },
  dotName: { color: "#fff", fontSize: 8, fontWeight: "700", textAlign: "center", textShadowColor: "rgba(0,0,0,0.8)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
});

// ── Screen styles ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  ambientLeft:  { position: "absolute", top: 0, left: 0, width: "60%", height: 260 },
  ambientRight: { position: "absolute", top: 0, right: 0, width: "60%", height: 260 },

  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 8 },
  backBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  shareBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  headerMeta: { flexDirection: "row", alignItems: "center", gap: 5 },
  headerLeague: { color: T.textMuted, fontSize: 11, fontWeight: "600" },
  headerDot: { color: T.textMuted, fontSize: 11 },

  banner: { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, gap: 8 },
  bannerTeam: { flex: 1, alignItems: "flex-start", gap: 10, minWidth: 0 },
  teamShield: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  bannerTeamName: { color: T.textSecondary, fontSize: 13, fontWeight: "800", lineHeight: 18, alignSelf: "stretch" },
  winBadge: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 2 },
  winBadgeTxt: { fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  bannerScore: { alignItems: "center", gap: 6, paddingTop: 2 },
  bannerScoreRow: { flexDirection: "row", alignItems: "center" },
  bannerScoreNum: { color: T.textPrimary, fontSize: 42, fontWeight: "900", letterSpacing: -1, minWidth: 36, textAlign: "center" },
  bannerScoreSep: { color: T.textMuted, fontSize: 28, fontWeight: "200", paddingHorizontal: 10 },
  bannerVs: { color: T.textMuted, fontSize: 20, fontWeight: "800", letterSpacing: 2 },
  ftChipRow: { alignItems: "center" },
  ftChip: { backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  ftChipTxt: { color: T.textMuted, fontSize: 9, fontWeight: "800", letterSpacing: 1.5 },
  bannerDate: { color: T.textMuted, fontSize: 10, fontWeight: "600" },

  editBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginHorizontal: 20, marginBottom: 14, paddingVertical: 10, backgroundColor: T.surface, borderRadius: T.radius.pill, borderWidth: 1, borderColor: T.border },
  editBtnTxt: { color: T.textMuted, fontSize: 12, fontWeight: "700" },

  tabBar: { flexDirection: "row", borderTopWidth: 1, borderBottomWidth: 1, borderColor: T.border },
  tab: { flex: 1, paddingVertical: 13, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: T.accent },
  tabTxt: { color: T.textMuted, fontSize: 13, fontWeight: "700" },
  tabTxtActive: { color: T.textPrimary },

  tabContent: { padding: 16, gap: 12, paddingBottom: 40 },

  // Team switcher
  teamSwitcher: { flexDirection: "row", gap: 10, marginBottom: 4 },
  teamSwitchBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingVertical: 10, borderRadius: T.radius.pill, borderWidth: 1.5, borderColor: T.border, backgroundColor: T.surface },
  switchDot: { width: 7, height: 7, borderRadius: 3.5 },
  teamSwitchTxt: { color: T.textMuted, fontSize: 12, fontWeight: "700", flexShrink: 1 },

  // Stats
  statCard: { backgroundColor: T.surface, borderRadius: T.radius.card, borderWidth: 1, borderColor: T.border, overflow: "hidden" },
  statCardLabel: { color: T.textMuted, fontSize: 9, fontWeight: "800", letterSpacing: 2, padding: 14, paddingBottom: 10 },
  statTeamRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12 },
  statTeamName: { fontSize: 11, fontWeight: "800", flex: 1 },
  statDivider: { height: 1, backgroundColor: T.border },
  statRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 13 },
  statRowLeft: { flexDirection: "row", alignItems: "center", gap: 5 },
  statRowLabelLeft: { color: T.textMuted, fontSize: 9, fontWeight: "800", letterSpacing: 1.5 },
  statRowLabel: { flex: 1, color: T.textMuted, fontSize: 9, fontWeight: "800", letterSpacing: 1.5, textAlign: "center" },
  statRowValue: { color: T.textPrimary, fontSize: 13, fontWeight: "700" },
  statBarBlock: { paddingHorizontal: 14, paddingVertical: 13, gap: 8 },
  statBarNumbers: { flexDirection: "row", alignItems: "center" },
  statBarNum: { fontSize: 16, fontWeight: "900", minWidth: 32 },
  statBarTrack: { height: 5, borderRadius: 3, flexDirection: "row", overflow: "hidden", gap: 1 },
  statBarFill: { borderRadius: 3 },
  radarLegend: { flexDirection: "row", gap: 16, paddingHorizontal: 14, paddingBottom: 8 },
  radarLegendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  radarLegendDot: { width: 8, height: 8, borderRadius: 4 },
  radarLegendTxt: { color: T.textMuted, fontSize: 11, fontWeight: "600", maxWidth: 100 },

  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 10 },
  emptyTxt: { color: T.textMuted, fontSize: 14, fontWeight: "600" },
});
