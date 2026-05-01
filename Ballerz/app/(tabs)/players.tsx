import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Modal,
  TextInput,
  Share,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {Player} from '../../types'
import { useStore } from "../../store";
import { T } from "../../constants/theme";
import { TopBar } from "@/components/TopBar";

type SortMode = "ovr_desc" | "ovr_asc" | "goals" | "mvps";

// ─── OVR / Tier helpers ───────────────────────────────────────────────────────

function ovrTier(ovr: number): "gold" | "cheapgold" | "silver" | "bronze" {
  if (ovr >= 90) return "gold";
  if (ovr >= 80) return "cheapgold";
  if (ovr >= 70) return "silver";
  return "bronze";
}

const TIER_COLOR = {
  gold:      "#f5c518",
  cheapgold: "#c9a84c",
  silver:    "#b0b0b0",
  bronze:    "#cd7f32",
};
const TIER_BG = {
  gold:      "#2a1f00",
  cheapgold: "#1f1700",
  silver:    "#1a1a1a",
  bronze:    "#1a0f00",
};
const TIER_GRADIENT: Record<string, [string, string, string]> = {
  gold:      ["#3d2e00", "#1a1200", "#2a1f00"],
  cheapgold: ["#2e2200", "#141000", "#1f1700"],
  silver:    ["#2a2a2a", "#141414", "#1a1a1a"],
  bronze:    ["#2a1500", "#100800", "#1a0f00"],
};

function ovrColor(ovr: number) { return TIER_COLOR[ovrTier(ovr)]; }
function ovrBg(ovr: number)    { return TIER_BG[ovrTier(ovr)]; }
function attrColor(val: number) {
  if (val >= 80) return "#4cde80";
  if (val >= 65) return "#f5c518";
  return "#e05555";
}

// ─── FIFA Card constants ──────────────────────────────────────────────────────

const CARD_W = 268;
const CARD_H = 370;

const ATTRS: { key: keyof Pick<Player, "pac"|"sho"|"pas"|"dri"|"def"|"phy">; label: string }[] = [
  { key: "pac", label: "PAC" }, { key: "sho", label: "SHO" },
  { key: "pas", label: "PAS" }, { key: "dri", label: "DRI" },
  { key: "def", label: "DEF" }, { key: "phy", label: "PHY" },
];

// ─── Form Badge ───────────────────────────────────────────────────────────────

function FormBadge({ form }: { form: Player["form"] }) {
  if (form === "neutral") return null;
  return (
    <Ionicons
      name={form === "hot" ? "flame-outline" : "snow-outline"}
      size={13}
      color={form === "hot" ? "#f97316" : "#60a5fa"}
    />
  );
}

// ─── Card Front ───────────────────────────────────────────────────────────────

function CardFront({ player }: { player: Player }) {
  const tier      = ovrTier(player.ovr);
  const color     = TIER_COLOR[tier];
  const gradient  = TIER_GRADIENT[tier];
  const tierLabel = tier === "cheapgold" ? "GOLD" : tier.toUpperCase();
  const initials  = player.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={cs.card}>
      <View style={[cs.glow, { backgroundColor: color }]} />

      <View style={cs.frontTopRow}>
        <View>
          <Text style={[cs.ovrNum, { color }]}>{player.ovr}</Text>
          <Text style={[cs.posText, { color }]}>{player.position}</Text>
        </View>
        <View style={[cs.tierPill, { borderColor: color + "55", backgroundColor: color + "18" }]}>
          <Text style={[cs.tierPillText, { color }]}>{tierLabel}</Text>
        </View>
      </View>

      <View style={[cs.avatar, { borderColor: color, shadowColor: color }]}>
        <Text style={[cs.avatarText, { color }]}>{initials}</Text>
      </View>

      <Text style={cs.cardName} numberOfLines={1}>{player.name}</Text>

      <View style={[cs.footPill, { borderColor: color + "44" }]}>
        <Ionicons name={player.foot === "R" ? "arrow-forward" : "arrow-back"} size={10} color={color + "bb"} />
        <Text style={[cs.footText, { color: color + "bb" }]}>{player.foot === "R" ? "Right foot" : "Left foot"}</Text>
      </View>

      <View style={cs.miniGrid}>
        {ATTRS.map(a => (
          <View key={a.key} style={cs.miniCell}>
            <Text style={[cs.miniVal, { color: attrColor(player[a.key]) }]}>{player[a.key]}</Text>
            <Text style={cs.miniLbl}>{a.label}</Text>
          </View>
        ))}
      </View>

      <Text style={cs.tapHint}>tap to flip</Text>
    </LinearGradient>
  );
}

// ─── Card Back ────────────────────────────────────────────────────────────────

function CardBack({ player }: { player: Player }) {
  const tier     = ovrTier(player.ovr);
  const color    = TIER_COLOR[tier];
  const gradient = TIER_GRADIENT[tier];

  return (
    <LinearGradient colors={[gradient[2], gradient[1], gradient[0]]} start={{ x: 1, y: 1 }} end={{ x: 0, y: 0 }} style={cs.card}>
      <View style={[cs.glow, { backgroundColor: color }]} />

      <Text style={[cs.backSectionTitle, { color }]}>ATTRIBUTES</Text>

      <View style={cs.attrList}>
        {ATTRS.map(a => {
          const val = player[a.key];
          const ac  = attrColor(val);
          return (
            <View key={a.key} style={cs.attrRow}>
              <Text style={[cs.attrLbl, { color: color + "99" }]}>{a.label}</Text>
              <View style={cs.barBg}>
                <View style={[cs.barFill, { width: `${val}%` as any, backgroundColor: ac }]} />
              </View>
              <Text style={[cs.attrNum, { color: ac }]}>{val}</Text>
            </View>
          );
        })}
      </View>

      <View style={[cs.backDivider, { backgroundColor: color + "25" }]} />

      <Text style={[cs.backSectionTitle, { color, marginBottom: 10 }]}>CAREER STATS</Text>
      <View style={cs.careerRow}>
        {[
          { val: player.goals,   lbl: "Goals"  },
          { val: player.assists, lbl: "Assists" },
          { val: player.mvps,    lbl: "MVPs"   },
        ].map((s, i) => (
          <React.Fragment key={s.lbl}>
            {i > 0 && <View style={[cs.careerDiv, { backgroundColor: color + "25" }]} />}
            <View style={cs.careerCell}>
              <Text style={[cs.careerVal, { color }]}>{s.val}</Text>
              <Text style={cs.careerLbl}>{s.lbl}</Text>
            </View>
          </React.Fragment>
        ))}
      </View>

      <Text style={cs.tapHint}>tap to flip</Text>
    </LinearGradient>
  );
}

const cs = StyleSheet.create({
  card:         { width: CARD_W, height: CARD_H, borderRadius: 22, padding: 20, alignItems: "center", overflow: "hidden", borderWidth: 1, borderColor: "#ffffff0d" },
  glow:         { position: "absolute", width: 220, height: 220, borderRadius: 110, opacity: 0.08, top: -50, alignSelf: "center" },
  frontTopRow:  { width: "100%", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  ovrNum:       { fontSize: 38, fontWeight: "900", lineHeight: 40 },
  posText:      { fontSize: 13, fontWeight: "700", marginTop: 1 },
  tierPill:     { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, marginTop: 4 },
  tierPillText: { fontSize: 10, fontWeight: "800", letterSpacing: 1.5 },
  avatar:       { width: 82, height: 82, borderRadius: 41, backgroundColor: "#111", borderWidth: 2, alignItems: "center", justifyContent: "center", marginBottom: 10, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 18, elevation: 12 },
  avatarText:   { fontSize: 28, fontWeight: "900" },
  cardName:     { color: "#fff", fontSize: 18, fontWeight: "900", letterSpacing: 0.4, marginBottom: 6, textAlign: "center", width: "100%" },
  footPill:     { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 14 },
  footText:     { fontSize: 11, fontWeight: "600" },
  miniGrid:     { flexDirection: "row", width: "100%", gap: 4 },
  miniCell:     { flex: 1, alignItems: "center", backgroundColor: "#ffffff08", borderRadius: 8, paddingVertical: 6 },
  miniVal:      { fontSize: 15, fontWeight: "900" },
  miniLbl:      { color: "#555", fontSize: 9, fontWeight: "700", marginTop: 1 },
  tapHint:      { position: "absolute", bottom: 11, color: "#ffffff20", fontSize: 10, fontWeight: "600", letterSpacing: 0.5 },
  backSectionTitle: { fontSize: 10, fontWeight: "800", letterSpacing: 2, alignSelf: "flex-start", marginBottom: 14 },
  attrList:     { width: "100%", gap: 9, marginBottom: 14 },
  attrRow:      { flexDirection: "row", alignItems: "center", gap: 8 },
  attrLbl:      { fontSize: 10, fontWeight: "800", letterSpacing: 0.8, width: 30 },
  barBg:        { flex: 1, height: 7, backgroundColor: "#ffffff0f", borderRadius: 4, overflow: "hidden" },
  barFill:      { height: "100%", borderRadius: 4 },
  attrNum:      { fontSize: 13, fontWeight: "900", width: 26, textAlign: "right" },
  backDivider:  { height: 1, width: "100%", marginBottom: 14 },
  careerRow:    { flexDirection: "row", width: "100%", alignItems: "center" },
  careerCell:   { flex: 1, alignItems: "center" },
  careerVal:    { fontSize: 24, fontWeight: "900" },
  careerLbl:    { color: "#555", fontSize: 10, fontWeight: "600", marginTop: 2 },
  careerDiv:    { width: 1, height: 38 },
});

// ─── Player Card Modal ────────────────────────────────────────────────────────

function PlayerCardModal({ player, visible, onClose }: {
  player: Player | null; visible: boolean; onClose: () => void;
}) {
  const flipAnim        = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardScale       = useRef(new Animated.Value(0.82)).current;
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (visible) {
      flipAnim.setValue(0);
      setFlipped(false);
      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(cardScale,       { toValue: 1, useNativeDriver: true, damping: 16, stiffness: 200, mass: 0.9 }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.timing(cardScale,       { toValue: 0.82, duration: 160, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleFlip = () => {
    Animated.spring(flipAnim, {
      toValue: flipped ? 0 : 1,
      useNativeDriver: true,
      damping: 14,
      stiffness: 130,
    }).start();
    setFlipped(f => !f);
  };

  const frontRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg",   "180deg"] });
  const backRotate  = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ["180deg", "360deg"] });

  const handleExport = async () => {
    if (!player) return;
    const tier     = ovrTier(player.ovr) === "cheapgold" ? "GOLD" : ovrTier(player.ovr).toUpperCase();
    const formLine = player.form === "hot" ? "🔥 In form" : player.form === "cold" ? "❄️ Out of form" : "";
    const lines = [
      `⚽ BALLERZ — PLAYER CARD`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `${player.name}  |  ${player.position}  |  ${player.ovr} OVR  [${tier}]`,
      formLine,
      `━━━━━━━━━━━━━━━━━━━━`,
      `PAC ${String(player.pac).padEnd(3)}  SHO ${String(player.sho).padEnd(3)}  PAS ${player.pas}`,
      `DRI ${String(player.dri).padEnd(3)}  DEF ${String(player.def).padEnd(3)}  PHY ${player.phy}`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `⚽ ${player.goals} Goals   🅰️ ${player.assists} Assists   🏆 ${player.mvps} MVPs`,
      `👟 ${player.foot === "R" ? "Right" : "Left"} foot`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `via Ballerz App`,
    ].filter(Boolean).join("\n");
    await Share.share({ message: lines });
  };

  if (!player) return null;

  const router = useRouter();

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: backdropOpacity }]}>
        <BlurView intensity={55} tint="dark" style={StyleSheet.absoluteFill} />
      </Animated.View>

      <View style={ms.container}>
        <TouchableOpacity style={ms.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={22} color="#fff" />
        </TouchableOpacity>

        <Animated.View style={{ transform: [{ scale: cardScale }] }}>
          <TouchableOpacity onPress={handleFlip} activeOpacity={0.95}>
            <View style={{ width: CARD_W, height: CARD_H }}>
              <Animated.View style={[
                StyleSheet.absoluteFill,
                { transform: [{ perspective: 1400 }, { rotateY: frontRotate }], backfaceVisibility: "hidden" },
              ]}>
                <CardFront player={player} />
              </Animated.View>
              <Animated.View style={[
                StyleSheet.absoluteFill,
                { transform: [{ perspective: 1400 }, { rotateY: backRotate }], backfaceVisibility: "hidden" },
              ]}>
                <CardBack player={player} />
              </Animated.View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity style={ms.exportBtn} onPress={handleExport}>
          <Ionicons name="share-social-outline" size={18} color="#fff" />
          <Text style={ms.exportText}>Share Card</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[ms.exportBtn, ms.editBtn]}
          onPress={() => {
            onClose();
            setTimeout(() => router.push(`/create-player?playerId=${player.id}`), 300);
          }}
        >
          <Ionicons name="create-outline" size={18} color="#aaa" />
          <Text style={[ms.exportText, { color: "#aaa" }]}>Edit Player</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const ms = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  closeBtn:  { position: "absolute", top: 60, right: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: "#ffffff14", alignItems: "center", justifyContent: "center" },
  exportBtn: { flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: "#0039a3", borderRadius: 14, paddingHorizontal: 30, paddingVertical: 14 },
  editBtn:   { backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  exportText:{ color: "#fff", fontSize: 15, fontWeight: "700" },
});

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({ visible, count, onConfirm, onCancel }: {
  visible: boolean; count: number; onConfirm: () => void; onCancel: () => void;
}) {
  const scale   = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scale.setValue(0.9); opacity.setValue(0);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.spring(scale,   { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 200 }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onCancel}>
      <BlurView intensity={30} tint="dark" style={styles.dialogOverlay}>
        <Animated.View style={[styles.dialog, { opacity, transform: [{ scale }] }]}>
          <View style={styles.dialogIconWrap}>
            <Ionicons name="person-remove-outline" size={26} color="#cc0000" />
          </View>
          <Text style={styles.dialogTitle}>Remove {count} {count === 1 ? "Player" : "Players"}?</Text>
          <Text style={styles.dialogSubtitle}>This action cannot be undone.</Text>
          <View style={styles.dialogDivider} />
          <View style={styles.dialogActions}>
            <TouchableOpacity style={styles.dialogCancel} onPress={onCancel}>
              <Text style={styles.dialogCancelText}>Cancel</Text>
            </TouchableOpacity>
            <View style={styles.dialogActionsDivider} />
            <TouchableOpacity style={styles.dialogConfirm} onPress={onConfirm}>
              <Text style={styles.dialogConfirmText}>Remove</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}

// ─── MVP Card ─────────────────────────────────────────────────────────────────

function MvpCard({ player, onDismiss }: { player: Player; onDismiss: () => void }) {
  const tier     = ovrTier(player.ovr);
  const color    = TIER_COLOR[tier];
  const initials = player.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <View style={styles.mvpCard}>
      {/* subtle glow */}
      <View style={[styles.mvpGlow, { backgroundColor: color }]} />

      {/* header row: label + dismiss */}
      <View style={styles.mvpCardHeader}>
        <View style={styles.mvpLabelRow}>
          <Ionicons name="trophy" size={11} color={color} />
          <Text style={[styles.mvpCardLabel, { color }]}>LAST MATCH MVP</Text>
        </View>
        <TouchableOpacity
          onPress={onDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.mvpDismissBtn}
        >
          <Ionicons name="close" size={15} color="#444" />
        </TouchableOpacity>
      </View>

      {/* body: avatar + info + OVR */}
      <View style={styles.mvpCardBody}>
        <View style={[styles.mvpAvatar, { borderColor: color + "66" }]}>
          <Text style={[styles.mvpAvatarText, { color }]}>{initials}</Text>
        </View>
        <View style={styles.mvpCardInfo}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={styles.mvpCardName}>{player.name}</Text>
            <FormBadge form={player.form} />
          </View>
          <Text style={styles.mvpCardSub}>
            {player.position} · {player.goals}G · {player.assists}A · {player.mvps} MVPs
          </Text>
        </View>
        <View style={[styles.mvpOvrBadge, { backgroundColor: ovrBg(player.ovr), borderColor: color + "55" }]}>
          <Text style={[styles.mvpOvrText, { color }]}>{player.ovr}</Text>
          <Text style={[styles.mvpOvrLabel, { color }]}>OVR</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Player Row ───────────────────────────────────────────────────────────────

function PlayerRow({ player, selectable, selected, onSelect, onTap, isLast }: {
  player: Player; selectable: boolean; selected: boolean;
  onSelect: () => void; onTap: () => void; isLast: boolean;
}) {
  const initials = player.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const color    = ovrColor(player.ovr);
  const bg       = ovrBg(player.ovr);

  const checkWidth   = useRef(new Animated.Value(selectable ? 30 : 0)).current;
  const checkOpacity = useRef(new Animated.Value(selectable ? 1 : 0)).current;
  const checkScale   = useRef(new Animated.Value(selectable ? 1 : 0.4)).current;

  useEffect(() => {
    if (selectable) {
      Animated.parallel([
        Animated.spring(checkWidth,   { toValue: 30,  useNativeDriver: false, damping: 18, stiffness: 280, mass: 0.8 }),
        Animated.spring(checkOpacity, { toValue: 1,   useNativeDriver: false, damping: 18, stiffness: 280 }),
        Animated.spring(checkScale,   { toValue: 1,   useNativeDriver: false, damping: 16, stiffness: 300, mass: 0.7 }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(checkWidth,   { toValue: 0,   duration: 160, useNativeDriver: false }),
        Animated.timing(checkOpacity, { toValue: 0,   duration: 120, useNativeDriver: false }),
        Animated.timing(checkScale,   { toValue: 0.4, duration: 140, useNativeDriver: false }),
      ]).start();
    }
  }, [selectable]);

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={selectable ? onSelect : onTap}
        style={[styles.row, selected && styles.rowSelected]}
      >
        <Animated.View style={{ width: checkWidth, opacity: checkOpacity, overflow: "hidden", alignItems: "center", justifyContent: "center", transform: [{ scale: checkScale }] }}>
          {selected
            ? <Ionicons name="checkmark-circle" size={22} color="#0039a3" />
            : <Ionicons name="ellipse-outline"  size={22} color="#444" />}
        </Animated.View>

        <View style={[styles.avatar, { borderColor: color + "55" }]}>
          <Text style={[styles.avatarText, { color }]}>{initials}</Text>
        </View>

        <View style={styles.playerInfo}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Text style={styles.playerName}>{player.name}</Text>
            <FormBadge form={player.form} />
            {player.isMvp && (
              <View style={styles.mvpPill}>
                <Ionicons name="trophy" size={9} color="#f5c518" />
                <Text style={styles.mvpPillText}>MVP</Text>
              </View>
            )}
          </View>
          <Text style={styles.playerSub}>
            {player.position} · {player.goals}G · {player.assists}A · {player.mvps} MVPs
          </Text>
        </View>

        <View style={[styles.ovrBadge, { backgroundColor: bg, borderColor: color + "44" }]}>
          <Text style={[styles.ovrText, { color }]}>{player.ovr}</Text>
          <Text style={[styles.ovrLabel, { color }]}>OVR</Text>
        </View>
      </TouchableOpacity>
      {!isLast && <View style={styles.rowDivider} />}
    </>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PlayersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { players, deletePlayer }           = useStore();
  const [menuVisible, setMenuVisible]       = useState(false);
  const [selectMode, setSelectMode]         = useState(false);
  const [selectedIds, setSelectedIds]       = useState<Set<string>>(new Set());
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [search, setSearch]                 = useState("");
  const [sortMode, setSortMode]             = useState<SortMode>("ovr_desc");
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [cardPlayer, setCardPlayer]         = useState<Player | null>(null);
  const [mvpDismissed, setMvpDismissed]     = useState(false);

  const dropdownOpacity = useRef(new Animated.Value(0)).current;
  const dropdownY       = useRef(new Animated.Value(-8)).current;
  const sortDropOpacity = useRef(new Animated.Value(0)).current;
  const sortDropY       = useRef(new Animated.Value(-8)).current;
  const searchHeight    = useRef(new Animated.Value(48)).current;
  const searchOpacity   = useRef(new Animated.Value(1)).current;
  const searchMargin    = useRef(new Animated.Value(10)).current;
  const lastScrollY        = useRef(0);
  const isSearchCollapsed  = useRef(false);
  const scrollUpAccum      = useRef(0);

  const openMenu = () => {
    dropdownOpacity.setValue(0); dropdownY.setValue(-8);
    setMenuVisible(true);
    Animated.parallel([
      Animated.timing(dropdownOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(dropdownY,       { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();
  };
  const closeMenu = () => {
    Animated.parallel([
      Animated.timing(dropdownOpacity, { toValue: 0, duration: 140, useNativeDriver: true }),
      Animated.timing(dropdownY,       { toValue: -8, duration: 140, useNativeDriver: true }),
    ]).start(() => setMenuVisible(false));
  };
  const openSortMenu = () => {
    sortDropOpacity.setValue(0); sortDropY.setValue(-8);
    setSortMenuVisible(true);
    Animated.parallel([
      Animated.timing(sortDropOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(sortDropY,       { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();
  };
  const closeSortMenu = () => {
    Animated.parallel([
      Animated.timing(sortDropOpacity, { toValue: 0, duration: 140, useNativeDriver: true }),
      Animated.timing(sortDropY,       { toValue: -8, duration: 140, useNativeDriver: true }),
    ]).start(() => setSortMenuVisible(false));
  };

  const handleScroll = (e: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const y = contentOffset.y;

    // At the bottom of the list the rubber-band bounce briefly produces negative
    // deltas even though the user hasn't scrolled up — ignore those frames.
    const isAtBottom = y + layoutMeasurement.height >= contentSize.height - 24;
    if (isAtBottom) return;

    const delta = y - lastScrollY.current;
    lastScrollY.current = y;
    if (Math.abs(delta) > 80) return;

    if (delta > 0) {
      scrollUpAccum.current = 0;
      if (y > 20 && !isSearchCollapsed.current) {
        isSearchCollapsed.current = true;
        Animated.parallel([
          Animated.timing(searchHeight,  { toValue: 0,  duration: 200, useNativeDriver: false }),
          Animated.timing(searchOpacity, { toValue: 0,  duration: 150, useNativeDriver: false }),
          Animated.timing(searchMargin,  { toValue: 0,  duration: 200, useNativeDriver: false }),
        ]).start();
      }
    } else if (delta < 0) {
      scrollUpAccum.current += Math.abs(delta);
      if (scrollUpAccum.current > 30 && isSearchCollapsed.current) {
        isSearchCollapsed.current = false;
        scrollUpAccum.current = 0;
        Animated.parallel([
          Animated.timing(searchHeight,  { toValue: 48, duration: 200, useNativeDriver: false }),
          Animated.timing(searchOpacity, { toValue: 1,  duration: 200, useNativeDriver: false }),
          Animated.timing(searchMargin,  { toValue: 10, duration: 200, useNativeDriver: false }),
        ]).start();
      }
    }
  };

  const SORT_OPTIONS: { key: SortMode; label: string; icon: string }[] = [
    { key: "ovr_desc", label: "OVR: High → Low", icon: "trending-down-outline" },
    { key: "ovr_asc",  label: "OVR: Low → High", icon: "trending-up-outline"   },
    { key: "goals",    label: "Most Goals",       icon: "football-outline"      },
    { key: "mvps",     label: "Most MVPs",        icon: "trophy-outline"        },
  ];

  const sorted = [...players]
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortMode === "ovr_asc") return a.ovr - b.ovr;
      if (sortMode === "goals")   return b.goals - a.goals;
      if (sortMode === "mvps")    return b.mvps - a.mvps;
      return b.ovr - a.ovr;
    });

  const mvpPlayer = players.find(p => p.isMvp);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const confirmDelete = () => {
    selectedIds.forEach((id) => deletePlayer(id));
    setSelectedIds(new Set()); setSelectMode(false); setConfirmVisible(false);
  };
  const cancelSelect = () => { setSelectMode(false); setSelectedIds(new Set()); };

  return (
    <View style={styles.container}>

        <TopBar
          title="Players"
          left={
            selectMode
              ? <TouchableOpacity onPress={cancelSelect}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              : <TouchableOpacity onPress={openMenu}><Ionicons name="ellipsis-horizontal" size={22} color={T.textSecondary} /></TouchableOpacity>
          }
          right={
            selectMode
              ? <TouchableOpacity onPress={() => selectedIds.size > 0 && setConfirmVisible(true)} disabled={selectedIds.size === 0}>
                  <View style={[styles.trashBtn, selectedIds.size === 0 && { opacity: 0.3 }]}>
                    <Ionicons name="trash-outline" size={20} color="#cc0000" />
                    {selectedIds.size > 0 && <View style={styles.trashBadge}><Text style={styles.trashBadgeText}>{selectedIds.size}</Text></View>}
                  </View>
                </TouchableOpacity>
              : <TouchableOpacity onPress={() => router.push("/create-player")}><Ionicons name="add" size={26} color="#fff" /></TouchableOpacity>
          }
        />

        {/* ── Search + sort ── */}
        <Animated.View style={[styles.searchRow, { height: searchHeight, opacity: searchOpacity, marginBottom: searchMargin }]}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={16} color="#555" />
            <TextInput style={styles.searchInput} placeholder="Search players..." placeholderTextColor="#555" value={search} onChangeText={setSearch} />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={16} color="#555" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.sortBtn} onPress={openSortMenu}>
            <Ionicons name="funnel-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </Animated.View>

        {/* ── Summary pills ── */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryPill}>
            <Ionicons name="people-outline" size={13} color="#aaa" />
            <Text style={styles.summaryText}>{players.length} Players</Text>
          </View>
          <View style={[styles.summaryPill, { borderLeftWidth: 2, borderLeftColor: T.accent }]}>
            <Ionicons name="stats-chart-outline" size={13} color="#aaa" />
            <Text style={styles.summaryText}>
              Avg {players.length > 0 ? Math.round(players.reduce((s, p) => s + p.ovr, 0) / players.length) : "—"} OVR
            </Text>
          </View>
        </View>

        {/* ── Dropdowns ── */}
        {menuVisible && (
          <View style={styles.dropdownContainer}>
            <TouchableWithoutFeedback onPress={closeMenu}><View style={styles.dropdownOverlay} /></TouchableWithoutFeedback>
            <Animated.View style={[styles.dropdown, { top: insets.top + 46, opacity: dropdownOpacity, transform: [{ translateY: dropdownY }] }]}>
              <TouchableOpacity style={styles.dropdownItem} onPress={() => { setSelectMode(true); closeMenu(); }}>
                <Ionicons name="checkbox-outline" size={16} color="#fff" />
                <Text style={styles.dropdownText}>Select Players</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}

        {sortMenuVisible && (
          <View style={styles.dropdownContainer}>
            <TouchableWithoutFeedback onPress={closeSortMenu}><View style={styles.dropdownOverlay} /></TouchableWithoutFeedback>
            <Animated.View style={[styles.dropdown, styles.sortDropdown, { top: insets.top + 46, opacity: sortDropOpacity, transform: [{ translateY: sortDropY }] }]}>
              {SORT_OPTIONS.map((opt, i) => (
                <React.Fragment key={opt.key}>
                  <TouchableOpacity style={styles.dropdownItem} onPress={() => { setSortMode(opt.key); closeSortMenu(); }}>
                    <Ionicons name={opt.icon as any} size={16} color={sortMode === opt.key ? "#f5c518" : "#fff"} />
                    <Text style={[styles.dropdownText, sortMode === opt.key && { color: "#f5c518" }]}>{opt.label}</Text>
                    {sortMode === opt.key && <Ionicons name="checkmark" size={14} color="#f5c518" style={{ marginLeft: "auto" }} />}
                  </TouchableOpacity>
                  {i < SORT_OPTIONS.length - 1 && <View style={styles.dropdownDivider} />}
                </React.Fragment>
              ))}
            </Animated.View>
          </View>
        )}

        {/* ── List ── */}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} onScroll={handleScroll} scrollEventThrottle={16}>
          {mvpPlayer && !search && !mvpDismissed && (
            <MvpCard player={mvpPlayer} onDismiss={() => setMvpDismissed(true)} />
          )}
          {sorted.length === 0 && (
            <View style={styles.emptyCard}>
              <Ionicons name="person-outline" size={32} color={T.textMuted} />
              <Text style={styles.emptyTitle}>{search ? "No players found" : "No players yet"}</Text>
              {!search && <Text style={styles.emptySubtitle}>Add your first player to get started</Text>}
              {!search && (
                <TouchableOpacity onPress={() => router.push("/create-player")} style={styles.emptyBtn} activeOpacity={0.85}>
                  <Text style={styles.emptyBtnTxt}>Add Player</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          {sorted.map((player, index) => (
            <PlayerRow
              key={player.id}
              player={player}
              selectable={selectMode}
              selected={selectedIds.has(player.id)}
              onSelect={() => toggleSelect(player.id)}
              onTap={() => setCardPlayer(player)}
              isLast={index === sorted.length - 1}
            />
          ))}
        </ScrollView>

        <ConfirmDialog visible={confirmVisible} count={selectedIds.size} onConfirm={confirmDelete} onCancel={() => setConfirmVisible(false)} />
        <PlayerCardModal player={cardPlayer} visible={!!cardPlayer} onClose={() => setCardPlayer(null)} />

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  cancelText: { color: T.textSecondary, fontSize: 14, fontWeight: "600" },

  trashBtn:       { alignItems: "center", justifyContent: "center" },
  trashBadge:     { position: "absolute", top: -6, right: -8, backgroundColor: "#cc0000", borderRadius: 8, minWidth: 16, height: 16, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  trashBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },

  searchRow:   { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 10, overflow: "hidden" },
  searchBox:   { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#181818", borderRadius: 12, paddingHorizontal: 12, height: 40 },
  searchInput: { flex: 1, color: "#fff", fontSize: 14 },
  sortBtn:     { width: 40, height: 40, backgroundColor: "#181818", borderRadius: 12, alignItems: "center", justifyContent: "center" },

  summaryRow:  { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  summaryPill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#181818", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  summaryText: { color: "#aaa", fontSize: 12, fontWeight: "600" },

  dropdownContainer: { ...StyleSheet.absoluteFillObject, zIndex: 200 },
  dropdownOverlay:   { ...StyleSheet.absoluteFillObject },
  dropdown:          { position: "absolute", top: 56, left: 16, backgroundColor: "#1e1e1e", borderRadius: 12, width: 200, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 12 },
  sortDropdown:      { left: undefined, right: 16 },
  dropdownItem:      { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 14 },
  dropdownDivider:   { height: 1, backgroundColor: "#2a2a2a" },
  dropdownText:      { color: "#fff", fontSize: 14, fontWeight: "600" },

  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },

  // ── MVP card (compact horizontal)
  mvpCard:       { backgroundColor: "#111", borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: "#1e1e1e", overflow: "hidden" },
  mvpGlow:       { position: "absolute", width: 160, height: 160, borderRadius: 80, opacity: 0.05, top: -50, left: -20 },
  mvpCardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingTop: 11, paddingBottom: 8 },
  mvpLabelRow:   { flexDirection: "row", alignItems: "center", gap: 5 },
  mvpCardLabel:  { fontSize: 10, fontWeight: "800", letterSpacing: 1.5 },
  mvpDismissBtn: { padding: 2 },
  mvpCardBody:   { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingBottom: 13, gap: 12 },
  mvpAvatar:     { width: 44, height: 44, borderRadius: 22, backgroundColor: "#0a0a0a", borderWidth: 1.5, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  mvpAvatarText: { fontSize: 14, fontWeight: "900" },
  mvpCardInfo:   { flex: 1 },
  mvpCardName:   { color: "#fff", fontSize: 15, fontWeight: "800" },
  mvpCardSub:    { color: "#444", fontSize: 11, marginTop: 3, fontWeight: "500" },
  mvpOvrBadge:   { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, alignItems: "center", minWidth: 46, borderWidth: 1, flexShrink: 0 },
  mvpOvrText:    { fontSize: 17, fontWeight: "900" },
  mvpOvrLabel:   { fontSize: 8, fontWeight: "700", letterSpacing: 1, marginTop: 1 },

  row:         { flexDirection: "row", alignItems: "center", paddingHorizontal: 4, paddingVertical: 13, gap: 12 },
  rowSelected: { backgroundColor: "rgba(0,57,163,0.1)", borderRadius: 12 },
  rowDivider:  { height: 1, backgroundColor: "#181818", marginHorizontal: 4 },
  avatar:      { width: 46, height: 46, borderRadius: 23, backgroundColor: "#111", alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
  avatarText:  { fontSize: 15, fontWeight: "800" },
  playerInfo:  { flex: 1 },
  playerName:  { color: "#fff", fontSize: 15, fontWeight: "700" },
  playerSub:   { color: "#555", fontSize: 11, marginTop: 3, fontWeight: "500" },
  mvpPill:     { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#2a1f00", borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2 },
  mvpPillText: { color: "#f5c518", fontSize: 9, fontWeight: "800" },
  ovrBadge:    { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, alignItems: "center", minWidth: 48, borderWidth: 1 },
  ovrText:     { fontSize: 18, fontWeight: "900" },
  ovrLabel:    { fontSize: 9, fontWeight: "700", letterSpacing: 1, marginTop: 1 },

  dialogOverlay:        { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  dialog:               { backgroundColor: "#1e1e1e", borderRadius: 20, width: "100%", overflow: "hidden", alignItems: "center" },
  dialogIconWrap:       { marginTop: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: "#2a0a0a", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  dialogTitle:          { color: "#fff", fontSize: 17, fontWeight: "800", marginBottom: 6 },
  dialogSubtitle:       { color: "#aaa", fontSize: 13, marginBottom: 20 },
  dialogDivider:        { height: 1, backgroundColor: "#2a2a2a", width: "100%" },
  dialogActions:        { flexDirection: "row", width: "100%" },
  dialogActionsDivider: { width: 1, backgroundColor: "#2a2a2a" },
  dialogCancel:         { flex: 1, paddingVertical: 16, alignItems: "center" },
  dialogCancelText:     { color: "#aaa", fontSize: 15, fontWeight: "600" },
  dialogConfirm:        { flex: 1, paddingVertical: 16, alignItems: "center" },
  dialogConfirmText:    { color: "#cc0000", fontSize: 15, fontWeight: "700" },

  emptyCard: { marginTop: 24, backgroundColor: T.surface, borderRadius: T.radius.card, borderWidth: 1, borderColor: T.border, padding: 28, alignItems: "center", gap: 10 },
  emptyTitle: { color: T.textPrimary, fontSize: 15, fontWeight: "800" },
  emptySubtitle: { color: T.textMuted, fontSize: 13, textAlign: "center" },
  emptyBtn: { marginTop: 4, backgroundColor: T.accent, borderRadius: T.radius.pill, paddingHorizontal: 24, paddingVertical: 11 },
  emptyBtnTxt: { color: "#000", fontSize: 14, fontWeight: "800" },
});