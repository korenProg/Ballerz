import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Alert,
  Image,
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
import { TopBar } from "@/components/TopBar";

const PRESET_COLORS = ["#f5c518", "#0039a3", "#cc0000", "#1a7a1a", "#7b2fbe", "#e0e0e0"];
const TEAM_SIZES = [5, 7, 11];

export default function LeagueScreen() {
  const { league, setLeague } = useStore();
  const { gamesCount, playersCount, totalGoals } = useAppStats();

  const [name, setName] = useState(league.name);
  const [logoUri, setLogoUri] = useState<string | null>(league.logoUri);
  const [color, setColor] = useState(league.color);
  const [adminName, setAdminName] = useState(league.adminName);
  const [defaultLocation, setDefaultLocation] = useState(league.defaultLocation);
  const [defaultTeamSize, setDefaultTeamSize] = useState(league.defaultTeamSize);

  async function pickLogo() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setLogoUri(result.assets[0].uri);
  }

  function save() {
    if (!name.trim()) {
      Alert.alert("Missing info", "League name cannot be empty.");
      return;
    }
    setLeague({ name: name.trim(), logoUri, color, adminName: adminName.trim(), defaultLocation: defaultLocation.trim(), defaultTeamSize });
    Alert.alert("Saved", "League settings updated.");
  }

  return (
    <View style={s.root}>
      {/* ── TopBar + banner ── */}
      <LinearGradient colors={[color + "cc", color + "22", color + "00"]} locations={[0, 0.65, 1]} style={s.headerGradient}>
        <TopBar title="League" />
        <View style={s.banner}>
          <TouchableOpacity onPress={pickLogo} style={s.avatarWrap}>
            {logoUri
              ? <Image source={{ uri: logoUri }} style={[s.avatar, { borderWidth: 2, borderColor: color + "cc" }]} />
              : <View style={[s.avatar, s.avatarFallback]}>
                  <Ionicons name="trophy" size={26} color={color} />
                </View>
            }
          </TouchableOpacity>
          <View style={s.bannerInfo}>
            <Text style={s.bannerName} numberOfLines={1}>{league.name || "Your League"}</Text>
            {league.adminName ? <Text style={s.bannerAdmin}>{league.adminName}</Text> : null}
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Stats strip */}
        <View style={s.statsRow}>
          {[
            { label: "Games",   value: gamesCount },
            { label: "Players", value: playersCount },
            { label: "Goals",   value: totalGoals },
          ].map((st) => (
            <View key={st.label} style={s.statChip}>
              <Text style={s.statValue}>{st.value}</Text>
              <Text style={s.statLabel}>{st.label}</Text>
            </View>
          ))}
        </View>

        {/* Form */}
        <View style={s.form}>
          <TextInput style={s.input} value={name} onChangeText={setName} placeholder="League name" placeholderTextColor={T.textMuted} />
          <TextInput style={s.input} value={adminName} onChangeText={setAdminName} placeholder="Admin name" placeholderTextColor={T.textMuted} />
          <TextInput style={s.input} value={defaultLocation} onChangeText={setDefaultLocation} placeholder="Default location" placeholderTextColor={T.textMuted} />

          {/* Color row */}
          <View style={s.colorRow}>
            {PRESET_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[s.swatch, { backgroundColor: c }, color === c && { borderColor: c, borderWidth: 3, transform: [{ scale: 1.15 }] }]}
                onPress={() => setColor(c)}
              />
            ))}
          </View>

          {/* Team size */}
          <View style={s.sizeRow}>
            {TEAM_SIZES.map((n) => (
              <TouchableOpacity
                key={n}
                style={[s.sizePill, defaultTeamSize === n && { backgroundColor: "#f59e0b", borderColor: "#f59e0b" }]}
                onPress={() => setDefaultTeamSize(n)}
              >
                <Text style={[s.sizeTxt, defaultTeamSize === n && s.sizeTxtActive]}>{n}v{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Save */}
        <TouchableOpacity style={s.saveBtn} onPress={save} activeOpacity={0.85}>
          <Text style={s.saveTxt}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },

  headerGradient: { paddingBottom: 20 },
  banner: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  avatarWrap: {},
  avatar: { width: 60, height: 60, borderRadius: 30 },
  avatarFallback: { backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" },
  bannerInfo: { flex: 1, gap: 3 },
  bannerName: { fontSize: 20, fontWeight: "800", color: "#fff" },
  bannerAdmin: { fontSize: 12, color: "rgba(255,255,255,0.55)" },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  // stats
  statsRow: { flexDirection: "row", marginHorizontal: 16, marginTop: 20, marginBottom: 8, gap: 8 },
  statChip: { flex: 1, backgroundColor: T.surface, borderRadius: T.radius.pill, paddingVertical: 10, alignItems: "center", borderWidth: 1, borderColor: T.border },
  statValue: { fontSize: 22, fontWeight: "800", color: T.textPrimary },
  statLabel: { fontSize: 10, color: T.textMuted, fontWeight: "600", marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5 },

  // form
  form: { paddingHorizontal: 16, gap: 10, marginTop: 4 },
  input: { backgroundColor: T.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: T.textPrimary, borderWidth: 1, borderColor: T.border },
  colorRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  swatch: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: "transparent" },
  sizeRow: { flexDirection: "row", gap: 10 },
  sizePill: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: T.border, alignItems: "center", backgroundColor: T.surface },
  sizeTxt: { color: T.textSecondary, fontWeight: "700", fontSize: 13 },
  sizeTxtActive: { color: "#fff" },

  // save
  saveBtn: { margin: 16, marginTop: 16, paddingVertical: 15, borderRadius: T.radius.pill, alignItems: "center", backgroundColor: "#f59e0b" },
  saveTxt: { color: "#000", fontWeight: "800", fontSize: 15 },
});
