import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Screen } from '@/components/ui/screen';
import { VoiceMemo } from '@/components/voice-memo';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { searchVerses } from '@/lib/bible-data';
import { createId } from '@/lib/id';
import { vaultStore } from '@/lib/stores';
import { VaultKind } from '@/lib/types';

const KINDS: { id: VaultKind; label: string }[] = [
  { id: 'note', label: 'Note' },
  { id: 'voice', label: 'Voice' },
  { id: 'verse', label: 'Verse' },
];

export default function NewVaultItemScreen() {
  const theme = useTheme();
  const [kind, setKind] = useState<VaultKind>('note');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audioUri, setAudioUri] = useState<string | undefined>();
  const [verseQuery, setVerseQuery] = useState('');
  const [verseRef, setVerseRef] = useState<string | undefined>();

  const verses = useMemo(() => searchVerses(verseQuery).slice(0, 6), [verseQuery]);
  const canSave =
    kind === 'voice' ? Boolean(audioUri || body.trim()) : kind === 'verse' ? Boolean(verseRef) : Boolean(body.trim());

  function save() {
    if (!canSave) return;
    const chosen = verses.find((verse) => verse.ref === verseRef);
    vaultStore.add({
      id: createId(),
      createdAt: new Date().toISOString(),
      kind,
      source: 'vault',
      title: title.trim() || (kind === 'verse' ? verseRef ?? 'Verse' : kind === 'voice' ? 'Voice note' : 'Note'),
      body: kind === 'verse' ? chosen?.text ?? body.trim() : body.trim(),
      audioUri: kind === 'voice' ? audioUri : undefined,
      verseRef: kind === 'verse' ? verseRef : undefined,
    });
    router.back();
  }

  return (
    <Screen>
      <ThemedText type="title" style={styles.title}>
        Add to vault
      </ThemedText>
      <View style={styles.kinds}>
        {KINDS.map((item) => {
          const active = kind === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => setKind(item.id)}
              style={[styles.kind, { backgroundColor: active ? theme.primary : theme.softFill }]}>
              <ThemedText type="smallBold" style={{ color: active ? theme.onPrimary : theme.textSecondary }}>
                {item.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {kind !== 'verse' ? (
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Title (optional)"
          placeholderTextColor={theme.textSecondary}
          style={[styles.field, { color: theme.text, backgroundColor: theme.backgroundElement }]}
        />
      ) : null}

      {kind === 'verse' ? (
        <>
          <TextInput
            value={verseQuery}
            onChangeText={setVerseQuery}
            placeholder="Search a verse"
            placeholderTextColor={theme.textSecondary}
            style={[styles.field, { color: theme.text, backgroundColor: theme.backgroundElement }]}
          />
          {verses.map((verse) => {
            const active = verseRef === verse.ref;
            return (
              <Pressable
                key={verse.ref}
                onPress={() => setVerseRef(verse.ref)}
                style={[
                  styles.verse,
                  { backgroundColor: active ? theme.accentSoft : theme.backgroundElement },
                ]}>
                <ThemedText type="smallBold">{verse.ref}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" numberOfLines={3}>
                  {verse.text}
                </ThemedText>
              </Pressable>
            );
          })}
        </>
      ) : (
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder={kind === 'voice' ? 'A caption, if you want one' : 'Write the note'}
          placeholderTextColor={theme.textSecondary}
          multiline
          style={[styles.body, { color: theme.text, backgroundColor: theme.backgroundElement }]}
        />
      )}

      {kind === 'voice' ? <VoiceMemo uri={audioUri} onChange={setAudioUri} /> : null}

      <Pressable
        onPress={save}
        disabled={!canSave}
        style={[styles.save, { backgroundColor: theme.primary, opacity: canSave ? 1 : 0.45 }]}>
        <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
          Save
        </ThemedText>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 32, lineHeight: 44 },
  kinds: { flexDirection: 'row', gap: 8 },
  kind: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
  },
  field: {
    minHeight: 48,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
    fontFamily: Fonts.regular,
    fontSize: 16,
  },
  body: {
    minHeight: 140,
    borderRadius: Radius.large,
    padding: Spacing.three,
    fontFamily: Fonts.regular,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  verse: {
    gap: 4,
    padding: Spacing.three,
    borderRadius: Radius.large,
  },
  save: {
    minHeight: 52,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
