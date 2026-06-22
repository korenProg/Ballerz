import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Crest from "../Crest";
import { T } from "../../constants/theme";
import type { Player } from "../../types/players";

type TeamStepProps = {
  stepNum: 1 | 2;
  sideLabel: "Home" | "Away";
  colors: string[];
  name: string; onName: (s: string) => void;
  color: string; onColor: (c: string) => void;
  logo: string | null; onPickLogo: () => void; onClearLogo: () => void;
  players: Player[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  defaultTeamSize: number;
  onAddPlayers: () => void;
};

export default function TeamStep({
  stepNum, sideLabel, colors, name, onName, color, onColor,
  logo, onPickLogo, onClearLogo, players, selectedIds, onToggle,
  defaultTeamSize, onAddPlayers,
}: TeamStepProps) {
  return (
    <View>
      <Text style={styles.eyebrow}>STEP {stepNum} OF 3</Text>
      <Text style={styles.title}>{sideLabel} team</Text>
      <Text style={styles.sub}>Set up the {sideLabel.toLowerCase()} side.</Text>

      <View style={styles.preview}>
        <Crest name={name || sideLabel} color={color} logo={logo ?? undefined} size={96} />
        <Text style={styles.previewName} numberOfLines={1}>{name || sideLabel}</Text>
      </View>

      <Text style={styles.label}>Team name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={onName}
        placeholder={sideLabel === "Home" ? "e.g. Reds" : "e.g. Blues"}
        placeholderTextColor={T.textMuted}
      />

      <Text style={styles.label}>Color</Text>
      <View style={styles.swatchRow}>
        {colors.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.swatch, { backgroundColor: c }, color === c && styles.swatchActive]}
            activeOpacity={0.8}
            onPress={() => onColor(c)}
          >
            {color === c ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Logo (optional)</Text>
      <View style={styles.logoRow}>
        <TouchableOpacity style={styles.logoSlot} activeOpacity={0.8} onPress={onPickLogo}>
          {logo ? (
            <Image source={{ uri: logo }} style={styles.logoSlotImg} resizeMode="contain" />
          ) : (
            <Ionicons name="image-outline" size={20} color={T.textSecondary} />
          )}
        </TouchableOpacity>
        {logo ? (
          <TouchableOpacity onPress={onClearLogo} hitSlop={8}>
            <Text style={styles.clearTxt}>Remove</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <Text style={styles.label}>
        Squad (optional · {defaultTeamSize}v{defaultTeamSize} · {selectedIds.length} selected)
      </Text>
      {players.length === 0 ? (
        <TouchableOpacity onPress={onAddPlayers}>
          <Text style={styles.hintLink}>No players yet — add players first</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.chipWrap}>
          {players.map((p) => {
            const on = selectedIds.includes(p.id);
            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.chip, on && { backgroundColor: color, borderColor: color }]}
                activeOpacity={0.8}
                onPress={() => onToggle(p.id)}
              >
                <Text style={[styles.chipTxt, on && styles.chipTxtOn]}>{p.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: { fontSize: 11, fontWeight: "800", color: T.textSecondary, letterSpacing: 2 },
  title: { fontSize: 28, fontWeight: "900", color: T.textPrimary, marginTop: 4 },
  sub: { fontSize: 13, color: T.textSecondary, marginBottom: 8 },
  preview: { alignItems: "center", gap: 8, marginTop: 14, marginBottom: 6 },
  previewName: { fontSize: 16, fontWeight: "800", color: T.textPrimary, maxWidth: 220 },
  label: { fontSize: 12, fontWeight: "800", color: T.textSecondary, marginTop: 16, marginBottom: 8 },
  input: { backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: T.textPrimary },
  swatchRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  swatch: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  swatchActive: { borderWidth: 2, borderColor: T.textPrimary },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  logoSlot: { width: 56, height: 56, borderRadius: 12, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  logoSlotImg: { width: "100%", height: "100%" },
  clearTxt: { fontSize: 13, fontWeight: "700", color: T.textSecondary, textDecorationLine: "underline" },
  hintLink: { fontSize: 13, color: T.textSecondary, textDecorationLine: "underline" },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border },
  chipTxt: { fontSize: 13, fontWeight: "700", color: T.textSecondary },
  chipTxtOn: { color: "#fff" },
});
