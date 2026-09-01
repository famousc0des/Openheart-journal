import { Pressable, StyleSheet, Text } from 'react-native';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

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
  const background = active ? color ?? theme.accent : theme.backgroundElement;
  const textColor = active ? '#ffffff' : theme.textSecondary;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.pill, size === 'lg' && styles.pillLarge, { backgroundColor: background }]}>
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
    fontSize: 13,
    fontWeight: '600',
  },
  labelLarge: {
    fontSize: 16,
    fontWeight: '700',
  },
});
