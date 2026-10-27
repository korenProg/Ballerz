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
  ActionSheetIOS,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NativeSegmentedControl, {
  type SegmentedControlProps,
} from "@react-native-segmented-control/segmented-control";
import Slider from "@react-native-community/slider";
import { useStore } from "../store";
import { calculateOvr } from "../utils/ovr";
import { initials } from "../utils/initials";
import { T, SPACE, SHEET } from "../constants/theme";
import ScreenHeader from "../components/ui/ScreenHeader";
import RatingBadge from "../components/ui/RatingBadge";

// The package types its default export through a mixin that loses `props`
// under React 19's JSX types; the runtime component is unchanged.
const SegmentedControl = NativeSegmentedControl as unknown as ComponentType<SegmentedControlProps>;

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

// iOS Contacts' grey avatar gradient.
const AVATAR_FADE = ["#A0A0A6", "#6E6E74"] as const;
const AVATAR = 112;

type Choice = { text: string; style?: "destructive" | "cancel"; onPress?: () => void };

// iOS gets the native action sheet that rises from the bottom; other
// platforms fall back to an alert with the same choices.
function choose(message: string | undefined, choices: Choice[]) {
  if (Platform.OS === "ios") {
    const cancel = choices.findIndex((c) => c.style === "cancel");
    ActionSheetIOS.showActionSheetWithOptions(
      {
        message,
        options: choices.map((c) => c.text),
        cancelButtonIndex: cancel === -1 ? undefined : cancel,
        destructiveButtonIndex: choices.flatMap((c, i) => (c.style === "destructive" ? [i] : [])),
        userInterfaceStyle: "dark",
        tintColor: T.accent,
      },
      (i) => choices[i]?.onPress?.(),
    );
    return;
  }
  Alert.alert("", message, choices);
}

// iOS inset-grouped section: optional uppercase header, rounded cells, and
// an optional grey footnote underneath.
function Section({ header, footer, children }: { header?: string; footer?: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      {header ? <Text style={styles.sectionHeader}>{header.toUpperCase()}</Text> : null}
      <View style={styles.group}>{children}</View>
      {footer ? <Text style={styles.sectionFooter}>{footer}</Text> : null}
    </View>
  );
}

// One cell. Every cell but the last draws the hairline iOS insets under its label.
function Row({ children, last = false, tall = false }: { children: ReactNode; last?: boolean; tall?: boolean }) {
  return (
    <View style={[styles.row, tall ? styles.rowTall : null]}>
      {children}
      {last ? null : <View style={styles.separator} />}
    </View>
  );
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
  const monogram = initials(name);
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
    choose(undefined, [
      { text: "Take Photo", onPress: takePhoto },
      { text: "Choose Photo", onPress: pickFromLibrary },
      ...(photo ? [{ text: "Delete Photo", style: "destructive" as const, onPress: () => setPhoto(null) }] : []),
      { text: "Cancel", style: "cancel" },
    ]);
  }

  // Closing with unsaved input asks first, the iOS way.
  function close() {
    if (!dirty) {
      router.back();
      return;
    }
    choose(
      editing
        ? "Are you sure you want to discard your changes?"
        : "Are you sure you want to discard this new player?",
      [
        { text: "Discard Changes", style: "destructive", onPress: () => router.back() },
        { text: "Keep Editing", style: "cancel" },
      ],
    );
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
                <Image source={{ uri: photo }} style={styles.avatar} />
              ) : (
                <LinearGradient colors={AVATAR_FADE} style={styles.avatar}>
                  {monogram ? (
                    <Text style={styles.monogram}>{monogram}</Text>
                  ) : (
                    <Ionicons name="person" size={60} color="#FFFFFF" />
                  )}
                </LinearGradient>
              )}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={pickPhoto}
              hitSlop={6}
              style={({ pressed }) => [styles.photoButton, pressed ? styles.pressed : null]}
            >
              <Text style={styles.photoButtonText}>{photo ? "Edit" : "Add Photo"}</Text>
            </Pressable>
          </View>

          <Section>
            <Row last>
              <TextInput
                style={styles.nameInput}
                value={name}
                onChangeText={setName}
                placeholder="Full name"
                placeholderTextColor={SHEET.label}
                autoFocus={!editing}
                autoCorrect={false}
                autoCapitalize="words"
                returnKeyType="done"
                keyboardAppearance="dark"
                selectionColor={T.accent}
                clearButtonMode="while-editing"
                accessibilityLabel="Full name"
              />
            </Row>
          </Section>

          <Section header="Details">
            <Row>
              <Text style={styles.rowLabel}>Position</Text>
              <SegmentedControl
                values={[...POSITIONS]}
                selectedIndex={POSITIONS.indexOf(position)}
                onChange={(e) => setPosition(POSITIONS[e.nativeEvent.selectedSegmentIndex])}
                appearance="dark"
                style={styles.segmentWide}
              />
            </Row>
            <Row last>
              <Text style={styles.rowLabel}>Foot</Text>
              <SegmentedControl
                values={["Left", "Right"]}
                selectedIndex={FEET.indexOf(foot)}
                onChange={(e) => setFoot(FEET[e.nativeEvent.selectedSegmentIndex])}
                appearance="dark"
                style={styles.segmentNarrow}
              />
            </Row>
          </Section>

          <Section header="Attributes" footer="Overall is the average of the six attributes.">
            <Row>
              <Text style={styles.rowLabel}>Overall</Text>
              <RatingBadge value={ovr} />
            </Row>
            {ATTR_ROWS.map(([key, label], i) => (
              <Row key={key} tall last={i === ATTR_ROWS.length - 1}>
                <Text style={styles.attrLabel}>{label}</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={99}
                  step={1}
                  value={attrs[key]}
                  onValueChange={(v) => setAttrs((a) => ({ ...a, [key]: Math.round(v) }))}
                  minimumTrackTintColor={T.accent}
                  maximumTrackTintColor={SHEET.separator}
                  thumbTintColor={Platform.OS === "ios" ? undefined : T.accent}
                  accessibilityLabel={label}
                />
                <Text style={styles.attrValue}>{attrs[key]}</Text>
              </Row>
            ))}
          </Section>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const ROW_H = 50;

const styles = StyleSheet.create({
  main: { flex: 1, backgroundColor: SHEET.bg },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: SPACE.lg, paddingTop: SPACE.sm },
  pressed: { opacity: 0.6 },

  photoBlock: { alignItems: "center", gap: SPACE.md, marginBottom: SPACE.xl },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  monogram: { fontSize: 44, fontWeight: "600", color: "#FFFFFF" },
  photoButton: {
    backgroundColor: SHEET.cell,
    borderRadius: 999,
    paddingHorizontal: SPACE.lg,
    paddingVertical: 7,
  },
  photoButtonText: { fontSize: 15, fontWeight: "600", color: T.text },

  section: { marginBottom: SPACE.xxl },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "400",
    color: SHEET.label,
    marginBottom: 6,
    marginLeft: SPACE.lg,
  },
  sectionFooter: {
    fontSize: 13,
    fontWeight: "400",
    color: SHEET.label,
    marginTop: 6,
    marginHorizontal: SPACE.lg,
  },
  group: { backgroundColor: SHEET.cell, borderRadius: 16, overflow: "hidden" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACE.md,
    minHeight: ROW_H,
    paddingHorizontal: SPACE.lg,
  },
  rowTall: { minHeight: 54 },
  separator: {
    position: "absolute",
    left: SPACE.lg,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: SHEET.separator,
  },
  rowLabel: { fontSize: 17, fontWeight: "400", color: T.text },

  nameInput: {
    flex: 1,
    height: ROW_H,
    fontSize: 17,
    color: T.text,
    outlineWidth: 0,
  },
  segmentWide: { flex: 1, maxWidth: 220, height: 32 },
  segmentNarrow: { width: 140, height: 32 },

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
});
