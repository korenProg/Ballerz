import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  type AlertButton,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStore } from "../../store";
import Crest from "../../components/Crest";
import { T, LEAGUE_COLORS, TEAM_SIZES } from "../../constants/theme";

export default function LeagueScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const league = useStore((s) => s.league);
  const setLeague = useStore((s) => s.setLeague);
  const resetAll = useStore((s) => s.resetAll);

  const [name, setName] = useState(league.name);
  const [logoUri, setLogoUri] = useState<string | null>(league.logoUri);
  const [color, setColor] = useState<string>(league.color);
  const [location, setLocation] = useState(league.defaultLocation);
  const [teamSize, setTeamSize] = useState<number>(league.defaultTeamSize);
  const [adminName, setAdminName] = useState(league.adminName);

  const dirty =
    name !== league.name ||
    logoUri !== league.logoUri ||
    color !== league.color ||
    location !== league.defaultLocation ||
    teamSize !== league.defaultTeamSize ||
    adminName !== league.adminName;

  const canSave = dirty && name.trim().length > 0;

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
    const buttons: AlertButton[] = [
      { text: "Take Photo", onPress: takePhoto },
      { text: "Choose from Library", onPress: pickFromLibrary },
    ];
    if (logoUri) {
      buttons.push({
        text: "Remove",
        style: "destructive",
        onPress: () => setLogoUri(null),
      });
    }
    buttons.push({ text: "Cancel", style: "cancel" });
    Alert.alert("League logo", "Choose a source", buttons);
  }

  function save() {
    if (!canSave) return;
    setLeague({
      name: name.trim(),
      logoUri,
      color,
      defaultLocation: location.trim(),
      defaultTeamSize: teamSize,
      adminName: adminName.trim(),
    });
  }

  function confirmReset() {
    Alert.alert(
      "Reset all data?",
      "This deletes every player, game and league setting on this device. It cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset everything",
          style: "destructive",
          onPress: () => {
            resetAll();
            router.replace("/onboarding");
          },
        },
      ]
    );
  }

  return (
    <View style={styles.main}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 110 },
          ]}
        >
          <Text style={styles.title}>League</Text>
          <Text style={styles.subtitle}>Settings for this device</Text>

          <View style={styles.crestRow}>
            <Pressable
              style={({ pressed }) => [styles.crestBtn, pressed ? styles.pressed : null]}
              onPress={pickLogo}
            >
              <Crest
                name={name || "League"}
                color={color}
                logo={logoUri ?? undefined}
                size={72}
              />
              <View style={styles.crestEditBadge}>
                <Ionicons name="camera" size={12} color={T.bg} />
              </View>
            </Pressable>
            <View style={styles.crestCopy}>
              <Text style={styles.crestTitle}>League crest</Text>
              <Text style={styles.crestSub}>
                Tap to change. Without an image, the initials sit on your league color.
              </Text>
            </View>
          </View>

          <Text style={styles.fieldLabel}>League name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Sunday League"
            placeholderTextColor={T.textMuted}
          />

          <Text style={styles.fieldLabel}>League color</Text>
          <View style={styles.swatches}>
            {LEAGUE_COLORS.map((c) => (
              <Pressable
                key={c}
                style={[
                  styles.swatch,
                  { backgroundColor: c },
                  color === c ? styles.swatchActive : null,
                ]}
                onPress={() => setColor(c)}
              >
                {color === c ? (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                ) : null}
              </Pressable>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Admin name</Text>
          <TextInput
            style={styles.input}
            value={adminName}
            onChangeText={setAdminName}
            placeholder="Who runs the league"
            placeholderTextColor={T.textMuted}
          />

          <Text style={styles.fieldLabel}>Default location</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="The usual pitch"
            placeholderTextColor={T.textMuted}
          />

          <Text style={styles.fieldLabel}>Default team size</Text>
          <View style={styles.sizes}>
            {TEAM_SIZES.map((s) => (
              <Pressable
                key={s}
                style={[styles.size, teamSize === s ? styles.sizeActive : null]}
                onPress={() => setTeamSize(s)}
              >
                <Text
                  style={[styles.sizeTxt, teamSize === s ? styles.sizeTxtActive : null]}
                >
                  {s}v{s}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.saveBtn,
              canSave ? null : styles.saveBtnDisabled,
              pressed ? styles.pressed : null,
            ]}
            disabled={!canSave}
            onPress={save}
          >
            <Text style={styles.saveTxt}>
              {dirty ? "Save changes" : "Saved"}
            </Text>
          </Pressable>

          <View style={styles.dangerZone}>
            <Text style={styles.dangerLabel}>DANGER ZONE</Text>
            <Pressable
              style={({ pressed }) => [styles.resetBtn, pressed ? styles.pressed : null]}
              onPress={confirmReset}
            >
              <Ionicons name="trash-outline" size={18} color="#dc2626" />
              <Text style={styles.resetTxt}>Reset all data</Text>
            </Pressable>
            <Text style={styles.dangerSub}>
              Deletes every player, game and setting, then restarts onboarding.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  main: { flex: 1, backgroundColor: T.bg },
  flex: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  pressed: { opacity: 0.6 },

  title: { fontSize: 30, fontWeight: "900", color: T.textPrimary, letterSpacing: 0.3 },
  subtitle: { fontSize: 13, fontWeight: "600", color: T.textSecondary, marginTop: 2 },

  crestRow: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 22 },
  crestBtn: { position: "relative" },
  crestEditBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.textPrimary,
    borderWidth: 2,
    borderColor: T.bg,
  },
  crestCopy: { flex: 1, gap: 3 },
  crestTitle: { fontSize: 15, fontWeight: "800", color: T.textPrimary },
  crestSub: { fontSize: 12, fontWeight: "600", color: T.textSecondary, lineHeight: 17 },

  fieldLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: T.textMuted,
    letterSpacing: 1,
    marginTop: 22,
    marginBottom: 8,
  },
  input: {
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    fontWeight: "600",
    color: T.textPrimary,
  },

  swatches: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  swatch: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  swatchActive: { borderColor: T.textPrimary },

  sizes: { flexDirection: "row", gap: 8 },
  size: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
  },
  sizeActive: { backgroundColor: T.textPrimary, borderColor: T.textPrimary },
  sizeTxt: { fontSize: 13, fontWeight: "800", color: T.textSecondary },
  sizeTxtActive: { color: T.bg },

  saveBtn: {
    marginTop: 28,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: T.textPrimary,
  },
  saveBtnDisabled: { opacity: 0.35 },
  saveTxt: { fontSize: 15, fontWeight: "900", color: T.bg },

  dangerZone: { marginTop: 38, gap: 8 },
  dangerLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: "#dc2626",
    letterSpacing: 1,
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: "#dc2626",
  },
  resetTxt: { fontSize: 14, fontWeight: "800", color: "#dc2626" },
  dangerSub: {
    fontSize: 12,
    fontWeight: "600",
    color: T.textSecondary,
    textAlign: "center",
    lineHeight: 17,
  },
});
