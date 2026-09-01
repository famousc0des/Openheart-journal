import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <ThemedView style={styles.wrap}>
      <ThemedText type="subtitle" style={styles.title}>
        {title}
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.body}>
        {body}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: Spacing.six,
    alignItems: 'center',
    gap: Spacing.two,
  },
  title: {
    fontSize: 20,
    textAlign: 'center',
  },
  body: {
    textAlign: 'center',
  },
});
