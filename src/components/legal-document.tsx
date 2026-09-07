import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

export function LegalDocument({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.content}>
      <ThemedText type="title" style={styles.title}>
        {title}
      </ThemedText>
      {body.split('\n\n').map((paragraph) => (
        <ThemedText key={paragraph.slice(0, 24)} themeColor="textSecondary" style={styles.paragraph}>
          {paragraph}
        </ThemedText>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.three,
    paddingBottom: Spacing.two,
  },
  title: {
    fontSize: 32,
    lineHeight: 44,
  },
  paragraph: {
    lineHeight: 24,
  },
});
