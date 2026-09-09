import { NamedIcon } from '@/components/ui/icon';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { LayoutAnimationConfig } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { EmptyState } from '@/components/ui/empty-state';
import { HeaderAddButton } from '@/components/ui/header-add-button';
import { Fonts, HairlineBorder, Radius, Spacing, Tracking } from '@/constants/theme';
import { useTheme, useThemeScheme } from '@/hooks/use-theme';
import { formatRelative } from '@/lib/date';
import { useCollection } from '@/lib/collection-store';
import { exportJournalEntry } from '@/lib/journal-export';
import { CARD_PALETTE, DARK_CARD_PALETTE, entryIcon, entryLabel } from '@/lib/journal-display';
import { listLayout } from '@/lib/motion';
import { htmlToPlainText } from '@/lib/rich-text';
import { journalStore } from '@/lib/stores';
import { JournalEntry } from '@/lib/types';

export default function JournalScreen() {
  const theme = useTheme();
  const scheme = useThemeScheme();
  const styles = createStyles(theme);
  const entries = useCollection(journalStore);
  const [query, setQuery] = useState('');

  const cardPalette = scheme === 'dark' ? DARK_CARD_PALETTE : CARD_PALETTE;

  const filtered = useMemo(() => {
    const sorted = [...entries].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(
      (entry) =>
        htmlToPlainText(entry.body).toLowerCase().includes(q) ||
        entry.title?.toLowerCase().includes(q) ||
        entry.prompt?.toLowerCase().includes(q)
    );
  }, [entries, query]);

  function openMenu(entry: JournalEntry) {
    Alert.alert(entryLabel(entry), undefined, [
      { text: 'Open', onPress: () => router.push(`/journal/${entry.id}`) },
      { text: 'Export', onPress: () => exportJournalEntry(entry) },
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
        <LayoutAnimationConfig skipEntering>
          <Animated.FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            itemLayoutAnimation={listLayout}
            contentContainerStyle={[styles.content, filtered.length === 0 && styles.contentEmpty]}
            ListHeaderComponent={
              <View style={styles.header}>
                <View style={styles.headerRow}>
                  <View style={styles.headerCopy}>
                    <ThemedText type="title" style={styles.title}>
                      Journal
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" style={styles.countLabel}>
                      {entries.length} {entries.length === 1 ? 'ENTRY' : 'ENTRIES'}
                    </ThemedText>
                  </View>
                  <HeaderAddButton
                    accessibilityLabel="Write a new journal entry"
                    onPress={() => router.push('/journal/new')}
                  />
                </View>
                <View
                  style={[
                    styles.searchBar,
                    { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                  ]}>
                  <NamedIcon name="search" size={16} color={theme.textSecondary} />
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
                icon={query ? 'search-outline' : 'book-outline'}
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
                style={[
                  styles.card,
                  HairlineBorder,
                  { backgroundColor: cardPalette[index % cardPalette.length], borderColor: theme.border },
                ]}>
                <NamedIcon
                  name={entryIcon(item)}
                  size={96}
                  color={theme.softFill}
                  style={styles.cardWatermark}
                />
                <View style={styles.cardTopRow}>
                  <View style={styles.cardIconBadge}>
                    <NamedIcon name={entryIcon(item)} size={16} color={theme.accent} />
                  </View>
                  <Pressable hitSlop={10} onPress={() => openMenu(item)}>
                    <NamedIcon name="ellipsis-horizontal" size={20} color={theme.textSecondary} />
                  </Pressable>
                </View>
                <ThemedText style={styles.cardTitle} numberOfLines={3}>
                  {entryLabel(item)}
                </ThemedText>
                <ThemedText style={styles.cardMeta}>{formatRelative(item.createdAt)}</ThemedText>
              </Pressable>
            )}
          />
        </LayoutAnimationConfig>
      </SafeAreaView>
    </ThemedView>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  fill: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.six * 2,
    gap: Spacing.three,
  },
  contentEmpty: {
    flexGrow: 1,
  },
  header: {
    gap: Spacing.three,
    marginBottom: Spacing.two,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    flexShrink: 1,
  },
  title: {
    fontSize: 34,
    lineHeight: 46,
  },
  countLabel: {
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.regular,
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
    backgroundColor: theme.backgroundElement,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    color: theme.text,
    fontFamily: Fonts.regular,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: Tracking.heading,
  },
  cardMeta: {
    color: theme.textSecondary,
    fontFamily: Fonts.regular,
    fontSize: 13,
    letterSpacing: Tracking.body,
  },
});
