import type { SFSymbol } from "sf-symbols-typescript";
import { HeaderButton } from "./HeaderButton";
import { chooseAction } from "./chooseAction";

export type HeaderMenuItem = {
  label: string;
  // The icon shown beside the item in the native iOS menu.
  sfSymbol: SFSymbol;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
};

export type HeaderMenuProps = { label: string; items: HeaderMenuItem[] };

// Android and web: the same ⋯ button, opening the items as a list of choices.
// iOS uses HeaderMenu.ios.tsx, Apple's native pull-down menu.
export default function HeaderMenu({ label, items }: HeaderMenuProps) {
  return (
    <HeaderButton
      icon="ellipsis-horizontal"
      label={label}
      onPress={() =>
        chooseAction(
          undefined,
          [
            ...items
              .filter((item) => !item.disabled)
              .map((item) => ({
                text: item.label,
                style: item.destructive ? ("destructive" as const) : undefined,
                onPress: item.onPress,
              })),
            { text: "Cancel", style: "cancel" as const },
          ],
        )
      }
    />
  );
}
