import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React, { useRef, useState } from "react";
import {
  Animated, Modal, ScrollView, StyleSheet, Text,
  TouchableOpacity, TouchableWithoutFeedback, View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Game } from "../../types";
import { useStore } from "../../store";
import { T } from "../../constants/theme";
import { TopBar } from "@/components/TopBar";
import { GameExportSheet } from "@/components/GameExportSheet";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  bar: { paddingTop: 12, paddingBottom: 8, marginBottom: 4 },
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

function GameCard({ game, selectable, selected, onSelect, onTap }: {
  game: Game; selectable: boolean; selected: boolean;
  onSelect: () => void; onTap: () => void;
}) {
  const isCompleted = game.status === "FT";
  const isPending = game.status !== "FT";
  const checkAnim = useRef(new Animated.Value(selectable ? 1 : 0)).current;

  React.useEffect(() => {
    if (selectable) {
      Animated.spring(checkAnim, { toValue: 1, useNativeDriver: false, damping: 18, stiffness: 260 }).start();
    } else {
      Animated.timing(checkAnim, { toValue: 0, duration: 180, useNativeDriver: false }).start();
    }
  }, [selectable]);

  const checkWidth = checkAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 26], extrapolate: "clamp" });

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={selectable ? onSelect : onTap}
      style={[styles.card, selected && styles.cardSelected]}
    >
      <View style={styles.cardHeader}>
        <Animated.View style={{ width: checkWidth, overflow: "hidden", opacity: checkAnim }}>
          <View style={styles.checkbox}>
            {selected
              ? <Ionicons name="checkmark-circle" size={20} color={T.accent} />
              : <Ionicons name="ellipse-outline" size={20} color="#333" />}
          </View>
        </Animated.View>
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
      </View>

      <View style={styles.divider} />

      <View style={styles.scoreBlock}>
        {game.date && (
          <Text style={styles.scoreDateTxt}>{game.date}</Text>
        )}

      <View style={styles.scoreRow}>
        <View style={styles.teamBlock}>
          <View style={styles.teamNameRow}>
            <View style={[styles.teamCircle, { borderColor: game.homeColor, backgroundColor: game.homeColor + "1a" }]}>
              <Ionicons name="shield" size={16} color={game.homeColor} />
            </View>
            <Text style={[styles.teamName, isCompleted && styles.teamNameFt]} numberOfLines={1}>{game.homeTeam}</Text>
          </View>
        </View>

        <View style={styles.scoreCenter}>
          {isPending ? (
            <Text style={styles.vsText}>VS</Text>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={[styles.scoreNum, styles.scoreNumFt]}>{game.homeScore}</Text>
              <Text style={[styles.scoreSep, styles.scoreNumFt]}>–</Text>
              <Text style={[styles.scoreNum, styles.scoreNumFt]}>{game.awayScore}</Text>
            </View>
          )}
        </View>

        <View style={[styles.teamBlock, { alignItems: "flex-end" }]}>
          <View style={[styles.teamNameRow, { flexDirection: "row-reverse" }]}>
            <View style={[styles.teamCircle, { borderColor: game.awayColor, backgroundColor: game.awayColor + "1a" }]}>
              <Ionicons name="shield" size={16} color={game.awayColor} />
            </View>
            <Text style={[styles.teamName, { textAlign: "right" }, isCompleted && styles.teamNameFt]} numberOfLines={1}>{game.awayTeam}</Text>
          </View>
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

      {!selectable && isPending && (
        <>
          <View style={styles.divider} />
          <View style={styles.recordCta}>
            <Text style={styles.recordCtaText}>Record Result</Text>
          </View>
        </>
      )}
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function GamesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { games, deleteGame } = useStore();
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmVisible, setConfirmVisible] = useState(false);
const [activeFilter, setActiveFilter] = useState<FilterKey>("All");
  const listRef = useRef<ScrollView>(null);
  const hasAutoScrolled = useRef(false);

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
  const selectAnim = useRef(new Animated.Value(0)).current;

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

  const enterSelectMode = () => {
    setSelectMode(true);
    closeMenu();
    Animated.spring(selectAnim, { toValue: 1, useNativeDriver: true, damping: 20, stiffness: 280 }).start();
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
    selectAnim.setValue(0);
  };
  const cancelSelect = () => {
    Animated.timing(selectAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setSelectMode(false);
      setSelectedIds(new Set());
    });
  };

  const handleFilterChange = (f: FilterKey) => {
    setActiveFilter(f);
    listRef.current?.scrollTo({ y: 0, animated: false });
  };

  const normalBarOpacity = selectAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const normalBarSlide  = selectAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -24] });
  const selectBarOpacity = selectAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const selectBarSlide   = selectAnim.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] });

  return (
    <View style={styles.container}>
      {/* Animated header — normal bar slides out, select bar slides in */}
      <View style={styles.headerWrap}>
        <Animated.View style={{ opacity: normalBarOpacity, transform: [{ translateY: normalBarSlide }] }}>
          <TopBar
            title="Games"
            left={<TouchableOpacity onPress={openMenu}><Ionicons name="ellipsis-horizontal" size={22} color={T.textSecondary} /></TouchableOpacity>}
            right={<TouchableOpacity onPress={() => router.push("/create-game")}><Ionicons name="add" size={26} color={T.textPrimary} /></TouchableOpacity>}
          />
        </Animated.View>
        <Animated.View style={[styles.selectBar, { paddingTop: insets.top + 12, opacity: selectBarOpacity, transform: [{ translateY: selectBarSlide }] }]}>
          <TouchableOpacity onPress={cancelSelect} style={styles.selectBarSide}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.selectBarTitle}>
            {selectedIds.size > 0 ? `${selectedIds.size} Selected` : "Select Games"}
          </Text>
          <TouchableOpacity
            style={[styles.selectBarSide, { alignItems: "flex-end" }, selectedIds.size === 0 && { opacity: 0.3 }]}
            onPress={() => selectedIds.size > 0 && setConfirmVisible(true)}
            disabled={selectedIds.size === 0}
          >
            <View style={styles.trashBtn}>
              <Ionicons name="trash-outline" size={20} color="#cc0000" />
              {selectedIds.size > 0 && <View style={styles.trashBadge}><Text style={styles.trashBadgeText}>{selectedIds.size}</Text></View>}
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {menuVisible && (
        <View style={styles.dropdownContainer}>
          <TouchableWithoutFeedback onPress={closeMenu}><View style={styles.dropdownOverlay} /></TouchableWithoutFeedback>
          <Animated.View style={[styles.dropdown, { top: insets.top + 46, opacity: dropdownOpacity, transform: [{ translateY: dropdownY }] }]}>
            <TouchableOpacity style={styles.dropdownItem} onPress={enterSelectMode}>
              <Ionicons name="checkbox-outline" size={16} color={T.textPrimary} />
              <Text style={styles.dropdownText}>Select Games</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}

      <Animated.View style={{ opacity: normalBarOpacity }} pointerEvents={selectMode ? "none" : "auto"}>
        <FilterTabs active={activeFilter} onChange={handleFilterChange} counts={filterCounts} />
      </Animated.View>

      <ScrollView
        ref={listRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          if (!hasAutoScrolled.current && games.length > 0) {
            hasAutoScrolled.current = true;
            listRef.current?.scrollToEnd({ animated: false });
          }
        }}
      >
        {visibleGames.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Ionicons
                name={activeFilter === "FT" ? "trophy-outline" : activeFilter === "Upcoming" ? "calendar-outline" : "football-outline"}
                size={28} color={T.textMuted}
              />
            </View>
            <Text style={styles.emptyTitle}>
              {activeFilter === "All" ? "No games yet" : activeFilter === "FT" ? "No finished games" : "No upcoming games"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeFilter === "All"
                ? "Create your first game to get started"
                : activeFilter === "FT"
                ? "Finish a game to see results here"
                : "Schedule a game to see it here"}
            </Text>
            {activeFilter === "All" && (
              <TouchableOpacity onPress={() => router.push("/create-game")} style={styles.emptyBtn} activeOpacity={0.85}>
                <Text style={styles.emptyBtnTxt}>New Game</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          visibleGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              selectable={selectMode}
              selected={selectedIds.has(game.id)}
              onSelect={() => toggleSelect(game.id)}
              onTap={() => router.push(`/game/${game.id}`)}
            />
          ))
        )}
      </ScrollView>

      <ConfirmDialog visible={confirmVisible} count={selectedIds.size} onConfirm={confirmDelete} onCancel={() => setConfirmVisible(false)} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  headerWrap: {},
  selectBar: { position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12 },
  selectBarSide: { minWidth: 60 },
  selectBarTitle: { color: T.textPrimary, fontSize: 16, fontWeight: "800", flex: 1, textAlign: "center" },
  cancelText: { color: T.textSecondary, fontSize: 14, fontWeight: "600" },
  trashBtn: { alignItems: "center", justifyContent: "center" },
  trashBadge: { position: "absolute", top: -6, right: -8, backgroundColor: "#cc0000", borderRadius: 8, minWidth: 16, height: 16, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  trashBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  dropdownContainer: { ...StyleSheet.absoluteFillObject, zIndex: 200 },
  dropdownOverlay: { ...StyleSheet.absoluteFillObject },
  dropdown: { position: "absolute", top: 56, left: 16, backgroundColor: "#161616", borderRadius: 14, width: 210, overflow: "hidden", borderWidth: 1, borderColor: "#242424" },
  dropdownItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 14 },
  dropdownText: { color: T.textSecondary, fontSize: 14, fontWeight: "600" },
  scrollContent: { paddingHorizontal: 16, gap: 10, paddingBottom: 40 },
  emptyCard: { margin: 16, borderRadius: T.radius.card, padding: 32, alignItems: "center", gap: 8 },
  emptyIconWrap: { width: 52, height: 52, borderRadius: 26, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  emptyTitle: { color: T.textPrimary, fontSize: 15, fontWeight: "800" },
  emptySubtitle: { color: T.textMuted, fontSize: 13, textAlign: "center", lineHeight: 19 },
  emptyBtn: { marginTop: 8, backgroundColor: T.accent, borderRadius: T.radius.pill, paddingHorizontal: 24, paddingVertical: 11 },
  emptyBtnTxt: { color: "#000", fontSize: 14, fontWeight: "800" },
  teamNameFt: { color: T.textMuted },
  scoreNumFt: { color: T.textMuted },

  card: { backgroundColor: T.surface, borderRadius: T.radius.card, overflow: "hidden", borderWidth: 1, borderColor: T.border, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0, shadowRadius: 16, elevation: 0 },
  cardSelected: { borderColor: T.accent, borderWidth: 1.5 },
  checkbox: { marginRight: 6 },
  cardHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 11, gap: 6 },
  cardHeaderMeta: { flexDirection: "row", alignItems: "center", gap: 5, flex: 1 },
  leagueText: { color: T.textMuted, fontSize: 11, fontWeight: "600" },
  dotSep: { color: T.textMuted, fontSize: 11 },
  locationText: { color: T.textMuted, fontSize: 11, fontWeight: "500", flex: 1 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: T.border },
  statusText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  divider: { height: 1, backgroundColor: T.border },
  scoreBlock: { paddingTop: 18, paddingBottom: 30, gap: 6 },
  scoreRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  teamBlock: { width: 110 },
  teamNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  teamCircle: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  teamName: { color: T.textSecondary, fontSize: 12, fontWeight: "700", flexShrink: 1 },
  scoreCenter: { alignItems: "center", minWidth: 60 },
  scoreDateTxt: { color: T.textMuted, fontSize: 9, fontWeight: "600", textAlign: "center" },
  scoreNum: { color: T.textPrimary, fontSize: T.scoreSize, fontWeight: "900" },
  scoreSep: { color: T.textMuted, fontSize: 22, fontWeight: "300" },
  vsText: { color: T.textMuted, fontSize: 16, fontWeight: "800", letterSpacing: 1.5, paddingHorizontal: 12 },
  mvpRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingHorizontal: 14, paddingVertical: 11, gap: 7 },
  mvpLabel: { color: T.textMuted, fontSize: 11, fontWeight: "600" },
  mvpName: { color: T.textPrimary, fontSize: 12, fontWeight: "700" },
  dateRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, gap: 6 },
  dateTxt: { color: T.textMuted, fontSize: 11, fontWeight: "600" },
  recordCta: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 11, gap: 6 },
  recordCtaText: { color: T.accent, fontSize: 12, fontWeight: "700" },

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
