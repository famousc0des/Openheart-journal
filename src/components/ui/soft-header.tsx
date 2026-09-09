import { NamedIcon } from '@/components/ui/icon';
import type { IconName } from '@/lib/icons/app';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts, HairlineBorder, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function CircleIconButton({
  icon,
  onPress,
  accessibilityLabel,
}: {
  icon: IconName;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[styles.circle, HairlineBorder, { backgroundColor: theme.softFill, borderColor: theme.border }]}
      hitSlop={8}>
      <NamedIcon name={icon} size={19} color={theme.text} />
    </Pressable>
  );
}

export function SoftHeader({
  title,
  onBack,
  left,
  right,
}: {
  title?: string;
  onBack?: () => void;
  left?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.side}>
        {left ?? <CircleIconButton icon="chevron-back" accessibilityLabel="Back" onPress={onBack ?? (() => router.back())} />}
      </View>
      {title ? (
        <ThemedText type="smallBold" style={styles.title} numberOfLines={1}>
          {title}
        </ThemedText>
      ) : (
        <View style={{ flex: 1 }} />
      )}
      <View style={[styles.side, styles.sideEnd]}>{right}</View>
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
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: Fonts.bold,
    fontSize: 17,
    lineHeight: 24,
  },
  side: {
    minWidth: 44,
    alignItems: 'flex-start',
  },
  sideEnd: {
    alignItems: 'flex-end',
  },
});
