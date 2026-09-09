import { NamedIcon } from '@/components/ui/icon';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Fab } from '@/components/ui/fab';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCollection } from '@/lib/collection-store';
import { formatRelative } from '@/lib/date';
import { vaultStore } from '@/lib/stores';
import { VaultKind } from '@/lib/types';

const FILTERS: { id: 'all' | VaultKind; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'voice', label: 'Voices' },
  { id: 'note', label: 'Notes' },
  { id: 'verse', label: 'Verses' },
];

export default function VaultScreen() {
  const theme = useTheme();
  const items = useCollection(vaultStore);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all');

  const visible = useMemo(() => {
    const sorted = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (filter === 'all') return sorted;
    return sorted.filter((item) => item.kind === filter);
  }, [filter, items]);

  return (
    <View style={{ flex: 1 }}>
      <Screen>
        <ThemedText type="title" style={styles.title}>
          Vault
        </ThemedText>
        <ThemedText themeColor="textSecondary">
          Voice recordings, notes, and verses you want to keep.
        </ThemedText>

        <View style={styles.filters}>
          {FILTERS.map((item) => {
            const active = filter === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setFilter(item.id)}
                style={[
                  styles.chip,
                  { backgroundColor: active ? theme.primary : theme.softFill },
                ]}>
                <ThemedText type="smallBold" style={{ color: active ? theme.onPrimary : theme.textSecondary }}>
                  {item.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        {visible.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            Nothing in this vault yet. Add a voice note, a written note, or a verse.
          </ThemedText>
        ) : (
          visible.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => router.push({ pathname: '/vault/[id]', params: { id: item.id } })}
              style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
              <View style={[styles.icon, { backgroundColor: theme.accentSoft }]}>
                <NamedIcon
                  name={item.kind === 'voice' ? 'mic-outline' : item.kind === 'verse' ? 'bookmark-outline' : 'document-text-outline'}
                  size={18}
                  color={theme.accent}
                />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <ThemedText type="smallBold" numberOfLines={1}>
                  {item.title || (item.kind === 'verse' ? item.verseRef : 'Untitled')}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                  {item.source === 'church' ? 'Sunday · ' : ''}
                  {formatRelative(item.createdAt)}
                </ThemedText>
              </View>
            </Pressable>
          ))
        )}
      </Screen>
      <Fab accessibilityLabel="Add to vault" onPress={() => router.push('/vault/new')} />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 34, lineHeight: 46 },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.large,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
