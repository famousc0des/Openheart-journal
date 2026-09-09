import { NamedIcon } from '@/components/ui/icon';
import type { IconName } from '@/lib/icons/app';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function EmptyState({
  title,
  body,
  icon,
}: {
  title: string;
  body: string;
  icon?: IconName;
}) {
  const theme = useTheme();

  return (
    <View style={styles.wrap}>
      {icon ? (
        <View style={[styles.iconWell, { backgroundColor: theme.accentSoft }]}>
          <NamedIcon name={icon} size={36} color={theme.accent} />
        </View>
      ) : null}
      <ThemedText type="subtitle" style={styles.title}>
        {title}
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.body}>
        {body}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexGrow: 1,
    minHeight: 280,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  iconWell: {
    width: 88,
    height: 88,
    borderRadius: Radius.large,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  title: {
    fontSize: 20,
    lineHeight: 28,
    textAlign: 'center',
  },
  body: {
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 24,
  },
});
