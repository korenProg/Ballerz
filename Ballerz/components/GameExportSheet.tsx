import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Sharing from "expo-sharing";
import React, { useRef, useState } from "react";
import {
  Animated, Modal, ScrollView, Share, StyleSheet,
  Text, TouchableOpacity, TouchableWithoutFeedback, View,
} from "react-native";
import { captureRef } from "react-native-view-shot";
import { Game, ExportMode } from "../types";
import { T } from "../constants/theme";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildShareText(game: Game, mode: "result" | "preview" | "teamsheet"): string {
  if (mode === "result") {
    const winner = game.homeScore > game.awayScore ? game.homeTeam
      : game.awayScore > game.homeScore ? game.awayTeam : "Draw";
    return [
      `BALLERZ - ${game.league}`,
      `${game.homeTeam}  ${game.homeScore} - ${game.awayScore}  ${game.awayTeam}`,
      winner !== "Draw" ? `${winner} win!` : `Draw`,
      game.mvp.name !== "—" ? `MVP: ${game.mvp.name}` : "",
      game.location ?? "",
      `via Ballerz`,
    ].filter(Boolean).join("\n");
  }
  if (mode === "preview") {
    return [
      `TONIGHT'S MATCH`,
      `${game.homeTeam}  vs  ${game.awayTeam}`,
      game.location ?? "",
      `via Ballerz`,
    ].filter(Boolean).join("\n");
  }
  const homeList = (game.homePlayers || []).map((p) => `  ${p.name.padEnd(20)} ${p.position}`).join("\n");
  const awayList = (game.awayPlayers || []).map((p) => `  ${p.name.padEnd(20)} ${p.position}`).join("\n");
  return [`TEAM SHEET`, `${game.homeTeam} vs ${game.awayTeam}`,
    game.homeTeam.toUpperCase(), homeList,
    game.awayTeam.toUpperCase(), awayList,
    `via Ballerz`].filter(Boolean).join("\n");
}

// ─── Export Cards ─────────────────────────────────────────────────────────────

const EXP_W = 320;

function TeamColorBar({ homeColor, awayColor }: { homeColor: string; awayColor: string }) {
  return (
    <View style={{ flexDirection: "row", height: 3 }}>
      <View style={{ flex: 1, backgroundColor: homeColor }} />
      <View style={{ flex: 1, backgroundColor: awayColor }} />
    </View>
  );
}

function ResultExportCard({ game, cardRef }: { game: Game; cardRef: React.RefObject<View | null> }) {
  const isDraw = game.homeScore === game.awayScore;
  const winnerColor = game.homeScore > game.awayScore ? game.homeColor
    : game.awayScore > game.homeScore ? game.awayColor : "#666";
  return (
    <View ref={cardRef} collapsable={false} style={ec.wrap}>
      <TeamColorBar homeColor={game.homeColor} awayColor={game.awayColor} />
      <View style={ec.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <Ionicons name="football" size={11} color="#444" />
          <Text style={ec.headerLeague}>{game.league}</Text>
        </View>
        <View style={ec.ftBadge}><Text style={ec.ftText}>FULL TIME</Text></View>
      </View>
      <View style={ec.scoreRow}>
        <View style={ec.teamCol}>
          <View style={[ec.shield, { borderColor: game.homeColor, backgroundColor: game.homeColor + "1a" }]}>
            <Ionicons name="shield" size={22} color={game.homeColor} />
          </View>
          <Text style={ec.teamName} numberOfLines={2}>{game.homeTeam}</Text>
        </View>
        <View style={ec.scoreBlock}>
          <Text style={ec.scoreText}>{game.homeScore}–{game.awayScore}</Text>
          {!isDraw ? (
            <View style={[ec.resultPill, { borderColor: winnerColor + "40", backgroundColor: winnerColor + "14" }]}>
              <Text style={[ec.resultPillTxt, { color: winnerColor }]}>
                {game.homeScore > game.awayScore ? game.homeTeam : game.awayTeam} win
              </Text>
            </View>
          ) : (
            <View style={[ec.resultPill, { borderColor: "#44444466", backgroundColor: "#1a1a1a" }]}>
              <Text style={[ec.resultPillTxt, { color: "#888" }]}>Draw</Text>
            </View>
          )}
        </View>
        <View style={[ec.teamCol, { alignItems: "flex-end" }]}>
          <View style={[ec.shield, { borderColor: game.awayColor, backgroundColor: game.awayColor + "1a" }]}>
            <Ionicons name="shield" size={22} color={game.awayColor} />
          </View>
          <Text style={[ec.teamName, { textAlign: "right" }]} numberOfLines={2}>{game.awayTeam}</Text>
        </View>
      </View>
      {game.location && (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, marginTop: -6, marginBottom: 12 }}>
          <Ionicons name="location-outline" size={10} color="#444" />
          <Text style={{ color: "#444", fontSize: 10, fontWeight: "500" }}>{game.location}</Text>
        </View>
      )}
      {game.mvp.name !== "—" && (
        <>
          <View style={ec.divider} />
          <View style={ec.mvpRow}>
            <Ionicons name="star" size={13} color="#f5c518" />
            <Text style={ec.mvpLabel}>MVP</Text>
            <Text style={ec.mvpName}>{game.mvp.name}</Text>
          </View>
        </>
      )}
      <View style={[ec.divider, { marginTop: 4 }]} />
      <Text style={ec.watermark}>VIA BALLERZ</Text>
    </View>
  );
}

function PreviewExportCard({ game, cardRef }: { game: Game; cardRef: React.RefObject<View | null> }) {
  return (
    <View ref={cardRef} collapsable={false} style={ec.wrap}>
      <TeamColorBar homeColor={game.homeColor} awayColor={game.awayColor} />
      <View style={{ alignItems: "center", paddingTop: 16, paddingBottom: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <Ionicons name="football-outline" size={11} color="#444" />
          <Text style={{ color: "#555", fontSize: 11, fontWeight: "600" }}>{game.league}</Text>
        </View>
      </View>
      <View style={[ec.scoreRow, { paddingVertical: 14 }]}>
        <View style={ec.teamCol}>
          <View style={[ec.shieldLg, { borderColor: game.homeColor, backgroundColor: game.homeColor + "1a" }]}>
            <Ionicons name="shield" size={28} color={game.homeColor} />
          </View>
          <Text style={ec.teamName} numberOfLines={2}>{game.homeTeam}</Text>
        </View>
        <Text style={ec.vsText}>vs</Text>
        <View style={[ec.teamCol, { alignItems: "flex-end" }]}>
          <View style={[ec.shieldLg, { borderColor: game.awayColor, backgroundColor: game.awayColor + "1a" }]}>
            <Ionicons name="shield" size={28} color={game.awayColor} />
          </View>
          <Text style={[ec.teamName, { textAlign: "right" }]} numberOfLines={2}>{game.awayTeam}</Text>
        </View>
      </View>
      {game.location && (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, marginBottom: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#1a1a1a", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 }}>
            <Ionicons name="location-outline" size={11} color="#555" />
            <Text style={{ color: "#666", fontSize: 11, fontWeight: "600" }}>{game.location}</Text>
          </View>
        </View>
      )}
      <View style={ec.divider} />
      <Text style={ec.watermark}>VIA BALLERZ</Text>
    </View>
  );
}

function TeamSheetExportCard({ game, cardRef }: { game: Game; cardRef: React.RefObject<View | null> }) {
  const home = game.homePlayers || [];
  const away = game.awayPlayers || [];
  const ini = (name: string) => name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <View ref={cardRef} collapsable={false} style={ec.wrap}>
      <TeamColorBar homeColor={game.homeColor} awayColor={game.awayColor} />
      <View style={{ alignItems: "center", paddingTop: 14, paddingBottom: 12 }}>
        <Text style={{ color: "#444", fontSize: 9, fontWeight: "800", letterSpacing: 2.5, marginBottom: 5 }}>TEAM SHEET</Text>
        <Text style={{ color: "#fff", fontSize: 13, fontWeight: "800" }}>{game.homeTeam} vs {game.awayTeam}</Text>
      </View>
      <View style={ec.divider} />
      <View style={{ flexDirection: "row", paddingHorizontal: 12, paddingVertical: 14, gap: 8 }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 10 }}>
            <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: game.homeColor }} />
            <Text style={{ color: game.homeColor, fontSize: 10, fontWeight: "800", flex: 1 }} numberOfLines={1}>{game.homeTeam}</Text>
          </View>
          {home.map((p) => (
            <View key={p.id} style={ec.playerRow}>
              <View style={[ec.miniAvatar, { borderColor: game.homeColor + "44" }]}>
                <Text style={[ec.miniAvatarTxt, { color: game.homeColor }]}>{ini(p.name)}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={ec.playerRowName} numberOfLines={1}>{p.name.split(" ").pop()}</Text>
                <Text style={ec.playerRowPos}>{p.position}</Text>
              </View>
            </View>
          ))}
        </View>
        <View style={{ width: 1, backgroundColor: "#1e1e1e", marginTop: 30 }} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 5, marginBottom: 10 }}>
            <Text style={{ color: game.awayColor, fontSize: 10, fontWeight: "800" }} numberOfLines={1}>{game.awayTeam}</Text>
            <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: game.awayColor }} />
          </View>
          {away.map((p) => (
            <View key={p.id} style={[ec.playerRow, { flexDirection: "row-reverse" }]}>
              <View style={[ec.miniAvatar, { borderColor: game.awayColor + "44" }]}>
                <Text style={[ec.miniAvatarTxt, { color: game.awayColor }]}>{ini(p.name)}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0, alignItems: "flex-end" }}>
                <Text style={ec.playerRowName} numberOfLines={1}>{p.name.split(" ").pop()}</Text>
                <Text style={ec.playerRowPos}>{p.position}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
      <View style={ec.divider} />
      <Text style={ec.watermark}>VIA BALLERZ</Text>
    </View>
  );
}

const ec = StyleSheet.create({
  wrap: { width: EXP_W, backgroundColor: "#0c0c0c", borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: "#1e1e1e" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 10 },
  headerLeague: { color: "#555", fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  ftBadge: { backgroundColor: "#252525", borderRadius: 5, paddingHorizontal: 8, paddingVertical: 3 },
  ftText: { color: "#aaa", fontSize: 9, fontWeight: "800", letterSpacing: 1.5 },
  scoreRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 18, gap: 6 },
  teamCol: { flex: 1, alignItems: "center", gap: 7 },
  shield: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  shieldLg: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  teamName: { color: "#fff", fontSize: 11, fontWeight: "800", textAlign: "center" },
  scoreBlock: { alignItems: "center", gap: 7, paddingHorizontal: 4 },
  scoreText: { color: "#fff", fontSize: 40, fontWeight: "900", letterSpacing: -1 },
  resultPill: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 3 },
  resultPillTxt: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  vsText: { color: "#333", fontSize: 22, fontWeight: "200", paddingHorizontal: 4 },
  divider: { height: 1, backgroundColor: "#161616" },
  mvpRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 11, gap: 8 },
  mvpLabel: { color: "#555", fontSize: 10, fontWeight: "700" },
  mvpName: { color: "#fff", fontSize: 11, fontWeight: "800", flex: 1 },
  watermark: { textAlign: "center", color: "#222", fontSize: 9, fontWeight: "800", letterSpacing: 2, paddingVertical: 9 },
  playerRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 7 },
  miniAvatar: { width: 26, height: 26, borderRadius: 13, backgroundColor: "#111", borderWidth: 1, alignItems: "center", justifyContent: "center" },
  miniAvatarTxt: { fontSize: 8, fontWeight: "800" },
  playerRowName: { color: "#ddd", fontSize: 11, fontWeight: "700" },
  playerRowPos: { color: "#3a3a3a", fontSize: 9, marginTop: 1 },
});

// ─── Sheet ────────────────────────────────────────────────────────────────────

export function GameExportSheet({ game, visible, onClose }: { game: Game | null; visible: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<ExportMode>("options");
  const [sharing, setSharing] = useState(false);
  const sheetY = useRef(new Animated.Value(80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const cardRef = useRef<View | null>(null);

  React.useEffect(() => {
    if (visible) {
      setMode("options");
      sheetY.setValue(80); opacity.setValue(0);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(sheetY, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 220 }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(sheetY, { toValue: 60, duration: 150, useNativeDriver: true }),
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
      await Share.share({ message: buildShareText(game, mode as "result" | "preview" | "teamsheet") });
    } finally { setSharing(false); }
  };

  if (!game) return null;
  const hasPlayers = !!(game.homePlayers?.length && game.awayPlayers?.length);
  const OPTION_CONFIGS = [
    { key: "result" as const, show: game.status === "FT", icon: "trophy-outline" as const, iconBg: "#1a0800", iconClr: "#cc4400", title: "Game Result", sub: "Final score + MVP" },
    { key: "preview" as const, show: true, icon: "radio-outline" as const, iconBg: "#00091a", iconClr: "#2266ee", title: "Match Preview", sub: "Announce the upcoming matchup" },
    { key: "teamsheet" as const, show: hasPlayers, icon: "people-outline" as const, iconBg: "#001510", iconClr: "#00aa66", title: "Team Sheet", sub: "Tonight's lineups" },
  ];

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={handleClose}>
      <BlurView intensity={45} tint="dark" style={sh.overlay}>
        <TouchableWithoutFeedback onPress={handleClose}><View style={StyleSheet.absoluteFill} /></TouchableWithoutFeedback>
        <Animated.View style={[sh.sheet, { opacity, transform: [{ translateY: sheetY }] }]}>
          <View style={sh.handle} />
          {mode === "options" ? (
            <>
              <Text style={sh.title}>Share</Text>
              <Text style={sh.sub}>{game.homeTeam} vs {game.awayTeam}</Text>
              <View style={sh.divider} />
              {OPTION_CONFIGS.filter((o) => o.show).map((opt, i, arr) => (
                <React.Fragment key={opt.key}>
                  <TouchableOpacity style={sh.option} onPress={() => setMode(opt.key)} activeOpacity={0.7}>
                    <View style={[sh.optIcon, { backgroundColor: opt.iconBg }]}>
                      <Ionicons name={opt.icon} size={20} color={opt.iconClr} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={sh.optTitle}>{opt.title}</Text>
                      <Text style={sh.optSub}>{opt.sub}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#2a2a2a" />
                  </TouchableOpacity>
                  {i < arr.length - 1 && <View style={sh.optDivider} />}
                </React.Fragment>
              ))}
              <View style={sh.divider} />
              <TouchableOpacity style={sh.cancelBtn} onPress={handleClose}>
                <Text style={sh.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={sh.previewHeader}>
                <TouchableOpacity style={sh.backBtn} onPress={() => setMode("options")}>
                  <Ionicons name="chevron-back" size={17} color="#aaa" />
                  <Text style={sh.backTxt}>Back</Text>
                </TouchableOpacity>
                <Text style={sh.previewTitle}>
                  {mode === "result" ? "Game Result" : mode === "preview" ? "Match Preview" : "Team Sheet"}
                </Text>
                <View style={{ width: 60 }} />
              </View>
              <ScrollView contentContainerStyle={{ alignItems: "center", paddingHorizontal: 20, paddingVertical: 16 }} showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                {mode === "result" && <ResultExportCard game={game} cardRef={cardRef} />}
                {mode === "preview" && <PreviewExportCard game={game} cardRef={cardRef} />}
                {mode === "teamsheet" && <TeamSheetExportCard game={game} cardRef={cardRef} />}
              </ScrollView>
              <View style={sh.divider} />
              <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 }}>
                <TouchableOpacity style={[sh.shareBtn, sharing && { opacity: 0.55 }]} onPress={handleShare} disabled={sharing} activeOpacity={0.85}>
                  <Ionicons name="share-social-outline" size={18} color="#fff" />
                  <Text style={sh.shareBtnTxt}>{sharing ? "Sharing…" : "Share Image"}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </Animated.View>
      </BlurView>
    </Modal>
  );
}

const sh = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  sheet: { backgroundColor: "#161616", borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingTop: 10, paddingBottom: 34, overflow: "hidden" },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#2a2a2a", alignSelf: "center", marginBottom: 14 },
  title: { color: "#fff", fontSize: 17, fontWeight: "800", textAlign: "center", marginBottom: 3 },
  sub: { color: "#555", fontSize: 13, textAlign: "center", marginBottom: 14 },
  divider: { height: 1, backgroundColor: "#1e1e1e" },
  option: { flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 15, gap: 14 },
  optIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  optTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
  optSub: { color: "#444", fontSize: 12, marginTop: 2 },
  optDivider: { height: 1, backgroundColor: "#1e1e1e", marginHorizontal: 18 },
  cancelBtn: { paddingVertical: 16, alignItems: "center" },
  cancelTxt: { color: "#555", fontSize: 15, fontWeight: "600" },
  previewHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 3, width: 60 },
  backTxt: { color: "#aaa", fontSize: 14, fontWeight: "600" },
  previewTitle: { color: "#fff", fontSize: 15, fontWeight: "800" },
  shareBtn: { backgroundColor: T.accent, borderRadius: 14, paddingVertical: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9 },
  shareBtnTxt: { color: "#000", fontSize: 16, fontWeight: "800" },
});
