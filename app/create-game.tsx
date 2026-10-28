import { useState, type ComponentType } from "react";
import {
  View,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Text, TextInput } from "../components/ui/Text";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import NativeSegmentedControl, {
  type SegmentedControlProps,
} from "@react-native-segmented-control/segmented-control";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStore } from "../store";
import { formatDate, parseDMY } from "../utils/game";
import {
  MIN_PLAYERS_FOR_GAME, DEFAULT_HOME_TEAM, DEFAULT_AWAY_TEAM, teamNamesClash,
} from "../utils/gameRules";
import { T, SPACE, SHEET, FONT } from "../constants/theme";
import ScreenHeader from "../components/ui/ScreenHeader";
import EmptyState from "../components/ui/EmptyState";
import Button from "../components/ui/Button";
import Crest from "../components/Crest";
import PlayerAvatar from "../components/PlayerAvatar";
import { chooseAction } from "../components/ui/chooseAction";
import { FormSection as Section, FormRow as Row, FORM_ROW_H as ROW_H } from "../components/ui/Form";

// The package types its default export through a mixin that loses `props`
// under React 19's JSX types; the runtime component is unchanged.
const SegmentedControl = NativeSegmentedControl as unknown as ComponentType<SegmentedControlProps>;

const TEAM_COLORS = ["#0039a3", "#dc2626", "#059669", "#7c3aed", "#ea580c", "#0d9488", "#ca8a04", "#e11d48"];
const MODES = ["upcoming", "result"] as const;
type Mode = (typeof MODES)[number];
type Side = "home" | "away";

const CREST = 76;

// − value + in one pill, like UIStepper with the count in the middle.
function Stepper({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  return (
    <View style={styles.stepper}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Decrease ${label}`}
        disabled={value === 0}
        hitSlop={6}
        onPress={() => onChange(Math.max(0, value - 1))}
        style={({ pressed }) => [styles.stepBtn, pressed ? styles.pressed : null]}
      >
        <Ionicons name="remove" size={18} color={value === 0 ? SHEET.label : T.text} />
      </Pressable>
      <Text style={styles.stepValue}>{value}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Increase ${label}`}
        hitSlop={6}
        onPress={() => onChange(value + 1)}
        style={({ pressed }) => [styles.stepBtn, pressed ? styles.pressed : null]}
      >
        <Ionicons name="add" size={18} color={T.text} />
      </Pressable>
    </View>
  );
}

// Presented as an iOS sheet (app/_layout.tsx: presentation "modal"), the same
// way as "New player".
export default function CreateGameScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // An `id` param turns this sheet into the edit form for that game.
  const { id } = useLocalSearchParams<{ id?: string }>();
  const league = useStore((s) => s.league);
  const addGame = useStore((s) => s.addGame);
  const updateGame = useStore((s) => s.updateGame);
  const players = useStore((s) => s.players);
  const setMvp = useStore((s) => s.setMvp);
  const updatePlayer = useStore((s) => s.updatePlayer);
  const editing = useStore((s) => (id ? s.games.find((g) => g.id === id) ?? null : null));

  const [initial] = useState(() => {
    const homeIds = editing?.homePlayers?.map((p) => p.id) ?? [];
    const awayIds = editing?.awayPlayers?.map((p) => p.id) ?? [];
    // The stored MVP is a name; find them among the saved lineups.
    const mvp = editing?.mvp.name
      ? players.find((p) => [...homeIds, ...awayIds].includes(p.id) && p.name === editing.mvp.name)
      : undefined;
    return {
      homeTeam: editing?.homeTeam ?? "",
      awayTeam: editing?.awayTeam ?? "",
      homeColor: editing?.homeColor ?? league.color,
      awayColor: editing?.awayColor ?? TEAM_COLORS[1],
      homeLogo: editing?.homeLogo ?? null,
      awayLogo: editing?.awayLogo ?? null,
      date: editing?.date ?? formatDate(new Date()),
      location: editing?.location ?? league.defaultLocation ?? "",
      homeIds,
      awayIds,
      mode: (editing?.status === "FT" ? "result" : "upcoming") as Mode,
      homeScore: editing?.homeScore ?? 0,
      awayScore: editing?.awayScore ?? 0,
      mvpId: mvp?.id ?? null,
      mvpStat: editing?.mvp.stat ?? "",
    };
  });

  const [homeTeam, setHomeTeam] = useState(initial.homeTeam);
  const [awayTeam, setAwayTeam] = useState(initial.awayTeam);
  const [homeColor, setHomeColor] = useState(initial.homeColor);
  const [awayColor, setAwayColor] = useState(initial.awayColor);
  const [homeLogo, setHomeLogo] = useState<string | null>(initial.homeLogo);
  const [awayLogo, setAwayLogo] = useState<string | null>(initial.awayLogo);
  const [date, setDate] = useState(initial.date);
  const [showDate, setShowDate] = useState(false);
  const [location, setLocation] = useState(initial.location);
  const [homeIds, setHomeIds] = useState<string[]>(initial.homeIds);
  const [awayIds, setAwayIds] = useState<string[]>(initial.awayIds);
  const [lineupSide, setLineupSide] = useState<Side>("home");
  const [mode, setMode] = useState<Mode>(initial.mode);
  const [homeScore, setHomeScore] = useState(initial.homeScore);
  const [awayScore, setAwayScore] = useState(initial.awayScore);
  const [mvpId, setMvpId] = useState<string | null>(initial.mvpId);
  const [mvpStat, setMvpStat] = useState(initial.mvpStat);

  // A blank name falls back to the side's stock name ("Team A").
  const homeName = homeTeam.trim() || DEFAULT_HOME_TEAM;
  const awayName = awayTeam.trim() || DEFAULT_AWAY_TEAM;
  const namesClash = teamNamesClash(homeName, awayName);
  const canSave = !namesClash;

  const sameIds = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));
  const dirty =
    homeTeam !== initial.homeTeam ||
    awayTeam !== initial.awayTeam ||
    homeColor !== initial.homeColor ||
    awayColor !== initial.awayColor ||
    homeLogo !== initial.homeLogo ||
    awayLogo !== initial.awayLogo ||
    date !== initial.date ||
    location !== initial.location ||
    !sameIds(homeIds, initial.homeIds) ||
    !sameIds(awayIds, initial.awayIds) ||
    mode !== initial.mode ||
    homeScore !== initial.homeScore ||
    awayScore !== initial.awayScore ||
    mvpId !== initial.mvpId ||
    mvpStat !== initial.mvpStat;

  const byId = (pid: string) => players.find((p) => p.id === pid);
  const snapshot = (ids: string[]) =>
    ids
      .map(byId)
      .filter((p): p is NonNullable<typeof p> => !!p)
      .map((p) => ({ id: p.id, name: p.name, position: p.position }));
  const lineup = [...homeIds, ...awayIds].map(byId).filter((p): p is NonNullable<typeof p> => !!p);
  const sideIds = lineupSide === "home" ? homeIds : awayIds;
  const otherIds = lineupSide === "home" ? awayIds : homeIds;
  const otherName = lineupSide === "home" ? awayName : homeName;

  // Tapping a player puts them on the selected side (moving them off the
  // other one), or takes them off it again.
  function toggle(pid: string) {
    const [setThis, setOther] = lineupSide === "home" ? [setHomeIds, setAwayIds] : [setAwayIds, setHomeIds];
    setOther((ids) => ids.filter((x) => x !== pid));
    setThis((ids) => (ids.includes(pid) ? ids.filter((x) => x !== pid) : [...ids, pid]));
    // Dropped from the lineups entirely, so they can't be player of the match.
    if (mvpId === pid && sideIds.includes(pid)) setMvpId(null);
  }

  async function pickLogo(set: (uri: string) => void) {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!res.canceled) set(res.assets[0].uri);
  }

  function editLogo(side: Side) {
    const [logo, setLogo] = side === "home" ? [homeLogo, setHomeLogo] : [awayLogo, setAwayLogo];
    chooseAction(undefined, [
      { text: "Choose Logo", onPress: () => pickLogo(setLogo) },
      ...(logo ? [{ text: "Delete Logo", style: "destructive" as const, onPress: () => setLogo(null) }] : []),
      { text: "Cancel", style: "cancel" },
    ]);
  }

  // Closing with unsaved input asks first, the iOS way.
  function close() {
    if (!dirty) {
      router.back();
      return;
    }
    chooseAction(
      editing
        ? "Are you sure you want to discard your changes?"
        : "Are you sure you want to discard this new game?",
      [
        { text: "Discard Changes", style: "destructive", onPress: () => router.back() },
        { text: "Keep Editing", style: "cancel" },
      ],
    );
  }

  function save() {
    if (!canSave) return;
    const base = {
      league: league.name,
      homeTeam: homeName, awayTeam: awayName,
      homeColor, awayColor, date, location: location.trim(),
      homeLogo: homeLogo ?? undefined,
      awayLogo: awayLogo ?? undefined,
      homePlayers: snapshot(homeIds), awayPlayers: snapshot(awayIds),
    };
    const mvpPlayer = mode === "result" && mvpId ? byId(mvpId) ?? null : null;
    const result =
      mode === "result"
        ? { status: "FT" as const, homeScore, awayScore, mvp: { name: mvpPlayer?.name ?? "", stat: mvpPlayer ? mvpStat.trim() : "" } }
        : { status: "Pending" as const, homeScore: 0, awayScore: 0, mvp: { name: "", stat: "" } };
    if (editing) {
      updateGame(editing.id, { ...base, ...result });
    } else {
      addGame({ ...base, ...result });
      if (mvpPlayer) {
        setMvp(mvpPlayer.id);
        updatePlayer(mvpPlayer.id, { mvps: mvpPlayer.mvps + 1 });
      }
    }
    router.back();
  }

  const dateValue = parseDMY(date);
  const dateLabel = dateValue.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const teamSize = league.defaultTeamSize;

  // A new game needs players for both sides; editing an existing one never blocks.
  if (!editing && players.length < MIN_PLAYERS_FOR_GAME) {
    const missing = MIN_PLAYERS_FOR_GAME - players.length;
    return (
      <View style={styles.main}>
        <ScreenHeader sheet nav="close" onNav={() => router.back()} title="New game" />
        <EmptyState
          icon="people-outline"
          title={`Add ${missing === 1 ? "one more player" : `${missing} players`} first`}
          sub={`A game needs at least ${MIN_PLAYERS_FOR_GAME} players in your league, one for each team.`}
        >
          <Button icon="person-add-outline" label="Add Player" onPress={() => router.push("/create-player")} />
        </EmptyState>
      </View>
    );
  }

  // One side of the matchup: the crest opens its logo choices, like the
  // photo on "New player".
  const matchupTeam = (side: Side) => {
    const home = side === "home";
    const logo = home ? homeLogo : awayLogo;
    const name = home ? homeName : awayName;
    return (
      <View style={styles.matchupTeam}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${logo ? "Change" : "Add"} ${name} logo`}
          onPress={() => editLogo(side)}
          style={({ pressed }) => (pressed ? styles.pressed : null)}
        >
          <Crest name={name} color={home ? homeColor : awayColor} logo={logo ?? undefined} size={CREST} />
        </Pressable>
        <Text style={styles.matchupName} numberOfLines={1}>{name}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => editLogo(side)}
          hitSlop={6}
          style={({ pressed }) => [styles.logoButton, pressed ? styles.pressed : null]}
        >
          <Text style={styles.logoButtonText}>{logo ? "Edit" : "Add Logo"}</Text>
        </Pressable>
      </View>
    );
  };

  const teamSection = (side: Side) => {
    const home = side === "home";
    const [name, setName, color, setColor] = home
      ? [homeTeam, setHomeTeam, homeColor, setHomeColor]
      : [awayTeam, setAwayTeam, awayColor, setAwayColor];
    return (
      <Section
        header={home ? "Home team" : "Away team"}
        footer={!home && namesClash ? "Both teams can't have the same name." : undefined}
      >
        <Row>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={home ? DEFAULT_HOME_TEAM : DEFAULT_AWAY_TEAM}
            placeholderTextColor={SHEET.label}
            autoCorrect={false}
            autoCapitalize="words"
            returnKeyType="done"
            keyboardAppearance="dark"
            selectionColor={T.accent}
            clearButtonMode="while-editing"
            accessibilityLabel={home ? "Home team name" : "Away team name"}
          />
        </Row>
        <Row last tall>
          <View style={styles.swatches} accessibilityRole="radiogroup">
            {TEAM_COLORS.map((c) => (
              <Pressable
                key={c}
                accessibilityRole="radio"
                accessibilityLabel={`Team colour ${c}`}
                accessibilityState={{ checked: color === c }}
                hitSlop={4}
                onPress={() => setColor(c)}
                style={[styles.swatch, { backgroundColor: c }, color === c ? styles.swatchOn : null]}
              >
                {color === c ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
              </Pressable>
            ))}
          </View>
        </Row>
      </Section>
    );
  };

  return (
    <View style={styles.main}>
      {/* With unsaved input, swipe-down is disabled so ✕ can ask first. */}
      <Stack.Screen options={{ gestureEnabled: !dirty }} />
      <ScreenHeader
        sheet
        nav="close"
        onNav={close}
        title={editing ? "Edit game" : "New game"}
        actions={[
          {
            icon: "checkmark",
            label: editing ? "Save changes" : mode === "result" ? "Save result" : "Create game",
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
          <View style={styles.matchup}>
            {matchupTeam("home")}
            <Text style={mode === "result" ? styles.matchupScore : styles.matchupVs}>
              {mode === "result" ? `${homeScore} – ${awayScore}` : "vs"}
            </Text>
            {matchupTeam("away")}
          </View>

          {teamSection("home")}
          {teamSection("away")}

          <Section header="Match">
            <Row>
              <SegmentedControl
                values={["Upcoming", "Result"]}
                selectedIndex={MODES.indexOf(mode)}
                onChange={(e) => setMode(MODES[e.nativeEvent.selectedSegmentIndex])}
                appearance="dark"
                fontStyle={{ fontFamily: FONT }}
                activeFontStyle={{ fontFamily: FONT }}
                style={styles.segmentFull}
              />
            </Row>
            <Row>
              <Text style={styles.rowLabel}>Date</Text>
              {Platform.OS === "ios" ? (
                // iOS draws its own compact date pill inside the cell.
                <DateTimePicker
                  value={dateValue}
                  mode="date"
                  display="compact"
                  themeVariant="dark"
                  accentColor={T.accent}
                  onChange={(_, selected) => {
                    if (selected) setDate(formatDate(selected));
                  }}
                />
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Date, ${dateLabel}`}
                  onPress={() => setShowDate(true)}
                  hitSlop={8}
                  style={({ pressed }) => [styles.datePill, pressed ? styles.pressed : null]}
                >
                  <Text style={styles.datePillText}>{dateLabel}</Text>
                </Pressable>
              )}
            </Row>
            <Row last>
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="Location"
                placeholderTextColor={SHEET.label}
                autoCorrect={false}
                returnKeyType="done"
                keyboardAppearance="dark"
                selectionColor={T.accent}
                clearButtonMode="while-editing"
                accessibilityLabel="Location"
              />
            </Row>
          </Section>

          {mode === "result" ? (
            <Section header="Final score">
              <Row>
                <Text style={styles.rowLabel} numberOfLines={1}>{homeName}</Text>
                <Stepper value={homeScore} onChange={setHomeScore} label={`${homeName} goals`} />
              </Row>
              <Row last>
                <Text style={styles.rowLabel} numberOfLines={1}>{awayName}</Text>
                <Stepper value={awayScore} onChange={setAwayScore} label={`${awayName} goals`} />
              </Row>
            </Section>
          ) : null}

          <Section
            header="Lineups"
            footer={`${homeName} ${homeIds.length} · ${awayName} ${awayIds.length}. Lineups are optional; the league plays ${teamSize}v${teamSize}.`}
          >
            <Row>
              <SegmentedControl
                values={[homeName, awayName]}
                selectedIndex={lineupSide === "home" ? 0 : 1}
                onChange={(e) => setLineupSide(e.nativeEvent.selectedSegmentIndex === 0 ? "home" : "away")}
                appearance="dark"
                fontStyle={{ fontFamily: FONT }}
                activeFontStyle={{ fontFamily: FONT }}
                style={styles.segmentFull}
              />
            </Row>
            {players.map((p, i) => {
              const on = sideIds.includes(p.id);
              const other = otherIds.includes(p.id);
              return (
                <Pressable
                  key={p.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={`${p.name}, ${p.position}${other ? `, playing for ${otherName}` : ""}`}
                  onPress={() => toggle(p.id)}
                  style={({ pressed }) => (pressed ? styles.rowPressed : null)}
                >
                  <Row last={i === players.length - 1}>
                    <View style={styles.playerInfo}>
                      <PlayerAvatar name={p.name} photo={p.photo} size={32} />
                      <View style={styles.playerText}>
                        <Text style={styles.rowLabel} numberOfLines={1}>{p.name}</Text>
                        <Text style={styles.playerSub} numberOfLines={1}>
                          {other ? `${p.position} · ${otherName}` : p.position}
                        </Text>
                      </View>
                    </View>
                    {on ? <Ionicons name="checkmark" size={20} color={T.accent} /> : null}
                  </Row>
                </Pressable>
              );
            })}
          </Section>

          {mode === "result" ? (
            <Section
              header="Player of the match"
              footer={lineup.length === 0 ? "Pick lineups to choose a player of the match." : undefined}
            >
              {lineup.map((p, i) => (
                <Pressable
                  key={p.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: mvpId === p.id }}
                  accessibilityLabel={p.name}
                  onPress={() => setMvpId(mvpId === p.id ? null : p.id)}
                  style={({ pressed }) => (pressed ? styles.rowPressed : null)}
                >
                  <Row last={i === lineup.length - 1 && !mvpId}>
                    <View style={styles.playerInfo}>
                      <PlayerAvatar name={p.name} photo={p.photo} size={32} />
                      <Text style={styles.rowLabel} numberOfLines={1}>{p.name}</Text>
                    </View>
                    {mvpId === p.id ? <Ionicons name="star" size={18} color={T.yellow} /> : null}
                  </Row>
                </Pressable>
              ))}
              {mvpId ? (
                <Row last>
                  <TextInput
                    style={styles.input}
                    value={mvpStat}
                    onChangeText={setMvpStat}
                    placeholder="Stat, e.g. 2 goals"
                    placeholderTextColor={SHEET.label}
                    returnKeyType="done"
                    keyboardAppearance="dark"
                    selectionColor={T.accent}
                    clearButtonMode="while-editing"
                    accessibilityLabel="Player of the match stat"
                  />
                </Row>
              ) : lineup.length === 0 ? (
                <Row last>
                  <Text style={styles.placeholder}>No players in the lineups</Text>
                </Row>
              ) : null}
            </Section>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      {Platform.OS !== "ios" && showDate ? (
        <DateTimePicker
          value={dateValue}
          mode="date"
          onChange={(event, selected) => {
            setShowDate(false);
            if (event.type === "set" && selected) setDate(formatDate(selected));
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  main: { flex: 1, backgroundColor: SHEET.bg },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: SPACE.lg, paddingTop: SPACE.sm },
  pressed: { opacity: 0.6 },
  rowPressed: { backgroundColor: SHEET.separator },

  matchup: { flexDirection: "row", alignItems: "flex-start", marginBottom: SPACE.xl },
  matchupTeam: { flex: 1, alignItems: "center", gap: SPACE.sm },
  matchupName: { fontSize: 15, fontWeight: "600", color: T.text, maxWidth: 130, textAlign: "center" },
  matchupVs: {
    marginTop: CREST / 2 - 11,
    minWidth: 64,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "400",
    color: SHEET.label,
  },
  matchupScore: {
    marginTop: CREST / 2 - 17,
    minWidth: 64,
    textAlign: "center",
    fontSize: 28,
    fontWeight: "700",
    color: T.text,
    fontVariant: ["tabular-nums"],
  },
  logoButton: {
    backgroundColor: SHEET.cell,
    borderRadius: 999,
    paddingHorizontal: SPACE.lg,
    paddingVertical: 7,
  },
  logoButtonText: { fontSize: 15, fontWeight: "600", color: T.text },

  rowLabel: { flexShrink: 1, fontSize: 17, fontWeight: "400", color: T.text },
  placeholder: { fontSize: 17, fontWeight: "400", color: SHEET.label },
  input: {
    flex: 1,
    height: ROW_H,
    fontSize: 17,
    color: T.text,
    outlineWidth: 0,
  },
  segmentFull: { flex: 1, height: 32 },

  swatches: { flex: 1, flexDirection: "row", justifyContent: "space-between" },
  swatch: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  swatchOn: { borderWidth: 2, borderColor: T.text },

  datePill: { backgroundColor: SHEET.separator, borderRadius: 8, paddingHorizontal: SPACE.md, paddingVertical: 6 },
  datePillText: { fontSize: 17, color: T.text },

  stepper: { flexDirection: "row", alignItems: "center", backgroundColor: SHEET.separator, borderRadius: 9, height: 32 },
  stepBtn: { width: 44, height: 32, alignItems: "center", justifyContent: "center" },
  stepValue: {
    minWidth: 28,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "600",
    color: T.text,
    fontVariant: ["tabular-nums"],
  },

  playerInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: SPACE.md, paddingVertical: SPACE.sm },
  playerText: { flex: 1 },
  playerSub: { fontSize: 13, color: SHEET.label, marginTop: 1 },
});
