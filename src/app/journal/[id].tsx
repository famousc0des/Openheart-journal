import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CircleIconButton, SoftHeader } from '@/components/ui/soft-header';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { verseByRef } from '@/lib/bible-data';
import { formatDateTime } from '@/lib/date';
import { CARD_PALETTE, entryLabel } from '@/lib/journal-display';
import { useCollection } from '@/lib/collection-store';
import { journalStore } from '@/lib/stores';
import { moodOption } from '@/lib/prompts';

export default function JournalDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const entries = useCollection(journalStore);
  const entry = entries.find((item) => item.id === id);

  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState('');
  const initialized = useRef(false);

  useEffect(() => {
    if (entry && !initialized.current) {
      setBody(entry.body);
      initialized.current = true;
    }
  }, [entry]);

  function openMenu() {
    if (!entry) return;
    Alert.alert(entryLabel(entry), undefined, [
      { text: editing ? 'Stop editing' : 'Edit', onPress: () => setEditing((prev) => !prev) },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          journalStore.remove(entry.id);
          router.back();
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  if (!entry) {
    return (
      <ThemedView style={styles.fill}>
        <SafeAreaView style={styles.fill} edges={['top']}>
          <SoftHeader />
          <ThemedText themeColor="textSecondary" style={{ paddingHorizontal: Spacing.four }}>
            This entry could not be found.
          </ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  function save() {
    if (!entry) return;
    journalStore.update(entry.id, { body: body.trim(), updatedAt: new Date().toISOString() });
    setEditing(false);
  }

  const mood = moodOption(entry.mood);
  const bigTitle = entry.title ?? entryLabel(entry);

  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.fill} edges={['top']}>
        <SoftHeader right={<CircleIconButton icon="ellipsis-horizontal" onPress={openMenu} />} />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.metaRow}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.metaLabel}>
              {formatDateTime(entry.createdAt).toUpperCase()}
            </ThemedText>
            <Pressable
              onPress={editing ? save : () => setEditing(true)}
              style={[styles.pillButton, { backgroundColor: editing ? theme.accent : theme.backgroundElement }]}>
              <ThemedText type="smallBold" style={{ color: editing ? '#fff' : theme.text }}>
                {editing ? 'Save' : 'Edit'}
              </ThemedText>
            </Pressable>
          </View>

          <ThemedText type="title" style={styles.bigTitle}>
            {bigTitle}
          </ThemedText>

          {mood && (
            <View style={[styles.moodTag, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name={mood.icon} size={15} color={theme.accent} />
              <ThemedText type="small" themeColor="accent">
                {mood.label}
              </ThemedText>
            </View>
          )}

          {entry.prompt && (
            <ThemedText themeColor="textSecondary" style={styles.promptText}>
              {entry.prompt}
            </ThemedText>
          )}

          {editing ? (
            <TextInput
              value={body}
              onChangeText={setBody}
              multiline
              autoFocus
              style={[styles.bodyInput, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            />
          ) : (
            <ThemedText style={styles.body}>{entry.body}</ThemedText>
          )}

          {entry.scriptureRefs && entry.scriptureRefs.length > 0 && (
            <View style={styles.tileRow}>
              {entry.scriptureRefs.map((ref, index) => {
                const verse = verseByRef(ref);
                if (!verse) return null;
                return (
                  <View
                    key={ref}
                    style={[styles.tile, { backgroundColor: CARD_PALETTE[index % CARD_PALETTE.length] }]}>
                    <View style={styles.tileBadge}>
                      <Ionicons name="bookmark" size={13} color="#fff" />
                    </View>
                    <ThemedText style={styles.tileRef} numberOfLines={1}>
                      {verse.ref}
                    </ThemedText>
                    <ThemedText style={styles.tileText} numberOfLines={5}>
                      {verse.text}
                    </ThemedText>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six * 2,
    gap: Spacing.three,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    letterSpacing: 1,
  },
  pillButton: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: Radius.pill,
  },
  bigTitle: {
    fontSize: 32,
    lineHeight: 38,
  },
  moodTag: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.pill,
  },
  promptText: {
    fontSize: 16,
    fontStyle: 'italic',
    lineHeight: 23,
  },
  body: {
    fontSize: 18,
    lineHeight: 27,
  },
  bodyInput: {
    minHeight: 180,
    fontSize: 18,
    lineHeight: 27,
    borderRadius: Radius.medium,
    padding: Spacing.three,
    textAlignVertical: 'top',
  },
  tileRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  tile: {
    flex: 1,
    minHeight: 160,
    borderRadius: Radius.medium,
    padding: Spacing.three,
    gap: 6,
    justifyContent: 'flex-end',
  },
  tileBadge: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileRef: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  tileText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    lineHeight: 17,
    fontStyle: 'italic',
  },
});
