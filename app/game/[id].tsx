import type { ComponentProps } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "../../store";
import GameScoreboard from "../../components/GameScoreboard";
import Crest from "../../components/Crest";
import ScreenHeader from "../../components/ui/ScreenHeader";
import IconButton from "../../components/ui/IconButton";
import Section from "../../components/ui/Section";
import ListRow from "../../components/ui/ListRow";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import { T, SPACE, RADIUS } from "../../constants/theme";
import type { GamePlayer } from "../../types/games";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

function LineupColumn({
  team,
  color,
  logo,
  players,
}: {
  team: string;
  color: string;
  logo?: string;
  players: GamePlayer[];
}) {
  return (
    <View style={styles.col}>
      <View style={styles.colHead}>
        <Crest name={team} color={color} logo={logo} size={20} />
        <Text style={styles.colTeam} numberOfLines={1}>
          {team}
        </Text>
      </View>
      {players.map((p) => (
        <View key={p.id} style={styles.colRow}>
          <Text style={styles.colName} numberOfLines={1}>
            {p.name}
          </Text>
          <Text style={styles.colPos}>{p.position}</Text>
        </View>
      ))}
    </View>
  );
}

function ScoreStepper({
  team,
  onMinus,
  onPlus,
}: {
  team: string;
  onMinus: () => void;
  onPlus: () => void;
}) {
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

export default function GameDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const game = useStore((s) => s.games.find((g) => g.id === id) ?? null);
  const updateGame = useStore((s) => s.updateGame);

  const back = <IconButton icon="chevron-back" label="Back" onPress={() => router.back()} />;

  if (!game) {
    return (
      <SafeAreaView style={styles.main} edges={["top", "bottom"]}>
        <ScreenHeader safeTop={false} leading={back} />
        <EmptyState icon="help-circle-outline" title="Game not found" sub="It may have been deleted." />
      </SafeAreaView>
    );
  }

  const home = game.homePlayers ?? [];
  const away = game.awayPlayers ?? [];
  const details: { icon: IoniconName; label: string }[] = [];
  if (game.date) details.push({ icon: "calendar-outline", label: game.date });
  if (game.location) details.push({ icon: "location-outline", label: game.location });
  if (game.league) details.push({ icon: "trophy-outline", label: game.league });

  return (
    <SafeAreaView style={styles.main} edges={["top", "bottom"]}>
      <ScreenHeader
        safeTop={false}
        leading={back}
        action={
          <IconButton
            icon="create-outline"
            label="Edit game"
            onPress={() => router.push(`/create-game?id=${game.id}` as const)}
          />
        }
      />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <GameScoreboard game={game} />

        {game.status === "Pending" ? (
          <Button label="Start game" icon="play" onPress={() => updateGame(game.id, { status: "Live" })} />
        ) : null}

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
            <Button
              label="Finish"
              icon="flag"
              onPress={() => router.push(`/record-result?id=${game.id}` as const)}
            />
          </Section>
        ) : null}

        {home.length > 0 || away.length > 0 ? (
          <Section title="Lineups" padded>
            <View style={styles.lineups}>
              <LineupColumn team={game.homeTeam} color={game.homeColor} logo={game.homeLogo} players={home} />
              <View style={styles.colDivider} />
              <LineupColumn team={game.awayTeam} color={game.awayColor} logo={game.awayLogo} players={away} />
            </View>
          </Section>
        ) : null}

        {details.length > 0 ? (
          <Section title="Details">
            {details.map((d, i) => (
              <ListRow
                key={d.icon}
                title={d.label}
                leading={<Ionicons name={d.icon} size={18} color={T.textDim} />}
                divider={i < details.length - 1}
              />
            ))}
          </Section>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  main: { flex: 1, backgroundColor: T.bg },
  scroll: { paddingHorizontal: SPACE.lg, paddingBottom: SPACE.xxxl, gap: SPACE.lg },
  lineups: { flexDirection: "row", gap: SPACE.md },
  col: { flex: 1, gap: 10 },
  colHead: { flexDirection: "row", alignItems: "center", gap: SPACE.sm, marginBottom: 2 },
  colTeam: { fontSize: 14, fontWeight: "600", color: T.text, flexShrink: 1 },
  colRow: { flexDirection: "row", alignItems: "center", gap: SPACE.sm },
  colName: { flex: 1, fontSize: 14, fontWeight: "400", color: T.text },
  colPos: { fontSize: 12, fontWeight: "500", color: T.textFaint },
  colDivider: { width: StyleSheet.hairlineWidth, backgroundColor: T.divider },
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
});
