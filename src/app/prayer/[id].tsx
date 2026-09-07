import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { CircleShareSheet } from '@/components/circle-share-sheet';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { Screen } from '@/components/ui/screen';
import { PRAYER_CATEGORY_LABELS, PRAYER_STATE_META, PRAYER_STATES } from '@/constants/status-colors';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDateTime } from '@/lib/date';
import { createId } from '@/lib/id';
import { useCollection, useCollectionReady } from '@/lib/collection-store';
import { hexToRgba } from '@/lib/color';
import { prayerStore } from '@/lib/stores';
import { PrayerState } from '@/lib/types';

export default function PrayerDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const prayers = useCollection(prayerStore);
  const ready = useCollectionReady(prayerStore);
  const prayer = prayers.find((item) => item.id === id);
  const [updateText, setUpdateText] = useState('');
  const [shareOpen, setShareOpen] = useState(false);

  if (!ready) {
    return <Screen />;
  }

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

      <View style={styles.shareSection}>
        <View style={styles.shareHeader}>
          <View style={styles.shareHeading}>
            <ThemedText type="smallBold">Share with your circles</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Members with Premium can comment on what you send.
            </ThemedText>
          </View>
          <Pressable
            onPress={() => setShareOpen(true)}
            style={[styles.shareButton, { backgroundColor: theme.primary }]}>
            <Ionicons name="people-outline" size={17} color={theme.onPrimary} />
            <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
              Share
            </ThemedText>
          </Pressable>
        </View>
        {(prayer.sharedCircleIds?.length ?? 0) > 0 && (
          <ThemedText type="small" themeColor="accent">
            Shared with {prayer.sharedCircleIds?.length}{' '}
            {prayer.sharedCircleIds?.length === 1 ? 'circle' : 'circles'}
          </ThemedText>
        )}
      </View>

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
                  {
                    borderColor: active ? meta.color : theme.border,
                    backgroundColor: active ? hexToRgba(meta.color, 0.12) : 'transparent',
                  },
                ]}>
                <Ionicons name={meta.icon} size={15} color={active ? meta.color : theme.text} />
                <ThemedText style={active ? { color: meta.color } : undefined} themeColor={active ? undefined : 'text'}>
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
            style={[styles.addButton, { backgroundColor: theme.primary, opacity: updateText.trim() ? 1 : 0.5 }]}>
            <Ionicons name="arrow-up" size={18} color={theme.onPrimary} />
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
        <Ionicons name="trash-outline" size={16} color={theme.danger} />
        <ThemedText type="smallBold" themeColor="danger">
          Delete prayer
        </ThemedText>
      </Pressable>
      <CircleShareSheet
        visible={shareOpen}
        draft={{
          kind: 'prayer',
          sourceId: prayer.id,
          title: prayer.title,
          body: prayer.body,
        }}
        onClose={() => setShareOpen(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 26,
    lineHeight: 36,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  shareSection: { gap: Spacing.two },
  shareHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  shareHeading: { flex: 1, gap: 2 },
  shareButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    borderRadius: Radius.pill,
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
    borderWidth: 1,
  },
  updateRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
  },
  updateInput: {
    flex: 1,
    fontFamily: Fonts.regular,
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
