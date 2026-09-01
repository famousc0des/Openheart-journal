import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { createId } from '@/lib/id';
import { midweekResurfaceDate, scheduleSermonResurfacing } from '@/lib/notifications';
import { sermonStore } from '@/lib/stores';

export default function NewSermonNoteScreen() {
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [rawNotes, setRawNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!rawNotes.trim() || saving) return;
    setSaving(true);
    const now = new Date().toISOString();
    const id = createId();
    const resurfaceAt = midweekResurfaceDate();
    const finalTitle = title.trim() || 'Sunday notes';

    const notificationId = await scheduleSermonResurfacing(finalTitle, resurfaceAt);

    sermonStore.add({
      id,
      createdAt: now,
      updatedAt: now,
      title: finalTitle,
      rawNotes: rawNotes.trim(),
      resurfaceAt: resurfaceAt.toISOString(),
      notificationId,
    });
    setSaving(false);
    router.back();
  }

  return (
    <Screen>
      <View style={{ gap: Spacing.two }}>
        <ThemedText type="small" themeColor="textSecondary">
          Sermon or series title
        </ThemedText>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Sunday — Rest as Resistance"
          placeholderTextColor={theme.textSecondary}
          style={[styles.titleInput, { color: theme.text, backgroundColor: theme.backgroundElement }]}
        />
      </View>

      <View style={{ gap: Spacing.two, flex: 1 }}>
        <ThemedText type="small" themeColor="textSecondary">
          Jot it down however it comes — fragments are fine. Openheart will tidy it up later without
          changing what you wrote.
        </ThemedText>
        <TextInput
          value={rawNotes}
          onChangeText={setRawNotes}
          placeholder="key pt - grace isnt earned... Eph 2:8&#10;rest = trust not laziness"
          placeholderTextColor={theme.textSecondary}
          multiline
          autoFocus
          style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
        />
      </View>

      <Pressable
        onPress={save}
        disabled={!rawNotes.trim() || saving}
        style={[styles.button, { backgroundColor: theme.accent, opacity: rawNotes.trim() ? 1 : 0.5 }]}>
        <ThemedText type="smallBold" style={{ color: '#fff' }}>
          {saving ? 'Saving…' : 'Save note'}
        </ThemedText>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  titleInput: {
    fontSize: 16,
    borderRadius: Radius.medium,
    padding: Spacing.three,
  },
  input: {
    minHeight: 220,
    fontSize: 16,
    lineHeight: 24,
    borderRadius: Radius.medium,
    padding: Spacing.three,
    textAlignVertical: 'top',
  },
  button: {
    paddingVertical: 16,
    borderRadius: Radius.pill,
    alignItems: 'center',
  },
});
