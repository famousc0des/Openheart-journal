import { NamedIcon } from '@/components/ui/icon';
import type { IconName } from '@/lib/icons/app';
import { Pressable, StyleSheet } from 'react-native';

import { PrimaryActionShadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Fab({
  onPress,
  icon = 'add',
  accessibilityLabel = 'Add item',
}: {
  onPress: () => void;
  icon?: IconName;
  accessibilityLabel?: string;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        PrimaryActionShadow,
        { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
      ]}>
      <NamedIcon name={icon} size={28} color={theme.onPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
