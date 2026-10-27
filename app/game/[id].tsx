import { useState, type ComponentProps } from "react";
import { View, ScrollView, Pressable, StyleSheet } from "react-native";
import { Text } from "../../components/ui/Text";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "../../store";
import GameScoreboard from "../../components/GameScoreboard";
import RivalryVersus from "../../components/RivalryVersus";
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
import { usePlayerRivalries } from "../../store/selectors";
import type { Game } from "../../types/games";
import type { Player } from "../../types/players";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

const TABS = [
  { key: "facts", label: "Facts" },
  { key: "lineup", label: "Lineup" },
  { key: "h2h", label: "H2H" },
] as const;
type TabKey = (typeof TABS)[number]["key"];
const MAX_RIVALRIES = 5;

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
    <Section title="Player of the match">
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
    <Section title="Match info" padded>
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
  if (here.length === 0) {
    return (
      <Section padded>
        <Text style={styles.h2hEmpty}>
          No rivalries in this game yet. Two players become rivals after {MIN_MEETINGS} games on opposite sides.
        </Text>
      </Section>
    );
  }
  return (
    <>
      {here.map((r) => (
        <Section key={`${r.a.id}|${r.b.id}`} padded>
          <RivalryVersus rivalry={r} roster={roster} onOpen={onOpen} />
        </Section>
      ))}
    </>
  );
}

export default function GameDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const game = useStore((s) => s.games.find((g) => g.id === id) ?? null);
  const roster = useStore((s) => s.players);
  const updateGame = useStore((s) => s.updateGame);
  const deleteGame = useStore((s) => s.deleteGame);
  const [tab, setTab] = useState<TabKey>("facts");

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

        {tab === "facts" ? (
          <>
            {game.status === "Live" ? (
              <Section title="Live score" padded>
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
            {game.status === "FT" && game.mvp?.name ? (
              <PlayerOfTheMatch game={game} roster={roster} onOpen={openPlayer} />
            ) : null}
            <MatchInfo game={game} />
          </>
        ) : null}

        {tab === "lineup" ? (
          home.length > 0 || away.length > 0 ? (
            <LineupPitch
              home={{ name: game.homeTeam, color: game.homeColor, logo: game.homeLogo, players: home }}
              away={{ name: game.awayTeam, color: game.awayColor, logo: game.awayLogo, players: away }}
              roster={roster}
              onPlayerPress={openPlayer}
            />
          ) : (
            <Section padded>
              <Text style={styles.h2hEmpty}>No lineups were picked for this game.</Text>
            </Section>
          )
        ) : null}

        {tab === "h2h" ? <PlayerHeadToHead game={game} roster={roster} onOpen={openPlayer} /> : null}
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
    paddingHorizontal: SPACE.lg,
    paddingTop: SPACE.xs,
    paddingBottom: SPACE.lg,
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

  h2hEmpty: { ...TYPE.rowSecondary, textAlign: "center" },
});
