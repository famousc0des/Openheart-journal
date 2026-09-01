import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { EmptyState } from '@/components/ui/empty-state';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatRelative } from '@/lib/date';
import { useCollection } from '@/lib/collection-store';
import { CARD_PALETTE, entryIcon, entryLabel } from '@/lib/journal-display';
import { journalStore } from '@/lib/stores';
import { JournalEntry } from '@/lib/types';

export default function JournalScreen() {
  const theme = useTheme();
  const entries = useCollection(journalStore);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const sorted = [...entries].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(
      (entry) =>
        entry.body.toLowerCase().includes(q) ||
        entry.title?.toLowerCase().includes(q) ||
        entry.prompt?.toLowerCase().includes(q)
    );
  }, [entries, query]);

  function openMenu(entry: JournalEntry) {
    Alert.alert(entryLabel(entry), undefined, [
      { text: 'Open', onPress: () => router.push(`/journal/${entry.id}`) },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => journalStore.remove(entry.id),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.fill} edges={['top']}>
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          ListHeaderComponent={
            <View style={styles.header}>
              <View style={styles.headerRow}>
                <View>
                  <ThemedText type="title" style={styles.title}>
                    Journal
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.countLabel}>
                    {entries.length} {entries.length === 1 ? 'ENTRY' : 'ENTRIES'}
                  </ThemedText>
                </View>
                <Pressable
                  onPress={() => router.push('/journal/new')}
                  style={[styles.addButton, { backgroundColor: theme.accent }]}>
                  <Ionicons name="add" size={24} color="#fff" />
                </Pressable>
              </View>
              <View style={[styles.searchBar, { backgroundColor: theme.backgroundElement }]}>
                <Ionicons name="search" size={16} color={theme.textSecondary} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search your entries"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.searchInput, { color: theme.text }]}
                />
              </View>
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              title={query ? 'No matches' : 'Nothing here yet'}
              body={
                query
                  ? 'Try a different word or clear your search.'
                  : 'Your morning and evening check-ins will show up here as you go.'
              }
            />
          }
          renderItem={({ item, index }) => (
            <Pressable
              onPress={() => router.push(`/journal/${item.id}`)}
              style={[styles.card, { backgroundColor: CARD_PALETTE[index % CARD_PALETTE.length] }]}>
              <Ionicons
                name={entryIcon(item)}
                size={96}
                color="rgba(255,255,255,0.12)"
                style={styles.cardWatermark}
              />
              <View style={styles.cardTopRow}>
                <View style={styles.cardIconBadge}>
                  <Ionicons name={entryIcon(item)} size={16} color="#fff" />
                </View>
                <Pressable hitSlop={10} onPress={() => openMenu(item)}>
                  <Ionicons name="ellipsis-horizontal" size={20} color="rgba(255,255,255,0.85)" />
                </Pressable>
              </View>
              <ThemedText style={styles.cardTitle} numberOfLines={3}>
                {entryLabel(item)}
              </ThemedText>
              <ThemedText style={styles.cardMeta}>{formatRelative(item.createdAt)}</ThemedText>
            </Pressable>
          )}
        />
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
    gap: Spacing.three,
    marginBottom: Spacing.two,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
  },
  countLabel: {
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    borderRadius: Radius.pill,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  card: {
    borderRadius: Radius.large,
    padding: Spacing.four,
    minHeight: 150,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  cardWatermark: {
    position: 'absolute',
    right: -12,
    bottom: -16,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
  },
  cardMeta: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
});
