import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Pill } from '@/components/ui/pill';
import { Screen } from '@/components/ui/screen';
import { PRAYER_CATEGORY_LABELS } from '@/constants/status-colors';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { createId } from '@/lib/id';
import { prayerStore } from '@/lib/stores';
import { PrayerCategory } from '@/lib/types';

const CATEGORIES = Object.keys(PRAYER_CATEGORY_LABELS) as PrayerCategory[];

export default function NewPrayerScreen() {
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<PrayerCategory>('other');

  function save() {
    if (!title.trim()) return;
    const now = new Date().toISOString();
    prayerStore.add({
      id: createId(),
      createdAt: now,
      updatedAt: now,
      title: title.trim(),
      body: body.trim(),
      category,
      state: 'praying',
      updates: [],
    });
    router.back();
  }

  return (
    <Screen>
      <View style={{ gap: Spacing.two }}>
        <ThemedText type="small" themeColor="textSecondary">
          What are you praying for?
        </ThemedText>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Mom's surgery, a job decision..."
          placeholderTextColor={theme.textSecondary}
          style={[styles.titleInput, { color: theme.text, backgroundColor: theme.backgroundElement }]}
        />
      </View>

      <TextInput
        value={body}
        onChangeText={setBody}
        placeholder="Add any details you want to remember"
        placeholderTextColor={theme.textSecondary}
        multiline
        style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
      />

      <View style={{ gap: Spacing.two }}>
        <ThemedText type="small" themeColor="textSecondary">
          Category
        </ThemedText>
        <View style={styles.chipRow}>
          {CATEGORIES.map((cat) => (
            <Pill
              key={cat}
              label={PRAYER_CATEGORY_LABELS[cat]}
              active={category === cat}
              onPress={() => setCategory(cat)}
            />
          ))}
        </View>
      </View>

      <Pressable
        onPress={save}
        disabled={!title.trim()}
        style={[styles.button, { backgroundColor: theme.accent, opacity: title.trim() ? 1 : 0.5 }]}>
        <ThemedText type="smallBold" style={{ color: '#fff' }}>
          Add to prayer log
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
    minHeight: 100,
    fontSize: 16,
    lineHeight: 22,
    borderRadius: Radius.medium,
    padding: Spacing.three,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  button: {
    paddingVertical: 16,
    borderRadius: Radius.pill,
    alignItems: 'center',
  },
});
