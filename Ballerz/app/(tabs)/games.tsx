import { View, Text, StyleSheet } from "react-native";

export default function GamesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Games</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: { fontSize: 18 },
});
