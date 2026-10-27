import { useState, type ComponentType, type ReactNode } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NativeSegmentedControl, {
  type SegmentedControlProps,
} from "@react-native-segmented-control/segmented-control";
import Slider from "@react-native-community/slider";
import { useStore } from "../store";
import { calculateOvr } from "../utils/ovr";
import { T, SPACE } from "../constants/theme";
import ScreenHeader from "../components/ui/ScreenHeader";
import RatingBadge from "../components/ui/RatingBadge";

const POSITIONS = ["GK", "DEF", "MID", "FWD"] as const;
type Position = (typeof POSITIONS)[number];
const FEET = ["L", "R"] as const;

const ATTR_ROWS = [
  ["pac", "Pace"],
  ["sho", "Shooting"],
  ["pas", "Passing"],
  ["dri", "Dribbling"],
  ["def", "Defending"],
  ["phy", "Physical"],
] as const;
type AttrKey = (typeof ATTR_ROWS)[number][0];
type Attrs = Record<AttrKey, number>;

// The package types its default export through a mixin that loses `props`
// under React 19's JSX types; the runtime component is unchanged.
const SegmentedControl = NativeSegmentedControl as unknown as ComponentType<SegmentedControlProps>;

// iOS grouped-inset section: a rounded card on the black page.
function Group({ children, padded = false }: { children: ReactNode; padded?: boolean }) {
  return <View style={[styles.group, padded ? styles.groupPadded : null]}>{children}</View>;
}

// Presented as an iOS sheet (app/_layout.tsx: presentation "modal") — it
// slides up over the current screen and swipes down to close, like WhatsApp's
// "New contact".
export default function CreatePlayerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // An `id` param turns this sheet into the edit form for that player.
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editing = useStore((s) => s.players.find((p) => p.id === id) ?? null);
  const addPlayer = useStore((s) => s.addPlayer);
  const updatePlayer = useStore((s) => s.updatePlayer);

  const [initial] = useState(() => ({
    photo: editing?.photo ?? null,
    name: editing?.name ?? "",
    position: ((editing?.position as Position) ?? "MID") as Position,
    foot: editing?.foot ?? ("R" as const),
    attrs: (editing
      ? {
          pac: editing.pac,
          sho: editing.sho,
          pas: editing.pas,
          dri: editing.dri,
          def: editing.def,
          phy: editing.phy,
        }
      : { pac: 50, sho: 50, pas: 50, dri: 50, def: 50, phy: 50 }) as Attrs,
  }));

  const [photo, setPhoto] = useState<string | null>(initial.photo);
  const [name, setName] = useState(initial.name);
  const [position, setPosition] = useState<Position>(initial.position);
  const [foot, setFoot] = useState<"L" | "R">(initial.foot);
  const [attrs, setAttrs] = useState<Attrs>(initial.attrs);

  const ovr = calculateOvr(attrs.pac, attrs.sho, attrs.pas, attrs.dri, attrs.def, attrs.phy);
  const canSave = name.trim().length > 0;
  const dirty =
    photo !== initial.photo ||
    name !== initial.name ||
    position !== initial.position ||
    foot !== initial.foot ||
    ATTR_ROWS.some(([key]) => attrs[key] !== initial.attrs[key]);

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
    const res = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!res.canceled) setPhoto(res.assets[0].uri);
  }

  function pickPhoto() {
    Alert.alert("Player photo", undefined, [
      { text: "Take Photo", onPress: takePhoto },
      { text: "Choose from Library", onPress: pickFromLibrary },
      ...(photo
        ? [{ text: "Remove Photo", style: "destructive" as const, onPress: () => setPhoto(null) }]
        : []),
      { text: "Cancel", style: "cancel" as const },
    ]);
  }

  // Closing with unsaved input asks first, the iOS way.
  function close() {
    if (!dirty) {
      router.back();
      return;
    }
    Alert.alert(editing ? "Discard your changes?" : "Discard this player?", undefined, [
      { text: "Keep Editing", style: "cancel" },
      { text: "Discard", style: "destructive", onPress: () => router.back() },
    ]);
  }

  function save() {
    if (!canSave) return;
    const base = { name: name.trim(), photo: photo ?? undefined, position, foot, ovr, ...attrs };
    if (editing) {
      // Leaves form, goals, assists, mvps and isMvp untouched.
      updatePlayer(editing.id, base);
    } else {
      addPlayer({ ...base, form: "neutral", goals: 0, assists: 0, mvps: 0 });
    }
    router.back();
  }

  return (
    <View style={styles.main}>
      {/* With unsaved input, swipe-down is disabled so ✕ can ask first. */}
      <Stack.Screen options={{ gestureEnabled: !dirty }} />
      <ScreenHeader
        sheet
        nav="close"
        onNav={close}
        title={editing ? "Edit player" : "New player"}
        actions={[
          {
            icon: "checkmark",
            label: editing ? "Save changes" : "Save player",
            onPress: save,
            prominent: true,
            disabled: !canSave,
          },
        ]}
      />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + SPACE.xxxl }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.photoBlock}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={photo ? "Change player photo" : "Add player photo"}
              onPress={pickPhoto}
              style={({ pressed }) => (pressed ? styles.pressed : null)}
            >
              {photo ? (
                <Image source={{ uri: photo }} style={styles.photo} />
              ) : (
                <View style={[styles.photo, styles.photoEmpty]}>
                  <Ionicons name="person" size={52} color={T.textFaint} />
                </View>
              )}
            </Pressable>
            <Pressable accessibilityRole="button" onPress={pickPhoto} hitSlop={8}>
              <Text style={styles.photoLink}>{photo ? "Edit Photo" : "Add Photo"}</Text>
            </Pressable>
          </View>

          <Group>
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              placeholder="Full name"
              placeholderTextColor={T.textFaint}
              autoFocus={!editing}
              autoCorrect={false}
              autoCapitalize="words"
              returnKeyType="done"
              keyboardAppearance="dark"
              selectionColor={T.accent}
              accessibilityLabel="Full name"
            />
          </Group>

          <Text style={styles.groupLabel}>Position</Text>
          <Group padded>
            <SegmentedControl
              values={[...POSITIONS]}
              selectedIndex={POSITIONS.indexOf(position)}
              onChange={(e) => setPosition(POSITIONS[e.nativeEvent.selectedSegmentIndex])}
              appearance="dark"
              style={styles.segment}
            />
          </Group>

          <Text style={styles.groupLabel}>Preferred foot</Text>
          <Group padded>
            <SegmentedControl
              values={["Left", "Right"]}
              selectedIndex={FEET.indexOf(foot)}
              onChange={(e) => setFoot(FEET[e.nativeEvent.selectedSegmentIndex])}
              appearance="dark"
              style={styles.segment}
            />
          </Group>

          <View style={styles.groupHead}>
            <Text style={[styles.groupLabel, styles.groupLabelInline]}>Attributes</Text>
            <View style={styles.ovr}>
              <Text style={styles.ovrLabel}>OVR</Text>
              <RatingBadge value={ovr} />
            </View>
          </View>
          <Group>
            {ATTR_ROWS.map(([key, label], i) => (
              <View key={key} style={styles.attrRow}>
                <Text style={styles.attrLabel}>{label}</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={99}
                  step={1}
                  value={attrs[key]}
                  onValueChange={(v) => setAttrs((a) => ({ ...a, [key]: Math.round(v) }))}
                  minimumTrackTintColor={T.accent}
                  maximumTrackTintColor={T.surfaceAlt}
                  thumbTintColor={Platform.OS === "ios" ? undefined : T.accent}
                  accessibilityLabel={label}
                />
                <Text style={styles.attrValue}>{attrs[key]}</Text>
                {i < ATTR_ROWS.length - 1 ? <View style={styles.rowDivider} /> : null}
              </View>
            ))}
          </Group>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  main: { flex: 1, backgroundColor: T.bg },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: SPACE.lg, paddingTop: SPACE.md },
  pressed: { opacity: 0.7 },

  photoBlock: { alignItems: "center", gap: SPACE.md, marginBottom: SPACE.xxl },
  photo: { width: 104, height: 104, borderRadius: 52 },
  photoEmpty: { backgroundColor: T.surfaceAlt, alignItems: "center", justifyContent: "center" },
  photoLink: { fontSize: 16, fontWeight: "500", color: T.accent },

  group: { backgroundColor: T.surface, borderRadius: 12, overflow: "hidden" },
  groupPadded: { padding: SPACE.md },
  groupLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: T.textDim,
    marginTop: SPACE.xxl,
    marginBottom: SPACE.sm,
    marginLeft: SPACE.lg,
  },
  groupHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: SPACE.xxl,
    marginBottom: SPACE.sm,
  },
  groupLabelInline: { marginTop: 0, marginBottom: 0 },
  ovr: { flexDirection: "row", alignItems: "center", gap: SPACE.sm, marginRight: SPACE.xs },
  ovrLabel: { fontSize: 13, fontWeight: "500", color: T.textDim },

  nameInput: {
    height: 48,
    paddingHorizontal: SPACE.lg,
    fontSize: 17,
    color: T.text,
    outlineWidth: 0,
  },
  segment: { height: 34 },

  attrRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.md,
    height: 52,
    paddingHorizontal: SPACE.lg,
  },
  attrLabel: { width: 84, fontSize: 15, fontWeight: "400", color: T.text },
  slider: { flex: 1, height: 40 },
  attrValue: {
    width: 28,
    textAlign: "right",
    fontSize: 15,
    fontWeight: "600",
    color: T.text,
    fontVariant: ["tabular-nums"],
  },
  rowDivider: {
    position: "absolute",
    left: SPACE.lg,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: T.divider,
  },
});
