import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PressableCard } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Fab } from '@/components/ui/fab';
import { Pill } from '@/components/ui/pill';
import { PRAYER_CATEGORY_LABELS, PRAYER_STATE_META, PRAYER_STATES } from '@/constants/status-colors';
import { Spacing } from '@/constants/theme';
import { formatDate } from '@/lib/date';
import { useCollection } from '@/lib/collection-store';
import { prayerStore } from '@/lib/stores';
import { PrayerState } from '@/lib/types';

export default function PrayerScreen() {
  const prayers = useCollection(prayerStore);
  const [filter, setFilter] = useState<PrayerState | 'all'>('all');

  const filtered = useMemo(() => {
    const sorted = [...prayers].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    return filter === 'all' ? sorted : sorted.filter((prayer) => prayer.state === filter);
  }, [prayers, filter]);

  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.fill} edges={['top']}>
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          ListHeaderComponent={
            <View style={styles.header}>
              <ThemedText type="title" style={styles.title}>
                Prayer Log
              </ThemedText>
              <FlatList
                data={['all', ...PRAYER_STATES] as (PrayerState | 'all')[]}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item}
                contentContainerStyle={{ gap: Spacing.two }}
                renderItem={({ item }) => (
                  <Pill
                    label={item === 'all' ? 'All' : PRAYER_STATE_META[item].label}
                    active={filter === item}
                    color={item === 'all' ? undefined : PRAYER_STATE_META[item].color}
                    onPress={() => setFilter(item)}
                  />
                )}
              />
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              title="Nothing here yet"
              body="Add a request or praise and keep track of how God moves over time."
            />
          }
          renderItem={({ item }) => {
            const meta = PRAYER_STATE_META[item.state];
            return (
              <PressableCard style={styles.item} onPress={() => router.push(`/prayer/${item.id}`)}>
                <View style={styles.itemHeaderRow}>
                  <ThemedText type="smallBold" style={styles.itemTitle} numberOfLines={1}>
                    {item.title}
                  </ThemedText>
                  <View style={[styles.badge, { backgroundColor: meta.color }]}>
                    <Ionicons name={meta.icon} size={13} color="#fff" />
                    <ThemedText type="small" style={styles.badgeText}>
                      {meta.label}
                    </ThemedText>
                  </View>
                </View>
                <ThemedText numberOfLines={2} themeColor="textSecondary">
                  {item.body}
                </ThemedText>
                <View style={styles.itemFooterRow}>
                  <ThemedText type="small" themeColor="textSecondary">
                    {PRAYER_CATEGORY_LABELS[item.category]} · {formatDate(item.createdAt)}
                  </ThemedText>
                  {item.updates.length > 0 && (
                    <ThemedText type="small" themeColor="textSecondary">
                      {item.updates.length} update{item.updates.length > 1 ? 's' : ''}
                    </ThemedText>
                  )}
                </View>
              </PressableCard>
            );
          }}
        />
        <Fab onPress={() => router.push('/prayer/new')} />
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
  title: {
    fontSize: 32,
    lineHeight: 38,
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
  itemTitle: {
    flex: 1,
  },
  itemFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeText: {
    color: '#ffffff',
  },
});
