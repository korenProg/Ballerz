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
  type TextInputProps,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useStore } from "../../store";
import Crest from "../../components/Crest";
import ScreenHeader from "../../components/ui/ScreenHeader";
import Section from "../../components/ui/Section";
import Button from "../../components/ui/Button";
import { T, SPACE, RADIUS, LEAGUE_COLORS, TEAM_SIZES } from "../../constants/theme";

function Field({ label, ...input }: { label: string } & TextInputProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput style={styles.input} placeholderTextColor={T.textFaint} {...input} />
    </View>
  );
}

export default function LeagueScreen() {
  const router = useRouter();
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
    const res = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!res.canceled) setLogoUri(res.assets[0].uri);
  }

  function pickLogo() {
    const buttons: AlertButton[] = [
      { text: "Take Photo", onPress: takePhoto },
      { text: "Choose from Library", onPress: pickFromLibrary },
    ];
    if (logoUri) buttons.push({ text: "Remove", style: "destructive", onPress: () => setLogoUri(null) });
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
      <ScreenHeader title="League" subtitle="Settings" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Section>
            <Pressable
              accessibilityRole="button"
              onPress={pickLogo}
              style={({ pressed }) => [styles.crestRow, pressed ? styles.pressed : null]}
            >
              <Crest name={name || "League"} color={color} logo={logoUri ?? undefined} size={56} />
              <View style={styles.crestCopy}>
                <Text style={styles.crestTitle}>League crest</Text>
                <Text style={styles.crestSub}>Tap to change</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={T.textFaint} />
            </Pressable>
          </Section>

          <Section title="Details" padded>
            <View style={styles.fields}>
              <Field label="League name" value={name} onChangeText={setName} placeholder="Sunday League" />
              <Field label="Admin name" value={adminName} onChangeText={setAdminName} placeholder="Who runs the league" />
              <Field
                label="Default location"
                value={location}
                onChangeText={setLocation}
                placeholder="The usual pitch"
              />
            </View>
          </Section>

          <Section title="League color" padded>
            <View style={styles.swatches}>
              {LEAGUE_COLORS.map((c) => (
                <Pressable
                  key={c}
                  accessibilityRole="button"
                  accessibilityLabel={`Color ${c}`}
                  accessibilityState={{ selected: color === c }}
                  style={[styles.swatch, { backgroundColor: c }, color === c ? styles.swatchActive : null]}
                  onPress={() => setColor(c)}
                >
                  {color === c ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
                </Pressable>
              ))}
            </View>
          </Section>

          <Section title="Default team size" padded>
            <View style={styles.sizes}>
              {TEAM_SIZES.map((s) => (
                <Pressable
                  key={s}
                  accessibilityRole="button"
                  accessibilityState={{ selected: teamSize === s }}
                  style={[styles.size, teamSize === s ? styles.sizeActive : null]}
                  onPress={() => setTeamSize(s)}
                >
                  <Text style={[styles.sizeTxt, teamSize === s ? styles.sizeTxtActive : null]}>
                    {s}v{s}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Section>

          <Button label={dirty ? "Save changes" : "Saved"} disabled={!canSave} onPress={save} />

          <Section title="Danger zone" padded>
            <View style={styles.danger}>
              <Text style={styles.dangerSub}>
                Deletes every player, game and setting on this device, then restarts onboarding.
              </Text>
              <Button variant="destructive" icon="trash-outline" label="Reset all data" onPress={confirmReset} />
            </View>
          </Section>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  main: { flex: 1, backgroundColor: T.bg },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: SPACE.lg, paddingBottom: SPACE.xxxl, gap: SPACE.lg },
  pressed: { backgroundColor: T.surfaceAlt },
  crestRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: SPACE.lg },
  crestCopy: { flex: 1, gap: 2 },
  crestTitle: { fontSize: 15, fontWeight: "600", color: T.text },
  crestSub: { fontSize: 13, fontWeight: "400", color: T.textDim },
  fields: { gap: SPACE.md },
  field: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: "500", color: T.textFaint },
  input: {
    backgroundColor: T.surfaceAlt,
    borderRadius: RADIUS.control,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: "500",
    color: T.text,
  },
  swatches: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  swatchActive: { borderColor: T.text },
  sizes: { flexDirection: "row", gap: SPACE.sm },
  size: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: RADIUS.control,
    backgroundColor: T.surfaceAlt,
  },
  sizeActive: { backgroundColor: T.accent },
  sizeTxt: { fontSize: 13, fontWeight: "600", color: T.textDim, fontVariant: ["tabular-nums"] },
  sizeTxtActive: { color: "#000" },
  danger: { gap: SPACE.md },
  dangerSub: { fontSize: 13, fontWeight: "400", color: T.textDim, lineHeight: 18 },
});
