import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { Screen } from '@/components/ui/screen';
import { PRAYER_CATEGORY_LABELS, PRAYER_STATE_META, PRAYER_STATES } from '@/constants/status-colors';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDateTime } from '@/lib/date';
import { createId } from '@/lib/id';
import { useCollection } from '@/lib/collection-store';
import { prayerStore } from '@/lib/stores';
import { PrayerState } from '@/lib/types';

export default function PrayerDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const prayers = useCollection(prayerStore);
  const prayer = prayers.find((item) => item.id === id);
  const [updateText, setUpdateText] = useState('');

  if (!prayer) {
    return (
      <Screen>
        <ThemedText themeColor="textSecondary">This prayer could not be found.</ThemedText>
      </Screen>
    );
  }

  function setState(state: PrayerState) {
    if (!prayer) return;
    prayerStore.update(prayer.id, { state, updatedAt: new Date().toISOString() });
  }

  function addUpdate() {
    if (!prayer || !updateText.trim()) return;
    prayerStore.update(prayer.id, {
      updatedAt: new Date().toISOString(),
      updates: [{ id: createId(), createdAt: new Date().toISOString(), body: updateText.trim() }, ...prayer.updates],
    });
    setUpdateText('');
  }

  function remove() {
    if (!prayer) return;
    Alert.alert('Delete prayer', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          prayerStore.remove(prayer.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <Screen>
      <View>
        <ThemedText type="title" style={styles.title}>
          {prayer.title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {PRAYER_CATEGORY_LABELS[prayer.category]} · started {formatDateTime(prayer.createdAt)}
        </ThemedText>
      </View>

      {prayer.body ? <ThemedText style={styles.body}>{prayer.body}</ThemedText> : null}

      <View style={{ gap: Spacing.two }}>
        <ThemedText type="small" themeColor="textSecondary">
          How is it now?
        </ThemedText>
        <View style={styles.stateGrid}>
          {PRAYER_STATES.map((state) => {
            const meta = PRAYER_STATE_META[state];
            const active = prayer.state === state;
            return (
              <Pressable
                key={state}
                onPress={() => setState(state)}
                style={[
                  styles.stateOption,
                  { borderColor: active ? meta.color : theme.border, backgroundColor: active ? meta.color : 'transparent' },
                ]}>
                <Ionicons name={meta.icon} size={15} color={active ? '#fff' : theme.text} />
                <ThemedText style={active ? styles.stateActiveText : undefined} themeColor={active ? undefined : 'text'}>
                  {meta.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ gap: Spacing.two }}>
        <ThemedText type="smallBold">Updates</ThemedText>
        <View style={styles.updateRow}>
          <TextInput
            value={updateText}
            onChangeText={setUpdateText}
            placeholder="Add how this is unfolding..."
            placeholderTextColor={theme.textSecondary}
            style={[styles.updateInput, { color: theme.text, backgroundColor: theme.backgroundElement }]}
          />
          <Pressable
            onPress={addUpdate}
            disabled={!updateText.trim()}
            style={[styles.addButton, { backgroundColor: theme.accent, opacity: updateText.trim() ? 1 : 0.5 }]}>
            <Ionicons name="arrow-up" size={18} color="#fff" />
          </Pressable>
        </View>

        {prayer.updates.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            No updates yet.
          </ThemedText>
        ) : (
          prayer.updates.map((update) => (
            <Card key={update.id}>
              <ThemedText type="small" themeColor="textSecondary">
                {formatDateTime(update.createdAt)}
              </ThemedText>
              <ThemedText>{update.body}</ThemedText>
            </Card>
          ))
        )}
      </View>

      <Pressable onPress={remove} style={styles.deleteButton}>
        <Ionicons name="trash-outline" size={16} color={theme.accent} />
        <ThemedText type="smallBold" themeColor="accent">
          Delete prayer
        </ThemedText>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 26,
    lineHeight: 32,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  stateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  stateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  stateActiveText: {
    color: '#ffffff',
  },
  updateRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
  },
  updateInput: {
    flex: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
});
