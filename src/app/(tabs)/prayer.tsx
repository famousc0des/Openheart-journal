import { NamedIcon } from '@/components/ui/icon';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import Animated, { LayoutAnimationConfig } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CircleShareSheet } from '@/components/circle-share-sheet';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PressableCard } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { HeaderAddButton } from '@/components/ui/header-add-button';
import { Pill } from '@/components/ui/pill';
import { PRAYER_CATEGORY_LABELS, PRAYER_STATE_META, PRAYER_STATES } from '@/constants/status-colors';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ShareDraft } from '@/lib/circle-share';
import { formatDate } from '@/lib/date';
import { useCollection } from '@/lib/collection-store';
import { hexToRgba } from '@/lib/color';
import { listLayout } from '@/lib/motion';
import { prayerStore } from '@/lib/stores';
import { PrayerState } from '@/lib/types';

export default function PrayerScreen() {
  const theme = useTheme();
  const prayers = useCollection(prayerStore);
  const [filter, setFilter] = useState<PrayerState | 'all'>('all');
  const [shareDraft, setShareDraft] = useState<ShareDraft | null>(null);

  const filtered = useMemo(() => {
    const sorted = [...prayers].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    return filter === 'all' ? sorted : sorted.filter((prayer) => prayer.state === filter);
  }, [prayers, filter]);

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
                  <ThemedText type="title" style={styles.title}>
                    Prayer Log
                  </ThemedText>
                  <HeaderAddButton
                    accessibilityLabel="Add a prayer"
                    onPress={() => router.push('/prayer/new')}
                  />
                </View>
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
                icon="heart-outline"
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
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: hexToRgba(meta.color, 0.1), borderColor: meta.color },
                      ]}>
                      <NamedIcon name={meta.icon} size={13} color={meta.color} />
                      <ThemedText type="small" style={[styles.badgeText, { color: meta.color }]}>
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
                    <Pressable
                      accessibilityLabel={`Share ${item.title} with a circle`}
                      hitSlop={10}
                      onPress={(event) => {
                        event.stopPropagation();
                        setShareDraft({
                          kind: 'prayer',
                          sourceId: item.id,
                          title: item.title,
                          body: item.body,
                        });
                      }}
                      style={styles.shareCardButton}>
                      <NamedIcon
                        name={(item.sharedCircleIds?.length ?? 0) > 0 ? 'people' : 'people-outline'}
                        size={18}
                        color={theme.accent}
                      />
                    </Pressable>
                  </View>
                </PressableCard>
              );
            }}
          />
        </LayoutAnimationConfig>

        <CircleShareSheet
          visible={Boolean(shareDraft)}
          draft={shareDraft}
          onClose={() => setShareDraft(null)}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
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
  title: {
    flexShrink: 1,
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
  itemTitle: {
    flex: 1,
  },
  itemFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  shareCardButton: { marginLeft: 'auto', minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  badgeText: {
    fontSize: 12,
  },
});
