import { router } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Screen } from '@/components/ui/screen';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { createId } from '@/lib/id';
import { midweekResurfaceDate, scheduleSermonResurfacing } from '@/lib/notifications';
import { sermonStore } from '@/lib/stores';
import { isYouTubeUrl, transcribeSermonVideo } from '@/lib/sermon-transcription';
import { tidySermonNotes, type TidyResult } from '@/lib/tidy-up';

export default function NewSermonNoteScreen() {
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [rawNotes, setRawNotes] = useState('');
  const [sourceMode, setSourceMode] = useState<'write' | 'youtube'>('write');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [transcribing, setTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState('');
  const [transcriptionStatus, setTranscriptionStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [tidyPreview, setTidyPreview] = useState<TidyResult | null>(null);
  const [tidyKept, setTidyKept] = useState(false);
  const [tidyMessage, setTidyMessage] = useState('');
  const [tidying, setTidying] = useState(false);

  function updateNotes(text: string) {
    setRawNotes(text);
    // Edits invalidate any pending tidy preview.
    setTidyPreview(null);
    setTidyKept(false);
    setTidyMessage('');
  }

  async function previewTidy() {
    if (!rawNotes.trim() || tidying) return;
    setTidying(true);
    setTidyMessage('');
    try {
      const result = await tidySermonNotes(rawNotes);
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
    setTidyKept(true);
  }

  function discardTidied() {
    setTidyPreview(null);
    setTidyKept(false);
  }

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
      tidiedNotes: tidyKept && tidyPreview ? tidyPreview.text : undefined,
      youtubeUrl: youtubeUrl.trim() || undefined,
      resurfaceAt: resurfaceAt.toISOString(),
      notificationId,
    });
    setSaving(false);
    router.back();
  }

  async function transcribe() {
    if (!isYouTubeUrl(youtubeUrl) || transcribing) return;
    setTranscriptionError('');
    setTranscriptionStatus('Downloading sermon audio…');
    setTranscribing(true);
    try {
      setRawNotes(
        await transcribeSermonVideo(youtubeUrl.trim(), (message) => setTranscriptionStatus(message))
      );
      setTranscriptionStatus('');
    } catch (error) {
      setTranscriptionStatus('');
      setTranscriptionError(error instanceof Error ? error.message : 'The sermon could not be transcribed.');
    } finally {
      setTranscribing(false);
    }
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
          placeholder="e.g. Sunday: Rest as Resistance"
          placeholderTextColor={theme.textSecondary}
          style={[styles.titleInput, { color: theme.text, backgroundColor: theme.backgroundElement }]}
        />
      </View>

      <View style={styles.sourceTabs}>
        {(['write', 'youtube'] as const).map((mode) => {
          const active = sourceMode === mode;
          return (
            <Pressable
              key={mode}
              onPress={() => setSourceMode(mode)}
              style={[styles.sourceTab, { backgroundColor: active ? theme.primary : theme.softFill }]}>
              <Ionicons
                name={mode === 'write' ? 'create-outline' : 'logo-youtube'}
                size={17}
                color={active ? theme.onPrimary : theme.textSecondary}
              />
              <ThemedText type="smallBold" style={{ color: active ? theme.onPrimary : theme.textSecondary }}>
                {mode === 'write' ? 'Write notes' : 'YouTube link'}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {sourceMode === 'youtube' && (
        <View style={styles.youtubeBlock}>
          <TextInput
            value={youtubeUrl}
            onChangeText={setYoutubeUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            placeholder="Paste a YouTube link"
            placeholderTextColor={theme.textSecondary}
            style={[styles.titleInput, { color: theme.text, backgroundColor: theme.backgroundElement }]}
          />
          <Pressable
            disabled={!isYouTubeUrl(youtubeUrl) || transcribing}
            onPress={transcribe}
            style={[
              styles.transcribeButton,
              {
                backgroundColor: theme.primary,
                opacity: isYouTubeUrl(youtubeUrl) && !transcribing ? 1 : 0.45,
              },
            ]}>
            <Ionicons name="sparkles-outline" size={17} color={theme.onPrimary} />
            <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
              {transcribing ? 'Working…' : 'Transcribe video'}
            </ThemedText>
          </Pressable>
          {transcriptionStatus ? (
            <ThemedText type="small" themeColor="textSecondary">
              {transcriptionStatus} A full sermon can take several minutes.
            </ThemedText>
          ) : null}
          {transcriptionError ? (
            <ThemedText type="small" themeColor="danger">{transcriptionError}</ThemedText>
          ) : null}
        </View>
      )}

      <View style={{ gap: Spacing.two, flex: 1 }}>
        <ThemedText type="small" themeColor="textSecondary">
          {sourceMode === 'youtube' && rawNotes
            ? 'Notes ready. Review them before saving.'
            : sourceMode === 'youtube'
              ? 'Openheart downloads the audio, transcribes the speech, then Claude writes the notes. You do not need captions.'
              : 'Jot it down however it comes. Fragments are fine. You can tidy spelling and punctuation later.'}
        </ThemedText>
        <TextInput
          value={rawNotes}
          onChangeText={updateNotes}
          placeholder="key pt - grace isnt earned... Eph 2:8&#10;rest = trust not laziness"
          placeholderTextColor={theme.textSecondary}
          multiline
          autoFocus={sourceMode === 'write'}
          style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
        />
      </View>

      {rawNotes.trim().length > 0 && !tidyPreview && (
        <Pressable
          onPress={() => void previewTidy()}
          disabled={tidying}
          style={[styles.tidyButton, { backgroundColor: theme.softFill, borderColor: theme.border, opacity: tidying ? 0.6 : 1 }]}>
          <Ionicons name="sparkles-outline" size={16} color={theme.accent} />
          <ThemedText type="smallBold" themeColor="accent">
            {tidying ? 'Tidying…' : 'Tidy up before saving'}
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
            <Ionicons name="sparkles" size={14} color={theme.accent} />
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
              <Pressable onPress={discardTidied} style={[styles.tidyAction, styles.tidyActionGhost, { borderColor: theme.border }]}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  Keep as written
                </ThemedText>
              </Pressable>
            </View>
          )}
        </View>
      )}

      <Pressable
        onPress={save}
        disabled={!rawNotes.trim() || saving}
        style={[styles.button, { backgroundColor: theme.primary, opacity: rawNotes.trim() ? 1 : 0.5 }]}>
        <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
          {saving ? 'Saving…' : tidyKept ? 'Save with tidied version' : 'Save note'}
        </ThemedText>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  titleInput: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    borderRadius: Radius.medium,
    padding: Spacing.three,
  },
  input: {
    minHeight: 220,
    fontFamily: Fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    borderRadius: Radius.medium,
    padding: Spacing.three,
    textAlignVertical: 'top',
  },
  sourceTabs: { flexDirection: 'row', gap: Spacing.two },
  sourceTab: {
    flex: 1,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: Radius.pill,
  },
  youtubeBlock: { gap: Spacing.two },
  transcribeButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: Radius.pill,
  },
  button: {
    paddingVertical: 16,
    borderRadius: Radius.pill,
    alignItems: 'center',
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
    lineHeight: 21,
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
});
