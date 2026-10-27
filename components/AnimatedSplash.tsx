import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import Animated, { css, cubicBezier, useReducedMotion } from "react-native-reanimated";
import * as SplashScreen from "expo-splash-screen";
import { T } from "../constants/theme";

// Matches the native splash (app.json → expo-splash-screen imageWidth 200,
// centred on black) so the hand-off from the static splash is invisible.
const LOGO = 200;
const MIN_MS = 2000;
const EXIT_MS = 500;

// Every loop starts and ends on its resting frame, so frame 0 equals the
// static native splash and the loop seam is invisible.
const SINE = cubicBezier(0.37, 0, 0.63, 1);
const EASE_OUT = cubicBezier(0.23, 1, 0.32, 1);

// Breathing with a soft fluid deformation: width and height swell a quarter
// cycle apart (±1.5% around a 1 → 1.04 breath), so the mark feels alive
// rather than zoomed.
const breathe = css.keyframes({
  "0%": { transform: [{ scaleX: 1 }, { scaleY: 1 }] },
  "25%": { transform: [{ scaleX: 1.035 }, { scaleY: 1.01 }] },
  "50%": { transform: [{ scaleX: 1.04 }, { scaleY: 1.04 }] },
  "75%": { transform: [{ scaleX: 1.01 }, { scaleY: 1.035 }] },
  "100%": { transform: [{ scaleX: 1 }, { scaleY: 1 }] },
});

// A slow float on a different period, so the combined motion never repeats
// mechanically.
const float = css.keyframes({
  "0%": { transform: [{ translateY: 0 }] },
  "50%": { transform: [{ translateY: -5 }] },
  "100%": { transform: [{ translateY: 0 }] },
});

// A barely-there accent halo breathing with the logo.
const glow = css.keyframes({
  "0%": { opacity: 0.06, transform: [{ scale: 0.92 }] },
  "50%": { opacity: 0.14, transform: [{ scale: 1.05 }] },
  "100%": { opacity: 0.06, transform: [{ scale: 0.92 }] },
});

export default function AnimatedSplash({
  ready,
  onDone,
}: {
  ready: boolean;
  onDone: () => void;
}) {
  const reduced = useReducedMotion();
  const [minElapsed, setMinElapsed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), MIN_MS);
    return () => clearTimeout(t);
  }, []);

  // Leave only once the app is ready AND the minimum time has passed; while
  // loading runs long, the loop simply keeps breathing.
  const leaving = ready && minElapsed;

  useEffect(() => {
    if (!leaving) return;
    const t = setTimeout(onDone, EXIT_MS);
    return () => clearTimeout(t);
  }, [leaving, onDone]);

  return (
    <Animated.View
      pointerEvents={leaving ? "none" : "auto"}
      // First frame of this view is identical to the native splash, so hide
      // that one now; the swap can't be seen.
      onLayout={() => {
        SplashScreen.hideAsync().catch(() => {});
      }}
      style={[
        styles.overlay,
        {
          opacity: leaving ? 0 : 1,
          transitionProperty: "opacity",
          transitionDuration: EXIT_MS,
          transitionTimingFunction: EASE_OUT,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.stage,
          {
            transform: [{ scale: leaving && !reduced ? 0.94 : 1 }],
            transitionProperty: "transform",
            transitionDuration: EXIT_MS,
            transitionTimingFunction: EASE_OUT,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.glow,
            reduced
              ? styles.glowStill
              : {
                  animationName: glow,
                  animationDuration: 3200,
                  animationIterationCount: "infinite",
                  animationTimingFunction: SINE,
                },
          ]}
        />
        <Animated.View
          style={
            reduced
              ? null
              : {
                  animationName: float,
                  animationDuration: 4500,
                  animationIterationCount: "infinite",
                  animationTimingFunction: SINE,
                }
          }
        >
          <Animated.Image
            source={require("../assets/images/xi_logo_white_png.png")}
            resizeMode="contain"
            style={[
              styles.logo,
              reduced
                ? null
                : {
                    animationName: breathe,
                    animationDuration: 3200,
                    animationIterationCount: "infinite",
                    animationTimingFunction: SINE,
                  },
            ]}
          />
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 10,
    backgroundColor: T.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  stage: { alignItems: "center", justifyContent: "center" },
  logo: { width: LOGO, height: LOGO },
  // A small core with a wide, heavily blurred shadow: a soft halo with no hard
  // edge (a plain circle at low opacity would read as a flat green disc).
  glow: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: T.accent,
    boxShadow: `0 0 90px 60px ${T.accent}`,
    opacity: 0.06,
  },
  glowStill: { opacity: 0.08 },
});
