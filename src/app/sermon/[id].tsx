import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDateTime } from '@/lib/date';
import { createId } from '@/lib/id';
import { cancelScheduledNotification } from '@/lib/notifications';
import { useCollection } from '@/lib/collection-store';
import { journalStore, sermonStore } from '@/lib/stores';
import { tidySermonNotes } from '@/lib/tidy-up';

export default function SermonDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const notes = useCollection(sermonStore);
  const note = notes.find((item) => item.id === id);

  const [view, setView] = useState<'original' | 'tidied'>('original');
  const [expansions, setExpansions] = useState<string[]>([]);
  const [fellBack, setFellBack] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!note) {
    return (
      <Screen>
        <ThemedText themeColor="textSecondary">This note could not be found.</ThemedText>
      </Screen>
    );
  }

  function runTidyUp() {
    if (!note) return;
    const result = tidySermonNotes(note.rawNotes);
    if (result.fellBack) {
      setFellBack(true);
      return;
    }
    setFellBack(false);
    setExpansions(result.expansions.map((expansion) => `${expansion.from} → ${expansion.to}`));
    sermonStore.update(note.id, { tidiedNotes: result.text, updatedAt: new Date().toISOString() });
    setView('tidied');
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
      </View>

      <View style={styles.row}>
        <Pill label="Original" active={view === 'original'} onPress={() => setView('original')} />
        <Pill
          label="Tidied"
          active={view === 'tidied' && !!note.tidiedNotes}
          onPress={() => (note.tidiedNotes ? setView('tidied') : runTidyUp())}
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
            Openheart only fixed spacing, capitalization, and punctuation, and expanded these
            shorthand words — nothing else was added:
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
        <Pressable onPress={runTidyUp} style={[styles.button, { backgroundColor: theme.accent }]}>
          <Ionicons name="sparkles-outline" size={16} color="#fff" />
          <ThemedText type="smallBold" style={{ color: '#fff' }}>
            Tidy up
          </ThemedText>
        </Pressable>
      )}

      <Pressable
        onPress={saveToJournal}
        style={[styles.button, { backgroundColor: theme.backgroundElement }]}>
        <Ionicons name="book-outline" size={16} color={theme.text} />
        <ThemedText type="smallBold">{saved ? 'Saved to journal ✓' : 'Save to journal'}</ThemedText>
      </Pressable>

      <Pressable onPress={remove} style={styles.deleteButton}>
        <Ionicons name="trash-outline" size={16} color={theme.accent} />
        <ThemedText type="smallBold" themeColor="accent">
          Delete note
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
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
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
});
