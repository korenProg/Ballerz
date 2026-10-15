import { View, TextInput, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { T, SPACE, RADIUS } from "../../constants/theme";

// Rounded search input with a leading magnifier and a clear (✕) button that
// appears once there is text.
export default function SearchField({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
}) {
  return (
    <View style={styles.field}>
      <Ionicons name="search" size={18} color={T.textFaint} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={T.textFaint}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="never"
        accessibilityLabel={placeholder}
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={8}
          onPress={() => onChangeText("")}
          style={({ pressed }) => [styles.clear, pressed ? styles.clearPressed : null]}
        >
          <Ionicons name="close" size={14} color={T.bg} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.sm,
    height: 44,
    paddingHorizontal: SPACE.md,
    borderRadius: RADIUS.control,
    backgroundColor: T.surface,
  },
  // outlineWidth: 0 drops the browser's focus rectangle on web; it is a no-op on native.
  input: { flex: 1, height: 44, fontSize: 15, fontWeight: "500", color: T.text, outlineWidth: 0 },
  clear: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.textFaint,
  },
  clearPressed: { opacity: 0.6 },
});
