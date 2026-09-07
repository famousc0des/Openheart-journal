import { Ionicons } from '@expo/vector-icons';
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
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const theme = useTheme();

  return (
    <View style={styles.wrap}>
      {icon ? (
        <View style={[styles.iconWell, { backgroundColor: theme.accentSoft }]}>
          <Ionicons name={icon} size={36} color={theme.accent} />
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
