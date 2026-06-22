import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Crest from "../Crest";
import { T } from "../../constants/theme";

type DetailsStepProps = {
  homeTeam: string; awayTeam: string;
  homeColor: string; awayColor: string;
  homeLogo: string | null; awayLogo: string | null;
  mode: "upcoming" | "result"; onMode: (m: "upcoming" | "result") => void;
  dateLabel: string; onOpenDate: () => void;
  location: string; onLocation: (s: string) => void;
  homeScore: number; onHomeScore: (n: number) => void;
  awayScore: number; onAwayScore: (n: number) => void;
  lineup: { id: string; name: string }[];
  mvpId: string | null; onMvp: (id: string | null) => void;
  mvpStat: string; onMvpStat: (s: string) => void;
};

function Stepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <View style={styles.stepper}>
      <TouchableOpacity style={styles.stepBtn} onPress={() => onChange(Math.max(0, value - 1))}><Ionicons name="remove" size={18} color={T.textPrimary} /></TouchableOpacity>
      <Text style={styles.stepVal}>{value}</Text>
      <TouchableOpacity style={styles.stepBtn} onPress={() => onChange(value + 1)}><Ionicons name="add" size={18} color={T.textPrimary} /></TouchableOpacity>
    </View>
  );
}

export default function DetailsStep({
  homeTeam, awayTeam, homeColor, awayColor, homeLogo, awayLogo,
  mode, onMode, dateLabel, onOpenDate, location, onLocation,
  homeScore, onHomeScore, awayScore, onAwayScore, lineup, mvpId, onMvp, mvpStat, onMvpStat,
}: DetailsStepProps) {
  return (
    <View>
      <Text style={styles.eyebrow}>STEP 3 OF 3</Text>
      <Text style={styles.title}>Match details</Text>
      <Text style={styles.sub}>Confirm and save.</Text>

      {/* Summary preview */}
      <View style={styles.preview}>
        <View style={styles.previewTeam}>
          <Crest name={homeTeam || "Home"} color={homeColor} logo={homeLogo ?? undefined} size={44} />
          <Text style={styles.previewName} numberOfLines={1}>{homeTeam || "Home"}</Text>
        </View>
        <Text style={styles.previewMid}>{mode === "result" ? `${homeScore} : ${awayScore}` : "vs"}</Text>
        <View style={styles.previewTeam}>
          <Crest name={awayTeam || "Away"} color={awayColor} logo={awayLogo ?? undefined} size={44} />
          <Text style={styles.previewName} numberOfLines={1}>{awayTeam || "Away"}</Text>
        </View>
      </View>

      {/* Mode */}
      <View style={styles.segment}>
        {(["upcoming", "result"] as const).map((m) => (
          <TouchableOpacity key={m} style={[styles.segBtn, mode === m && styles.segBtnActive]} activeOpacity={0.8} onPress={() => onMode(m)}>
            <Text style={[styles.segTxt, mode === m && styles.segTxtActive]}>{m === "upcoming" ? "Upcoming" : "Log result"}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Date</Text>
      <TouchableOpacity style={styles.input} activeOpacity={0.8} onPress={onOpenDate}>
        <Text style={styles.inputTxt}>{dateLabel}</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Location</Text>
      <TextInput style={styles.input} value={location} onChangeText={onLocation} placeholder="e.g. City Park (optional)" placeholderTextColor={T.textMuted} />

      {mode === "result" && (
        <>
          <Text style={styles.label}>Final score</Text>
          <View style={styles.scoreRow}>
            <Stepper value={homeScore} onChange={onHomeScore} />
            <Text style={styles.scoreColon}>:</Text>
            <Stepper value={awayScore} onChange={onAwayScore} />
          </View>

          <Text style={styles.label}>MVP (optional)</Text>
          {lineup.length === 0 ? (
            <Text style={styles.hint}>Add players to a lineup to pick an MVP</Text>
          ) : (
            <View style={styles.chipWrap}>
              {lineup.map((p) => (
                <TouchableOpacity key={p.id} style={[styles.chip, mvpId === p.id && styles.chipMvpOn]} activeOpacity={0.8} onPress={() => onMvp(mvpId === p.id ? null : p.id)}>
                  <Text style={[styles.chipTxt, mvpId === p.id && styles.chipTxtOn]}>{p.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {mvpId ? (
            <TextInput style={[styles.input, { marginTop: 10 }]} value={mvpStat} onChangeText={onMvpStat} placeholder="MVP stat, e.g. 2 goals" placeholderTextColor={T.textMuted} />
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: { fontSize: 11, fontWeight: "800", color: T.textSecondary, letterSpacing: 2 },
  title: { fontSize: 28, fontWeight: "900", color: T.textPrimary, marginTop: 4 },
  sub: { fontSize: 13, color: T.textSecondary, marginBottom: 8 },
  preview: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: 16, padding: 16, marginTop: 12 },
  previewTeam: { flex: 1, alignItems: "center", gap: 6 },
  previewName: { fontSize: 13, fontWeight: "700", color: T.textPrimary, maxWidth: 110, textAlign: "center" },
  previewMid: { fontSize: 18, fontWeight: "900", color: T.textPrimary, paddingHorizontal: 10 },
  label: { fontSize: 12, fontWeight: "800", color: T.textSecondary, marginTop: 16, marginBottom: 8 },
  input: { backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14 },
  inputTxt: { fontSize: 15, color: T.textPrimary },
  segment: { flexDirection: "row", backgroundColor: T.surface, borderRadius: 12, padding: 4, marginTop: 16 },
  segBtn: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: "center" },
  segBtnActive: { backgroundColor: T.border },
  segTxt: { fontSize: 13, fontWeight: "700", color: T.textSecondary },
  segTxtActive: { color: T.textPrimary },
  scoreRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 6 },
  scoreColon: { fontSize: 24, fontWeight: "900", color: T.textPrimary },
  stepper: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 6 },
  stepBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: T.border, alignItems: "center", justifyContent: "center" },
  stepVal: { fontSize: 20, fontWeight: "900", color: T.textPrimary, minWidth: 24, textAlign: "center" },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border },
  chipTxt: { fontSize: 13, fontWeight: "700", color: T.textSecondary },
  chipTxtOn: { color: "#fff" },
  chipMvpOn: { backgroundColor: "#ca8a04", borderColor: "#ca8a04" },
  hint: { fontSize: 13, color: T.textSecondary },
});
