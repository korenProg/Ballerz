import { View, TouchableOpacity, Image, StyleSheet } from "react-native";
import { Text, TextInput } from "../ui/Text";
import { Ionicons } from "@expo/vector-icons";
import Crest from "../Crest";
import { T } from "../../constants/theme";
import type { Player } from "../../types/players";

type TeamStepProps = {
  sideLabel: "Home" | "Away";
  colors: string[];
  name: string; onName: (s: string) => void;
  // The side's stock name ("Team A"). Tapping the field clears it; leaving
  // the field empty puts it back.
  defaultName: string;
  nameError?: string;
  color: string; onColor: (c: string) => void;
  logo: string | null; onPickLogo: () => void; onClearLogo: () => void;
  players: Player[];
  selectedIds: string[];
  // Players already picked for the other side, who can't play for this one.
  takenIds: string[];
  otherTeamName: string;
  onToggle: (id: string) => void;
  defaultTeamSize: number;
  onAddPlayers: () => void;
};

export default function TeamStep({
  sideLabel, colors, name, onName, defaultName, nameError, color, onColor,
  logo, onPickLogo, onClearLogo, players, selectedIds, takenIds, otherTeamName, onToggle,
  defaultTeamSize, onAddPlayers,
}: TeamStepProps) {
  return (
    <View>
      <Text style={styles.title}>{sideLabel} team</Text>
      <Text style={styles.sub}>Set up the {sideLabel.toLowerCase()} side.</Text>

      <View style={styles.preview}>
        <Crest name={name || defaultName} color={color} logo={logo ?? undefined} size={96} />
        <Text style={styles.previewName} numberOfLines={1}>{name || defaultName}</Text>
      </View>

      <Text style={styles.label}>Team name</Text>
      <TextInput
        style={[styles.input, nameError ? styles.inputError : null]}
        value={name}
        onChangeText={onName}
        onFocus={() => {
          if (name === defaultName) onName("");
        }}
        onBlur={() => {
          if (!name.trim()) onName(defaultName);
        }}
        placeholder={defaultName}
        placeholderTextColor={T.textFaint}
        keyboardAppearance="dark"
        selectionColor={T.accent}
      />
      {nameError ? <Text style={styles.error}>{nameError}</Text> : null}

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
            <Ionicons name="image-outline" size={20} color={T.textDim} />
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
            const taken = takenIds.includes(p.id);
            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.chip, on && { backgroundColor: color, borderColor: color }, taken && styles.chipTaken]}
                activeOpacity={0.8}
                disabled={taken}
                accessibilityState={{ disabled: taken, selected: on }}
                onPress={() => onToggle(p.id)}
              >
                <Text style={[styles.chipTxt, on && styles.chipTxtOn]}>
                  {p.name}
                  {taken ? <Text style={styles.chipTakenTxt}>{` · ${otherTeamName}`}</Text> : null}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: "700", color: T.text, marginTop: 4 },
  sub: { fontSize: 13, color: T.textDim, marginBottom: 8 },
  preview: { alignItems: "center", gap: 8, marginTop: 14, marginBottom: 6 },
  previewName: { fontSize: 16, fontWeight: "700", color: T.text, maxWidth: 220 },
  label: { fontSize: 12, fontWeight: "700", color: T.textDim, marginTop: 16, marginBottom: 8 },
  input: { backgroundColor: T.surface, borderWidth: 1, borderColor: T.divider, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: T.text },
  swatchRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  swatch: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  swatchActive: { borderWidth: 2, borderColor: T.text },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  logoSlot: { width: 56, height: 56, borderRadius: 12, backgroundColor: T.surface, borderWidth: 1, borderColor: T.divider, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  logoSlotImg: { width: "100%", height: "100%" },
  clearTxt: { fontSize: 13, fontWeight: "700", color: T.textDim, textDecorationLine: "underline" },
  hintLink: { fontSize: 13, color: T.textDim, textDecorationLine: "underline" },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: T.surface, borderWidth: 1, borderColor: T.divider },
  chipTxt: { fontSize: 13, fontWeight: "700", color: T.textDim },
  chipTxtOn: { color: "#fff" },
  chipTaken: { opacity: 0.4 },
  chipTakenTxt: { fontWeight: "500" },
  inputError: { borderColor: T.red },
  error: { fontSize: 12, fontWeight: "500", color: T.red, marginTop: 6 },
});
