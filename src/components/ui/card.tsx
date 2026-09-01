import { Pressable, PressableProps, StyleSheet, View, ViewProps } from 'react-native';

import { Radius, SoftShadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Card({ style, ...rest }: ViewProps) {
  const theme = useTheme();
  return (
    <View
      style={[styles.card, SoftShadow, { backgroundColor: theme.backgroundElement }, style]}
      {...rest}
    />
  );
}

export function PressableCard({ style, ...rest }: PressableProps) {
  const theme = useTheme();
  return (
    <Pressable
      style={(state) => [
        styles.card,
        SoftShadow,
        { backgroundColor: theme.backgroundElement },
        typeof style === 'function' ? style(state) : style,
        state.pressed && { opacity: 0.75 },
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.medium,
    padding: Spacing.three,
    gap: Spacing.two,
  },
});
