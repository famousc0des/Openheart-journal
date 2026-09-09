import { NamedIcon } from '@/components/ui/icon';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { CircleShareSheet } from '@/components/circle-share-sheet';
import { ThemedText } from '@/components/themed-text';
import { Screen } from '@/components/ui/screen';
import { VoiceMemo } from '@/components/voice-memo';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ShareDraft } from '@/lib/circle-share';
import { createId } from '@/lib/id';
import { vaultStore } from '@/lib/stores';
import { tidySermonNotes, type TidyResult } from '@/lib/tidy-up';

export default function ChurchCheckInScreen() {
  const theme = useTheme();
  const [body, setBody] = useState('');
  const [audioUri, setAudioUri] = useState<string | undefined>();
  const [itemId, setItemId] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [tidyPreview, setTidyPreview] = useState<TidyResult | null>(null);
  const [tidyKept, setTidyKept] = useState(false);
  const [tidyMessage, setTidyMessage] = useState('');
  const [tidying, setTidying] = useState(false);

  const canSave = Boolean(body.trim() || audioUri);

  function updateBody(text: string) {
    setBody(text);
    setTidyPreview(null);
    setTidyKept(false);
    setTidyMessage('');
  }

  async function previewTidy() {
    if (!body.trim() || tidying) return;
    setTidying(true);
    setTidyMessage('');
    try {
      const result = await tidySermonNotes(body);
      if (result.fellBack) {
        setTidyPreview(null);
        setTidyMessage("Openheart couldn't tidy this without changing your words, so it's left as you wrote it.");
        return;
      }
      if (!result.changed) {
        setTidyPreview(null);
        setTidyMessage('Already tidy. Nothing to fix.');
        return;
      }
      setTidyKept(false);
      setTidyPreview(result);
    } catch {
      setTidyPreview(null);
      setTidyMessage('Notes could not be tidied. Try again.');
    } finally {
      setTidying(false);
    }
  }

  function keepTidied() {
    if (!tidyPreview) return;
    setBody(tidyPreview.text);
    setTidyKept(true);
  }

  function discardTidied() {
    setTidyPreview(null);
    setTidyKept(false);
  }

  function persist(): string | null {
    if (!canSave) return null;
    const payload = {
      kind: (audioUri ? 'voice' : 'note') as 'voice' | 'note',
      title: 'How was church today',
      body: body.trim(),
      audioUri,
    };
    if (itemId) {
      vaultStore.update(itemId, payload);
      return itemId;
    }
    const id = createId();
    vaultStore.add({
      id,
      createdAt: new Date().toISOString(),
      source: 'church',
      ...payload,
    });
    setItemId(id);
    return id;
  }

  function saveAndClose() {
    persist();
    router.back();
  }

  function openShare() {
    const id = persist();
    if (!id) return;
    setShareOpen(true);
  }

  const draft: ShareDraft | null =
    itemId || canSave
      ? {
          kind: 'church',
          sourceId: itemId ?? 'pending',
          title: 'How was church today',
          body: body.trim() || 'A voice note from Sunday.',
        }
      : null;

  return (
    <Screen>
      <ThemedText type="small" themeColor="textSecondary">
        SUNDAY
      </ThemedText>
      <ThemedText type="title" style={styles.title}>
        How was church today?
      </ThemedText>
      <ThemedText themeColor="textSecondary">
        Type what stayed with you, or send a voice note. Fragments are fine — tidy spelling and
        punctuation before you save, if you want.
      </ThemedText>

      <TextInput
        value={body}
        onChangeText={updateBody}
        placeholder="What did you notice, or what are you still sitting with?"
        placeholderTextColor={theme.textSecondary}
        multiline
        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
      />

      {body.trim().length > 0 && !tidyPreview && (
        <Pressable
          onPress={() => void previewTidy()}
          disabled={tidying}
          style={[
            styles.tidyButton,
            { backgroundColor: theme.softFill, borderColor: theme.border, opacity: tidying ? 0.6 : 1 },
          ]}>
          <NamedIcon name="sparkles-outline" size={16} color={theme.accent} />
          <ThemedText type="smallBold" themeColor="accent">
            {tidying ? 'Tidying…' : 'Tidy up'}
          </ThemedText>
        </Pressable>
      )}

      {tidyMessage ? (
        <ThemedText type="small" themeColor="textSecondary">
          {tidyMessage}
        </ThemedText>
      ) : null}

      {tidyPreview && (
        <View style={[styles.tidyCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <View style={styles.tidyHeaderRow}>
            <NamedIcon name="sparkles" size={14} color={theme.accent} />
            <ThemedText type="smallBold" themeColor="accent">
              Tidied preview
            </ThemedText>
            {tidyKept && (
              <ThemedText type="small" themeColor="success" style={styles.tidyKeptLabel}>
                ✓ Will be saved
              </ThemedText>
            )}
          </View>
          <ThemedText type="small" style={styles.tidyPreviewText}>
            {tidyPreview.text}
          </ThemedText>
          {tidyPreview.expansions.length > 0 && (
            <ThemedText type="small" themeColor="textSecondary">
              Expanded: {tidyPreview.expansions.map((expansion) => `${expansion.from} → ${expansion.to}`).join(', ')}
            </ThemedText>
          )}
          {!tidyKept && (
            <View style={styles.tidyActionsRow}>
              <Pressable onPress={keepTidied} style={[styles.tidyAction, { backgroundColor: theme.primary }]}>
                <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
                  Keep tidied version
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={discardTidied}
                style={[styles.tidyAction, styles.tidyActionGhost, { borderColor: theme.border }]}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  Keep as written
                </ThemedText>
              </Pressable>
            </View>
          )}
        </View>
      )}

      <VoiceMemo uri={audioUri} onChange={setAudioUri} />

      <Pressable
        onPress={openShare}
        disabled={!canSave}
        style={[styles.button, { backgroundColor: theme.accentSoft, opacity: canSave ? 1 : 0.45 }]}>
        <ThemedText type="smallBold" themeColor="accent">
          Share with a circle
        </ThemedText>
      </Pressable>
      <Pressable
        onPress={saveAndClose}
        disabled={!canSave}
        style={[styles.button, { backgroundColor: theme.primary, opacity: canSave ? 1 : 0.45 }]}>
        <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
          {tidyKept ? 'Save tidied to vault' : 'Save to vault'}
        </ThemedText>
      </Pressable>

      <CircleShareSheet
        visible={shareOpen && Boolean(itemId)}
        draft={itemId ? { ...draft!, sourceId: itemId } : null}
        onClose={() => setShareOpen(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 32, lineHeight: 44 },
  input: {
    minHeight: 140,
    borderRadius: Radius.large,
    padding: Spacing.three,
    fontFamily: Fonts.regular,
    fontSize: 16,
    textAlignVertical: 'top',
    borderWidth: 1,
  },
  tidyButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tidyCard: {
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  tidyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tidyKeptLabel: {
    marginLeft: 'auto',
  },
  tidyPreviewText: {
    lineHeight: 22,
  },
  tidyActionsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  tidyAction: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
  },
  tidyActionGhost: {
    backgroundColor: 'transparent',
    borderWidth: StyleSheet.hairlineWidth,
  },
  button: {
    minHeight: 52,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
