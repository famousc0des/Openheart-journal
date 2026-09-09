import { NamedIcon } from '@/components/ui/icon';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { Fonts, HairlineBorder } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const STROKE = 3.5;
const RING_INSET = 5;

export function profileCompletenessPercent(photoUri: string, name: string, location: string): number {
  let percent = 0;
  if (photoUri.trim()) percent += 40;
  if (name.trim()) percent += 40;
  if (location.trim()) percent += 20;
  return percent;
}

export function ProfileAvatar({
  uri,
  name,
  size = 112,
  onPress,
  completeness,
  minimal = false,
}: {
  uri: string;
  name: string;
  size?: number;
  onPress?: () => void;
  /** 0–100. When set, draws a progress ring and percent pill instead of the camera badge. */
  completeness?: number;
  /** Plain portrait for the profile summary; editing remains available on press. */
  minimal?: boolean;
}) {
  const theme = useTheme();
  const letter = (name.trim() || '?').charAt(0).toUpperCase();
  const showRing = completeness != null && !minimal;
  const target = Math.max(0, Math.min(100, completeness ?? 0)) / 100;
  const outer = showRing ? size + RING_INSET * 2 + STROKE * 2 : size;
  const cx = outer / 2;
  const radius = (outer - STROKE) / 2 - 0.5;
  const circumference = 2 * Math.PI * radius;
  const overlay = Math.round(size * 0.32);
  const progress = useSharedValue(showRing ? 0 : target);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!showRing) return;
    if (reduceMotion) {
      progress.value = target;
      return;
    }
    progress.value = withTiming(target, {
      duration: 640,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, reduceMotion, showRing, target]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const photo = uri ? (
    <Image source={{ uri }} contentFit="cover" style={{ width: size, height: size, borderRadius: size / 2 }} />
  ) : (
    <View
      style={[
        styles.photo,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.accentSoft,
        },
      ]}>
      <Text allowFontScaling={false} style={[styles.letter, { color: theme.accent, fontSize: size * 0.32 }]}>
        {letter}
      </Text>
    </View>
  );

  return (
    <View style={{ width: outer, height: outer, alignItems: 'center', justifyContent: 'center' }}>
      {showRing ? (
        <Svg
          width={outer}
          height={outer}
          style={StyleSheet.absoluteFill}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants">
          <Circle
            cx={cx}
            cy={cx}
            r={radius}
            stroke={theme.border}
            strokeWidth={STROKE}
            fill="none"
          />
          <AnimatedCircle
            cx={cx}
            cy={cx}
            r={radius}
            stroke={theme.accent}
            strokeWidth={STROKE}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            transform={`rotate(-90 ${cx} ${cx})`}
            animatedProps={animatedProps}
          />
        </Svg>
      ) : null}

      <Pressable
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={
          onPress
            ? completeness != null
              ? `Change profile photo. Profile ${Math.round(target * 100)} percent complete`
              : 'Change profile photo'
            : 'Profile photo'
        }
        hitSlop={showRing ? 8 : 0}
        style={[
          styles.photoHit,
          !showRing && HairlineBorder,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: theme.border,
            backgroundColor: theme.background,
          },
        ]}>
        {photo}
      </Pressable>

      {showRing ? (
        <View
          pointerEvents="none"
          style={[
            styles.percentPill,
            {
              backgroundColor: theme.primary,
              borderColor: theme.background,
            },
          ]}>
          <Text allowFontScaling={false} style={[styles.percentText, { color: theme.onPrimary }]}>
            {`${Math.round(target * 100)}%`}
          </Text>
        </View>
      ) : onPress && !minimal ? (
        <View
          pointerEvents="none"
          style={[
            styles.editBadge,
            {
              width: overlay,
              height: overlay,
              borderRadius: overlay / 2,
              backgroundColor: theme.primary,
              borderColor: theme.background,
            },
          ]}>
          <NamedIcon name="camera" size={Math.round(overlay * 0.48)} color={theme.onPrimary} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  photoHit: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photo: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  letter: {
    fontFamily: Fonts.medium,
    includeFontPadding: false,
    textAlign: 'center',
  },
  percentPill: {
    position: 'absolute',
    bottom: 0,
    minWidth: 44,
    minHeight: 24,
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentText: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.2,
    includeFontPadding: false,
  },
  editBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
});
