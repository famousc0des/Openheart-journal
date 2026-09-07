import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { CircleShareSheet } from '@/components/circle-share-sheet';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDateTime } from '@/lib/date';
import { createId } from '@/lib/id';
import { cancelScheduledNotification } from '@/lib/notifications';
import { currentUserName } from '@/lib/church';
import { useCollection, useCollectionReady } from '@/lib/collection-store';
import { churchStore, journalStore, sentChurchNoteStore, sermonStore } from '@/lib/stores';
import { tidySermonNotes } from '@/lib/tidy-up';

export default function SermonDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const notes = useCollection(sermonStore);
  const ready = useCollectionReady(sermonStore);
  const note = notes.find((item) => item.id === id);

  const churches = useCollection(churchStore);

  const [view, setView] = useState<'original' | 'tidied'>('original');
  const [expansions, setExpansions] = useState<string[]>([]);
  const [fellBack, setFellBack] = useState(false);
  const [tidying, setTidying] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sendingToChurchId, setSendingToChurchId] = useState<string | null>(null);
  const [includeTitle, setIncludeTitle] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(true);
  const [sentToChurch, setSentToChurch] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  if (!ready) {
    return <Screen />;
  }

  if (!note) {
    return (
      <Screen>
        <ThemedText themeColor="textSecondary">This note could not be found.</ThemedText>
      </Screen>
    );
  }

  async function runTidyUp() {
    if (!note || tidying) return;
    setTidying(true);
    setFellBack(false);
    try {
      const result = await tidySermonNotes(note.rawNotes);
      if (result.fellBack) {
        setFellBack(true);
        return;
      }
      setExpansions(result.expansions.map((expansion) => `${expansion.from} → ${expansion.to}`));
      sermonStore.update(note.id, { tidiedNotes: result.text, updatedAt: new Date().toISOString() });
      setView('tidied');
    } finally {
      setTidying(false);
    }
  }

  function saveToJournal() {
    if (!note) return;
    const now = new Date().toISOString();
    journalStore.add({
      id: createId(),
      createdAt: now,
      updatedAt: now,
      type: 'sermon',
      title: note.title,
      body: note.tidiedNotes ?? note.rawNotes,
      sermonNoteId: note.id,
    });
    setSaved(true);
  }

  function sendToChurch() {
    if (!note || !sendingToChurchId) return;
    if (!includeTitle && !includeNotes) return;
    const fields: ('title' | 'notes' | 'tidied')[] = [];
    if (includeTitle) fields.push('title');
    if (includeNotes) fields.push(note.tidiedNotes && view === 'tidied' ? 'tidied' : 'notes');
    sentChurchNoteStore.add({
      id: createId(),
      sermonNoteId: note.id,
      churchId: sendingToChurchId,
      senderName: currentUserName(),
      fieldsIncluded: fields,
      title: includeTitle ? note.title : undefined,
      body: includeNotes
        ? view === 'tidied' && note.tidiedNotes
          ? note.tidiedNotes
          : note.rawNotes
        : undefined,
      sentAt: new Date().toISOString(),
    });
    setSendingToChurchId(null);
    setSentToChurch(true);
  }

  function remove() {
    if (!note) return;
    Alert.alert('Delete sermon note', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await cancelScheduledNotification(note.notificationId);
          sermonStore.remove(note.id);
          router.back();
        },
      },
    ]);
  }

  const displayText = view === 'tidied' && note.tidiedNotes ? note.tidiedNotes : note.rawNotes;

  return (
    <Screen>
      <View>
        <ThemedText type="title" style={styles.title}>
          {note.title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {formatDateTime(note.createdAt)}
        </ThemedText>
        {note.resurfaceAt && !note.resurfacedAt && (
          <ThemedText type="small" themeColor="accent">
            🔔 Resurfaces {formatDateTime(note.resurfaceAt)}
          </ThemedText>
        )}
        {note.youtubeUrl && (
          <View style={styles.youtubeSource}>
            <Ionicons name="logo-youtube" size={15} color={theme.accent} />
            <ThemedText type="small" themeColor="accent" numberOfLines={1} style={{ flex: 1 }}>
              YouTube transcript
            </ThemedText>
          </View>
        )}
      </View>

      <View style={styles.row}>
        <Pill label="Original" active={view === 'original'} onPress={() => setView('original')} />
        <Pill
          label="Tidied"
          active={view === 'tidied' && !!note.tidiedNotes}
          onPress={() => (note.tidiedNotes ? setView('tidied') : void runTidyUp())}
        />
      </View>

      <Card>
        <ThemedText style={styles.body}>{displayText}</ThemedText>
      </Card>

      {fellBack && (
        <ThemedText type="small" themeColor="textSecondary">
          Openheart couldn't tidy this without changing your words, so it's left as you wrote it.
        </ThemedText>
      )}

      {view === 'tidied' && expansions.length > 0 && (
        <View style={{ gap: Spacing.one }}>
          <ThemedText type="small" themeColor="textSecondary">
            Openheart fixed spelling, spacing, capitalization, and punctuation, and expanded these
            shorthand words. Nothing else was added:
          </ThemedText>
          <View style={styles.chipRow}>
            {expansions.map((expansion, index) => (
              <View key={`${expansion}-${index}`} style={[styles.chip, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="small">{expansion}</ThemedText>
              </View>
            ))}
          </View>
        </View>
      )}

      {!note.tidiedNotes && (
        <Pressable
          onPress={() => void runTidyUp()}
          disabled={tidying}
          style={[styles.button, { backgroundColor: theme.primary, opacity: tidying ? 0.6 : 1 }]}>
          <Ionicons name="sparkles-outline" size={16} color={theme.onPrimary} />
          <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
            {tidying ? 'Tidying…' : 'Tidy up'}
          </ThemedText>
        </Pressable>
      )}

      <Pressable
        onPress={saveToJournal}
        style={[styles.button, { backgroundColor: theme.backgroundElement }]}>
        <Ionicons name="book-outline" size={16} color={theme.text} />
        <ThemedText type="smallBold">{saved ? 'Saved to journal ✓' : 'Save to journal'}</ThemedText>
      </Pressable>

      <Pressable
        onPress={() => setShareOpen(true)}
        style={[styles.button, { backgroundColor: theme.backgroundElement }]}>
        <Ionicons name="people-outline" size={16} color={theme.text} />
        <ThemedText type="smallBold">Share with a circle</ThemedText>
      </Pressable>

      {churches.length > 0 && !sendingToChurchId && (
        <Pressable
          onPress={() => setSendingToChurchId(churches[0].id)}
          style={[styles.button, { backgroundColor: theme.backgroundElement }]}>
          <Ionicons name="home-outline" size={16} color={theme.text} />
          <ThemedText type="smallBold">
            {sentToChurch ? 'Sent to church ✓. Send again' : 'Send to church'}
          </ThemedText>
        </Pressable>
      )}

      {sendingToChurchId && (
        <View style={[styles.sendCard, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText type="smallBold">Send to church</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Only the fields you pick leave your journal. The owner sees your name with what you
            send. Nothing else.
          </ThemedText>
          {churches.length > 1 && (
            <View style={styles.chipRow}>
              {churches.map((church) => (
                <Pill
                  key={church.id}
                  label={church.name}
                  active={sendingToChurchId === church.id}
                  onPress={() => setSendingToChurchId(church.id)}
                />
              ))}
            </View>
          )}
          <View style={styles.chipRow}>
            <Pill
              label={includeTitle ? '✓ Title' : 'Title'}
              active={includeTitle}
              onPress={() => setIncludeTitle((value) => !value)}
            />
            <Pill
              label={
                includeNotes
                  ? `✓ Notes (${view === 'tidied' && note.tidiedNotes ? 'tidied' : 'original'})`
                  : 'Notes'
              }
              active={includeNotes}
              onPress={() => setIncludeNotes((value) => !value)}
            />
          </View>
          <View style={styles.sendActions}>
            <Pressable
              disabled={!includeTitle && !includeNotes}
              onPress={sendToChurch}
              style={[
                styles.sendButton,
                {
                  backgroundColor: theme.primary,
                  opacity: includeTitle || includeNotes ? 1 : 0.4,
                },
              ]}>
              <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
                Send
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setSendingToChurchId(null)}
              style={[styles.sendButton, styles.sendGhost, { borderColor: theme.border }]}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                Cancel
              </ThemedText>
            </Pressable>
          </View>
        </View>
      )}

      <Pressable onPress={remove} style={styles.deleteButton}>
        <Ionicons name="trash-outline" size={16} color={theme.danger} />
        <ThemedText type="smallBold" themeColor="danger">
          Delete note
        </ThemedText>
      </Pressable>
      <CircleShareSheet
        visible={shareOpen}
        draft={{
          kind: 'sermon',
          sourceId: note.id,
          title: note.title,
          body: displayText,
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
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  youtubeSource: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 15,
    borderRadius: Radius.pill,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  sendCard: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.medium,
  },
  sendActions: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  sendButton: {
    flex: 1,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
  },
  sendGhost: {
    borderWidth: StyleSheet.hairlineWidth,
  },
});
