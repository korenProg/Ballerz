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
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useStore } from "../store";

const PRESET_COLORS = ["#f5c518", "#0039a3", "#cc0000", "#1a7a1a", "#7b2fbe", "#e0e0e0"];
const TEAM_SIZES = [5, 7, 11];

export default function Onboarding() {
  const router = useRouter();
  const { setLeague, completeOnboarding } = useStore();

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [color, setColor] = useState("#0039a3");
  const [adminName, setAdminName] = useState("");
  const [defaultLocation, setDefaultLocation] = useState("");
  const [defaultTeamSize, setDefaultTeamSize] = useState(5);

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

  function finish() {
    if (!name.trim()) {
      Alert.alert("Missing info", "Please enter a league name.");
      return;
    }
    setLeague({ name: name.trim(), logoUri, color, adminName: adminName.trim(), defaultLocation: defaultLocation.trim(), defaultTeamSize });
    completeOnboarding();
    router.replace("/(tabs)");
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* Progress dots */}
        <View style={s.dots}>
          {[1, 2, 3].map((n) => (
            <View key={n} style={[s.dot, step >= n && s.dotActive]} />
          ))}
        </View>

        {step === 1 && (
          <View style={s.section}>
            <Text style={s.title}>Create your league</Text>
            <Text style={s.subtitle}>Let&apos;s get you set up</Text>

            {/* Logo picker */}
            <TouchableOpacity style={s.logoPicker} onPress={pickLogo}>
              {logoUri ? (
                <Image source={{ uri: logoUri }} style={s.logoImg} />
              ) : (
                <View style={s.logoPlaceholder}>
                  <Ionicons name="trophy" size={40} color="#555" />
                </View>
              )}
              <Text style={s.logoHint}>Tap to add logo (optional)</Text>
            </TouchableOpacity>

            {/* League name */}
            <Text style={s.label}>League name</Text>
            <TextInput
              style={s.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Sunday League"
              placeholderTextColor="#555"
            />

            {/* Color swatches */}
            <Text style={s.label}>League color</Text>
            <View style={s.swatches}>
              {PRESET_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[s.swatch, { backgroundColor: c }, color === c && s.swatchSelected]}
                  onPress={() => setColor(c)}
                />
              ))}
            </View>

            <TouchableOpacity style={s.btn} onPress={() => setStep(2)}>
              <Text style={s.btnText}>Next</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View style={s.section}>
            <Text style={s.title}>Details</Text>

            <Text style={s.label}>Your name (admin)</Text>
            <TextInput
              style={s.input}
              value={adminName}
              onChangeText={setAdminName}
              placeholder="e.g. Koren"
              placeholderTextColor="#555"
            />

            <Text style={s.label}>Default location</Text>
            <TextInput
              style={s.input}
              value={defaultLocation}
              onChangeText={setDefaultLocation}
              placeholder="e.g. The Cage"
              placeholderTextColor="#555"
            />

            <Text style={s.label}>Default team size</Text>
            <View style={s.pills}>
              {TEAM_SIZES.map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[s.pill, defaultTeamSize === n && s.pillActive]}
                  onPress={() => setDefaultTeamSize(n)}
                >
                  <Text style={[s.pillText, defaultTeamSize === n && s.pillTextActive]}>
                    {n}v{n}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.row}>
              <TouchableOpacity style={[s.btn, s.btnSecondary]} onPress={() => setStep(1)}>
                <Text style={s.btnSecondaryText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btn, { flex: 1 }]} onPress={() => setStep(3)}>
                <Text style={s.btnText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={s.section}>
            <Text style={s.title}>You&apos;re all set</Text>

            {/* Preview card */}
            <View style={[s.previewCard, { borderColor: color }]}>
              <View style={[s.previewBanner, { backgroundColor: color }]} />
              <View style={s.previewBody}>
                {logoUri ? (
                  <Image source={{ uri: logoUri }} style={s.previewLogo} />
                ) : (
                  <View style={[s.previewLogo, s.previewLogoPlaceholder]}>
                    <Ionicons name="trophy" size={28} color="#555" />
                  </View>
                )}
                <Text style={s.previewName}>{name || "Your League"}</Text>
                {adminName ? <Text style={s.previewAdmin}>{adminName}</Text> : null}
              </View>
            </View>

            <View style={s.row}>
              <TouchableOpacity style={[s.btn, s.btnSecondary]} onPress={() => setStep(2)}>
                <Text style={s.btnSecondaryText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btn, { flex: 1 }]} onPress={finish}>
                <Text style={s.btnText}>Let&apos;s go 🚀</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0a0a0a" },
  scroll: { flexGrow: 1, padding: 24 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 32 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#333" },
  dotActive: { backgroundColor: "#f5c518" },
  section: { flex: 1, gap: 16 },
  title: { fontSize: 28, fontWeight: "700", color: "#fff" },
  subtitle: { fontSize: 15, color: "#888" },
  label: { fontSize: 13, fontWeight: "600", color: "#aaa", textTransform: "uppercase", letterSpacing: 0.5 },
  input: {
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  logoPicker: { alignItems: "center", gap: 8, marginVertical: 8 },
  logoImg: { width: 88, height: 88, borderRadius: 44 },
  logoPlaceholder: {
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
  logoHint: { fontSize: 13, color: "#555" },
  swatches: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  swatch: { width: 36, height: 36, borderRadius: 18 },
  swatchSelected: { borderWidth: 3, borderColor: "#fff" },
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
  pillText: { color: "#aaa", fontWeight: "600", fontSize: 15 },
  pillTextActive: { color: "#000" },
  btn: {
    backgroundColor: "#f5c518",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  btnText: { color: "#000", fontWeight: "700", fontSize: 16 },
  btnSecondary: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    width: 80,
    marginTop: 8,
    marginRight: 10,
  },
  btnSecondaryText: { color: "#aaa", fontWeight: "600", fontSize: 16 },
  row: { flexDirection: "row", alignItems: "center" },
  previewCard: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 2,
    backgroundColor: "#111",
    marginVertical: 8,
  },
  previewBanner: { height: 60 },
  previewBody: { alignItems: "center", paddingVertical: 16, gap: 8 },
  previewLogo: { width: 64, height: 64, borderRadius: 32, marginTop: -42 },
  previewLogoPlaceholder: {
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#333",
    marginTop: -42,
  },
  previewName: { fontSize: 20, fontWeight: "700", color: "#fff" },
  previewAdmin: { fontSize: 13, color: "#888" },
});
