import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, Tracking } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { moodFace } from '@/lib/mood-faces';
import { Mood } from '@/lib/types';

const RING = 1.5;
const RING_GAP = 2;

type MoodFaceButtonProps = {
  mood: Mood;
  label: string;
  size: number;
  selected: boolean;
  /** Dim the face when another mood is already chosen. */
  quiet?: boolean;
  /** Stretch to share a full-width row (primary five). */
  fill?: boolean;
  /** When true, GIF faces stay on the first frame even if selected. */
  reduceMotion?: boolean;
  onPress: () => void;
};

export function MoodFaceButton({
  mood,
  label,
  size,
  selected,
  quiet = false,
  fill = false,
  reduceMotion = false,
  onPress,
}: MoodFaceButtonProps) {
  const theme = useTheme();
  const autoplay = selected && !reduceMotion;
  const ringBox = size + RING_GAP * 2 + RING * 2;
  const columnWidth = Math.max(ringBox, 64);
  const faceOpacity = selected ? 1 : quiet ? 0.55 : 0.92;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.hit,
        fill ? styles.fill : { width: columnWidth },
        pressed && styles.pressed,
      ]}>
      <View
        style={[
          styles.ring,
          {
            width: ringBox,
            height: ringBox,
            borderRadius: ringBox / 2,
            borderWidth: RING,
            borderColor: selected ? theme.accent : 'transparent',
          },
        ]}>
        <View
          style={[
            styles.clip,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              opacity: faceOpacity,
            },
          ]}>
          <Image
            key={`${mood}-${selected}`}
            source={moodFace(mood)}
            style={[styles.face, { width: size, height: size }]}
            contentFit="cover"
            contentPosition="center"
            autoplay={autoplay}
            allowDownscaling
            cachePolicy="memory-disk"
            pointerEvents="none"
          />
        </View>
      </View>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.85}
        style={[styles.label, { color: selected ? theme.text : theme.textSecondary }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 6,
  },
  fill: {
    flex: 1,
  },
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  clip: {
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  face: {
    transform: [{ scale: 1.08 }],
  },
  label: {
    alignSelf: 'stretch',
    fontFamily: Fonts.medium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: Tracking.body,
    textAlign: 'center',
    includeFontPadding: false,
  },
  pressed: {
    opacity: 0.72,
  },
});
