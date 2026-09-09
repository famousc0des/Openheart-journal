import { Pressable, StyleSheet, Text } from 'react-native';

import { Fonts, HairlineBorder, PrimaryActionShadow, Radius, Tracking } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { hexToRgba } from '@/lib/color';

export function Pill({
  label,
  active,
  onPress,
  color,
  size = 'md',
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  color?: string;
  size?: 'md' | 'lg';
}) {
  const theme = useTheme();
  // Colored pills use the tinted-outline badge treatment; neutral active pills
  // use the bone primary-action fill.
  const background = active ? (color ? hexToRgba(color, 0.12) : theme.primary) : theme.softFill;
  const textColor = active ? (color ?? theme.onPrimary) : theme.textSecondary;
  const borderColor = active && color ? color : undefined;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: Boolean(active) }}
      onPress={onPress}
      style={[
        styles.pill,
        HairlineBorder,
        size === 'lg' && styles.pillLarge,
        { backgroundColor: background, borderColor: theme.border },
        borderColor != null && { borderColor },
        active && !color && PrimaryActionShadow,
      ]}>
      <Text style={[styles.label, size === 'lg' && styles.labelLarge, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
  },
  pillLarge: {
    paddingHorizontal: 22,
    paddingVertical: 13,
  },
  label: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    includeFontPadding: false,
    letterSpacing: Tracking.body,
  },
  labelLarge: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    lineHeight: 21,
    includeFontPadding: false,
    letterSpacing: Tracking.body,
  },
});
