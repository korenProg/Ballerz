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

// ─── Data ───────────────────────────────────────────────────────────────────

const stats = [
  { label: "Points", value: "28.5" },
  { label: "Assists", value: "7.2" },
  { label: "Rebounds", value: "10.1" },
  { label: "Blocks", value: "2.3" },
  { label: "Steals", value: "1.8" },
];

const lastGame = {
  league: "Ballerz League",
  status: "FT",
  homeTeam: "Lakers",
  awayTeam: "Bulls",
  homeScore: 112,
  awayScore: 98,
};

// ─── Carousel config ─────────────────────────────────────────────────────────

const CARD_WIDTH = 200;
const CARD_GAP = 12;
const ITEM_WIDTH = CARD_WIDTH + CARD_GAP;
const LOOP_WIDTH = ITEM_WIDTH * stats.length;
const loopedStats = [...stats, ...stats];

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatsCarousel({ translateX }: { translateX: Animated.Value }) {
  return (
    <View style={styles.carousel}>
      <Animated.View style={[styles.row, { transform: [{ translateX }] }]}>
        {loopedStats.map((stat, index) => (
          <View key={index} style={styles.card}>
            <Text style={styles.cardValue}>{stat.value}</Text>
            <Text style={styles.cardLabel}>{stat.label}</Text>
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

function LastGameCard() {
  return (
    <View style={styles.lastGameCard}>
      {/* League header */}
      <View style={styles.lastGameHeader}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="football-outline" size={14} color="#aaa" />
          <Text style={styles.lastGameLeague}>{lastGame.league}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{lastGame.status}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Match row */}
      <View style={styles.matchRow}>
        <View
          style={[
            styles.teamBadge,
            { backgroundColor: "#1a0000", borderColor: "#cc0000" },
          ]}
        >
          <Ionicons name="shield" size={20} color="#cc0000" />
        </View>
        <Text style={styles.teamName}>{lastGame.homeTeam}</Text>

        <Text style={styles.score}>
          {lastGame.homeScore} – {lastGame.awayScore}
        </Text>
        <Text style={styles.teamName}>{lastGame.awayTeam}</Text>
        <View
          style={[
            styles.teamBadge,
            { backgroundColor: "#00001a", borderColor: "#0055cc" },
          ]}
        >
          <Ionicons name="shield" size={20} color="#0055cc" />
        </View>
      </View>
      <View style={styles.divider} />

      <View style={styles.mvpRow}>
        <Ionicons name="star" size={14} color="#f5c518" />
        <Text style={styles.mvpLabel}>Match MVP</Text>
        <Text style={styles.mvpName}>Neymar .jr</Text>
        <Text style={styles.mvpStat}>34 pts · 9 ast</Text>
      </View>
    </View>
  );
}

function MVPSection() {
  return (
    <View style={styles.mvpSection}>
      <Image
        source={require("@/assets/images/playerDefaultPic.png")}
        style={styles.mvpAvatar}
        resizeMode="contain"
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.6)", "#000"]}
        style={styles.mvpFade}
      />
      <Text style={styles.mvpBadgeText}>MVP</Text>
      <Text style={styles.mvpPlayerName}>Neymar .jr</Text>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      translateX.setValue(0);
      Animated.timing(translateX, {
        toValue: -LOOP_WIDTH,
        duration: stats.length * 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(animate);
    };
    animate();
  }, []);
  
  return (
    <LinearGradient
      colors={["#000000", "#000000", "#00000060", "rgb(0, 0, 0)"]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <Image
          source={require("@/assets/images/ballerzWideLogo.png")}
          style={styles.headerImage}
          resizeMode="contain"
        />

        <StatsCarousel translateX={translateX} />

        <Text style={styles.sectionTitle}>Last Game</Text>
        <LastGameCard />

        <MVPSection />

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
    backgroundColor: "#181818",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    width: CARD_WIDTH,
    height: 130,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  cardLabel: {
    fontSize: 13,
    color: "#aaa",
    marginTop: 4,
  },

  // Section title
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 24,
    marginBottom: 10,
    marginHorizontal: 16,
  },

  // Last game card
  lastGameCard: {
    backgroundColor: "#181818",
    borderRadius: 16,
    marginHorizontal: 16,
    overflow: "hidden",
  },
  lastGameHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
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
  teamBlock: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  teamName: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  teamBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
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

  // MVP
  mvpSection: {
    alignItems: "center",
    marginTop: 24,
  },
  mvpAvatar: {
    width: 120,
    height: 120,
  },
  mvpFade: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    height: 70,
  },
  mvpBadgeText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#f5c518",
    letterSpacing: 2,
    marginTop: -14,
  },
  mvpPlayerName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 1,
    marginTop: 2,
  },

  // Button
  button: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "bold",
  },
});
