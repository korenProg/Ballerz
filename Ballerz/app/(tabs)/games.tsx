import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Sharing from "expo-sharing";
import React, { useRef, useState } from "react";
import {
  Animated, Modal, ScrollView, Share, StyleSheet, Text,
  TouchableOpacity, TouchableWithoutFeedback, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";
import { useRouter } from "expo-router";
import { GamePlayer, Game, ExportMode } from "../../types";
import { useStore } from "../../store";
import { T } from "../../constants/theme";

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
      game.location ? `${game.location}` : "",
      `via Ballerz`,
    ].filter(Boolean).join("\n");
  }
  if (mode === "preview") {
    return [
      `TONIGHT'S MATCH`,
      `${game.homeTeam}  vs  ${game.awayTeam}`,
      game.location ? `${game.location}` : "",
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

// ─── Filter Tabs ──────────────────────────────────────────────────────────────

type FilterKey = "All" | "Upcoming" | "FT";
const FILTERS: FilterKey[] = ["All", "Upcoming", "FT"];

function FilterTabs({ active, onChange, counts }: {
  active: FilterKey; onChange: (f: FilterKey) => void; counts: Record<FilterKey, number>;
}) {
  return (
    <View style={ft.bar}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ft.content}>
        {FILTERS.map((f) => {
          const isActive = f === active;
          return (
            <TouchableOpacity key={f} onPress={() => onChange(f)} activeOpacity={0.75}
              style={[ft.pill, isActive && ft.pillActive]}>
              <Text style={[ft.label, isActive && ft.labelActive]}>{f}</Text>
              {counts[f] > 0 && (
                <View style={[ft.badge, isActive && ft.badgeActive]}>
                  <Text style={[ft.badgeTxt, isActive && ft.badgeTxtActive]}>{counts[f]}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const ft = StyleSheet.create({
  bar: { height: 48, justifyContent: "center" },
  content: { paddingHorizontal: 16, gap: 8, alignItems: "center" },
  pill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border },
  pillActive: { backgroundColor: T.accent, borderColor: T.accent },
  label: { color: T.textMuted, fontSize: 13, fontWeight: "700" },
  labelActive: { color: "#000" },
  badge: { backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 8, minWidth: 18, height: 18, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  badgeActive: { backgroundColor: "rgba(0,0,0,0.15)" },
  badgeTxt: { color: T.textMuted, fontSize: 10, fontWeight: "800" },
  badgeTxtActive: { color: "#000" },
});

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
    <View ref={cardRef} collapsable={false} style={expCard.wrap}>
      <TeamColorBar homeColor={game.homeColor} awayColor={game.awayColor} />
      <View style={expCard.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <Ionicons name="football" size={11} color="#444" />
          <Text style={expCard.headerLeague}>{game.league}</Text>
        </View>
        <View style={expCard.ftBadge}><Text style={expCard.ftText}>FULL TIME</Text></View>
      </View>
      <View style={expCard.scoreRow}>
        <View style={expCard.teamCol}>
          <View style={[expCard.shield, { borderColor: game.homeColor, backgroundColor: game.homeColor + "1a" }]}>
            <Ionicons name="shield" size={22} color={game.homeColor} />
          </View>
          <Text style={expCard.teamName} numberOfLines={2}>{game.homeTeam}</Text>
        </View>
        <View style={expCard.scoreBlock}>
          <Text style={expCard.scoreText}>{game.homeScore}–{game.awayScore}</Text>
          {!isDraw ? (
            <View style={[expCard.resultPill, { borderColor: winnerColor + "40", backgroundColor: winnerColor + "14" }]}>
              <Text style={[expCard.resultPillTxt, { color: winnerColor }]}>
                {game.homeScore > game.awayScore ? game.homeTeam : game.awayTeam} win
              </Text>
            </View>
          ) : (
            <View style={[expCard.resultPill, { borderColor: "#44444466", backgroundColor: "#1a1a1a" }]}>
              <Text style={[expCard.resultPillTxt, { color: "#888" }]}>Draw</Text>
            </View>
          )}
        </View>
        <View style={[expCard.teamCol, { alignItems: "flex-end" }]}>
          <View style={[expCard.shield, { borderColor: game.awayColor, backgroundColor: game.awayColor + "1a" }]}>
            <Ionicons name="shield" size={22} color={game.awayColor} />
          </View>
          <Text style={[expCard.teamName, { textAlign: "right" }]} numberOfLines={2}>{game.awayTeam}</Text>
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
          <View style={expCard.divider} />
          <View style={expCard.mvpRow}>
            <Ionicons name="star" size={13} color="#f5c518" />
            <Text style={expCard.mvpLabel}>MVP</Text>
            <Text style={expCard.mvpName}>{game.mvp.name}</Text>
          </View>
        </>
      )}
      <View style={[expCard.divider, { marginTop: 4 }]} />
      <Text style={expCard.watermark}>VIA BALLERZ</Text>
    </View>
  );
}

function PreviewExportCard({ game, cardRef }: { game: Game; cardRef: React.RefObject<View | null> }) {
  return (
    <View ref={cardRef} collapsable={false} style={expCard.wrap}>
      <TeamColorBar homeColor={game.homeColor} awayColor={game.awayColor} />
      <View style={{ alignItems: "center", paddingTop: 16, paddingBottom: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <Ionicons name="football-outline" size={11} color="#444" />
          <Text style={{ color: "#555", fontSize: 11, fontWeight: "600" }}>{game.league}</Text>
        </View>
      </View>
      <View style={[expCard.scoreRow, { paddingVertical: 14 }]}>
        <View style={expCard.teamCol}>
          <View style={[expCard.shieldLg, { borderColor: game.homeColor, backgroundColor: game.homeColor + "1a" }]}>
            <Ionicons name="shield" size={28} color={game.homeColor} />
          </View>
          <Text style={expCard.teamName} numberOfLines={2}>{game.homeTeam}</Text>
        </View>
        <Text style={expCard.vsText}>vs</Text>
        <View style={[expCard.teamCol, { alignItems: "flex-end" }]}>
          <View style={[expCard.shieldLg, { borderColor: game.awayColor, backgroundColor: game.awayColor + "1a" }]}>
            <Ionicons name="shield" size={28} color={game.awayColor} />
          </View>
          <Text style={[expCard.teamName, { textAlign: "right" }]} numberOfLines={2}>{game.awayTeam}</Text>
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
      <View style={expCard.divider} />
      <Text style={expCard.watermark}>VIA BALLERZ</Text>
    </View>
  );
}

function TeamSheetExportCard({ game, cardRef }: { game: Game; cardRef: React.RefObject<View | null> }) {
  const home = game.homePlayers || [];
  const away = game.awayPlayers || [];
  const initials = (name: string) => name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <View ref={cardRef} collapsable={false} style={expCard.wrap}>
      <TeamColorBar homeColor={game.homeColor} awayColor={game.awayColor} />
      <View style={{ alignItems: "center", paddingTop: 14, paddingBottom: 12 }}>
        <Text style={{ color: "#444", fontSize: 9, fontWeight: "800", letterSpacing: 2.5, marginBottom: 5 }}>TEAM SHEET</Text>
        <Text style={{ color: "#fff", fontSize: 13, fontWeight: "800" }}>{game.homeTeam} vs {game.awayTeam}</Text>
      </View>
      <View style={expCard.divider} />
      <View style={{ flexDirection: "row", paddingHorizontal: 12, paddingVertical: 14, gap: 8 }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 10 }}>
            <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: game.homeColor }} />
            <Text style={{ color: game.homeColor, fontSize: 10, fontWeight: "800", flex: 1 }} numberOfLines={1}>{game.homeTeam}</Text>
          </View>
          {home.map((p) => (
            <View key={p.id} style={expCard.playerRow}>
              <View style={[expCard.miniAvatar, { borderColor: game.homeColor + "44" }]}>
                <Text style={[expCard.miniAvatarTxt, { color: game.homeColor }]}>{initials(p.name)}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={expCard.playerRowName} numberOfLines={1}>{p.name.split(" ").pop()}</Text>
                <Text style={expCard.playerRowPos}>{p.position}</Text>
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
            <View key={p.id} style={[expCard.playerRow, { flexDirection: "row-reverse" }]}>
              <View style={[expCard.miniAvatar, { borderColor: game.awayColor + "44" }]}>
                <Text style={[expCard.miniAvatarTxt, { color: game.awayColor }]}>{initials(p.name)}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0, alignItems: "flex-end" }}>
                <Text style={expCard.playerRowName} numberOfLines={1}>{p.name.split(" ").pop()}</Text>
                <Text style={expCard.playerRowPos}>{p.position}</Text>
              </View>
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

// ─── Game Export Sheet ────────────────────────────────────────────────────────

function GameExportSheet({ game, visible, onClose }: { game: Game | null; visible: boolean; onClose: () => void }) {
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
      <BlurView intensity={45} tint="dark" style={exp.overlay}>
        <TouchableWithoutFeedback onPress={handleClose}><View style={StyleSheet.absoluteFill} /></TouchableWithoutFeedback>
        <Animated.View style={[exp.sheet, { opacity, transform: [{ translateY: sheetY }] }]}>
          <View style={exp.handle} />
          {mode === "options" ? (
            <>
              <Text style={exp.title}>Share</Text>
              <Text style={exp.sub}>{game.homeTeam} vs {game.awayTeam}</Text>
              <View style={exp.divider} />
              {OPTION_CONFIGS.filter((o) => o.show).map((opt, i, arr) => (
                <React.Fragment key={opt.key}>
                  <TouchableOpacity style={exp.option} onPress={() => setMode(opt.key)} activeOpacity={0.7}>
                    <View style={[exp.optIcon, { backgroundColor: opt.iconBg }]}>
                      <Ionicons name={opt.icon} size={20} color={opt.iconClr} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={exp.optTitle}>{opt.title}</Text>
                      <Text style={exp.optSub}>{opt.sub}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#2a2a2a" />
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
            <>
              <View style={exp.previewHeader}>
                <TouchableOpacity style={exp.backBtn} onPress={() => setMode("options")}>
                  <Ionicons name="chevron-back" size={17} color="#aaa" />
                  <Text style={exp.backTxt}>Back</Text>
                </TouchableOpacity>
                <Text style={exp.previewTitle}>
                  {mode === "result" ? "Game Result" : mode === "preview" ? "Match Preview" : "Team Sheet"}
                </Text>
                <View style={{ width: 60 }} />
              </View>
              <ScrollView contentContainerStyle={{ alignItems: "center", paddingHorizontal: 20, paddingVertical: 16 }} showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                {mode === "result" && <ResultExportCard game={game} cardRef={cardRef} />}
                {mode === "preview" && <PreviewExportCard game={game} cardRef={cardRef} />}
                {mode === "teamsheet" && <TeamSheetExportCard game={game} cardRef={cardRef} />}
              </ScrollView>
              <View style={exp.divider} />
              <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 }}>
                <TouchableOpacity style={[exp.shareBtn, sharing && { opacity: 0.55 }]} onPress={handleShare} disabled={sharing} activeOpacity={0.85}>
                  <Ionicons name="share-social-outline" size={18} color="#fff" />
                  <Text style={exp.shareBtnTxt}>{sharing ? "Sharing…" : "Share Image"}</Text>
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

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({ visible, count, onConfirm, onCancel }: { visible: boolean; count: number; onConfirm: () => void; onCancel: () => void }) {
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    if (visible) {
      scale.setValue(0.9); opacity.setValue(0);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 200 }),
      ]).start();
    } else { scale.setValue(0.9); opacity.setValue(0); }
  }, [visible]);
  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onCancel}>
      <BlurView intensity={30} tint="dark" style={styles.dialogOverlay}>
        <Animated.View style={[styles.dialog, { opacity, transform: [{ scale }] }]}>
          <View style={styles.dialogIconWrap}>
            <Ionicons name="trash-outline" size={28} color="#cc0000" />
          </View>
          <Text style={styles.dialogTitle}>Delete {count} {count === 1 ? "Game" : "Games"}?</Text>
          <Text style={styles.dialogSubtitle}>This action cannot be undone.</Text>
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

// ─── Game Card ────────────────────────────────────────────────────────────────

function GameCard({ game, selectable, selected, onSelect, onTap, onExport }: {
  game: Game; selectable: boolean; selected: boolean;
  onSelect: () => void; onTap: () => void; onExport: () => void;
}) {
  const isCompleted = game.status === "FT";
  const isPending = game.status !== "FT";

  return (
    <TouchableOpacity
      activeOpacity={selectable || isCompleted ? 0.7 : 1}
      onPress={selectable ? onSelect : isCompleted ? onTap : undefined}
      style={[styles.card, selected && styles.cardSelected]}
    >
      <View style={styles.cardHeader}>
        {selectable && (
          <View style={styles.checkbox}>
            {selected
              ? <Ionicons name="checkmark-circle" size={20} color={T.accent} />
              : <Ionicons name="ellipse-outline" size={20} color="#333" />}
          </View>
        )}
        <View style={styles.cardHeaderMeta}>
          <Ionicons name="football-outline" size={12} color={T.textMuted} />
          <Text style={styles.leagueText}>{game.league}</Text>
          {game.location && (
            <>
              <Text style={styles.dotSep}>·</Text>
              <Text style={styles.locationText} numberOfLines={1}>{game.location}</Text>
            </>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: isCompleted ? "rgba(255,255,255,0.06)" : T.accentMuted }]}>
          <Text style={[styles.statusText, { color: isCompleted ? T.textMuted : T.accent }]}>
            {isCompleted ? "FT" : "UPCOMING"}
          </Text>
        </View>
        {!selectable && (
          <TouchableOpacity onPress={onExport} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={styles.shareIconBtn}>
            <Ionicons name="share-outline" size={15} color={T.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.divider} />

      <View style={styles.scoreRow}>
        <View style={styles.teamBlock}>
          <View style={styles.teamNameRow}>
            <View style={[styles.teamCircle, { borderColor: game.homeColor, backgroundColor: game.homeColor + "1a" }]}>
              <Ionicons name="shield" size={16} color={game.homeColor} />
            </View>
            <Text style={styles.teamName} numberOfLines={2}>{game.homeTeam}</Text>
          </View>
        </View>

        <View style={styles.scoreCenter}>
          {isPending ? (
            <Text style={styles.vsText}>VS</Text>
          ) : (
            <>
              <Text style={styles.scoreNum}>{game.homeScore}</Text>
              <Text style={styles.scoreSep}>–</Text>
              <Text style={styles.scoreNum}>{game.awayScore}</Text>
            </>
          )}
        </View>

        <View style={[styles.teamBlock, { alignItems: "flex-end" }]}>
          <View style={[styles.teamNameRow, { flexDirection: "row-reverse" }]}>
            <View style={[styles.teamCircle, { borderColor: game.awayColor, backgroundColor: game.awayColor + "1a" }]}>
              <Ionicons name="shield" size={16} color={game.awayColor} />
            </View>
            <Text style={[styles.teamName, { textAlign: "right" }]} numberOfLines={2}>{game.awayTeam}</Text>
          </View>
        </View>
      </View>

      {isCompleted && (
        <>
          <View style={styles.divider} />
          <View style={styles.mvpRow}>
            <Ionicons name="star" size={12} color={T.accent} />
            <Text style={styles.mvpLabel}>MVP</Text>
            <Text style={styles.mvpName}>{game.mvp.name}</Text>
          </View>
        </>
      )}

      {isPending && game.date && (
        <>
          <View style={styles.divider} />
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={11} color={T.textMuted} />
            <Text style={styles.dateTxt}>{game.date}</Text>
          </View>
        </>
      )}

      {isCompleted && !selectable && (
        <>
          <View style={styles.divider} />
          <View style={styles.recordCta}>
            <Ionicons name="create-outline" size={12} color={T.accent} />
            <Text style={styles.recordCtaText}>Edit result</Text>
            <Ionicons name="chevron-forward" size={12} color={T.accent} />
          </View>
        </>
      )}
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function GamesScreen() {
  const router = useRouter();
  const { games, deleteGame } = useStore();
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [exportGame, setExportGame] = useState<Game | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("All");
  const listRef = useRef<ScrollView>(null);

  const filterCounts: Record<FilterKey, number> = {
    All: games.length,
    Upcoming: games.filter((g) => g.status !== "FT").length,
    FT: games.filter((g) => g.status === "FT").length,
  };

  const visibleGames = games.filter((g) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Upcoming") return g.status !== "FT";
    if (activeFilter === "FT") return g.status === "FT";
    return true;
  });

  const dropdownOpacity = useRef(new Animated.Value(0)).current;
  const dropdownY = useRef(new Animated.Value(-8)).current;

  const openMenu = () => {
    dropdownOpacity.setValue(0); dropdownY.setValue(-8);
    setMenuVisible(true);
    Animated.parallel([
      Animated.timing(dropdownOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(dropdownY, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();
  };
  const closeMenu = () => {
    Animated.parallel([
      Animated.timing(dropdownOpacity, { toValue: 0, duration: 140, useNativeDriver: true }),
      Animated.timing(dropdownY, { toValue: -8, duration: 140, useNativeDriver: true }),
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
    setSelectedIds(new Set()); setSelectMode(false); setConfirmVisible(false);
  };
  const cancelSelect = () => { setSelectMode(false); setSelectedIds(new Set()); };

  const handleFilterChange = (f: FilterKey) => {
    setActiveFilter(f);
    listRef.current?.scrollTo({ y: 0, animated: false });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.topBar}>
        {selectMode ? (
          <TouchableOpacity onPress={cancelSelect} style={styles.topBarBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={openMenu} style={styles.topBarBtn}>
            <Ionicons name="ellipsis-horizontal" size={22} color={T.textMuted} />
          </TouchableOpacity>
        )}
        <Text style={styles.pageTitle}>Games</Text>
        {selectMode ? (
          <TouchableOpacity onPress={() => selectedIds.size > 0 && setConfirmVisible(true)} style={styles.topBarBtn} disabled={selectedIds.size === 0}>
            <View style={[styles.trashBtn, selectedIds.size === 0 && { opacity: 0.3 }]}>
              <Ionicons name="trash-outline" size={20} color="#cc0000" />
              {selectedIds.size > 0 && (
                <View style={styles.trashBadge}><Text style={styles.trashBadgeText}>{selectedIds.size}</Text></View>
              )}
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.topBarBtn} onPress={() => router.push("/create-game")}>
            <Ionicons name="add" size={26} color={T.textPrimary} />
          </TouchableOpacity>
        )}
      </View>

      {menuVisible && (
        <View style={styles.dropdownContainer}>
          <TouchableWithoutFeedback onPress={closeMenu}><View style={styles.dropdownOverlay} /></TouchableWithoutFeedback>
          <Animated.View style={[styles.dropdown, { opacity: dropdownOpacity, transform: [{ translateY: dropdownY }] }]}>
            <TouchableOpacity style={styles.dropdownItem} onPress={() => { setSelectMode(true); closeMenu(); }}>
              <Ionicons name="checkbox-outline" size={16} color={T.textPrimary} />
              <Text style={styles.dropdownText}>Select Games</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}

      {!selectMode && <FilterTabs active={activeFilter} onChange={handleFilterChange} counts={filterCounts} />}

      <ScrollView ref={listRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {visibleGames.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="football-outline" size={36} color={T.textMuted} />
            <Text style={styles.emptyText}>No games here</Text>
          </View>
        ) : (
          visibleGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              selectable={selectMode}
              selected={selectedIds.has(game.id)}
              onSelect={() => toggleSelect(game.id)}
              onTap={() => router.push(`/record-result?gameId=${game.id}`)}
              onExport={() => setExportGame(game)}
            />
          ))
        )}
      </ScrollView>

      <ConfirmDialog visible={confirmVisible} count={selectedIds.size} onConfirm={confirmDelete} onCancel={() => setConfirmVisible(false)} />
      <GameExportSheet game={exportGame} visible={!!exportGame} onClose={() => setExportGame(null)} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, zIndex: 100 },
  topBarBtn: { minWidth: 40, alignItems: "center" },
  pageTitle: { color: T.textPrimary, fontSize: 18, fontWeight: "800" },
  cancelText: { color: T.textMuted, fontSize: 14, fontWeight: "600" },
  trashBtn: { alignItems: "center", justifyContent: "center" },
  trashBadge: { position: "absolute", top: -6, right: -8, backgroundColor: "#cc0000", borderRadius: 8, minWidth: 16, height: 16, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  trashBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  dropdownContainer: { ...StyleSheet.absoluteFillObject, zIndex: 200 },
  dropdownOverlay: { ...StyleSheet.absoluteFillObject },
  dropdown: { position: "absolute", top: 56, left: 16, backgroundColor: "#161616", borderRadius: 14, width: 210, overflow: "hidden", borderWidth: 1, borderColor: "#242424" },
  dropdownItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 14 },
  dropdownText: { color: T.textSecondary, fontSize: 14, fontWeight: "600" },
  scrollContent: { paddingHorizontal: 16, gap: 10, paddingBottom: 40 },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { color: T.textMuted, fontSize: 14, fontWeight: "600" },

  card: { backgroundColor: T.surface, borderRadius: T.radius.card, overflow: "hidden", borderWidth: 1, borderColor: T.border },
  cardSelected: { borderColor: T.accent, borderWidth: 1.5 },
  checkbox: { marginRight: 6 },
  cardHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 11, gap: 6 },
  cardHeaderMeta: { flexDirection: "row", alignItems: "center", gap: 5, flex: 1 },
  leagueText: { color: T.textMuted, fontSize: 11, fontWeight: "600" },
  dotSep: { color: T.textMuted, fontSize: 11 },
  locationText: { color: T.textMuted, fontSize: 11, fontWeight: "500", flex: 1 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: T.border },
  statusText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  shareIconBtn: { paddingLeft: 8, paddingRight: 2 },
  divider: { height: 1, backgroundColor: T.border },
  scoreRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 16, gap: 8 },
  teamBlock: { flex: 1, gap: 6 },
  teamNameRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  teamCircle: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  teamName: { color: T.textSecondary, fontSize: 12, fontWeight: "700", flexShrink: 1 },
  scoreCenter: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8 },
  scoreNum: { color: T.textPrimary, fontSize: T.scoreSize, fontWeight: "900" },
  scoreSep: { color: T.textMuted, fontSize: 22, fontWeight: "300" },
  vsText: { color: T.textMuted, fontSize: 16, fontWeight: "800", letterSpacing: 1.5, paddingHorizontal: 12 },
  mvpRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 11, gap: 7 },
  mvpLabel: { color: T.textMuted, fontSize: 11, fontWeight: "600" },
  mvpName: { color: T.textPrimary, fontSize: 12, fontWeight: "700", flex: 1 },
  dateRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, gap: 6 },
  dateTxt: { color: T.textMuted, fontSize: 11, fontWeight: "600" },
  recordCta: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 11, gap: 6 },
  recordCtaText: { color: T.accent, fontSize: 12, fontWeight: "600" },

  dialogOverlay: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  dialog: { backgroundColor: "#161616", borderRadius: 22, width: "100%", overflow: "hidden", alignItems: "center", borderWidth: 1, borderColor: "#242424" },
  dialogIconWrap: { marginTop: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: "#2a0a0a", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  dialogTitle: { color: T.textPrimary, fontSize: 17, fontWeight: "800", marginBottom: 6 },
  dialogSubtitle: { color: T.textSecondary, fontSize: 13, marginBottom: 20 },
  dialogDivider: { height: 1, backgroundColor: "#2a2a2a", width: "100%" },
  dialogActions: { flexDirection: "row", width: "100%" },
  dialogActionsDivider: { width: 1, backgroundColor: "#2a2a2a" },
  dialogCancel: { flex: 1, paddingVertical: 16, alignItems: "center" },
  dialogCancelText: { color: T.textSecondary, fontSize: 15, fontWeight: "600" },
  dialogConfirm: { flex: 1, paddingVertical: 16, alignItems: "center" },
  dialogConfirmText: { color: "#cc0000", fontSize: 15, fontWeight: "700" },
});
