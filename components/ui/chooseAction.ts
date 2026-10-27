import { Platform, Alert, ActionSheetIOS } from "react-native";
import { T } from "../../constants/theme";

export type Choice = { text: string; style?: "destructive" | "cancel"; onPress?: () => void };

// iOS gets the native action sheet that rises from the bottom; other
// platforms fall back to an alert with the same choices.
export function chooseAction(message: string | undefined, choices: Choice[]) {
  if (Platform.OS === "ios") {
    const cancel = choices.findIndex((c) => c.style === "cancel");
    ActionSheetIOS.showActionSheetWithOptions(
      {
        message,
        options: choices.map((c) => c.text),
        cancelButtonIndex: cancel === -1 ? undefined : cancel,
        destructiveButtonIndex: choices.flatMap((c, i) => (c.style === "destructive" ? [i] : [])),
        userInterfaceStyle: "dark",
        tintColor: T.accent,
      },
      (i) => choices[i]?.onPress?.(),
    );
    return;
  }
  Alert.alert("", message, choices);
}
