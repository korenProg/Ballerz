import { useRef, useState } from "react";
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
  PanResponder,
  LayoutChangeEvent,
  DimensionValue,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "../store";
import { calculateOvr } from "../utils/ovr";
import { T } from "../constants/theme";

const POSITIONS = ["GK", "DEF", "MID", "FWD"] as const;
type Position = (typeof POSITIONS)[number];

const ATTR_ROWS = [
  ["pac", "PAC"],
  ["sho", "SHO"],
  ["pas", "PAS"],
  ["dri", "DRI"],
  ["def", "DEF"],
  ["phy", "PHY"],
] as const;

type AttrKey = (typeof ATTR_ROWS)[number][0];

const THUMB = 22;

function Slider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const widthRef = useRef(0);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const setFromX = (x: number) => {
    const w = widthRef.current;
    if (!w) return;
    const ratio = Math.max(0, Math.min(1, x / w));
    onChangeRef.current(Math.round(ratio * 99));
  };

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => setFromX(e.nativeEvent.locationX),
      onPanResponderMove: (e) => setFromX(e.nativeEvent.locationX),
    })
  ).current;

  const onLayout = (e: LayoutChangeEvent) => {
    widthRef.current = e.nativeEvent.layout.width;
  };

  const pct = `${(value / 99) * 100}%` as DimensionValue;

  return (
    <View style={styles.sliderArea} onLayout={onLayout} {...responder.panHandlers}>
      <View style={styles.sliderBar} pointerEvents="none" />
      <View style={[styles.sliderFill, { width: pct }]} pointerEvents="none" />
      <View
        style={[styles.sliderThumb, { left: pct, marginLeft: -THUMB / 2 }]}
        pointerEvents="none"
      />
    </View>
  );
}

export default function CreatePlayerScreen() {
  const router = useRouter();
  const addPlayer = useStore((s) => s.addPlayer);

  const [photo, setPhoto] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [nameFocused, setNameFocused] = useState(false);
  const [position, setPosition] = useState<Position>("MID");
  const [foot, setFoot] = useState<"L" | "R">("R");
  const [attrs, setAttrs] = useState<Record<AttrKey, number>>({
    pac: 50,
    sho: 50,
    pas: 50,
    dri: 50,
    def: 50,
    phy: 50,
  });

  const setAttr = (key: AttrKey) => (v: number) =>
    setAttrs((a) => ({ ...a, [key]: v }));

  const ovr = calculateOvr(
    attrs.pac,
    attrs.sho,
    attrs.pas,
    attrs.dri,
    attrs.def,
    attrs.phy
  );

  const canSave = name.trim().length > 0;

  async function pickFromLibrary() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!res.canceled) setPhoto(res.assets[0].uri);
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
    if (!res.canceled) setPhoto(res.assets[0].uri);
  }

  function pickPhoto() {
    Alert.alert("Player photo", "Choose a source", [
      { text: "Take Photo", onPress: takePhoto },
      { text: "Choose from Library", onPress: pickFromLibrary },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  function save() {
    if (!canSave) return;
    addPlayer({
      name: name.trim(),
      photo: photo ?? undefined,
      position,
      foot,
      form: "neutral",
      goals: 0,
      assists: 0,
      mvps: 0,
      ovr,
      ...attrs,
    });
    router.back();
  }

  return (
    <SafeAreaView style={styles.main} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity hitSlop={8} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={26} color={T.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Player</Text>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.previewRow}>
            <TouchableOpacity style={styles.photo} activeOpacity={0.8} onPress={pickPhoto}>
              {photo ? (
                <Image source={{ uri: photo }} style={styles.photoImg} />
              ) : (
                <>
                  <Ionicons name="camera-outline" size={24} color={T.textSecondary} />
                  <Text style={styles.photoTxt}>Add photo</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.ovrBadge}>
              <Text style={styles.ovrValue}>{ovr}</Text>
              <Text style={styles.ovrLabel}>OVR</Text>
              <View style={styles.ovrDivider} />
              <Text style={styles.ovrPos}>{position}</Text>
            </View>
          </View>

          <Text style={styles.fieldLabel}>Name</Text>
          <View style={[styles.inputWrap, nameFocused && styles.inputWrapFocused]}>
            <Ionicons
              name="person-outline"
              size={18}
              color={nameFocused ? T.textPrimary : T.textMuted}
            />
            <TextInput
              style={styles.inputField}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Koren"
              placeholderTextColor={T.textMuted}
              autoFocus
              returnKeyType="done"
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
              onSubmitEditing={save}
            />
          </View>

          <Text style={styles.fieldLabel}>Position</Text>
          <View style={styles.chipRow}>
            {POSITIONS.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.chip, position === p && styles.chipActive]}
                activeOpacity={0.8}
                onPress={() => setPosition(p)}
              >
                <Text style={[styles.chipTxt, position === p && styles.chipTxtActive]}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Strong foot</Text>
          <View style={styles.chipRow}>
            {(["L", "R"] as const).map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.chip, foot === f && styles.chipActive]}
                activeOpacity={0.8}
                onPress={() => setFoot(f)}
              >
                <Text style={[styles.chipTxt, foot === f && styles.chipTxtActive]}>
                  {f === "L" ? "Left" : "Right"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Attributes</Text>
          <View style={styles.attrCard}>
            {ATTR_ROWS.map(([key, label]) => (
              <View key={key} style={styles.attrRow}>
                <Text style={styles.attrLabel}>{label}</Text>
                <Slider value={attrs[key]} onChange={setAttr(key)} />
                <Text style={styles.attrValue}>{attrs[key]}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
            activeOpacity={0.8}
            disabled={!canSave}
            onPress={save}
          >
            <Text style={styles.saveBtnTxt}>Save Player</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  main: { flex: 1, backgroundColor: T.bg, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 12 },
  flex: { flex: 1 },

  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  headerTitle: { fontSize: 16, fontWeight: "800", color: T.textPrimary },

  scrollContent: { paddingTop: 20, paddingBottom: 24 },

  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  photo: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    overflow: "hidden",
  },
  photoImg: { width: "100%", height: "100%" },
  photoTxt: { fontSize: 11, fontWeight: "700", color: T.textSecondary },

  ovrBadge: {
    width: 88,
    height: 104,
    borderRadius: 18,
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    justifyContent: "center",
  },
  ovrValue: { fontSize: 42, fontWeight: "900", color: T.textPrimary, lineHeight: 44 },
  ovrLabel: { fontSize: 11, fontWeight: "800", color: T.textSecondary, letterSpacing: 3 },
  ovrDivider: { width: 26, height: 1, backgroundColor: T.border, marginVertical: 7 },
  ovrPos: { fontSize: 12, fontWeight: "800", color: T.textSecondary, letterSpacing: 1 },

  fieldLabel: { fontSize: 12, fontWeight: "800", color: T.textSecondary, marginTop: 22, marginBottom: 8 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: T.surface,
    borderWidth: 1.5,
    borderColor: T.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  inputWrapFocused: {
    borderColor: T.textPrimary,
    backgroundColor: T.bg,
  },
  inputField: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 16,
    fontWeight: "600",
    color: T.textPrimary,
  },

  chipRow: { flexDirection: "row", gap: 8 },
  chip: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
  },
  chipActive: { backgroundColor: T.border },
  chipTxt: { fontSize: 13, fontWeight: "700", color: T.textSecondary },
  chipTxtActive: { color: T.textPrimary, fontWeight: "800" },

  attrCard: {
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  attrRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 10 },
  attrLabel: { width: 38, fontSize: 12, fontWeight: "800", color: T.textSecondary },
  attrValue: { width: 26, fontSize: 14, fontWeight: "800", color: T.textPrimary, textAlign: "right" },

  sliderArea: { flex: 1, height: 24, justifyContent: "center" },
  sliderBar: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 9,
    height: 6,
    borderRadius: 3,
    backgroundColor: T.bg,
  },
  sliderFill: {
    position: "absolute",
    left: 0,
    top: 9,
    height: 6,
    borderRadius: 3,
    backgroundColor: T.textPrimary,
  },
  sliderThumb: {
    position: "absolute",
    top: 1,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: T.textPrimary,
    borderWidth: 3,
    borderColor: T.bg,
  },

  footer: { flexDirection: "row", marginTop: 12 },
  saveBtn: {
    flex: 1,
    backgroundColor: T.textPrimary,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnTxt: { fontSize: 14, fontWeight: "800", color: T.bg },
});
