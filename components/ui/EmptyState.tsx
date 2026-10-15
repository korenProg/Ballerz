import type { ComponentProps, ReactNode } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { T, SPACE } from "../../constants/theme";

export default function EmptyState({
  icon,
  title,
  sub,
  children,
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  title: string;
  sub: string;
  children?: ReactNode;
}) {
  return (
    <View style={styles.wrap}>
      <Ionicons name={icon} size={30} color={T.textFaint} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.sub}>{sub}</Text>
      {children ? <View style={styles.action}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", paddingTop: 64, paddingHorizontal: SPACE.xxxl, gap: 6 },
  title: { fontSize: 16, fontWeight: "600", color: T.text, marginTop: SPACE.sm },
  sub: { fontSize: 13, fontWeight: "400", color: T.textDim, textAlign: "center" },
  action: { marginTop: SPACE.md + 2, alignSelf: "stretch" },
});
