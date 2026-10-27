import type { ComponentPropsWithRef } from "react";
import { Text as RNText, TextInput as RNTextInput, StyleSheet } from "react-native";
import { FONT } from "../../constants/theme";

// React Native's Text and TextInput with the app font (FONT) applied, so no
// screen sets fontFamily itself. Import these instead of react-native's.
// A style that sets its own fontFamily still wins.
export function Text({ style, ...props }: ComponentPropsWithRef<typeof RNText>) {
  return <RNText {...props} style={[styles.font, style]} />;
}

export function TextInput({ style, ...props }: ComponentPropsWithRef<typeof RNTextInput>) {
  return <RNTextInput {...props} style={[styles.font, style]} />;
}

const styles = StyleSheet.create({ font: { fontFamily: FONT } });
