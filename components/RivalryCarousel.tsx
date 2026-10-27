import { useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import RivalryVersus from "./RivalryVersus";
import { T, SPACE } from "../constants/theme";
import type { PlayerRivalry } from "../utils/rivalries";
import type { Player } from "../types/players";

// Several rivalries swipe sideways one page at a time, with dots underneath;
// a single rivalry is shown on its own.
export default function RivalryCarousel({
  rivalries,
  roster,
  onOpen,
}: {
  rivalries: readonly PlayerRivalry[];
  roster: readonly Player[];
  onOpen: (id: string) => void;
}) {
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(0);
  if (rivalries.length === 1) return <RivalryVersus rivalry={rivalries[0]} roster={roster} onOpen={onOpen} />;
  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 ? (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentInsetAdjustmentBehavior="never"
          // Page changes only once a swipe settles, so React isn't touched mid-scroll.
          onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
        >
          {rivalries.map((r) => (
            <View key={`${r.a.id}|${r.b.id}`} style={{ width }}>
              <RivalryVersus rivalry={r} roster={roster} onOpen={onOpen} />
            </View>
          ))}
        </ScrollView>
      ) : null}
      <View style={styles.dots} accessibilityLabel={`Rivalry ${page + 1} of ${rivalries.length}`}>
        {rivalries.map((r, i) => (
          <View key={`${r.a.id}|${r.b.id}`} style={[styles.dot, i === page ? styles.dotOn : null]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: SPACE.lg },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: T.surfaceAlt },
  dotOn: { backgroundColor: T.accent, width: 16 },
});
