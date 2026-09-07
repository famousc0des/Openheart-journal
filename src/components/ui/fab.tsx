import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { PrimaryActionShadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Fab({
  onPress,
  icon = 'add',
}: {
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        PrimaryActionShadow,
        { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
      ]}>
      <Ionicons name={icon} size={28} color={theme.onPrimary} />
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
