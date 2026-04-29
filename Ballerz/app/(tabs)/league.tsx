import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useStore } from "../../store";
import { useAppStats } from "../../store/selectors";
import { T } from "../../constants/theme";

const PRESET_COLORS = [
  "#f5c518",
  "#0039a3",
  "#cc0000",
  "#1a7a1a",
  "#7b2fbe",
  "#e0e0e0",
];
const TEAM_SIZES = [5, 7, 11];

export default function LeagueScreen() {
  const { league, games, setLeague } = useStore();

  const [name, setName] = useState(league.name);
  const [logoUri, setLogoUri] = useState<string | null>(league.logoUri);
  const [color, setColor] = useState(league.color);
  const [adminName, setAdminName] = useState(league.adminName);
  const [defaultLocation, setDefaultLocation] = useState(
    league.defaultLocation,
  );
  const [defaultTeamSize, setDefaultTeamSize] = useState(
    league.defaultTeamSize,
  );

  async function pickLogo() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setLogoUri(result.assets[0].uri);
    }
  }

  function save() {
    if (!name.trim()) {
      Alert.alert("Missing info", "League name cannot be empty.");
      return;
    }
    setLeague({
      name: name.trim(),
      logoUri,
      color,
      adminName: adminName.trim(),
      defaultLocation: defaultLocation.trim(),
      defaultTeamSize,
    });
    Alert.alert("Saved", "League settings updated.");
  }

  const { gamesCount, playersCount, totalGoals } = useAppStats();

  const appStats = [
    { label: "Games", value: String(gamesCount), accent: "#ffffff" },
    { label: "Players", value: String(playersCount), accent: "#ffffff" },
    { label: "Goals", value: String(totalGoals), accent: "#ffffff" },
  ];

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Profile card */}
        <View style={s.profileCard}>
          <LinearGradient
            colors={[color, "#192f6a00"]} // 1. Array of colors (Required)
            start={{ x: 0, y: 0 }} // 2. Starting point {x, y}
            end={{ x: 0, y: 1 }} // 3. Ending point {x, y}
            locations={[0, 0.5, 1]} // 4. Color stop positions
          >
            <View style={s.cardBody}>
              <TouchableOpacity onPress={pickLogo}>
                {logoUri ? (
                  <Image source={{ uri: logoUri }} style={s.logo} />
                ) : (
                  <View style={[s.logo, s.logoPlaceholder]}>
                    <Ionicons name="trophy" size={28} color="#555" />
                  </View>
                )}
              </TouchableOpacity>
              <Text style={s.leagueName}>{league.name || "Your League"}</Text>
              {league.adminName ? (
                <Text style={s.adminName}>{league.adminName}</Text>
              ) : null}
            </View>
          </LinearGradient>
        </View>

        {/* ── Stats Strip ─────────────────────────────────────────────────── */}
        <View style={s.statsRow}>
          {appStats.map((stat, i) => (
            <View key={i} style={s.statChip}>
              <Text style={[s.statValue, { color: stat.accent }]}>
                {stat.value}
              </Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Edit form */}

        <Text style={s.label}>League name</Text>
        <TextInput
          style={s.input}
          value={name}
          onChangeText={setName}
          placeholderTextColor="#555"
          placeholder="Sunday League"
        />

        <Text style={s.label}>League color</Text>
        <View style={s.swatches}>
          {PRESET_COLORS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[
                s.swatch,
                { backgroundColor: c },
                color === c && s.swatchSelected,
              ]}
              onPress={() => setColor(c)}
            />
          ))}
        </View>

        <Text style={s.label}>Admin name</Text>
        <TextInput
          style={s.input}
          value={adminName}
          onChangeText={setAdminName}
          placeholderTextColor="#555"
          placeholder="Your name"
        />

        <Text style={s.label}>Default location</Text>
        <TextInput
          style={s.input}
          value={defaultLocation}
          onChangeText={setDefaultLocation}
          placeholderTextColor="#555"
          placeholder="e.g. The Cage"
        />

        <Text style={s.label}>Default team size</Text>
        <View style={s.pills}>
          {TEAM_SIZES.map((n) => (
            <TouchableOpacity
              key={n}
              style={[s.pill, defaultTeamSize === n && s.pillActive]}
              onPress={() => setDefaultTeamSize(n)}
            >
              <Text
                style={[s.pillText, defaultTeamSize === n && s.pillTextActive]}
              >
                {n}v{n}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={s.saveBtn} onPress={save}>
          <Text style={s.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.bg },
  scroll: { padding: 16, gap: 12, paddingBottom: 40 },
  cardBody: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
    gap: 8,
  },
  profileCard: { borderRadius: 16, overflow: "hidden" },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderColor: "#383838",
    borderWidth: 2,
  },
  logoPlaceholder: {
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#333",
  },

  leagueName: { fontSize: 22, fontWeight: "700", color: "#fff", marginTop: 4 },
  adminName: {
    fontSize: 12,
    color: "#bbb",
    backgroundColor: "#44444488",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  gameCount: { fontSize: 12, color: "#555", marginTop: 2 },

  // ── Stats
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  statChip: {
    flex: 1,
    backgroundColor: T.surface,
    borderRadius: T.radius.pill,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: T.border,
    marginVertical: 10,
  },
  statValue: { fontSize: 26, fontWeight: "800" },
  statLabel: {
    fontSize: 10,
    color: "#4a4a4a",
    fontWeight: "600",
    marginTop: 3,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: "#aaa",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: T.surface,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: T.border,
    marginTop: -6,
  },
  logoPicker: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    gap: 10,
  },
  logoThumb: { width: 28, height: 28, borderRadius: 14 },
  logoPickerText: { flex: 1, color: "#aaa", fontSize: 15 },
  swatches: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  swatch: { width: 36, height: 36, borderRadius: 18 },
  swatchSelected: { borderWidth: 3, borderColor: "#fff" },
  pills: { flexDirection: "row", gap: 10 },
  pill: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
  },
  pillActive: { backgroundColor: T.accent, borderColor: T.accent },
  pillText: { color: "#aaa", fontWeight: "600", fontSize: 15 },
  pillTextActive: { color: "#000" },
  saveBtn: {
    backgroundColor: T.accent,
    borderRadius: T.radius.pill,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnText: { color: "#000", fontWeight: "700", fontSize: 16 },
});
