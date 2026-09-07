import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SoftHeader } from '@/components/ui/soft-header';
import { Fonts, Radius, Spacing, Tracking } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { createId } from '@/lib/id';
import { journalStore } from '@/lib/stores';

export default function NewJournalEntryScreen() {
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  function save() {
    if (!body.trim()) return;
    const now = new Date().toISOString();
    journalStore.add({
      id: createId(),
      createdAt: now,
      updatedAt: now,
      type: 'freeform',
      title: title.trim() || undefined,
      body: body.trim(),
    });
    router.back();
  }

  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.fill} edges={['top']}>
        <SoftHeader
          right={
            <Pressable
              onPress={save}
              disabled={!body.trim()}
              style={[styles.pillButton, { backgroundColor: theme.primary, opacity: body.trim() ? 1 : 0.4 }]}>
              <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
                Save
              </ThemedText>
            </Pressable>
          }
        />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ThemedText type="small" themeColor="textSecondary" style={styles.draftLabel}>
            NEW ENTRY
          </ThemedText>

          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Give it a name"
            placeholderTextColor={theme.textSecondary}
            multiline
            style={[styles.titleInput, { color: theme.text }]}
          />

          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Write what's on your heart..."
            placeholderTextColor={theme.textSecondary}
            multiline
            style={[styles.bodyInput, { color: theme.text }]}
          />
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
  draftLabel: {
    letterSpacing: 1,
  },
  pillButton: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: Radius.pill,
  },
  titleInput: {
    fontFamily: Fonts.regular,
    fontSize: 32,
    lineHeight: 44,
    letterSpacing: Tracking.heading,
    padding: 0,
  },
  bodyInput: {
    fontFamily: Fonts.regular,
    fontSize: 18,
    lineHeight: 27,
    minHeight: 240,
    padding: 0,
    textAlignVertical: 'top',
  },
});
