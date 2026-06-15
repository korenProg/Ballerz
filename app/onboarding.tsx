import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "../store";
import { T } from "../constants/theme";

const LEAGUE_COLORS = [
  "#0039a3",
  "#dc2626",
  "#059669",
  "#7c3aed",
  "#ea580c",
  "#0d9488",
  "#ca8a04",
  "#e11d48",
];

const TEAM_SIZES = [5, 6, 7, 8, 11];

const TOTAL_STEPS = 3;

export default function Onboarding() {
  const router = useRouter();
  const setLeague = useStore((s) => s.setLeague);
  const completeOnboarding = useStore((s) => s.completeOnboarding);

  const [showWelcome, setShowWelcome] = useState(true);
  const [step, setStep] = useState(0);
  const [adminName, setAdminName] = useState("");
  const [leagueName, setLeagueName] = useState("");
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [color, setColor] = useState(LEAGUE_COLORS[0]);
  const [location, setLocation] = useState("");
  const [teamSize, setTeamSize] = useState(5);

  const canContinue =
    step === 0 ? adminName.trim().length > 0 : step === 1 ? leagueName.trim().length > 0 : true;

  async function pickFromLibrary() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!res.canceled) setLogoUri(res.assets[0].uri);
  }

  async function takePhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Camera unavailable", "Allow camera access to take a photo.");
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!res.canceled) setLogoUri(res.assets[0].uri);
  }

  function pickLogo() {
    Alert.alert("League logo", "Choose a source", [
      { text: "Take Photo", onPress: takePhoto },
      { text: "Choose from Library", onPress: pickFromLibrary },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  function next() {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
      return;
    }
    setLeague({
      name: leagueName.trim(),
      logoUri,
      color,
      adminName: adminName.trim(),
      defaultLocation: location.trim(),
      defaultTeamSize: teamSize,
    });
    completeOnboarding();
    router.replace("/(tabs)");
  }

  if (showWelcome) {
    return (
      <SafeAreaView style={styles.main} edges={["top", "bottom"]}>
        <View style={styles.welcomeBody}>
          <View style={styles.welcomeLogo}>
            <Image
              source={require("../assets/images/ballerzLogo.png")}
              style={styles.welcomeLogoImg}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.welcomeWordmark}>Ballerz</Text>
          <Text style={styles.welcomeTagline}>Run your amateur league like a pro.</Text>
          <Text style={styles.welcomeDesc}>
            Track every match, rate your squad FIFA-style, and crown your league MVP.
          </Text>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.nextBtn}
            activeOpacity={0.8}
            onPress={() => setShowWelcome(false)}
          >
            <Text style={styles.nextBtnTxt}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.main} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
      <View style={styles.progressRow}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.progressSeg, i <= step && styles.progressSegActive]}
            disabled={i >= step}
            hitSlop={8}
            onPress={() => setStep(i)}
          />
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {step === 0 && (
          <View style={styles.stepBody}>
            <Text style={styles.eyebrow}>STEP 1 OF 3</Text>
            <Text style={styles.title}>Who's running the league?</Text>
            <Text style={styles.sub}>This is you — the league admin.</Text>

            <Text style={styles.fieldLabel}>Full name</Text>
            <TextInput
              style={styles.input}
              value={adminName}
              onChangeText={setAdminName}
              placeholder="e.g. Koren"
              placeholderTextColor={T.textMuted}
              autoFocus
              returnKeyType="next"
              onSubmitEditing={() => canContinue && next()}
            />
          </View>
        )}

        {step === 1 && (
          <View style={styles.stepBody}>
            <Text style={styles.eyebrow}>STEP 2 OF 3</Text>
            <Text style={styles.title}>Create your league</Text>
            <Text style={styles.sub}>Give it a name and a badge.</Text>

            <TouchableOpacity style={styles.logoPicker} activeOpacity={0.8} onPress={pickLogo}>
              {logoUri ? (
                <Image source={{ uri: logoUri }} style={styles.logoImage} />
              ) : (
                <>
                  <Ionicons name="image-outline" size={26} color={T.textSecondary} />
                  <Text style={styles.logoPickerTxt}>Add logo</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>League name</Text>
            <TextInput
              style={styles.input}
              value={leagueName}
              onChangeText={setLeagueName}
              placeholder="e.g. Sunday League"
              placeholderTextColor={T.textMuted}
              returnKeyType="next"
              onSubmitEditing={() => canContinue && next()}
            />
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepBody}>
            <Text style={styles.eyebrow}>STEP 3 OF 3</Text>
            <Text style={styles.title}>League defaults</Text>
            <Text style={styles.sub}>You can change these anytime.</Text>

            <Text style={styles.fieldLabel}>League color</Text>
            <View style={styles.swatchRow}>
              {LEAGUE_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.swatch, { backgroundColor: c }, color === c && styles.swatchActive]}
                  activeOpacity={0.8}
                  onPress={() => setColor(c)}
                >
                  {color === c && <Ionicons name="checkmark" size={16} color={T.textPrimary} />}
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Home pitch</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="e.g. City Park Field (optional)"
              placeholderTextColor={T.textMuted}
            />

            <Text style={styles.fieldLabel}>Players per team</Text>
            <View style={styles.sizeRow}>
              {TEAM_SIZES.map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[styles.sizeChip, teamSize === size && styles.sizeChipActive]}
                  activeOpacity={0.8}
                  onPress={() => setTeamSize(size)}
                >
                  <Text style={[styles.sizeChipTxt, teamSize === size && styles.sizeChipTxtActive]}>
                    {size}v{size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextBtn, !canContinue && styles.nextBtnDisabled]}
          activeOpacity={0.8}
          disabled={!canContinue}
          onPress={next}
        >
          <Text style={styles.nextBtnTxt}>{step === TOTAL_STEPS - 1 ? "Start Ballin'" : "Continue"}</Text>
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  main: { flex: 1, backgroundColor: T.bg, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 12 },
  flex: { flex: 1 },
  progressRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  progressSeg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: T.surface },
  progressSegActive: { backgroundColor: T.textPrimary },
  scrollContent: { paddingBottom: 24 },

  welcomeBody: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  welcomeLogo: {
    width: 120,
    height: 120,
    borderRadius: 32,
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 18,
  },
  welcomeLogoImg: { width: "78%", height: "78%" },
  welcomeWordmark: { fontSize: 40, fontWeight: "900", color: T.textPrimary, letterSpacing: 0.5 },
  welcomeTagline: { fontSize: 16, fontWeight: "700", color: T.textPrimary, textAlign: "center" },
  welcomeDesc: {
    fontSize: 14,
    color: T.textSecondary,
    textAlign: "center",
    lineHeight: 21,
    marginTop: 4,
    paddingHorizontal: 12,
  },

  stepBody: { marginTop: 36, gap: 6 },
  eyebrow: { fontSize: 11, fontWeight: "800", color: T.textSecondary, letterSpacing: 2 },
  title: { fontSize: 28, fontWeight: "900", color: T.textPrimary },
  sub: { fontSize: 13, color: T.textSecondary, marginBottom: 18 },

  fieldLabel: { fontSize: 12, fontWeight: "800", color: T.textSecondary, marginTop: 14, marginBottom: 8 },
  input: {
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: T.textPrimary,
  },

  logoPicker: {
    alignSelf: "center",
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: 8,
    overflow: "hidden",
  },
  logoImage: { width: "100%", height: "100%" },
  logoPickerTxt: { fontSize: 11, fontWeight: "700", color: T.textSecondary },

  swatchRow: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  swatchActive: { borderWidth: 2, borderColor: T.textPrimary },

  sizeRow: { flexDirection: "row", gap: 8 },
  sizeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
  },
  sizeChipActive: { backgroundColor: T.border },
  sizeChipTxt: { fontSize: 13, fontWeight: "700", color: T.textSecondary },
  sizeChipTxtActive: { color: T.textPrimary, fontWeight: "800" },

  footer: { flexDirection: "row", gap: 10, marginTop: 12 },
  nextBtn: {
    flex: 1,
    backgroundColor: T.textPrimary,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
  },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnTxt: { fontSize: 14, fontWeight: "800", color: T.bg },
});
