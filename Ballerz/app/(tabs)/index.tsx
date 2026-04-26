import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useEffect } from "react";
import { useLastGame, useMvpPlayer, useAppStats } from "../../store/selectors";
import type { Game } from "../../types/games";

// ─── Carousel config ─────────────────────────────────────────────────────────

const CARD_WIDTH = 160;
const CARD_GAP = 12;
const ITEM_WIDTH = CARD_WIDTH + CARD_GAP;
const STATS_COUNT = 3;
const LOOP_WIDTH = ITEM_WIDTH * STATS_COUNT;

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatsCarousel({
  translateX,
  stats,
}: {
  translateX: Animated.Value;
  stats: { label: string; value: string }[];
}) {
  const loopedStats = [...stats, ...stats];
  return (
    <View style={styles.carousel}>
      <Animated.View style={[styles.row, { transform: [{ translateX }] }]}>
        {loopedStats.map((stat, index) => (
          <LinearGradient
            key={index}
            colors={["#e6e6e61c", "#00000031", "#0d1a6e73"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            <Text
              style={styles.cardValue}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {stat.value}
            </Text>
            <Text style={styles.cardLabel}>{stat.label}</Text>
          </LinearGradient>
        ))}
      </Animated.View>
    </View>
  );
}

function LastGameCard({ g }: { g: Game }) {
  return (
    <LinearGradient
      colors={["#2d2d3560", "#101013", "#47485328"]}
      start={{ x: 0, y: 2 }}
      end={{ x: 1, y: 0 }}
      style={styles.lastGameCard}
    >
      <View style={styles.lastGameHeader}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="football-outline" size={14} color="#aaa" />
          <Text style={styles.lastGameLeague}>{g.league}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{g.status}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.matchRow}>
        <View
          style={[
            styles.teamBadge,
            { backgroundColor: "#1a0000", borderColor: g.homeColor ?? "#cc0000" },
          ]}
        >
          <Ionicons name="shield" size={20} color={g.homeColor ?? "#cc0000"} />
        </View>
        <Text style={styles.teamName}>{g.homeTeam}</Text>
        <Text style={styles.score}>
          {g.homeScore} – {g.awayScore}
        </Text>
        <Text style={styles.teamName}>{g.awayTeam}</Text>
        <View
          style={[
            styles.teamBadge,
            { backgroundColor: "#00001a", borderColor: g.awayColor ?? "#0055cc" },
          ]}
        >
          <Ionicons name="shield" size={20} color={g.awayColor ?? "#0055cc"} />
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.mvpRow}>
        <Ionicons name="star" size={14} color="#f5c518" />
        <Text style={styles.mvpLabel}>Match MVP</Text>
        <Text style={styles.mvpName}>{g.mvp.name}</Text>
        <Text style={styles.mvpStat}>{g.mvp.stat}</Text>
      </View>
    </LinearGradient>
  );
}

function MVPSection({ mvpName }: { mvpName: string }) {
  return (
    <View style={styles.mvpCard}>
      {/* Glow behind player */}
      <View style={styles.mvpGlowOuter} />
      <View style={styles.mvpGlowMid} />
      <View style={styles.mvpGlowInner} />

      <Image
        source={require("@/assets/images/playerDefaultPic.png")}
        style={styles.mvpImage}
        resizeMode="contain"
      />
      <LinearGradient
        colors={["rgba(0,0,0,0.7)", "transparent"]}
        style={styles.mvpTopFade}
      />
      <LinearGradient
        colors={["transparent", "#000000"]}
        style={styles.mvpBottomFade}
      />
      <View style={styles.mvpTopLabels}>
        <Text style={styles.mvpTopTitle}>Last Match</Text>
        <Text style={styles.mvpTopBadge}>MVP</Text>
      </View>
      <Text style={styles.mvpBottomName}>{mvpName}</Text>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const translateX = useRef(new Animated.Value(0)).current;
  const lastGame = useLastGame();
  const mvpPlayer = useMvpPlayer();
  const { gamesCount, playersCount, totalGoals } = useAppStats();

  const stats = [
    { label: "Games", value: String(gamesCount) },
    { label: "Players", value: String(playersCount) },
    { label: "Goals", value: String(totalGoals) },
  ];

  useEffect(() => {
    const animate = () => {
      translateX.setValue(0);
      Animated.timing(translateX, {
        toValue: -LOOP_WIDTH,
        duration: STATS_COUNT * 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(animate);
    };
    animate();
  }, []);

  return (
    <LinearGradient
      colors={["#000000", "#000000", "#00000060", "rgb(0,0,0)"]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <Image
          source={require("@/assets/images/ballerzWideLogo.png")}
          style={styles.headerImage}
          resizeMode="contain"
        />

        <StatsCarousel translateX={translateX} stats={stats} />

        {lastGame && (
          <>
            <Text style={styles.sectionTitle}>Last Game</Text>
            <LastGameCard g={lastGame} />
          </>
        )}

        {lastGame && mvpPlayer && (
          <MVPSection mvpName={mvpPlayer.name} />
        )}

        <TouchableOpacity style={styles.button} onPress={() => {}}>
          <Text style={styles.buttonText}>Create Game</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  headerImage: {
    width: "40%",
    height: 60,
    alignSelf: "center",
    marginTop: 10,
  },

  // Carousel
  carousel: {
    overflow: "hidden",
    marginTop: 15,
  },
  row: {
    flexDirection: "row",
    gap: CARD_GAP,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    width: CARD_WIDTH,
    height: 130,
  },
  cardValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  cardLabel: {
    fontSize: 13,
    color: "#8899cc",
    marginTop: 6,
    fontWeight: "600",
  },

  // Section title
  sectionTitle: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 24,
    marginBottom: 7,
    marginHorizontal: 16,
  },

  // Last game card
  lastGameCard: {
    borderRadius: 16,
    marginHorizontal: 16,
    overflow: "hidden",
  },
  lastGameHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  lastGameLeague: {
    color: "#aaa",
    fontSize: 13,
    fontWeight: "600",
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
    paddingVertical: 16,
    gap: 8,
  },
  statusBadge: {
    backgroundColor: "#2a2a2a",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    color: "#aaa",
    fontSize: 11,
    fontWeight: "700",
  },
  teamName: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    flex: 1,
  },
  teamBadge: {
    width: 35,
    height: 35,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
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

  // MVP section card
  mvpCard: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 20,
    overflow: "hidden",
    height: 200,
    backgroundColor: "#000",
  },
  mvpGlowOuter: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "#f5c518",
    opacity: 0.04,
    alignSelf: "center",
    top: -40,
  },
  mvpGlowMid: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#f5c518",
    opacity: 0.07,
    alignSelf: "center",
    top: 0,
  },
  mvpGlowInner: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f5c518",
    opacity: 0.13,
    alignSelf: "center",
    top: 40,
  },
  mvpImage: {
    width: "50%",
    height: "100%",
    position: "absolute",
    left: "25%", // centers a 50%-wide image
  },
  mvpTopFade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 70,
  },
  mvpBottomFade: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  mvpTopLabels: {
    position: "absolute",
    top: 14,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  mvpTopTitle: {
    color: "#ccc",
    fontSize: 13,
    fontWeight: "600",
  },
  mvpTopBadge: {
    color: "#f5c518",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 2,
    marginTop: 2,
  },
  mvpBottomName: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 1,
  },

  // Button
  button: {
    position: "absolute",
    bottom: 18,
    left: 16,
    right: 16,
    backgroundColor: "#0039a3",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
