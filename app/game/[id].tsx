import { useState, type ComponentProps } from "react";
import { View, ScrollView, Pressable, StyleSheet, useWindowDimensions } from "react-native";
import { Text } from "../../components/ui/Text";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "../../store";
import GameScoreboard from "../../components/GameScoreboard";
import RivalryCarousel from "../../components/RivalryCarousel";
import AttributeRadar from "../../components/AttributeRadar";
import LineupPitch from "../../components/LineupPitch";
import PlayerAvatar from "../../components/PlayerAvatar";
import ScreenHeader from "../../components/ui/ScreenHeader";
import IconButton from "../../components/ui/IconButton";
import Section from "../../components/ui/Section";
import Tabs from "../../components/ui/Tabs";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import { chooseAction } from "../../components/ui/chooseAction";
import { T, TYPE, SPACE, RADIUS } from "../../constants/theme";
import { shortDate, parseDMY } from "../../utils/game";
import { MIN_MEETINGS } from "../../utils/rivalries";
import {
  ATTRS,
  LINE_WEIGHTS,
  lineStrengths,
  teamProfile,
  winProbability,
  type LineKey,
  type TeamProfile,
  type WinProbability,
} from "../../utils/matchPreview";
import { usePlayerRivalries } from "../../store/selectors";
import type { Game, GamePlayer } from "../../types/games";
import type { Player } from "../../types/players";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

const TABS = [
  { key: "lineups", label: "Lineups" },
  { key: "stats", label: "Stats" },
] as const;
type TabKey = (typeof TABS)[number]["key"];
const MAX_RIVALRIES = 5;
const RADAR_LABELS = ATTRS.map((k) => k.toUpperCase());
const LINE_ORDER: readonly LineKey[] = ["FWD", "MID", "DEF", "GK"];

function ScoreStepper({ team, onMinus, onPlus }: { team: string; onMinus: () => void; onPlus: () => void }) {
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepTeam} numberOfLines={1}>
        {team}
      </Text>
      <View style={styles.stepBtns}>
        <IconButton icon="remove" label={`Remove a goal from ${team}`} onPress={onMinus} />
        <IconButton icon="add" label={`Add a goal for ${team}`} onPress={onPlus} />
      </View>
    </View>
  );
}

// FotMob's "Player of the match" card: avatar, name, their side, MVP badge.
function PlayerOfTheMatch({
  game,
  roster,
  onOpen,
}: {
  game: Game;
  roster: readonly Player[];
  onOpen: (id: string) => void;
}) {
  const name = game.mvp.name;
  const same = (n: string) => n.trim().toLowerCase() === name.trim().toLowerCase();
  const inHome = (game.homePlayers ?? []).find((p) => same(p.name));
  const inAway = (game.awayPlayers ?? []).find((p) => same(p.name));
  const snapshot = inHome ?? inAway;
  const player = (snapshot && roster.find((p) => p.id === snapshot.id)) ?? roster.find((p) => same(p.name));
  const team = inHome ? game.homeTeam : inAway ? game.awayTeam : null;
  return (
    <Section divider title="Player of the match">
      <Pressable
        accessibilityRole={player ? "button" : undefined}
        disabled={!player}
        onPress={() => player && onOpen(player.id)}
        style={({ pressed }) => [styles.potm, pressed ? styles.pressed : null]}
      >
        <PlayerAvatar name={name} photo={player?.photo} size={52} />
        <View style={styles.potmText}>
          <Text style={styles.potmName} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.potmSub} numberOfLines={1}>
            {[team, game.mvp.stat].filter(Boolean).join(" · ") || "MVP"}
          </Text>
        </View>
        <View style={styles.mvpBadge}>
          <Ionicons name="star" size={12} color="#000" />
          <Text style={styles.mvpBadgeTxt}>MVP</Text>
        </View>
      </Pressable>
    </Section>
  );
}

// FotMob's "Match info": a two-column grid of icon + value.
function MatchInfo({ game }: { game: Game }) {
  const home = game.homePlayers?.length ?? 0;
  const away = game.awayPlayers?.length ?? 0;
  const items: { icon: IoniconName; label: string }[] = [];
  if (game.date) {
    items.push({
      icon: "calendar-outline",
      label: parseDMY(game.date).toLocaleDateString(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    });
  }
  if (game.location) items.push({ icon: "location-outline", label: game.location });
  if (game.league) items.push({ icon: "trophy-outline", label: game.league });
  if (home || away) items.push({ icon: "people-outline", label: `${home} v ${away}` });
  if (items.length === 0) return null;
  return (
    <Section divider title="Match info" padded>
      <View style={styles.infoGrid}>
        {items.map((it) => (
          <View key={it.icon} style={styles.infoCell}>
            <Ionicons name={it.icon} size={18} color={T.textDim} />
            <Text style={styles.infoTxt} numberOfLines={2}>
              {it.label}
            </Text>
          </View>
        ))}
      </View>
    </Section>
  );
}

// Player rivalries inside this game: one player from each side who have met
// 3+ times on opposite sides (this game included), most meetings first.
function PlayerHeadToHead({
  game,
  roster,
  onOpen,
}: {
  game: Game;
  roster: readonly Player[];
  onOpen: (id: string) => void;
}) {
  const all = usePlayerRivalries();
  const home = new Set((game.homePlayers ?? []).map((p) => p.id));
  const away = new Set((game.awayPlayers ?? []).map((p) => p.id));
  const here = all
    .filter((r) => (home.has(r.a.id) && away.has(r.b.id)) || (home.has(r.b.id) && away.has(r.a.id)))
    .slice(0, MAX_RIVALRIES);
  return (
    <Section divider title="Head to head" padded>
      {here.length === 0 ? (
        <Text style={styles.note}>
          No rivalries in this game yet. Two players become rivals after {MIN_MEETINGS} games on opposite sides.
        </Text>
      ) : (
        <RivalryCarousel rivalries={here} roster={roster} onOpen={onOpen} />
      )}
    </Section>
  );
}

// FotMob's win probability: three shares and a bar in the team colours.
function WinChance({ game, chance, colors }: { game: Game; chance: WinProbability; colors: [string, string] }) {
  const parts = [
    { key: "home", pct: chance.home, color: colors[0], label: game.homeTeam, align: null },
    { key: "draw", pct: chance.draw, color: T.surfaceAlt, label: "Draw", align: styles.chanceMiddle },
    { key: "away", pct: chance.away, color: colors[1], label: game.awayTeam, align: styles.chanceRight },
  ];
  return (
    <Section divider title="Win probability" padded>
      <View style={styles.chanceRow}>
        {parts.map((p) => (
          <View key={p.key} style={[styles.chanceCell, p.align]}>
            <Text style={styles.chancePct}>{p.pct}%</Text>
            <Text style={styles.chanceLabel} numberOfLines={1}>
              {p.label}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.chanceBar}>
        {parts
          .filter((p) => p.pct > 0)
          .map((p) => (
            <View key={p.key} style={{ flex: p.pct, backgroundColor: p.color }} />
          ))}
      </View>
      <Text style={styles.chanceNote}>From the lineups&apos; ratings, recent form, positions and numbers.</Text>
    </Section>
  );
}

// Both lineups' average attributes on one hexagon.
function TeamAttributes({
  game,
  home,
  away,
  colors,
}: {
  game: Game;
  home: TeamProfile;
  away: TeamProfile;
  colors: [string, string];
}) {
  const { width } = useWindowDimensions();
  const size = Math.min(width - SPACE.lg * 4, 300);
  const teams = [
    { key: "home", name: game.homeTeam, color: colors[0], ovr: home.ovr },
    { key: "away", name: game.awayTeam, color: colors[1], ovr: away.ovr },
  ];
  return (
    <Section divider title="Team attributes" padded>
      <View style={styles.legend}>
        {teams.map((t) => (
          <View key={t.key} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: t.color }]} />
            <Text style={styles.legendName} numberOfLines={1}>
              {t.name}
            </Text>
            <Text style={styles.legendOvr}>{t.ovr}</Text>
          </View>
        ))}
      </View>
      <View style={styles.radar}>
        <AttributeRadar
          labels={RADAR_LABELS}
          series={[
            { color: colors[0], values: ATTRS.map((k) => home.attrs[k]), name: game.homeTeam },
            { color: colors[1], values: ATTRS.map((k) => away.attrs[k]), name: game.awayTeam },
          ]}
          size={size}
        />
      </View>
    </Section>
  );
}

// One FotMob-style comparison row: value pills either side (the stronger
// side lit in its colour), the line's name and head-count in the middle, and
// a bar split by the two ratings.
function LineCompare({
  label,
  sub,
  home,
  away,
  colors,
}: {
  label: string;
  sub: string;
  home: number | null;
  away: number | null;
  colors: [string, string];
}) {
  const h = home ?? 0;
  const a = away ?? 0;
  const pill = (v: number | null, lit: boolean, color: string) => (
    <View style={[styles.linePill, lit ? { backgroundColor: color } : null]}>
      <Text style={[styles.linePillTxt, lit ? styles.linePillTxtLit : null]}>{v ?? "–"}</Text>
    </View>
  );
  return (
    <View style={styles.lineRow}>
      <View style={styles.lineTop}>
        {pill(home, h > a, colors[0])}
        <View style={styles.lineMid}>
          <Text style={styles.lineLabel}>{label}</Text>
          <Text style={styles.lineSub}>{sub}</Text>
        </View>
        {pill(away, a > h, colors[1])}
      </View>
      {h + a > 0 ? (
        <View style={styles.lineBar}>
          {h > 0 ? <View style={{ flex: h, backgroundColor: colors[0] }} /> : null}
          {a > 0 ? <View style={{ flex: a, backgroundColor: colors[1] }} /> : null}
        </View>
      ) : null}
    </View>
  );
}

// How the two sides compare line by line, front to back. Lines neither side
// fills are left out.
function TeamByPosition({
  home,
  away,
  roster,
  colors,
}: {
  home: readonly GamePlayer[];
  away: readonly GamePlayer[];
  roster: readonly Player[];
  colors: [string, string];
}) {
  const h = lineStrengths(home, roster);
  const a = lineStrengths(away, roster);
  const lines = LINE_ORDER.filter((k) => h[k].count > 0 || a[k].count > 0);
  return (
    <Section divider title="Team by position" padded>
      <View style={styles.lines}>
        {lines.map((k) => (
          <LineCompare
            key={k}
            label={LINE_WEIGHTS[k].label}
            sub={`${h[k].count} v ${a[k].count}`}
            home={h[k].rating}
            away={a[k].rating}
            colors={colors}
          />
        ))}
      </View>
    </Section>
  );
}

export default function GameDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const game = useStore((s) => s.games.find((g) => g.id === id) ?? null);
  const roster = useStore((s) => s.players);
  const games = useStore((s) => s.games);
  const updateGame = useStore((s) => s.updateGame);
  const deleteGame = useStore((s) => s.deleteGame);
  const [tab, setTab] = useState<TabKey>("lineups");

  if (!game) {
    return (
      <SafeAreaView style={styles.main} edges={["bottom"]}>
        <ScreenHeader nav="back" title="Match" />
        <EmptyState icon="help-circle-outline" title="Game not found" sub="It may have been deleted." />
      </SafeAreaView>
    );
  }

  const home = game.homePlayers ?? [];
  const away = game.awayPlayers ?? [];
  const openPlayer = (pid: string) => router.push({ pathname: "/player/[id]", params: { id: pid } });
  // The game itself is left out of the history, so its own result never feeds its prediction.
  const history = games.filter((g) => g.id !== game.id);
  const homeProfile = teamProfile(home, roster, history);
  const awayProfile = teamProfile(away, roster, history);
  const chance = winProbability(homeProfile, awayProfile);
  // Same-coloured kits would make the two shapes indistinguishable.
  const colors: [string, string] = [
    game.homeColor,
    game.awayColor.toLowerCase() === game.homeColor.toLowerCase() ? T.text : game.awayColor,
  ];

  const confirmDelete = () =>
    chooseAction(`Delete ${game.homeTeam} v ${game.awayTeam}? This can't be undone.`, [
      {
        text: "Delete Game",
        style: "destructive",
        onPress: () => {
          deleteGame(game.id);
          router.back();
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);

  return (
    <SafeAreaView style={styles.main} edges={["bottom"]}>
      <ScreenHeader
        nav="back"
        title={game.league || "Match"}
        subtitle={game.date ? shortDate(game.date) : undefined}
        menu={{
          label: "Game options",
          items: [
            { label: "Edit Game", sfSymbol: "pencil", onPress: () => router.push(`/create-game?id=${game.id}` as const) },
            { label: "Delete Game", sfSymbol: "trash", destructive: true, onPress: confirmDelete },
          ],
        }}
      />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <GameScoreboard game={game} showMvp={false} />

        {game.status === "Pending" ? (
          <Button label="Start game" icon="play" onPress={() => updateGame(game.id, { status: "Live" })} />
        ) : null}

        <Tabs tabs={TABS} value={tab} onChange={setTab} />

        {tab === "stats" ? (
          <>
            {game.status === "Live" ? (
              <Section divider title="Live score" padded>
                <View style={styles.steppers}>
                  <ScoreStepper
                    team={game.homeTeam}
                    onMinus={() => updateGame(game.id, { homeScore: Math.max(0, game.homeScore - 1) })}
                    onPlus={() => updateGame(game.id, { homeScore: game.homeScore + 1 })}
                  />
                  <ScoreStepper
                    team={game.awayTeam}
                    onMinus={() => updateGame(game.id, { awayScore: Math.max(0, game.awayScore - 1) })}
                    onPlus={() => updateGame(game.id, { awayScore: game.awayScore + 1 })}
                  />
                </View>
                <Button label="Finish" icon="flag" onPress={() => router.push(`/record-result?id=${game.id}` as const)} />
              </Section>
            ) : null}
            {chance ? <WinChance game={game} chance={chance} colors={colors} /> : null}
            {homeProfile.size > 0 && awayProfile.size > 0 ? (
              <TeamAttributes game={game} home={homeProfile} away={awayProfile} colors={colors} />
            ) : null}
            {home.length > 0 && away.length > 0 ? (
              <TeamByPosition home={home} away={away} roster={roster} colors={colors} />
            ) : null}
            {home.length > 0 && away.length > 0 ? (
              <PlayerHeadToHead game={game} roster={roster} onOpen={openPlayer} />
            ) : (
              <Section padded>
                <Text style={styles.note}>Stats appear once both teams have players.</Text>
              </Section>
            )}
          </>
        ) : null}

        {tab === "lineups" ? (
          <>
            {game.status === "FT" && game.mvp?.name ? (
              <PlayerOfTheMatch game={game} roster={roster} onOpen={openPlayer} />
            ) : null}
            {home.length > 0 || away.length > 0 ? (
              <LineupPitch
                home={{ name: game.homeTeam, color: game.homeColor, logo: game.homeLogo, players: home }}
                away={{ name: game.awayTeam, color: game.awayColor, logo: game.awayLogo, players: away }}
                roster={roster}
                onPlayerPress={openPlayer}
              />
            ) : (
              <Section padded>
                <Text style={styles.note}>No lineups were picked for this game.</Text>
              </Section>
            )}
            <MatchInfo game={game} />
          </>
        ) : null}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  main: { flex: 1, backgroundColor: T.bg },
  scroll: { paddingHorizontal: SPACE.lg, paddingBottom: SPACE.xxxl, gap: SPACE.lg },
  pressed: { opacity: 0.6 },

  steppers: { flexDirection: "row", gap: SPACE.md, marginBottom: SPACE.md },
  stepper: {
    flex: 1,
    alignItems: "center",
    gap: SPACE.sm,
    backgroundColor: T.surfaceAlt,
    borderRadius: RADIUS.control,
    padding: SPACE.md,
  },
  stepTeam: { fontSize: 14, fontWeight: "600", color: T.text },
  stepBtns: { flexDirection: "row", gap: SPACE.sm },

  potm: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.md,
    padding: SPACE.lg,
  },
  potmText: { flex: 1, gap: 2 },
  potmName: { fontSize: 17, fontWeight: "600", color: T.text },
  potmSub: { fontSize: 13, fontWeight: "400", color: T.textDim },
  mvpBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.badge,
    backgroundColor: T.yellow,
  },
  mvpBadgeTxt: { fontSize: 12, fontWeight: "700", color: "#000" },

  infoGrid: { flexDirection: "row", flexWrap: "wrap", rowGap: SPACE.lg },
  infoCell: { width: "50%", flexDirection: "row", alignItems: "center", gap: SPACE.sm, paddingRight: SPACE.sm },
  infoTxt: { flex: 1, fontSize: 14, fontWeight: "400", color: T.text },

  note: { ...TYPE.rowSecondary, textAlign: "center" },

  chanceRow: { flexDirection: "row" },
  chanceCell: { flex: 1, gap: 2 },
  chanceMiddle: { alignItems: "center" },
  chanceRight: { alignItems: "flex-end" },
  chancePct: { fontSize: 22, fontWeight: "700", color: T.text, fontVariant: ["tabular-nums"] },
  chanceLabel: { fontSize: 12, fontWeight: "500", color: T.textFaint },
  chanceBar: { flexDirection: "row", height: 8, borderRadius: 4, overflow: "hidden", gap: 2, marginTop: SPACE.md },
  chanceNote: { ...TYPE.caption, marginTop: SPACE.md },

  legend: { flexDirection: "row", gap: SPACE.lg, marginBottom: SPACE.sm },
  legendItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: SPACE.sm },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendName: { flexShrink: 1, fontSize: 14, fontWeight: "600", color: T.text },
  legendOvr: { fontSize: 14, fontWeight: "700", color: T.textDim, fontVariant: ["tabular-nums"] },
  radar: { alignItems: "center" },

  lines: { gap: SPACE.lg },
  lineRow: { gap: SPACE.sm },
  lineTop: { flexDirection: "row", alignItems: "center" },
  lineMid: { flex: 1, alignItems: "center" },
  lineLabel: { fontSize: 14, fontWeight: "600", color: T.text },
  lineSub: { fontSize: 12, fontWeight: "500", color: T.textFaint, fontVariant: ["tabular-nums"] },
  linePill: {
    minWidth: 40,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.surfaceAlt,
  },
  linePillTxt: { fontSize: 15, fontWeight: "700", color: T.text, fontVariant: ["tabular-nums"] },
  linePillTxtLit: { color: "#FFFFFF" },
  lineBar: { flexDirection: "row", height: 4, borderRadius: 2, overflow: "hidden", gap: 2 },
});
