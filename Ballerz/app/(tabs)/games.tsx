import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Modal,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import React, { useState, useRef, useEffect } from "react";

// ─── Data / types ─────────────────────────────────────────────────────────────

type Game = {
  id: string;
  league: string;
  status: "FT" | "Live" | "Pending";
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  mvp: { name: string; stat: string };
  homeColor: string;
  awayColor: string;
};

const initialGames: Game[] = [
  {
    id: "1",
    league: "Ballerz League",
    status: "FT",
    homeTeam: "Barcelona FC",
    awayTeam: "Real Madrid",
    homeScore: 3,
    awayScore: 2,
    mvp: { name: "Neymar Jr", stat: "2 goals · 1 ast" },
    homeColor: "#cc0000",
    awayColor: "#0055cc",
  },
  {
    id: "2",
    league: "Ballerz League",
    status: "Pending",
    homeTeam: "Man City",
    awayTeam: "Liverpool",
    homeScore: 0,
    awayScore: 0,
    mvp: { name: "—", stat: "—" },
    homeColor: "#cc0000",
    awayColor: "#0055cc",
  },
  {
    id: "3",
    league: "Ballerz League",
    status: "FT",
    homeTeam: "PSG",
    awayTeam: "Bayern",
    homeScore: 2,
    awayScore: 2,
    mvp: { name: "Mbappe", stat: "2 goals · 3 chances" },
    homeColor: "#cc0000",
    awayColor: "#0055cc",
  },
  {
    id: "4",
    league: "Ballerz League",
    status: "Pending",
    homeTeam: "Ajax",
    awayTeam: "Juventus",
    homeScore: 0,
    awayScore: 0,
    mvp: { name: "—", stat: "—" },
    homeColor: "#cc0000",
    awayColor: "#0055cc",
  },
  {
    id: "5",
    league: "Ballerz League",
    status: "Live",
    homeTeam: "Arsenal",
    awayTeam: "Chelsea",
    homeScore: 1,
    awayScore: 0,
    mvp: { name: "Saka", stat: "1 goal · 2 ast" },
    homeColor: "#cc0000",
    awayColor: "#0055cc",
  },
];

function statusColor(status: Game["status"]) {
  if (status === "FT") return "#2a2a2a";
  if (status === "Live") return "#1a3a00";
  return "#2a2200";
}

function statusTextColor(status: Game["status"]) {
  if (status === "FT") return "#aaa";
  if (status === "Live") return "#55cc00";
  return "#ccaa00";
}

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

// ─── GameCard ─────────────────────────────────────────────────────────────────

function GameCard({
  game,
  selectable,
  selected,
  onSelect,
}: {
  game: Game;
  selectable: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={selectable ? 0.7 : 1}
      onPress={selectable ? onSelect : undefined}
      style={[styles.card, selected && styles.cardSelected]}
    >
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
            gap: 6,
            flex: 1,
          }}
        >
          <Ionicons name="football-outline" size={13} color="#aaa" />
          <Text style={styles.leagueText}>{game.league}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusColor(game.status) },
          ]}
        >
          <Text
            style={[styles.statusText, { color: statusTextColor(game.status) }]}
          >
            {game.status}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.matchRow}>
        <View
          style={[
            styles.teamBadge,
            { backgroundColor: "#1a0000", borderColor: game.homeColor },
          ]}
        >
          <Ionicons name="shield" size={18} color={game.homeColor} />
        </View>
        <Text style={styles.teamName}>{game.homeTeam}</Text>
        <Text style={styles.score}>
          {game.status === "Pending"
            ? "vs"
            : `${game.homeScore} – ${game.awayScore}`}
        </Text>
        <Text style={styles.teamName}>{game.awayTeam}</Text>
        <View
          style={[
            styles.teamBadge,
            { backgroundColor: "#00001a", borderColor: game.awayColor },
          ]}
        >
          <Ionicons name="shield" size={18} color={game.awayColor} />
        </View>
      </View>

      {game.status !== "Pending" && (
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
    </TouchableOpacity>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function GamesScreen() {
  const [games, setGames] = useState<Game[]>(initialGames);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmVisible, setConfirmVisible] = useState(false);

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
    setGames((prev) => prev.filter((g) => !selectedIds.has(g.id)));
    setSelectedIds(new Set());
    setSelectMode(false);
    setConfirmVisible(false);
  };

  const markAllFinished = () => {
    setGames((prev) => prev.map((g) => ({ ...g, status: "FT" as const })));
    closeMenu();
  };

  const cancelSelect = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  return (
    <LinearGradient
      colors={["#000000", "#000000", "#00000060", "rgb(0,0,0)"]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* ── Top bar ── */}
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

        {/* ── Dropdown ── */}
        {/* ── Dropdown overlay + menu ── */}
        {menuVisible && (
          <View style={styles.dropdownContainer}>
            {/* full screen tap-away */}
            <TouchableWithoutFeedback onPress={closeMenu}>
              <View style={styles.dropdownOverlay} />
            </TouchableWithoutFeedback>

            {/* actual menu */}
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

        {/* ── Games list ── */}
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
            />
          ))}
        </ScrollView>

        {/* ── Confirm delete dialog ── */}
        <ConfirmDialog
          visible={confirmVisible}
          count={selectedIds.size}
          onConfirm={confirmDelete}
          onCancel={() => setConfirmVisible(false)}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

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
  topBarBtn: {
    minWidth: 40,
    alignItems: "center",
  },
  pageTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  cancelText: {
    color: "#aaa",
    fontSize: 14,
    fontWeight: "600",
  },

  // Trash
  trashBtn: {
    alignItems: "center",
    justifyContent: "center",
  },
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
  trashBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },

  // Dropdown — positioned right under the three dots
  dropdownContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 200,
  },
  dropdownOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  dropdown: {
    position: "absolute",
    top: 56,
    left: 16,
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    width: 200,
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
  dropdownDivider: {
    height: 1,
    backgroundColor: "#2a2a2a",
  },
  dropdownText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },

  // Confirm dialog
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
  dialogSubtitle: {
    color: "#aaa",
    fontSize: 13,
    marginBottom: 20,
  },
  dialogDivider: {
    height: 1,
    backgroundColor: "#2a2a2a",
    width: "100%",
  },
  dialogActions: {
    flexDirection: "row",
    width: "100%",
  },
  dialogActionsDivider: {
    width: 1,
    backgroundColor: "#2a2a2a",
  },
  dialogCancel: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
  },
  dialogCancelText: {
    color: "#aaa",
    fontSize: 15,
    fontWeight: "600",
  },
  dialogConfirm: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
  },
  dialogConfirmText: {
    color: "#cc0000",
    fontSize: 15,
    fontWeight: "700",
  },

  // Scroll
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 40,
  },

  // Card
  card: {
    backgroundColor: "#181818",
    borderRadius: 16,
    overflow: "hidden",
  },
  cardSelected: {
    borderWidth: 1.5,
    borderColor: "#0039a3",
  },
  checkbox: {
    marginRight: 8,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  leagueText: {
    color: "#aaa",
    fontSize: 13,
    fontWeight: "600",
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "#2a2a2a",
  },
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 8,
  },
  teamBadge: {
    width: 35,
    height: 35,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  teamName: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    flex: 1,
  },
  score: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    minWidth: 80,
    textAlign: "center",
  },
  mvpRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  mvpLabel: {
    color: "#aaa",
    fontSize: 12,
    fontWeight: "600",
  },
  mvpName: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
  },
  mvpStat: {
    color: "#aaa",
    fontSize: 12,
  },
});
