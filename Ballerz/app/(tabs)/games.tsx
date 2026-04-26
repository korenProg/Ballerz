// NEW DEPS: npx expo install react-native-view-shot expo-sharing

import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as Sharing from "expo-sharing";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";
import {GoalEvent, GamePlayer, Game, ExportMode} from '../../types'
import { useStore } from "../../store";


// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusBg(status: Game["status"]) {
  if (status === "FT") return "#2a2a2a";
  if (status === "Live") return "#1a3a00";
  return "#2a2200";
}
function statusFg(status: Game["status"]) {
  if (status === "FT") return "#aaa";
  if (status === "Live") return "#55cc00";
  return "#ccaa00";
}

function buildShareText(
  game: Game,
  mode: "result" | "preview" | "teamsheet",
): string {
  if (mode === "result") {
    const winner =
      game.homeScore > game.awayScore
        ? game.homeTeam
        : game.awayScore > game.homeScore
          ? game.awayTeam
          : "Draw";
    return [
      `⚽ ${game.league}`,
      `━━━━━━━━━━━━━━━━━━`,
      `${game.homeTeam}  ${game.homeScore} – ${game.awayScore}  ${game.awayTeam}`,
      winner !== "Draw" ? `🏆 ${winner} win!` : `🤝 It's a draw!`,
      game.mvp.name !== "—"
        ? `⭐ MVP: ${game.mvp.name}  (${game.mvp.stat})`
        : "",
      game.location ? `📍 ${game.location}` : "",
      `━━━━━━━━━━━━━━━━━━`,
      `via Ballerz`,
    ]
      .filter(Boolean)
      .join("\n");
  }
  if (mode === "preview") {
    return [
      `🔥 TONIGHT'S MATCH`,
      `━━━━━━━━━━━━━━━━━━`,
      `${game.homeTeam}  vs  ${game.awayTeam}`,
      `⚽ ${game.league}`,
      game.location ? `📍 ${game.location}` : "",
      game.homeCaptain && game.awayCaptain
        ? `👑 Caps: ${game.homeCaptain} & ${game.awayCaptain}`
        : "",
      `━━━━━━━━━━━━━━━━━━`,
      `via Ballerz`,
    ]
      .filter(Boolean)
      .join("\n");
  }
  // teamsheet
  const homeList = (game.homePlayers || [])
    .map(
      (p) =>
        `  ${p.name.padEnd(20)} ${p.position}${p.name === game.homeCaptain ? " ©" : ""}`,
    )
    .join("\n");
  const awayList = (game.awayPlayers || [])
    .map(
      (p) =>
        `  ${p.name.padEnd(20)} ${p.position}${p.name === game.awayCaptain ? " ©" : ""}`,
    )
    .join("\n");
  return [
    `📋 TEAM SHEET`,
    `${game.homeTeam} vs ${game.awayTeam}`,
    `━━━━━━━━━━━━━━━━━━`,
    `${game.homeTeam.toUpperCase()}`,
    homeList,
    `━━━━━━━━━━━━━━━━━━`,
    `${game.awayTeam.toUpperCase()}`,
    awayList,
    `━━━━━━━━━━━━━━━━━━`,
    `via Ballerz`,
  ]
    .filter(Boolean)
    .join("\n");
}

// ─── Export Cards ─────────────────────────────────────────────────────────────
// These are rendered inside the export sheet and captured as images.
// Fixed width (EXP_W) so the screenshot is always consistent.

const EXP_W = 320;

// Thin split bar — home color left / away color right
function TeamColorBar({
  homeColor,
  awayColor,
}: {
  homeColor: string;
  awayColor: string;
}) {
  return (
    <View style={{ flexDirection: "row", height: 3 }}>
      <View style={{ flex: 1, backgroundColor: homeColor }} />
      <View style={{ flex: 1, backgroundColor: awayColor }} />
    </View>
  );
}

function ResultExportCard({
  game,
  cardRef,
}: {
  game: Game;
  cardRef: React.RefObject<View | null>;
}) {
  const isDraw = game.homeScore === game.awayScore;
  const winnerColor =
    game.homeScore > game.awayScore
      ? game.homeColor
      : game.awayScore > game.homeScore
        ? game.awayColor
        : "#666";

  return (
    <View ref={cardRef} collapsable={false} style={expCard.wrap}>
      <TeamColorBar homeColor={game.homeColor} awayColor={game.awayColor} />

      {/* Header */}
      <View style={expCard.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <Ionicons name="football" size={11} color="#444" />
          <Text style={expCard.headerLeague}>{game.league}</Text>
        </View>
        <View style={expCard.ftBadge}>
          <Text style={expCard.ftText}>FULL TIME</Text>
        </View>
      </View>

      {/* Score row */}
      <View style={expCard.scoreRow}>
        {/* Home */}
        <View style={expCard.teamCol}>
          <View
            style={[
              expCard.shield,
              {
                borderColor: game.homeColor,
                backgroundColor: game.homeColor + "1a",
              },
            ]}
          >
            <Ionicons name="shield" size={22} color={game.homeColor} />
          </View>
          <Text style={expCard.teamName} numberOfLines={2}>
            {game.homeTeam}
          </Text>
          {game.homeCaptain && (
            <Text style={expCard.captainTxt} numberOfLines={1}>
              © {game.homeCaptain}
            </Text>
          )}
        </View>

        {/* Score */}
        <View style={expCard.scoreBlock}>
          <Text style={expCard.scoreText}>
            {game.homeScore}–{game.awayScore}
          </Text>
          {!isDraw && (
            <View
              style={[
                expCard.resultPill,
                {
                  borderColor: winnerColor + "40",
                  backgroundColor: winnerColor + "14",
                },
              ]}
            >
              <Text style={[expCard.resultPillTxt, { color: winnerColor }]}>
                {game.homeScore > game.awayScore
                  ? game.homeTeam
                  : game.awayTeam}{" "}
                win
              </Text>
            </View>
          )}
          {isDraw && (
            <View
              style={[
                expCard.resultPill,
                { borderColor: "#44444466", backgroundColor: "#1a1a1a" },
              ]}
            >
              <Text style={[expCard.resultPillTxt, { color: "#888" }]}>
                Draw
              </Text>
            </View>
          )}
        </View>

        {/* Away */}
        <View style={[expCard.teamCol, { alignItems: "flex-end" }]}>
          <View
            style={[
              expCard.shield,
              {
                borderColor: game.awayColor,
                backgroundColor: game.awayColor + "1a",
              },
            ]}
          >
            <Ionicons name="shield" size={22} color={game.awayColor} />
          </View>
          <Text
            style={[expCard.teamName, { textAlign: "right" }]}
            numberOfLines={2}
          >
            {game.awayTeam}
          </Text>
          {game.awayCaptain && (
            <Text
              style={[expCard.captainTxt, { textAlign: "right" }]}
              numberOfLines={1}
            >
              © {game.awayCaptain}
            </Text>
          )}
        </View>
      </View>

      {/* Location */}
      {game.location && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            marginTop: -6,
            marginBottom: 12,
          }}
        >
          <Ionicons name="location-outline" size={10} color="#444" />
          <Text style={{ color: "#444", fontSize: 10, fontWeight: "500" }}>
            {game.location}
          </Text>
        </View>
      )}

      {/* MVP */}
      {game.mvp.name !== "—" && (
        <>
          <View style={expCard.divider} />
          <View style={expCard.mvpRow}>
            <Ionicons name="star" size={13} color="#f5c518" />
            <Text style={expCard.mvpLabel}>MVP</Text>
            <Text style={expCard.mvpName}>{game.mvp.name}</Text>
            <Text style={expCard.mvpStat}>{game.mvp.stat}</Text>
          </View>
        </>
      )}

      <View style={[expCard.divider, { marginTop: 4 }]} />
      <Text style={expCard.watermark}>VIA BALLERZ</Text>
    </View>
  );
}

function PreviewExportCard({
  game,
  cardRef,
}: {
  game: Game;
  cardRef: React.RefObject<View | null>;
}) {
  const isLive = game.status === "Live";
  const statusLbl = isLive ? "LIVE NOW" : "UPCOMING";
  const statusClr = isLive ? "#55cc00" : "#f5c518";

  return (
    <View ref={cardRef} collapsable={false} style={expCard.wrap}>
      <TeamColorBar homeColor={game.homeColor} awayColor={game.awayColor} />

      {/* Status */}
      <View style={{ alignItems: "center", paddingTop: 16, paddingBottom: 8 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginBottom: 4,
          }}
        >
          {isLive && <LiveDot />}
          <Text
            style={{
              color: statusClr,
              fontSize: 10,
              fontWeight: "900",
              letterSpacing: 2.5,
            }}
          >
            {statusLbl}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <Ionicons name="football-outline" size={11} color="#444" />
          <Text style={{ color: "#555", fontSize: 11, fontWeight: "600" }}>
            {game.league}
          </Text>
        </View>
      </View>

      {/* Teams */}
      <View style={[expCard.scoreRow, { paddingVertical: 14 }]}>
        <View style={expCard.teamCol}>
          <View
            style={[
              expCard.shieldLg,
              {
                borderColor: game.homeColor,
                backgroundColor: game.homeColor + "1a",
              },
            ]}
          >
            <Ionicons name="shield" size={28} color={game.homeColor} />
          </View>
          <Text style={expCard.teamName} numberOfLines={2}>
            {game.homeTeam}
          </Text>
          {game.homeCaptain && (
            <View
              style={[expCard.capPill, { borderColor: game.homeColor + "40" }]}
            >
              <Text style={[expCard.capPillTxt, { color: game.homeColor }]}>
                C
              </Text>
              <Text style={expCard.capPillName}>
                {game.homeCaptain.split(" ").pop()}
              </Text>
            </View>
          )}
        </View>

        <Text style={expCard.vsText}>vs</Text>

        <View style={[expCard.teamCol, { alignItems: "flex-end" }]}>
          <View
            style={[
              expCard.shieldLg,
              {
                borderColor: game.awayColor,
                backgroundColor: game.awayColor + "1a",
              },
            ]}
          >
            <Ionicons name="shield" size={28} color={game.awayColor} />
          </View>
          <Text
            style={[expCard.teamName, { textAlign: "right" }]}
            numberOfLines={2}
          >
            {game.awayTeam}
          </Text>
          {game.awayCaptain && (
            <View
              style={[
                expCard.capPill,
                {
                  borderColor: game.awayColor + "40",
                  flexDirection: "row-reverse",
                },
              ]}
            >
              <Text style={[expCard.capPillTxt, { color: game.awayColor }]}>
                C
              </Text>
              <Text style={expCard.capPillName}>
                {game.awayCaptain.split(" ").pop()}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Location */}
      {game.location && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            marginBottom: 14,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              backgroundColor: "#1a1a1a",
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 5,
            }}
          >
            <Ionicons name="location-outline" size={11} color="#555" />
            <Text style={{ color: "#666", fontSize: 11, fontWeight: "600" }}>
              {game.location}
            </Text>
          </View>
        </View>
      )}

      <View style={expCard.divider} />
      <Text style={expCard.watermark}>VIA BALLERZ</Text>
    </View>
  );
}

function TeamSheetExportCard({
  game,
  cardRef,
}: {
  game: Game;
  cardRef: React.RefObject<View | null>;
}) {
  const home = game.homePlayers || [];
  const away = game.awayPlayers || [];

  const initials = (name: string) =>
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <View ref={cardRef} collapsable={false} style={expCard.wrap}>
      <TeamColorBar homeColor={game.homeColor} awayColor={game.awayColor} />

      {/* Title */}
      <View style={{ alignItems: "center", paddingTop: 14, paddingBottom: 12 }}>
        <Text
          style={{
            color: "#444",
            fontSize: 9,
            fontWeight: "800",
            letterSpacing: 2.5,
            marginBottom: 5,
          }}
        >
          TEAM SHEET
        </Text>
        <Text style={{ color: "#fff", fontSize: 13, fontWeight: "800" }}>
          {game.homeTeam} vs {game.awayTeam}
        </Text>
      </View>

      <View style={expCard.divider} />

      {/* Two-column lineup */}
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: 12,
          paddingVertical: 14,
          gap: 8,
        }}
      >
        {/* Home column */}
        <View style={{ flex: 1 }}>
          {/* Column header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              marginBottom: 10,
            }}
          >
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: 3.5,
                backgroundColor: game.homeColor,
              }}
            />
            <Text
              style={{
                color: game.homeColor,
                fontSize: 10,
                fontWeight: "800",
                flex: 1,
              }}
              numberOfLines={1}
            >
              {game.homeTeam}
            </Text>
          </View>
          {home.map((p) => (
            <View key={p.id} style={expCard.playerRow}>
              <View
                style={[
                  expCard.miniAvatar,
                  { borderColor: game.homeColor + "44" },
                ]}
              >
                <Text
                  style={[expCard.miniAvatarTxt, { color: game.homeColor }]}
                >
                  {initials(p.name)}
                </Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={expCard.playerRowName} numberOfLines={1}>
                  {p.name.split(" ").pop()}
                </Text>
                <Text style={expCard.playerRowPos}>{p.position}</Text>
              </View>
              {p.name === game.homeCaptain && (
                <View
                  style={[
                    expCard.cBadge,
                    { borderColor: game.homeColor + "50" },
                  ]}
                >
                  <Text style={[expCard.cBadgeTxt, { color: game.homeColor }]}>
                    C
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Vertical divider */}
        <View style={{ width: 1, backgroundColor: "#1e1e1e", marginTop: 30 }} />

        {/* Away column */}
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 5,
              marginBottom: 10,
            }}
          >
            <Text
              style={{ color: game.awayColor, fontSize: 10, fontWeight: "800" }}
              numberOfLines={1}
            >
              {game.awayTeam}
            </Text>
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: 3.5,
                backgroundColor: game.awayColor,
              }}
            />
          </View>
          {away.map((p) => (
            <View
              key={p.id}
              style={[expCard.playerRow, { flexDirection: "row-reverse" }]}
            >
              <View
                style={[
                  expCard.miniAvatar,
                  { borderColor: game.awayColor + "44" },
                ]}
              >
                <Text
                  style={[expCard.miniAvatarTxt, { color: game.awayColor }]}
                >
                  {initials(p.name)}
                </Text>
              </View>
              <View style={{ flex: 1, minWidth: 0, alignItems: "flex-end" }}>
                <Text style={expCard.playerRowName} numberOfLines={1}>
                  {p.name.split(" ").pop()}
                </Text>
                <Text style={expCard.playerRowPos}>{p.position}</Text>
              </View>
              {p.name === game.awayCaptain && (
                <View
                  style={[
                    expCard.cBadge,
                    { borderColor: game.awayColor + "50" },
                  ]}
                >
                  <Text style={[expCard.cBadgeTxt, { color: game.awayColor }]}>
                    C
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>

      <View style={expCard.divider} />
      <Text style={expCard.watermark}>VIA BALLERZ</Text>
    </View>
  );
}

const expCard = StyleSheet.create({
  wrap: {
    width: EXP_W,
    backgroundColor: "#0c0c0c",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1e1e1e",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  headerLeague: {
    color: "#555",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  ftBadge: {
    backgroundColor: "#252525",
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  ftText: { color: "#aaa", fontSize: 9, fontWeight: "800", letterSpacing: 1.5 },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 18,
    gap: 6,
  },
  teamCol: { flex: 1, alignItems: "center", gap: 7 },
  shield: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  shieldLg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  teamName: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
  },
  captainTxt: { color: "#444", fontSize: 9, fontWeight: "500" },
  scoreBlock: { alignItems: "center", gap: 7, paddingHorizontal: 4 },
  scoreText: {
    color: "#fff",
    fontSize: 40,
    fontWeight: "900",
    letterSpacing: -1,
  },
  resultPill: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  resultPillTxt: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  vsText: {
    color: "#333",
    fontSize: 22,
    fontWeight: "200",
    paddingHorizontal: 4,
  },
  capPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  capPillTxt: { fontSize: 8, fontWeight: "900" },
  capPillName: { color: "#555", fontSize: 9, fontWeight: "600" },
  divider: { height: 1, backgroundColor: "#161616" },
  mvpRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 8,
  },
  mvpLabel: { color: "#555", fontSize: 10, fontWeight: "700" },
  mvpName: { color: "#fff", fontSize: 11, fontWeight: "800", flex: 1 },
  mvpStat: { color: "#555", fontSize: 10 },
  watermark: {
    textAlign: "center",
    color: "#222",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 2,
    paddingVertical: 9,
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 7,
  },
  miniAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#111",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  miniAvatarTxt: { fontSize: 8, fontWeight: "800" },
  playerRowName: { color: "#ddd", fontSize: 11, fontWeight: "700" },
  playerRowPos: { color: "#3a3a3a", fontSize: 9, marginTop: 1 },
  cBadge: {
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  cBadgeTxt: { fontSize: 8, fontWeight: "900" },
});

// ─── Game Export Sheet ────────────────────────────────────────────────────────

function GameExportSheet({
  game,
  visible,
  onClose,
}: {
  game: Game | null;
  visible: boolean;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<ExportMode>("options");
  const [sharing, setSharing] = useState(false);

  const sheetY = useRef(new Animated.Value(80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const cardRef = useRef<View | null>(null);

  useEffect(() => {
    if (visible) {
      setMode("options");
      sheetY.setValue(80);
      opacity.setValue(0);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(sheetY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 220,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(sheetY, {
        toValue: 60,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(onClose);
  };

  const handleShare = async () => {
    if (mode === "options" || !game) return;
    setSharing(true);
    try {
      if (cardRef.current) {
        const uri = await captureRef(cardRef, { format: "png", quality: 1 });
        await Sharing.shareAsync(uri, { mimeType: "image/png" });
      }
    } catch {
      // Fallback to text share
      await Share.share({
        message: buildShareText(
          game,
          mode as "result" | "preview" | "teamsheet",
        ),
      });
    } finally {
      setSharing(false);
    }
  };

  if (!game) return null;

  const hasPlayers = !!(game.homePlayers?.length && game.awayPlayers?.length);

  const OPTION_CONFIGS = [
    {
      key: "result" as const,
      show: game.status === "FT",
      icon: "trophy-outline" as const,
      iconBg: "#1a0800",
      iconClr: "#cc4400",
      title: "Game Result",
      sub: "Final score + MVP",
    },
    {
      key: "preview" as const,
      show: true,
      icon: "radio-outline" as const,
      iconBg: "#00091a",
      iconClr: "#2266ee",
      title: "Match Preview",
      sub: "Announce the upcoming matchup",
    },
    {
      key: "teamsheet" as const,
      show: hasPlayers,
      icon: "people-outline" as const,
      iconBg: "#001510",
      iconClr: "#00aa66",
      title: "Team Sheet",
      sub: "Tonight's lineups",
    },
  ];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <BlurView intensity={45} tint="dark" style={exp.overlay}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[exp.sheet, { opacity, transform: [{ translateY: sheetY }] }]}
        >
          <View style={exp.handle} />

          {mode === "options" ? (
            /* ── Option list ── */
            <>
              <Text style={exp.title}>Share</Text>
              <Text style={exp.sub}>
                {game.homeTeam} vs {game.awayTeam}
              </Text>
              <View style={exp.divider} />
              {OPTION_CONFIGS.filter((o) => o.show).map((opt, i, arr) => (
                <React.Fragment key={opt.key}>
                  <TouchableOpacity
                    style={exp.option}
                    onPress={() => setMode(opt.key)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[exp.optIcon, { backgroundColor: opt.iconBg }]}
                    >
                      <Ionicons name={opt.icon} size={20} color={opt.iconClr} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={exp.optTitle}>{opt.title}</Text>
                      <Text style={exp.optSub}>{opt.sub}</Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color="#2a2a2a"
                    />
                  </TouchableOpacity>
                  {i < arr.length - 1 && <View style={exp.optDivider} />}
                </React.Fragment>
              ))}
              <View style={exp.divider} />
              <TouchableOpacity style={exp.cancelBtn} onPress={handleClose}>
                <Text style={exp.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            /* ── Card preview ── */
            <>
              {/* Header */}
              <View style={exp.previewHeader}>
                <TouchableOpacity
                  style={exp.backBtn}
                  onPress={() => setMode("options")}
                >
                  <Ionicons name="chevron-back" size={17} color="#aaa" />
                  <Text style={exp.backTxt}>Back</Text>
                </TouchableOpacity>
                <Text style={exp.previewTitle}>
                  {mode === "result"
                    ? "Game Result"
                    : mode === "preview"
                      ? "Match Preview"
                      : "Team Sheet"}
                </Text>
                <View style={{ width: 60 }} />
              </View>

              {/* Card preview (scrollable in case of tall team sheet) */}
              <ScrollView
                contentContainerStyle={{
                  alignItems: "center",
                  paddingHorizontal: 20,
                  paddingVertical: 16,
                }}
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: 420 }}
              >
                {mode === "result" && (
                  <ResultExportCard game={game} cardRef={cardRef} />
                )}
                {mode === "preview" && (
                  <PreviewExportCard game={game} cardRef={cardRef} />
                )}
                {mode === "teamsheet" && (
                  <TeamSheetExportCard game={game} cardRef={cardRef} />
                )}
              </ScrollView>

              <View style={exp.divider} />
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingTop: 14,
                  paddingBottom: 8,
                }}
              >
                <TouchableOpacity
                  style={[exp.shareBtn, sharing && { opacity: 0.55 }]}
                  onPress={handleShare}
                  disabled={sharing}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="share-social-outline"
                    size={18}
                    color="#fff"
                  />
                  <Text style={exp.shareBtnTxt}>
                    {sharing ? "Sharing…" : "Share Image"}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </Animated.View>
      </BlurView>
    </Modal>
  );
}

const exp = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#161616",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 10,
    paddingBottom: 34,
    overflow: "hidden",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#2a2a2a",
    alignSelf: "center",
    marginBottom: 14,
  },
  title: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 3,
  },
  sub: { color: "#555", fontSize: 13, textAlign: "center", marginBottom: 14 },
  divider: { height: 1, backgroundColor: "#1e1e1e" },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 15,
    gap: 14,
  },
  optIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  optTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
  optSub: { color: "#444", fontSize: 12, marginTop: 2 },
  optDivider: { height: 1, backgroundColor: "#1e1e1e", marginHorizontal: 18 },
  cancelBtn: { paddingVertical: 16, alignItems: "center" },
  cancelTxt: { color: "#555", fontSize: 15, fontWeight: "600" },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 3, width: 60 },
  backTxt: { color: "#aaa", fontSize: 14, fontWeight: "600" },
  previewTitle: { color: "#fff", fontSize: 15, fontWeight: "800" },
  shareBtn: {
    backgroundColor: "#0039a3",
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  shareBtnTxt: { color: "#fff", fontSize: 16, fontWeight: "800" },
});

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({
  visible,
  count,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          damping: 18,
          stiffness: 200,
        }),
      ]).start();
    } else {
      scale.setValue(0.9);
      opacity.setValue(0);
    }
  }, [visible]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onCancel}
    >
      <BlurView intensity={30} tint="dark" style={styles.dialogOverlay}>
        <Animated.View
          style={[styles.dialog, { opacity, transform: [{ scale }] }]}
        >
          <View style={styles.dialogIconWrap}>
            <Ionicons name="trash-outline" size={28} color="#cc0000" />
          </View>
          <Text style={styles.dialogTitle}>
            Delete {count} {count === 1 ? "Game" : "Games"}?
          </Text>
          <Text style={styles.dialogSubtitle}>
            This action cannot be undone.
          </Text>
          <View style={styles.dialogDivider} />
          <View style={styles.dialogActions}>
            <TouchableOpacity style={styles.dialogCancel} onPress={onCancel}>
              <Text style={styles.dialogCancelText}>Cancel</Text>
            </TouchableOpacity>
            <View style={styles.dialogActionsDivider} />
            <TouchableOpacity style={styles.dialogConfirm} onPress={onConfirm}>
              <Text style={styles.dialogConfirmText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}

// ─── Live Dot ─────────────────────────────────────────────────────────────────

function LiveDot() {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.8,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);
  return (
    <View
      style={{
        width: 10,
        height: 10,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Animated.View
        style={[styles.livePulseDot, { transform: [{ scale: pulse }] }]}
      />
      <View style={styles.liveSolidDot} />
    </View>
  );
}

// ─── Player Score Row ─────────────────────────────────────────────────────────

function PlayerScoreRow({
  player,
  goals,
  teamColor,
  isCaptain,
  onGoal,
}: {
  player: GamePlayer;
  goals: number;
  teamColor: string;
  isCaptain: boolean;
  onGoal: () => void;
}) {
  const flashAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const initials = player.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handlePress = () => {
    onGoal();
    scaleAnim.setValue(1.05);
    flashAnim.setValue(1);
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 11,
        stiffness: 260,
      }),
      Animated.timing(flashAnim, {
        toValue: 0,
        duration: 480,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Animated.View
      style={[tracker.playerWrap, { transform: [{ scale: scaleAnim }] }]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: teamColor,
            opacity: Animated.multiply(flashAnim, 0.22),
            borderRadius: 10,
          },
        ]}
      />
      <TouchableOpacity
        style={tracker.playerRow}
        onPress={handlePress}
        activeOpacity={0.65}
      >
        <View style={[tracker.avatar, { borderColor: teamColor + "55" }]}>
          <Text style={[tracker.avatarTxt, { color: teamColor }]}>
            {initials}
          </Text>
        </View>
        <View style={tracker.playerInfo}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Text style={tracker.playerName} numberOfLines={1}>
              {player.name}
            </Text>
            {isCaptain && (
              <View style={[tracker.cBadge, { borderColor: teamColor + "70" }]}>
                <Text style={[tracker.cBadgeTxt, { color: teamColor }]}>C</Text>
              </View>
            )}
          </View>
          <Text style={tracker.playerPos}>{player.position}</Text>
        </View>
        <View style={tracker.playerRight}>
          {goals > 0 && (
            <Text style={[tracker.goalCount, { color: teamColor }]}>
              {goals}
            </Text>
          )}
          <Ionicons
            name="add-circle"
            size={24}
            color={goals > 0 ? teamColor : "#252525"}
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const tracker = StyleSheet.create({
  playerWrap: { marginBottom: 4, borderRadius: 10, overflow: "hidden" },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 9,
    gap: 9,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#111",
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTxt: { fontSize: 11, fontWeight: "800" },
  playerInfo: { flex: 1, minWidth: 0 },
  playerName: { color: "#fff", fontSize: 12, fontWeight: "700" },
  playerPos: { color: "#444", fontSize: 10, marginTop: 1 },
  cBadge: {
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  cBadgeTxt: { fontSize: 9, fontWeight: "900" },
  playerRight: { flexDirection: "row", alignItems: "center", gap: 4 },
  goalCount: { fontSize: 16, fontWeight: "900" },
});

// ─── MVP Picker Sheet ─────────────────────────────────────────────────────────

function MvpPickerSheet({
  visible,
  allPlayers,
  goalMap,
  homeColor,
  awayColor,
  homePlayerIds,
  onSelect,
  onCancel,
}: {
  visible: boolean;
  allPlayers: GamePlayer[];
  goalMap: Record<string, number>;
  homeColor: string;
  awayColor: string;
  homePlayerIds: Set<string>;
  onSelect: (p: GamePlayer) => void;
  onCancel: () => void;
}) {
  const sheetY = useRef(new Animated.Value(60)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      sheetY.setValue(60);
      opacity.setValue(0);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(sheetY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 220,
        }),
      ]).start();
    }
  }, [visible]);

  const sorted = [...allPlayers].sort(
    (a, b) => (goalMap[b.id] || 0) - (goalMap[a.id] || 0),
  );

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onCancel}
    >
      <BlurView intensity={45} tint="dark" style={mvpSheet.overlay}>
        <Animated.View
          style={[
            mvpSheet.sheet,
            { opacity, transform: [{ translateY: sheetY }] },
          ]}
        >
          <View style={mvpSheet.handle} />
          <Text style={mvpSheet.title}>Select MVP</Text>
          <Text style={mvpSheet.sub}>Who was the standout player?</Text>
          <View style={mvpSheet.divider} />
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 340 }}
          >
            {sorted.map((p, i) => {
              const g = goalMap[p.id] || 0;
              const color = homePlayerIds.has(p.id) ? homeColor : awayColor;
              const init = p.name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();
              return (
                <React.Fragment key={p.id}>
                  <TouchableOpacity
                    style={mvpSheet.row}
                    onPress={() => onSelect(p)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[mvpSheet.avatar, { borderColor: color + "55" }]}
                    >
                      <Text style={[mvpSheet.avatarTxt, { color }]}>
                        {init}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={mvpSheet.pName}>{p.name}</Text>
                      <Text style={mvpSheet.pSub}>{p.position}</Text>
                    </View>
                    {g > 0 && (
                      <View style={mvpSheet.goalPill}>
                        <Ionicons name="football" size={10} color="#f5c518" />
                        <Text style={mvpSheet.goalTxt}>{g}</Text>
                      </View>
                    )}
                    <Ionicons name="chevron-forward" size={16} color="#333" />
                  </TouchableOpacity>
                  {i < sorted.length - 1 && (
                    <View style={mvpSheet.rowDivider} />
                  )}
                </React.Fragment>
              );
            })}
          </ScrollView>
          <View style={mvpSheet.divider} />
          <TouchableOpacity style={mvpSheet.cancelBtn} onPress={onCancel}>
            <Text style={mvpSheet.cancelTxt}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}

const mvpSheet = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 16,
  },
  sheet: {
    backgroundColor: "#1a1a1a",
    borderRadius: 26,
    width: "93%",
    overflow: "hidden",
    paddingTop: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#333",
    alignSelf: "center",
    marginBottom: 16,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  sub: {
    color: "#555",
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 16,
  },
  divider: { height: 1, backgroundColor: "#222" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 12,
  },
  rowDivider: { height: 1, backgroundColor: "#1e1e1e", marginHorizontal: 18 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#111",
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTxt: { fontSize: 13, fontWeight: "800" },
  pName: { color: "#fff", fontSize: 14, fontWeight: "700" },
  pSub: { color: "#444", fontSize: 11, marginTop: 1 },
  goalPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#2a1f00",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
  },
  goalTxt: { color: "#f5c518", fontSize: 12, fontWeight: "800" },
  cancelBtn: { paddingVertical: 16, alignItems: "center" },
  cancelTxt: { color: "#555", fontSize: 15, fontWeight: "600" },
});

// ─── Live Tracker Modal ───────────────────────────────────────────────────────

function LiveTrackerModal({
  game,
  visible,
  onClose,
  onFinish,
}: {
  game: Game | null;
  visible: boolean;
  onClose: () => void;
  onFinish: (
    homeScore: number,
    awayScore: number,
    mvpName: string,
    mvpStat: string,
  ) => void;
}) {
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [goalMap, setGoalMap] = useState<Record<string, number>>({});
  const [events, setEvents] = useState<GoalEvent[]>([]);
  const [mvpOpen, setMvpOpen] = useState(false);

  const minuteRef = useRef(1);
  const homeScaleAnim = useRef(new Animated.Value(1)).current;
  const awayScaleAnim = useRef(new Animated.Value(1)).current;
  const eventsScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible && game) {
      setHomeScore(game.homeScore);
      setAwayScore(game.awayScore);
      setGoalMap({});
      setEvents([]);
      minuteRef.current = 1;
    }
  }, [visible, game?.id]);

  const flashScore = (anim: Animated.Value) => {
    anim.setValue(1.5);
    Animated.spring(anim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 10,
      stiffness: 200,
    }).start();
  };

  const addGoal = useCallback((player: GamePlayer, team: "home" | "away") => {
    if (team === "home") {
      setHomeScore((s) => s + 1);
      flashScore(homeScaleAnim);
    } else {
      setAwayScore((s) => s + 1);
      flashScore(awayScaleAnim);
    }
    setGoalMap((m) => ({ ...m, [player.id]: (m[player.id] || 0) + 1 }));
    setEvents((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        playerId: player.id,
        playerName: player.name,
        team,
        minute: minuteRef.current++,
      },
    ]);
    setTimeout(
      () => eventsScrollRef.current?.scrollToEnd({ animated: true }),
      80,
    );
  }, []);

  const undoLast = () => {
    if (events.length === 0) return;
    const last = events[events.length - 1];
    if (last.team === "home") setHomeScore((s) => Math.max(0, s - 1));
    else setAwayScore((s) => Math.max(0, s - 1));
    setGoalMap((m) => ({
      ...m,
      [last.playerId]: Math.max(0, (m[last.playerId] || 1) - 1),
    }));
    setEvents((e) => e.slice(0, -1));
    minuteRef.current = Math.max(1, minuteRef.current - 1);
  };

  const handleSelectMvp = (player: GamePlayer) => {
    const g = goalMap[player.id] || 0;
    onFinish(
      homeScore,
      awayScore,
      player.name,
      `${g} goal${g !== 1 ? "s" : ""}`,
    );
    setMvpOpen(false);
  };

  if (!game) return null;

  const homePlayers = game.homePlayers || [];
  const awayPlayers = game.awayPlayers || [];
  const homeIds = new Set(homePlayers.map((p) => p.id));

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <LinearGradient colors={["#0d0d0d", "#000"]} style={{ flex: 1 }}>
          <SafeAreaView style={lt.container} edges={["top", "bottom"]}>
            {/* Header */}
            <View style={lt.header}>
              <TouchableOpacity style={lt.iconBtn} onPress={onClose}>
                <Ionicons name="chevron-down" size={22} color="#fff" />
              </TouchableOpacity>
              <View style={lt.headerCenter}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 7 }}
                >
                  <LiveDot />
                  <Text style={lt.liveLabel}>LIVE</Text>
                </View>
                {game.location ? (
                  <View style={lt.locationRow}>
                    <Ionicons name="location-outline" size={11} color="#444" />
                    <Text style={lt.locationTxt}>{game.location}</Text>
                  </View>
                ) : null}
              </View>
              <TouchableOpacity
                style={[lt.iconBtn, events.length === 0 && lt.iconBtnDisabled]}
                onPress={undoLast}
                disabled={events.length === 0}
              >
                <Ionicons name="arrow-undo-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Score banner */}
            <View style={lt.scoreBanner}>
              <View style={lt.teamSide}>
                <View
                  style={[lt.teamBar, { backgroundColor: game.homeColor }]}
                />
                <Text style={lt.teamName} numberOfLines={2}>
                  {game.homeTeam}
                </Text>
              </View>
              <View style={lt.scoreCenter}>
                <Animated.Text
                  style={[
                    lt.scoreNum,
                    { transform: [{ scale: homeScaleAnim }] },
                  ]}
                >
                  {homeScore}
                </Animated.Text>
                <Text style={lt.scoreDash}>–</Text>
                <Animated.Text
                  style={[
                    lt.scoreNum,
                    { transform: [{ scale: awayScaleAnim }] },
                  ]}
                >
                  {awayScore}
                </Animated.Text>
              </View>
              <View style={[lt.teamSide, { alignItems: "flex-end" }]}>
                <View
                  style={[lt.teamBar, { backgroundColor: game.awayColor }]}
                />
                <Text
                  style={[lt.teamName, { textAlign: "right" }]}
                  numberOfLines={2}
                >
                  {game.awayTeam}
                </Text>
              </View>
            </View>

            {/* Events ribbon */}
            {events.length > 0 && (
              <ScrollView
                ref={eventsScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={lt.eventsBar}
                contentContainerStyle={{
                  paddingHorizontal: 16,
                  gap: 7,
                  alignItems: "center",
                }}
              >
                {events.map((ev) => {
                  const c =
                    ev.team === "home" ? game.homeColor : game.awayColor;
                  return (
                    <View
                      key={ev.id}
                      style={[lt.eventChip, { borderColor: c + "44" }]}
                    >
                      <Text style={[lt.eventMin, { color: c }]}>
                        {ev.minute}'
                      </Text>
                      <Ionicons name="football" size={9} color={c} />
                      <Text style={lt.eventName} numberOfLines={1}>
                        {ev.playerName.split(" ").pop()}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>
            )}

            {/* Player columns */}
            <ScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={lt.columnsOuter}
            >
              <View style={lt.columns}>
                <View style={lt.col}>
                  <View
                    style={[
                      lt.colHeader,
                      { borderBottomColor: game.homeColor + "60" },
                    ]}
                  >
                    <View
                      style={[lt.colDot, { backgroundColor: game.homeColor }]}
                    />
                    <Text style={lt.colTitle} numberOfLines={1}>
                      {game.homeTeam}
                    </Text>
                  </View>
                  {homePlayers.map((p) => (
                    <PlayerScoreRow
                      key={p.id}
                      player={p}
                      goals={goalMap[p.id] || 0}
                      teamColor={game.homeColor}
                      isCaptain={p.name === game.homeCaptain}
                      onGoal={() => addGoal(p, "home")}
                    />
                  ))}
                </View>
                <View style={lt.colDivider} />
                <View style={lt.col}>
                  <View
                    style={[
                      lt.colHeader,
                      { borderBottomColor: game.awayColor + "60" },
                    ]}
                  >
                    <View
                      style={[lt.colDot, { backgroundColor: game.awayColor }]}
                    />
                    <Text style={lt.colTitle} numberOfLines={1}>
                      {game.awayTeam}
                    </Text>
                  </View>
                  {awayPlayers.map((p) => (
                    <PlayerScoreRow
                      key={p.id}
                      player={p}
                      goals={goalMap[p.id] || 0}
                      teamColor={game.awayColor}
                      isCaptain={p.name === game.awayCaptain}
                      onGoal={() => addGoal(p, "away")}
                    />
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={lt.footer}>
              <TouchableOpacity
                style={lt.endBtn}
                onPress={() => setMvpOpen(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="flag" size={17} color="#fff" />
                <Text style={lt.endBtnTxt}>End Game</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </Modal>

      <MvpPickerSheet
        visible={mvpOpen}
        allPlayers={[...homePlayers, ...awayPlayers]}
        goalMap={goalMap}
        homeColor={game.homeColor}
        awayColor={game.awayColor}
        homePlayerIds={homeIds}
        onSelect={handleSelectMvp}
        onCancel={() => setMvpOpen(false)}
      />
    </>
  );
}

const lt = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnDisabled: { opacity: 0.28 },
  headerCenter: { flex: 1, alignItems: "center" },
  liveLabel: {
    color: "#55cc00",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2.5,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 4,
  },
  locationTxt: { color: "#444", fontSize: 11, fontWeight: "500" },
  scoreBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 18,
  },
  teamSide: { flex: 1, gap: 7 },
  teamBar: { width: 20, height: 3, borderRadius: 2 },
  teamName: { color: "#fff", fontSize: 13, fontWeight: "800", lineHeight: 17 },
  scoreCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
  },
  scoreNum: { color: "#fff", fontSize: 52, fontWeight: "900", lineHeight: 56 },
  scoreDash: { color: "#2a2a2a", fontSize: 36, fontWeight: "200" },
  eventsBar: { maxHeight: 38, marginBottom: 10 },
  eventChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#111",
  },
  eventMin: { fontSize: 10, fontWeight: "800" },
  eventName: { color: "#bbb", fontSize: 10, fontWeight: "600", maxWidth: 60 },
  columnsOuter: { paddingHorizontal: 12, paddingBottom: 16 },
  columns: { flexDirection: "row", gap: 6 },
  col: { flex: 1 },
  colHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingBottom: 10,
    marginBottom: 8,
    borderBottomWidth: 1,
  },
  colDot: { width: 7, height: 7, borderRadius: 3.5 },
  colTitle: { color: "#fff", fontSize: 11, fontWeight: "800", flex: 1 },
  colDivider: { width: 1, backgroundColor: "#181818", marginTop: 38 },
  footer: { paddingHorizontal: 16, paddingBottom: 6, paddingTop: 6 },
  endBtn: {
    backgroundColor: "#cc0000",
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  endBtnTxt: { color: "#fff", fontSize: 16, fontWeight: "800" },
});

// ─── Game Card ────────────────────────────────────────────────────────────────

function GameCard({
  game,
  selectable,
  selected,
  onSelect,
  onTap,
  onExport,
}: {
  game: Game;
  selectable: boolean;
  selected: boolean;
  onSelect: () => void;
  onTap: () => void;
  onExport: () => void;
}) {
  const isLive = game.status === "Live";
  const tappable = isLive && !selectable;

  return (
    <TouchableOpacity
      activeOpacity={tappable || selectable ? 0.7 : 1}
      onPress={selectable ? onSelect : tappable ? onTap : undefined}
      style={[
        styles.card,
        selected && styles.cardSelected,
        isLive && !selectable && styles.cardLive,
      ]}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        {selectable && (
          <View style={styles.checkbox}>
            {selected ? (
              <Ionicons name="checkmark-circle" size={20} color="#0039a3" />
            ) : (
              <Ionicons name="ellipse-outline" size={20} color="#555" />
            )}
          </View>
        )}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            flex: 1,
          }}
        >
          <Ionicons name="football-outline" size={13} color="#555" />
          <Text style={styles.leagueText}>{game.league}</Text>
          {game.location && (
            <>
              <Text style={styles.dotSep}>·</Text>
              <Ionicons name="location-outline" size={11} color="#444" />
              <Text style={styles.locationText} numberOfLines={1}>
                {game.location}
              </Text>
            </>
          )}
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusBg(game.status) },
          ]}
        >
          {isLive && <LiveDot />}
          <Text style={[styles.statusText, { color: statusFg(game.status) }]}>
            {game.status}
          </Text>
        </View>
        {/* Share icon — always visible, never in select mode */}
        {!selectable && (
          <TouchableOpacity
            onPress={onExport}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.shareIconBtn}
          >
            <Ionicons name="share-outline" size={15} color="#444" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.divider} />

      {/* Match row */}
      <View style={styles.matchRow}>
        <View
          style={[
            styles.teamBadge,
            { backgroundColor: "#1a0000", borderColor: game.homeColor },
          ]}
        >
          <Ionicons name="shield" size={18} color={game.homeColor} />
        </View>
        <View style={styles.teamBlock}>
          <Text style={styles.teamName}>{game.homeTeam}</Text>
          {game.homeCaptain && (
            <View style={styles.captainRow}>
              <View
                style={[styles.cBadge, { borderColor: game.homeColor + "55" }]}
              >
                <Text style={[styles.cBadgeTxt, { color: game.homeColor }]}>
                  C
                </Text>
              </View>
              <Text style={styles.captainName} numberOfLines={1}>
                {game.homeCaptain}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.score}>
          {game.status === "Pending"
            ? "vs"
            : `${game.homeScore} – ${game.awayScore}`}
        </Text>
        <View style={[styles.teamBlock, { alignItems: "flex-end" }]}>
          <Text style={[styles.teamName, { textAlign: "right" }]}>
            {game.awayTeam}
          </Text>
          {game.awayCaptain && (
            <View style={[styles.captainRow, { flexDirection: "row-reverse" }]}>
              <View
                style={[styles.cBadge, { borderColor: game.awayColor + "55" }]}
              >
                <Text style={[styles.cBadgeTxt, { color: game.awayColor }]}>
                  C
                </Text>
              </View>
              <Text
                style={[styles.captainName, { textAlign: "right" }]}
                numberOfLines={1}
              >
                {game.awayCaptain}
              </Text>
            </View>
          )}
        </View>
        <View
          style={[
            styles.teamBadge,
            { backgroundColor: "#00001a", borderColor: game.awayColor },
          ]}
        >
          <Ionicons name="shield" size={18} color={game.awayColor} />
        </View>
      </View>

      {/* MVP row */}
      {game.status === "FT" && (
        <>
          <View style={styles.divider} />
          <View style={styles.mvpRow}>
            <Ionicons name="star" size={13} color="#f5c518" />
            <Text style={styles.mvpLabel}>Match MVP</Text>
            <Text style={styles.mvpName}>{game.mvp.name}</Text>
            <Text style={styles.mvpStat}>{game.mvp.stat}</Text>
          </View>
        </>
      )}

      {/* Live CTA */}
      {isLive && !selectable && (
        <>
          <View style={styles.divider} />
          <View style={styles.liveCta}>
            <Ionicons name="radio-outline" size={13} color="#55cc00" />
            <Text style={styles.liveCtaText}>Tap to track score</Text>
            <Ionicons name="chevron-forward" size={13} color="#55cc00" />
          </View>
        </>
      )}
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function GamesScreen() {
  const { games, updateGame, deleteGame } = useStore();
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [trackerGame, setTrackerGame] = useState<Game | null>(null);
  const [exportGame, setExportGame] = useState<Game | null>(null); // NEW

  const dropdownOpacity = useRef(new Animated.Value(0)).current;
  const dropdownY = useRef(new Animated.Value(-8)).current;

  const openMenu = () => {
    dropdownOpacity.setValue(0);
    dropdownY.setValue(-8);
    setMenuVisible(true);
    Animated.parallel([
      Animated.timing(dropdownOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(dropdownY, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeMenu = () => {
    Animated.parallel([
      Animated.timing(dropdownOpacity, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(dropdownY, {
        toValue: -8,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start(() => setMenuVisible(false));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const confirmDelete = () => {
    selectedIds.forEach((id) => deleteGame(id));
    setSelectedIds(new Set());
    setSelectMode(false);
    setConfirmVisible(false);
  };

  const markAllFinished = () => {
    games.filter((g) => g.status !== "FT").forEach((g) => updateGame(g.id, { status: "FT" }));
    closeMenu();
  };

  const cancelSelect = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const handleTrackerFinish = (
    homeScore: number,
    awayScore: number,
    mvpName: string,
    mvpStat: string,
  ) => {
    if (!trackerGame) return;
    updateGame(trackerGame.id, {
      status: "FT",
      homeScore,
      awayScore,
      mvp: { name: mvpName, stat: mvpStat },
    });
    setTrackerGame(null);
  };

  return (
    <LinearGradient
      colors={["#000000", "#000000", "#00000060", "rgb(0,0,0)"]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* Top bar */}
        <View style={styles.topBar}>
          {selectMode ? (
            <TouchableOpacity onPress={cancelSelect} style={styles.topBarBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={openMenu} style={styles.topBarBtn}>
              <Ionicons name="ellipsis-horizontal" size={22} color="#fff" />
            </TouchableOpacity>
          )}
          <Text style={styles.pageTitle}>Games</Text>
          {selectMode ? (
            <TouchableOpacity
              onPress={() => selectedIds.size > 0 && setConfirmVisible(true)}
              style={styles.topBarBtn}
              disabled={selectedIds.size === 0}
            >
              <View
                style={[
                  styles.trashBtn,
                  selectedIds.size === 0 && { opacity: 0.3 },
                ]}
              >
                <Ionicons name="trash-outline" size={20} color="#cc0000" />
                {selectedIds.size > 0 && (
                  <View style={styles.trashBadge}>
                    <Text style={styles.trashBadgeText}>
                      {selectedIds.size}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.topBarBtn} onPress={() => {}}>
              <Ionicons name="add" size={26} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Dropdown */}
        {menuVisible && (
          <View style={styles.dropdownContainer}>
            <TouchableWithoutFeedback onPress={closeMenu}>
              <View style={styles.dropdownOverlay} />
            </TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.dropdown,
                {
                  opacity: dropdownOpacity,
                  transform: [{ translateY: dropdownY }],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setSelectMode(true);
                  closeMenu();
                }}
              >
                <Ionicons name="checkbox-outline" size={16} color="#fff" />
                <Text style={styles.dropdownText}>Select Games</Text>
              </TouchableOpacity>
              <View style={styles.dropdownDivider} />
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={markAllFinished}
              >
                <Ionicons
                  name="checkmark-done-outline"
                  size={16}
                  color="#55cc00"
                />
                <Text style={[styles.dropdownText, { color: "#55cc00" }]}>
                  Mark All Finished
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}

        {/* List */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {games.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              selectable={selectMode}
              selected={selectedIds.has(game.id)}
              onSelect={() => toggleSelect(game.id)}
              onTap={() => setTrackerGame(game)}
              onExport={() => setExportGame(game)}
            />
          ))}
        </ScrollView>

        <ConfirmDialog
          visible={confirmVisible}
          count={selectedIds.size}
          onConfirm={confirmDelete}
          onCancel={() => setConfirmVisible(false)}
        />
      </SafeAreaView>

      {/* Live tracker */}
      <LiveTrackerModal
        game={trackerGame}
        visible={!!trackerGame}
        onClose={() => setTrackerGame(null)}
        onFinish={handleTrackerFinish}
      />

      {/* Export sheet — NEW */}
      <GameExportSheet
        game={exportGame}
        visible={!!exportGame}
        onClose={() => setExportGame(null)}
      />
    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 100,
  },
  topBarBtn: { minWidth: 40, alignItems: "center" },
  pageTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  cancelText: { color: "#aaa", fontSize: 14, fontWeight: "600" },

  trashBtn: { alignItems: "center", justifyContent: "center" },
  trashBadge: {
    position: "absolute",
    top: -6,
    right: -8,
    backgroundColor: "#cc0000",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  trashBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },

  dropdownContainer: { ...StyleSheet.absoluteFillObject, zIndex: 200 },
  dropdownOverlay: { ...StyleSheet.absoluteFillObject },
  dropdown: {
    position: "absolute",
    top: 56,
    left: 16,
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    width: 210,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  dropdownDivider: { height: 1, backgroundColor: "#2a2a2a" },
  dropdownText: { color: "#fff", fontSize: 14, fontWeight: "600" },

  scrollContent: { paddingHorizontal: 16, gap: 12, paddingBottom: 40 },

  card: { backgroundColor: "#181818", borderRadius: 16, overflow: "hidden" },
  cardSelected: { borderWidth: 1.5, borderColor: "#0039a3" },
  cardLive: { borderWidth: 1, borderColor: "#55cc0022" },
  checkbox: { marginRight: 8 },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 5,
  },
  leagueText: { color: "#555", fontSize: 12, fontWeight: "600" },
  dotSep: { color: "#333", fontSize: 12 },
  locationText: { color: "#444", fontSize: 11, fontWeight: "500", flex: 1 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: { fontSize: 11, fontWeight: "700" },
  shareIconBtn: { paddingLeft: 8, paddingRight: 2, paddingVertical: 4 }, // NEW

  divider: { height: 1, backgroundColor: "#222" },

  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 8,
  },
  teamBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  teamBlock: { flex: 1, gap: 3 },
  teamName: { color: "#fff", fontSize: 12, fontWeight: "700" },
  captainRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  cBadge: {
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  cBadgeTxt: { fontSize: 9, fontWeight: "900" },
  captainName: { color: "#555", fontSize: 10, fontWeight: "500", flex: 1 },
  score: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    minWidth: 72,
    textAlign: "center",
  },

  mvpRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 8,
  },
  mvpLabel: { color: "#555", fontSize: 12, fontWeight: "600" },
  mvpName: { color: "#fff", fontSize: 12, fontWeight: "700", flex: 1 },
  mvpStat: { color: "#555", fontSize: 12 },

  liveCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 6,
  },
  liveCtaText: { color: "#55cc00", fontSize: 12, fontWeight: "600" },

  dialogOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  dialog: {
    backgroundColor: "#1e1e1e",
    borderRadius: 20,
    width: "100%",
    overflow: "hidden",
    alignItems: "center",
  },
  dialogIconWrap: {
    marginTop: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2a0a0a",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  dialogTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 6,
  },
  dialogSubtitle: { color: "#aaa", fontSize: 13, marginBottom: 20 },
  dialogDivider: { height: 1, backgroundColor: "#2a2a2a", width: "100%" },
  dialogActions: { flexDirection: "row", width: "100%" },
  dialogActionsDivider: { width: 1, backgroundColor: "#2a2a2a" },
  dialogCancel: { flex: 1, paddingVertical: 16, alignItems: "center" },
  dialogCancelText: { color: "#aaa", fontSize: 15, fontWeight: "600" },
  dialogConfirm: { flex: 1, paddingVertical: 16, alignItems: "center" },
  dialogConfirmText: { color: "#cc0000", fontSize: 15, fontWeight: "700" },

  livePulseDot: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#55cc00",
    opacity: 0.3,
  },
  liveSolidDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#55cc00",
  },
});
