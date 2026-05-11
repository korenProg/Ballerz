import React, { useState } from "react";
import { View, Text, Image, StyleSheet } from "react-native";

type Props = {
  photo?: string;
  name: string;
  size: number;
  borderRadius?: number;
  color?: string;
  backgroundColor?: string;
};

export function PlayerPhoto({ photo, name, size, borderRadius, color = "#fff", backgroundColor = "transparent" }: Props) {
  const [error, setError] = useState(false);
  const r = borderRadius ?? size / 2;
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <View style={[s.wrap, { width: size, height: size, borderRadius: r, backgroundColor }]}>
      {photo && !error
        ? <Image source={{ uri: photo }} style={{ width: size, height: size, borderRadius: r }} onError={() => setError(true)} />
        : <Text style={[s.initials, { fontSize: size * 0.3, color }]}>{initials}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
  initials: { fontWeight: "900" },
});
