import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  SafeAreaView,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useStore } from "../store";
import { calculateOvr } from "../utils/ovr";

const POSITIONS = ["GK", "DF", "MF", "FW"] as const;
const FORMS = [
  { value: "hot", label: "🔥 Hot" },
  { value: "neutral", label: "➡️ Neutral" },
  { value: "cold", label: "❄️ Cold" },
] as const;

type StatKey = "pac" | "sho" | "pas" | "dri" | "def" | "phy";
const STAT_KEYS: StatKey[] = ["pac", "sho", "pas", "dri", "def", "phy"];
const STAT_LABELS: Record<StatKey, string> = {
  pac: "PAC", sho: "SHO", pas: "PAS", dri: "DRI", def: "DEF", phy: "PHY",
};

export default function CreatePlayer() {
  const router = useRouter();
  const { playerId } = useLocalSearchParams<{ playerId?: string }>();
  const { addPlayer, updatePlayer, players } = useStore();
  const existingPlayer = playerId ? players.find((p) => p.id === playerId) ?? null : null;
  const isEditing = !!existingPlayer;

  const [photo, setPhoto] = useState<string | undefined>(existingPlayer?.photo);
  const [name, setName] = useState(existingPlayer?.name ?? "");
  const [position, setPosition] = useState<string>(existingPlayer?.position ?? "MF");
  const [foot, setFoot] = useState<"L" | "R">(existingPlayer?.foot ?? "R");
  const [form, setForm] = useState<"hot" | "cold" | "neutral">(existingPlayer?.form ?? "neutral");
  const [stats, setStats] = useState<Record<StatKey, string>>({
    pac: existingPlayer ? String(existingPlayer.pac) : "",
    sho: existingPlayer ? String(existingPlayer.sho) : "",
    pas: existingPlayer ? String(existingPlayer.pas) : "",
    dri: existingPlayer ? String(existingPlayer.dri) : "",
    def: existingPlayer ? String(existingPlayer.def) : "",
    phy: existingPlayer ? String(existingPlayer.phy) : "",
  });

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  }

  function setStat(key: StatKey, raw: string) {
    const cleaned = raw.replace(/[^0-9]/g, "").slice(0, 2);
    setStats((prev) => ({ ...prev, [key]: cleaned }));
  }

  const parsedStats = {
    pac: parseInt(stats.pac) || 0,
    sho: parseInt(stats.sho) || 0,
    pas: parseInt(stats.pas) || 0,
    dri: parseInt(stats.dri) || 0,
    def: parseInt(stats.def) || 0,
    phy: parseInt(stats.phy) || 0,
  };
  const ovr = calculateOvr(
    parsedStats.pac, parsedStats.sho, parsedStats.pas,
    parsedStats.dri, parsedStats.def, parsedStats.phy
  );
  const hasAtLeastOneStat = STAT_KEYS.some((k) => stats[k] !== "");
  const canSave = name.trim().length > 0 && hasAtLeastOneStat;

  function save() {
    if (!canSave) {
      Alert.alert("Missing info", "Enter a name and at least one stat.");
      return;
    }
    const data = {
      name: name.trim(),
      photo,
      position,
      foot,
      form,
      ovr,
      ...parsedStats,
      goals: existingPlayer?.goals ?? 0,
      assists: existingPlayer?.assists ?? 0,
      mvps: existingPlayer?.mvps ?? 0,
      isMvp: existingPlayer?.isMvp ?? false,
    };
    if (isEditing && existingPlayer) {
      updatePlayer(existingPlayer.id, data);
    } else {
      addPlayer(data);
    }
    router.back();
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={26} color="#aaa" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{isEditing ? "Edit Player" : "Add Player"}</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        <TouchableOpacity style={s.photoRow} onPress={pickPhoto}>
          {photo ? (
            <Image source={{ uri: photo }} style={s.photoImg} />
          ) : (
            <View style={s.photoPlaceholder}>
              <Ionicons name="person" size={36} color="#555" />
            </View>
          )}
          <Text style={s.photoHint}>Tap to add photo</Text>
        </TouchableOpacity>

        <Text style={s.label}>Name</Text>
        <TextInput
          style={s.input}
          value={name}
          onChangeText={setName}
          placeholder="Player name"
          placeholderTextColor="#555"
        />

        <Text style={s.label}>Position</Text>
        <View style={s.pills}>
          {POSITIONS.map((p) => (
            <TouchableOpacity
              key={p}
              style={[s.pill, position === p && s.pillActive]}
              onPress={() => setPosition(p)}
            >
              <Text style={[s.pillText, position === p && s.pillTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>Preferred foot</Text>
        <View style={s.pills}>
          {(["L", "R"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[s.pill, foot === f && s.pillActive]}
              onPress={() => setFoot(f)}
            >
              <Text style={[s.pillText, foot === f && s.pillTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>Form</Text>
        <View style={s.pills}>
          {FORMS.map((fm) => (
            <TouchableOpacity
              key={fm.value}
              style={[s.pill, { flex: 1 }, form === fm.value && s.pillActive]}
              onPress={() => setForm(fm.value)}
            >
              <Text style={[s.pillText, form === fm.value && s.pillTextActive]}>{fm.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>Stats</Text>
        <View style={s.statsGrid}>
          {STAT_KEYS.map((key) => (
            <View key={key} style={s.statCell}>
              <Text style={s.statLabel}>{STAT_LABELS[key]}</Text>
              <TextInput
                style={s.statInput}
                value={stats[key]}
                onChangeText={(v) => setStat(key, v)}
                keyboardType="numeric"
                maxLength={2}
                placeholder="—"
                placeholderTextColor="#444"
                textAlign="center"
              />
            </View>
          ))}
        </View>

        <View style={s.ovrRow}>
          <Text style={s.ovrLabel}>OVR</Text>
          <Text style={s.ovrValue}>{hasAtLeastOneStat ? ovr : "—"}</Text>
        </View>

        <TouchableOpacity
          style={[s.saveBtn, !canSave && s.saveBtnDisabled]}
          onPress={save}
          disabled={!canSave}
        >
          <Text style={s.saveBtnText}>{isEditing ? "Save Changes" : "Add Player"}</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0a0a0a" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#fff" },
  scroll: { padding: 16, gap: 12, paddingBottom: 40 },
  photoRow: { alignItems: "center", gap: 8, marginVertical: 8 },
  photoImg: { width: 88, height: 88, borderRadius: 44 },
  photoPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#2a2a2a",
    borderStyle: "dashed",
  },
  photoHint: { fontSize: 13, color: "#555" },
  label: { fontSize: 12, fontWeight: "600", color: "#aaa", textTransform: "uppercase", letterSpacing: 0.5 },
  input: {
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  pills: { flexDirection: "row", gap: 10 },
  pill: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    alignItems: "center",
  },
  pillActive: { backgroundColor: "#f5c518", borderColor: "#f5c518" },
  pillText: { color: "#aaa", fontWeight: "600", fontSize: 14 },
  pillTextActive: { color: "#000" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCell: { width: "30%", alignItems: "center", gap: 4 },
  statLabel: { fontSize: 11, fontWeight: "700", color: "#888", textTransform: "uppercase" },
  statInput: {
    width: "100%",
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    paddingVertical: 10,
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  ovrRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  ovrLabel: { fontSize: 14, fontWeight: "700", color: "#aaa" },
  ovrValue: { fontSize: 28, fontWeight: "900", color: "#f5c518" },
  saveBtn: {
    backgroundColor: "#f5c518",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { color: "#000", fontWeight: "700", fontSize: 16 },
});
