import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { Fonts, Radius, Spacing, Tracking } from "@/constants/theme";

const INK = "#2A1F3D";
const INK_SOFT = "rgba(42, 31, 61, 0.72)";
const EGGPLANT = "#3A2458";

export function OnboardingScreen({
  onGetStarted,
}: {
  onGetStarted: () => void;
}) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const contentOpacity = useSharedValue(1);
  const screenOpacity = useSharedValue(1);
  const loaderOpacity = useSharedValue(0);
  const loaderProgress = useSharedValue(0);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  const loaderLayerStyle = useAnimatedStyle(() => ({
    opacity: loaderOpacity.value,
  }));

  const loaderFillStyle = useAnimatedStyle(() => ({
    width: loaderProgress.value * 280,
  }));

  function finishTransition() {
    onGetStarted();
  }

  function fadeScreenOut() {
    screenOpacity.value = withTiming(
      0,
      { duration: 500, easing: Easing.out(Easing.cubic) },
      (done) => {
        if (done) runOnJS(finishTransition)();
      },
    );
  }

  function runLoader() {
    setIsTransitioning(true);
    loaderOpacity.value = withTiming(1, { duration: 200 });
    loaderProgress.value = withTiming(
      1,
      { duration: 1100, easing: Easing.inOut(Easing.cubic) },
      (done) => {
        if (done) runOnJS(fadeScreenOut)();
      },
    );
  }

  function handleGetStarted() {
    if (isTransitioning) return;
    contentOpacity.value = withTiming(
      0,
      { duration: 400, easing: Easing.out(Easing.cubic) },
      (done) => {
        if (done) runOnJS(runLoader)();
      },
    );
  }

  return (
    <Animated.View
      style={[styles.fill, screenStyle]}
    >
      <Image
        source={require("@/assets/images/start-screen.png")}
        resizeMode="cover"
        style={styles.art}
      />
      <View pointerEvents="none" style={styles.artDim} />

      <SafeAreaView
        style={styles.overlay}
        edges={["top", "bottom"]}
        pointerEvents="box-none"
      >
        <Animated.View style={[styles.header, contentStyle]}>
          <Animated.Text
            entering={FadeInDown.duration(460)
              .delay(80)
              .easing(Easing.out(Easing.cubic))}
            style={styles.kicker}
          >
            Welcome to
          </Animated.Text>
          <Animated.Text
            entering={FadeInDown.duration(560)
              .delay(200)
              .springify()
              .damping(18)
              .stiffness(140)}
            style={styles.title}
          >
            Openheart
          </Animated.Text>
        </Animated.View>

        <View style={styles.spacer} />

        <Animated.View style={[styles.footer, contentStyle]}>
          <Animated.Text
            entering={FadeInUp.duration(480)
              .delay(380)
              .easing(Easing.out(Easing.cubic))}
            style={styles.tagline}
          >
            A private place journal for your prayers and sermon notes, just for
            you and your loved ones.
          </Animated.Text>
          <Animated.Text
            entering={FadeInUp.duration(480)
              .delay(450)
              .easing(Easing.out(Easing.cubic))}
            style={styles.verse}
          >
            Hebrews 13:5
          </Animated.Text>
          <Animated.View
            entering={FadeInUp.duration(520).delay(520).springify().damping(16)}
          >
            <Pressable
              accessibilityRole="button"
              disabled={isTransitioning}
              onPress={handleGetStarted}
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.buttonText}>Get Started</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>

        {isTransitioning && (
          <Animated.View
            pointerEvents="none"
            style={[styles.loaderLayer, loaderLayerStyle]}
          >
            <View style={styles.loaderTrack}>
              <Animated.View style={[styles.loaderFill, loaderFillStyle]} />
            </View>
          </Animated.View>
        )}
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  art: {
    ...StyleSheet.absoluteFill,
    width: "100%",
    height: "100%",
  },
  artDim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.28)",
    zIndex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 2,
    elevation: 2,
  },
  header: {
    paddingHorizontal: Spacing.five,
    paddingTop: Spacing.five,
    gap: 4,
  },
  spacer: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: Spacing.five,
    paddingBottom: Spacing.two,
    gap: Spacing.three,
  },
  kicker: {
    color: INK_SOFT,
    fontFamily: Fonts.regular,
    fontSize: 34,
    lineHeight: 44,
    letterSpacing: Tracking.heading,
  },
  title: {
    color: INK,
    fontFamily: Fonts.regular,
    fontSize: 64,
    lineHeight: 80,
    letterSpacing: Tracking.display,
  },
  tagline: {
    color: "#FFFFFF",
    fontFamily: Fonts.bold,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: Tracking.body,
  },
  verse: {
    color: "rgba(255, 255, 255, 0.78)",
    fontFamily: Fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: Tracking.body,
  },
  button: {
    backgroundColor: EGGPLANT,
    paddingVertical: 18,
    borderRadius: Radius.pill,
    alignItems: "center",
    marginTop: Spacing.one,
  },
  buttonPressed: {
    opacity: 0.88,
  },
  buttonText: {
    color: "#FFFFFF",
    fontFamily: Fonts.medium,
    fontSize: 16,
    letterSpacing: Tracking.body,
  },
  loaderLayer: {
    position: "absolute",
    right: Spacing.five,
    bottom: Spacing.six * 2,
    left: Spacing.five,
    alignItems: "center",
  },
  loaderTrack: {
    width: "100%",
    maxWidth: 280,
    height: 5,
    overflow: "hidden",
    borderRadius: Radius.pill,
    backgroundColor: "rgba(42, 31, 61, 0.12)",
  },
  loaderFill: {
    height: "100%",
    borderRadius: Radius.pill,
    backgroundColor: EGGPLANT,
  },
});
