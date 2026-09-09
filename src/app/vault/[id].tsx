import { NamedIcon } from '@/components/ui/icon';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';

import { CircleShareSheet } from '@/components/circle-share-sheet';
import { ThemedText } from '@/components/themed-text';
import { Screen } from '@/components/ui/screen';
import { VoicePlayer } from '@/components/voice-memo';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ShareDraft } from '@/lib/circle-share';
import { formatRelative } from '@/lib/date';
import { useCollection, useCollectionReady } from '@/lib/collection-store';
import { vaultStore } from '@/lib/stores';

export default function VaultItemScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const items = useCollection(vaultStore);
  const ready = useCollectionReady(vaultStore);
  const item = items.find((entry) => entry.id === id);
  const [shareOpen, setShareOpen] = useState(false);

  if (!ready) {
    return <Screen />;
  }

  if (!item) {
    return (
      <Screen>
        <ThemedText themeColor="textSecondary">This vault item could not be found.</ThemedText>
      </Screen>
    );
  }

  const draft: ShareDraft = {
    kind: item.kind === 'verse' ? 'verse' : item.source === 'church' ? 'church' : 'journal',
    sourceId: item.id,
    title: item.title,
    body: item.body || item.verseRef || 'A note from my vault.',
  };

  function remove() {
    Alert.alert('Remove from vault', 'This stays gone on this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          vaultStore.remove(item!.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <>
      <Stack.Screen options={{ title: item.title }} />
      <Screen>
        <ThemedText type="small" themeColor="textSecondary">
          {item.source === 'church' ? 'Sunday check-in · ' : ''}
          {formatRelative(item.createdAt)}
        </ThemedText>
        {item.verseRef ? (
          <ThemedText type="smallBold">{item.verseRef}</ThemedText>
        ) : null}
        {item.body ? <ThemedText style={styles.body}>{item.body}</ThemedText> : null}
        {item.audioUri ? <VoicePlayer uri={item.audioUri} /> : null}

        <Pressable
          onPress={() => setShareOpen(true)}
          style={[styles.button, { backgroundColor: theme.accentSoft }]}>
          <NamedIcon name="share-outline" size={16} color={theme.accent} />
          <ThemedText type="smallBold" themeColor="accent">
            Share with a circle
          </ThemedText>
        </Pressable>
        <Pressable onPress={remove} style={styles.danger}>
          <ThemedText type="small" themeColor="danger">
            Remove from vault
          </ThemedText>
        </Pressable>
      </Screen>
      <CircleShareSheet visible={shareOpen} draft={draft} onClose={() => setShareOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  body: { fontSize: 17, lineHeight: 26 },
  button: {
    minHeight: 48,
    borderRadius: Radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  danger: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
