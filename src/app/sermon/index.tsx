import { router } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PressableCard } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Fab } from '@/components/ui/fab';
import { Spacing } from '@/constants/theme';
import { formatDate } from '@/lib/date';
import { useCollection } from '@/lib/collection-store';
import { sermonStore } from '@/lib/stores';

export default function SermonScreen() {
  const notes = useCollection(sermonStore);

  const sorted = useMemo(
    () => [...notes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [notes]
  );

  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.fill} edges={['top']}>
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          ListHeaderComponent={
            <View style={styles.header}>
              <ThemedText type="small" themeColor="textSecondary">
                Capture notes on Sunday, and Openheart will bring them back mid-week.
              </ThemedText>
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              title="No notes yet"
              body="Jot down what stood out this Sunday. You'll be nudged to revisit it later in the week."
            />
          }
          renderItem={({ item }) => (
            <PressableCard style={styles.item} onPress={() => router.push(`/sermon/${item.id}`)}>
              <View style={styles.itemHeaderRow}>
                <ThemedText type="smallBold" numberOfLines={1} style={{ flex: 1 }}>
                  {item.title}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {formatDate(item.createdAt)}
                </ThemedText>
              </View>
              <ThemedText numberOfLines={2} themeColor="textSecondary">
                {item.rawNotes}
              </ThemedText>
              {item.tidiedNotes && (
                <ThemedText type="small" themeColor="success">
                  ✓ Tidied
                </ThemedText>
              )}
            </PressableCard>
          )}
        />
        <Fab onPress={() => router.push('/sermon/new')} />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: {
    padding: Spacing.four,
    paddingBottom: Spacing.six * 2,
    gap: Spacing.three,
  },
  header: {
    gap: Spacing.one,
    marginBottom: Spacing.two,
  },
  title: {
    fontSize: 32,
    lineHeight: 44,
  },
  item: {
    gap: Spacing.one,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
