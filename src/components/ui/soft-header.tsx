import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { HairlineBorder, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function CircleIconButton({
  icon,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.circle, HairlineBorder, { backgroundColor: theme.softFill, borderColor: theme.border }]}
      hitSlop={8}>
      <Ionicons name={icon} size={19} color={theme.text} />
    </Pressable>
  );
}

export function SoftHeader({
  title,
  onBack,
  right,
}: {
  title?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <CircleIconButton icon="chevron-back" onPress={onBack ?? (() => router.back())} />
      {title ? (
        <ThemedText type="smallBold" style={styles.title} numberOfLines={1}>
          {title}
        </ThemedText>
      ) : (
        <View style={{ flex: 1 }} />
      )}
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: 2,
    paddingBottom: Spacing.one,
    gap: Spacing.two,
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
  },
  right: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
});
