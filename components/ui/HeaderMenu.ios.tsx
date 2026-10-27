import { Fragment } from "react";
import { Host, Menu, Button, Divider, Image } from "@expo/ui/swift-ui";
import {
  frame,
  glassEffect,
  background,
  shapes,
  menuStyle,
  buttonStyle,
  menuIndicator,
  disabled,
  accessibilityLabel,
} from "@expo/ui/swift-ui/modifiers";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { T } from "../../constants/theme";
import type { HeaderMenuProps } from "./HeaderMenu";

const GLASS = isLiquidGlassAvailable();
const SIZE = 40;

// iOS: Apple's own pull-down menu (SwiftUI Menu) behind a round ⋯ button
// that matches the other header buttons — Liquid Glass on iOS 26+.
export default function HeaderMenu({ label, items }: HeaderMenuProps) {
  return (
    <Host matchContents colorScheme="dark" style={{ width: SIZE, height: SIZE }}>
      <Menu
        label={
          <Image
            systemName="ellipsis"
            size={17}
            color={T.text}
            modifiers={[
              frame({ width: SIZE, height: SIZE }),
              GLASS
                ? glassEffect({ glass: { variant: "regular", interactive: true }, shape: "circle" })
                : background(T.surface, shapes.circle()),
            ]}
          />
        }
        modifiers={[menuStyle("button"), buttonStyle("plain"), menuIndicator("hidden"), accessibilityLabel(label)]}
      >
        {items.map((item, i) => (
          <Fragment key={item.label}>
            {/* Destructive actions sit in their own group at the bottom, as in iOS menus. */}
            {item.destructive && i > 0 ? <Divider /> : null}
            <Button
              label={item.label}
              systemImage={item.sfSymbol}
              role={item.destructive ? "destructive" : "default"}
              onPress={item.onPress}
              modifiers={item.disabled ? [disabled(true)] : undefined}
            />
          </Fragment>
        ))}
      </Menu>
    </Host>
  );
}
