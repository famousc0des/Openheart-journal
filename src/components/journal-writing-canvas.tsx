import { NamedIcon } from '@/components/ui/icon';
import type { IconName } from '@/lib/icons/app';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { type ReactNode, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  FORMAT_FONTS,
  FORMAT_HIGHLIGHTS,
  FORMAT_SIZES,
  JournalRichBody,
  JournalRichEditor,
  type JournalEditorHandle,
} from '@/components/journal-rich-editor';
import { ThemedText } from '@/components/themed-text';
import { VoiceMemo } from '@/components/voice-memo';
import { Fonts, Palette, Radius, Spacing, Tracking } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { hexToRgba } from '@/lib/color';
import { searchVerses } from '@/lib/bible-data';
import { createId } from '@/lib/id';
import { DEFAULT_PAGE_COLOR, isLightWash, PAGE_WASHES, resolvePageColor } from '@/lib/journal-page';
import { promptForPeriod } from '@/lib/prompts';
import { escapeHtml, isRichEmpty } from '@/lib/rich-text';
import { isPremiumStore, vaultStore } from '@/lib/stores';
import { useScalar } from '@/lib/scalar-store';
import { EmojiText } from '@/lib/with-emoji-fallback';

type Sheet = 'none' | 'menu' | 'format' | 'insert' | 'color' | 'verse' | 'voice';

function CircleHit({
  icon,
  label,
  onPress,
  ink,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  ink: string;
}) {
  const styles = createStyles(useTheme());
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.circle, { opacity: pressed ? 0.62 : 1 }]}>
      <NamedIcon name={icon} size={20} color={ink} />
    </Pressable>
  );
}

function SheetCard({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <Pressable
          onPress={() => {}}
          style={[styles.sheetCard, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.sheetGrab} />
          <ThemedText type="smallBold" style={styles.sheetTitle}>
            {title}
          </ThemedText>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function MenuRow({
  icon,
  label,
  tone = 'ink',
  onPress,
}: {
  icon: IconName;
  label: string;
  tone?: 'ink' | 'danger';
  onPress: () => void;
}) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const color = tone === 'danger' ? theme.danger : theme.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.menuRow, { opacity: pressed ? 0.6 : 1 }]}>
      <NamedIcon name={icon} size={20} color={color} />
      <Text style={[styles.menuLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

export function JournalWritingCanvas({
  title,
  onTitleChange,
  body,
  onBodyChange,
  pageColor,
  onPageColorChange,
  prompt,
  onPromptChange,
  scriptureRefs,
  onScriptureRefsChange,
  canSave,
  onSave,
  onDelete,
  onShare,
  onExport,
  onEdit,
  editing = true,
}: {
  title: string;
  onTitleChange: (value: string) => void;
  body: string;
  onBodyChange: (html: string) => void;
  pageColor?: string;
  onPageColorChange: (value: string) => void;
  prompt?: string;
  onPromptChange?: (value: string) => void;
  scriptureRefs?: string[];
  onScriptureRefsChange?: (refs: string[]) => void;
  canSave: boolean;
  onSave: () => void;
  onDelete?: () => void;
  onShare?: () => void;
  onExport?: () => void;
  onEdit?: () => void;
  editing?: boolean;
}) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const editorRef = useRef<JournalEditorHandle>(null);
  const isPremium = useScalar(isPremiumStore);
  const [sheet, setSheet] = useState<Sheet>('none');
  const [verseQuery, setVerseQuery] = useState('');
  const [voiceUri, setVoiceUri] = useState<string | undefined>();
  const chosenPaper = resolvePageColor(pageColor);
  const paper = chosenPaper.toUpperCase() === DEFAULT_PAGE_COLOR ? theme.background : chosenPaper;
  const ink = isLightWash(paper) ? Palette.ink : theme.text;
  const empty = isRichEmpty(body);
  const verses = useMemo(() => searchVerses(verseQuery).slice(0, 8), [verseQuery]);

  function closeSheet() {
    setSheet('none');
  }

  function run(cmd: string, arg?: string) {
    editorRef.current?.run(cmd, arg);
  }

  function insertPrompt() {
    const next = promptForPeriod(new Date().getHours() < 16 ? 'morning' : 'evening');
    onPromptChange?.(next);
    run('insertHTML', `<p><em>${escapeHtml(next)}</em></p>`);
    closeSheet();
  }

  function attachVerse(ref: string, text: string) {
    const next = Array.from(new Set([...(scriptureRefs ?? []), ref]));
    onScriptureRefsChange?.(next);
    run(
      'insertHTML',
      `<blockquote><strong>${escapeHtml(ref)}</strong><br/>${escapeHtml(text)}</blockquote><p></p>`
    );
    closeSheet();
  }

  async function insertPhoto(fromCamera: boolean) {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        fromCamera ? 'Camera is closed' : 'Photos are closed',
        'Turn on access in Settings to add a picture to this page.'
      );
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.55,
          base64: true,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.55,
          base64: true,
        });

    if (result.canceled) return;
    const asset = result.assets[0];
    const payload = asset.base64;
    const mime = asset.mimeType || 'image/jpeg';
    if (!payload) {
      Alert.alert('Could not add that photo', 'Try another picture.');
      return;
    }
    run('insertHTML', `<p><img src="data:${mime};base64,${payload}" alt="" /></p><p></p>`);
  }

  function openCamera() {
    Alert.alert('Add a photo', undefined, [
      { text: 'Take photo', onPress: () => void insertPhoto(true) },
      { text: 'Choose from library', onPress: () => void insertPhoto(false) },
      { text: 'Voice note', onPress: () => setSheet('voice') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  function keepVoice() {
    if (!voiceUri) {
      closeSheet();
      return;
    }
    vaultStore.add({
      id: createId(),
      createdAt: new Date().toISOString(),
      kind: 'voice',
      source: 'vault',
      title: title.trim() || 'Journal voice note',
      body: 'Recorded from a journal entry.',
      audioUri: voiceUri,
    });
    run('insertHTML', '<p><em>Voice note saved to Vault.</em></p><p></p>');
    setVoiceUri(undefined);
    closeSheet();
  }

  function chooseColor(value: string, premium: boolean) {
    if (premium && !isPremium) {
      Alert.alert('Premium', 'Page colors are part of Openheart Premium. Writing stays free.', [
        { text: 'Not now', style: 'cancel' },
        { text: 'Preview premium', onPress: () => isPremiumStore.set(true) },
      ]);
      return;
    }
    onPageColorChange(value);
    closeSheet();
  }

  return (
    <View style={[styles.fill, { backgroundColor: paper }]}>
      <StatusBar style={isLightWash(paper) ? 'dark' : 'light'} />
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top - 8, 4) }]}>
          <CircleHit icon="chevron-back" label="Back" ink={ink} onPress={() => router.back()} />
          <CircleHit icon="menu-outline" label="More" ink={ink} onPress={() => setSheet('menu')} />
        </View>

        <View style={styles.page}>
          {editing ? (
            <TextInput
              value={title}
              onChangeText={onTitleChange}
              placeholder="Title"
              placeholderTextColor={hexToRgba(ink, 0.55)}
              multiline
              style={[styles.title, styles.titleField, { color: ink }]}
            />
          ) : (
            <EmojiText style={[styles.title, { color: ink }]}>{title || 'Untitled'}</EmojiText>
          )}

          {prompt ? (
            <Text style={[styles.prompt, { color: hexToRgba(ink, 0.7) }]}>{prompt}</Text>
          ) : null}

          <View style={[styles.editorSlot, editing && styles.editorField]}>
            {editing ? (
              <>
                <JournalRichEditor ref={editorRef} value={body} onChange={onBodyChange} ink={ink} />
                {empty ? (
                  <View pointerEvents="none" style={styles.emptyHit}>
                    <Text style={[styles.continue, { color: hexToRgba(ink, 0.55) }]}>Tap here to continue.</Text>
                  </View>
                ) : null}
              </>
            ) : (
              <ScrollView
                style={styles.fill}
                contentContainerStyle={styles.readBody}
                showsVerticalScrollIndicator={false}>
                <Pressable onPress={onEdit} disabled={!onEdit}>
                  <JournalRichBody html={body} ink={ink} />
                </Pressable>
              </ScrollView>
            )}
          </View>
        </View>

        {editing ? (
        <View style={[styles.toolbarWrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.pill}>
            <Pressable
              accessibilityLabel="Add a photo"
              onPress={openCamera}
              style={({ pressed }) => [styles.tool, { opacity: pressed ? 0.55 : 1 }]}>
              <NamedIcon name="camera-outline" size={22} color={theme.text} />
            </Pressable>
            <Pressable
              accessibilityLabel="Formatting"
              onPress={() => setSheet('format')}
              style={({ pressed }) => [styles.tool, { opacity: pressed ? 0.55 : 1 }]}>
              <NamedIcon name="pencil-outline" size={21} color={theme.text} />
            </Pressable>
            <Pressable
              accessibilityLabel="Attach verse"
              onPress={() => setSheet('verse')}
              style={({ pressed }) => [styles.tool, { opacity: pressed ? 0.55 : 1 }]}>
              <NamedIcon name="attach-outline" size={22} color={theme.text} />
            </Pressable>
            <Pressable
              accessibilityLabel="Numbered list"
              onPress={() => run('insertOrderedList')}
              style={({ pressed }) => [styles.tool, { opacity: pressed ? 0.55 : 1 }]}>
              <NamedIcon name="list-outline" size={22} color={theme.text} />
            </Pressable>
            <Pressable
              accessibilityLabel="Insert"
              onPress={() => setSheet('insert')}
              style={({ pressed }) => [styles.plus, { opacity: pressed ? 0.82 : 1 }]}>
              <NamedIcon name="add" size={26} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
        ) : (
          <View style={{ height: Math.max(insets.bottom, 12) }} />
        )}
      </KeyboardAvoidingView>

      <SheetCard visible={sheet === 'menu'} title="Entry" onClose={closeSheet}>
        {editing ? (
        <MenuRow
          icon="checkmark-circle-outline"
          label={canSave ? 'Save' : 'Save (write a little first)'}
          onPress={() => {
            closeSheet();
            if (!canSave) {
              Alert.alert('Write a little first', 'Add a few words to the page before saving.');
              return;
            }
            onSave();
          }}
        />
        ) : onEdit ? (
          <MenuRow
            icon="create-outline"
            label="Edit"
            onPress={() => {
              closeSheet();
              onEdit();
            }}
          />
        ) : null}
        <MenuRow
          icon="color-palette-outline"
          label="Page color"
          onPress={() => setSheet('color')}
        />
        {onShare ? (
          <MenuRow
            icon="share-outline"
            label="Share with a circle"
            onPress={() => {
              closeSheet();
              onShare();
            }}
          />
        ) : null}
        {onExport ? (
          <MenuRow
            icon="download-outline"
            label="Export"
            onPress={() => {
              closeSheet();
              onExport();
            }}
          />
        ) : null}
        {onDelete ? (
          <MenuRow
            icon="trash-outline"
            label="Delete"
            tone="danger"
            onPress={() => {
              closeSheet();
              onDelete();
            }}
          />
        ) : null}
      </SheetCard>

      <SheetCard visible={sheet === 'format'} title="Format" onClose={closeSheet}>
        <View style={styles.formatRow}>
          <Pressable style={styles.formatKey} onPress={() => run('bold')} accessibilityLabel="Bold">
            <Text style={[styles.formatGlyph, { fontFamily: Fonts.bold }]}>B</Text>
          </Pressable>
          <Pressable style={styles.formatKey} onPress={() => run('italic')} accessibilityLabel="Italic">
            <Text style={[styles.formatGlyph, { fontStyle: 'italic', fontFamily: Fonts.medium }]}>I</Text>
          </Pressable>
          <Pressable
            style={styles.formatKey}
            onPress={() => run('insertUnorderedList')}
            accessibilityLabel="Bullets">
            <NamedIcon name="list-outline" size={20} color={theme.text} />
          </Pressable>
          <Pressable
            style={styles.formatKey}
            onPress={() => run('insertOrderedList')}
            accessibilityLabel="Numbers">
            <NamedIcon name="list" size={20} color={theme.text} />
          </Pressable>
        </View>
        <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
          Typeface
        </ThemedText>
        <View style={styles.chipRow}>
          {FORMAT_FONTS.map((font) => (
            <Pressable
              key={font.value}
              onPress={() => run('fontName', font.value)}
              style={styles.chip}>
              <Text style={styles.chipLabel}>{font.label}</Text>
            </Pressable>
          ))}
        </View>
        <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
          Size
        </ThemedText>
        <View style={styles.chipRow}>
          {FORMAT_SIZES.map((size) => (
            <Pressable
              key={size.value}
              onPress={() => run('fontSize', size.value)}
              style={styles.chip}>
              <Text style={styles.chipLabel}>{size.label}</Text>
            </Pressable>
          ))}
        </View>
        <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
          Highlight
        </ThemedText>
        <View style={styles.chipRow}>
          {FORMAT_HIGHLIGHTS.map((swatch) => (
            <Pressable
              key={swatch.value}
              onPress={() => run('highlight', swatch.value)}
              style={[
                styles.washDot,
                {
                  backgroundColor: swatch.value === 'transparent' ? '#fff' : swatch.value,
                  borderColor: 'rgba(0,0,0,0.1)',
                },
              ]}
            />
          ))}
        </View>
      </SheetCard>

      <SheetCard visible={sheet === 'insert'} title="Insert" onClose={closeSheet}>
        <MenuRow icon="text-outline" label="Heading" onPress={() => { run('heading'); closeSheet(); }} />
        <MenuRow
          icon="list-outline"
          label="Bulleted list"
          onPress={() => {
            run('insertUnorderedList');
            closeSheet();
          }}
        />
        <MenuRow
          icon="list"
          label="Numbered list"
          onPress={() => {
            run('insertOrderedList');
            closeSheet();
          }}
        />
        <MenuRow icon="bookmark-outline" label="Verse" onPress={() => setSheet('verse')} />
        <MenuRow icon="mic-outline" label="Voice note" onPress={() => setSheet('voice')} />
        <MenuRow icon="sparkles-outline" label="Writing prompt" onPress={insertPrompt} />
      </SheetCard>

      <SheetCard visible={sheet === 'color'} title="Page color" onClose={closeSheet}>
        <View style={styles.washRow}>
          {PAGE_WASHES.map((wash) => {
            const locked = wash.premium && !isPremium;
            const active = paper === wash.value;
            return (
              <Pressable
                key={wash.id}
                accessibilityLabel={locked ? `${wash.label}, Premium` : wash.label}
                onPress={() => chooseColor(wash.value, wash.premium)}
                style={styles.washItem}>
                <View
                  style={[
                    styles.washSwatch,
                    {
                      backgroundColor: wash.value,
                      borderColor: active ? ink : 'rgba(0,0,0,0.08)',
                      borderWidth: active ? 2 : StyleSheet.hairlineWidth,
                    },
                  ]}>
                  {locked ? <NamedIcon name="lock-closed" size={14} color={Palette.ink} /> : null}
                </View>
                <Text style={styles.washLabel}>{wash.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </SheetCard>

      <SheetCard visible={sheet === 'verse'} title="Attach a verse" onClose={closeSheet}>
        <TextInput
          value={verseQuery}
          onChangeText={setVerseQuery}
          placeholder="Search verses"
          placeholderTextColor="rgba(51,51,51,0.35)"
          style={styles.search}
        />
        <ScrollView style={styles.verseList} keyboardShouldPersistTaps="handled">
          {verses.map((verse) => (
            <Pressable
              key={verse.ref}
              onPress={() => attachVerse(verse.ref, verse.text)}
              style={({ pressed }) => [styles.verseRow, { opacity: pressed ? 0.65 : 1 }]}>
              <Text style={styles.verseRef}>{verse.ref}</Text>
              <Text style={styles.verseText} numberOfLines={3}>
                {verse.text}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </SheetCard>

      <SheetCard visible={sheet === 'voice'} title="Voice note" onClose={closeSheet}>
        <VoiceMemo uri={voiceUri} onChange={setVoiceUri} />
        <Pressable
          onPress={keepVoice}
          style={({ pressed }) => [styles.doneVoice, { opacity: pressed ? 0.8 : 1 }]}>
          <Text style={styles.doneVoiceLabel}>{voiceUri ? 'Save to Vault' : 'Close'}</Text>
        </Pressable>
      </SheetCard>
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  fill: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  circle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.softFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  page: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: Tracking.heading,
    color: theme.text,
    padding: 0,
    marginBottom: 16,
    includeFontPadding: false,
  },
  titleField: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: Radius.medium,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  editorField: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: Radius.medium,
    padding: 12,
    overflow: 'hidden',
  },
  prompt: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: theme.textSecondary,
    fontStyle: 'italic',
    marginBottom: 14,
  },
  editorSlot: {
    flex: 1,
    position: 'relative',
  },
  readBody: {
    paddingBottom: 32,
  },
  emptyHit: {
    position: 'absolute',
    top: 12,
    right: 12,
    bottom: 0,
    left: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 2,
  },
  continue: {
    fontFamily: Fonts.regular,
    fontSize: 17,
    lineHeight: 28,
    color: theme.textSecondary,
    includeFontPadding: false,
  },
  toolbarWrap: {
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 58,
    paddingLeft: 6,
    paddingRight: 6,
    borderRadius: Radius.pill,
    backgroundColor: theme.backgroundElement,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
    boxShadow: '0 8px 28px rgba(15, 16, 18, 0.08)',
    elevation: 6,
  },
  tool: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plus: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  sheetBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15,16,18,0.28)',
  },
  sheetCard: {
    backgroundColor: theme.backgroundElement,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 4,
  },
  sheetGrab: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.border,
    marginBottom: 10,
  },
  sheetTitle: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    lineHeight: 22,
    color: theme.text,
    marginBottom: 8,
  },
  menuRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuLabel: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    lineHeight: 22,
  },
  formatRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  formatKey: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: theme.softFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formatGlyph: {
    fontSize: 18,
    lineHeight: 24,
    color: theme.text,
  },
  sectionLabel: {
    marginTop: 8,
    marginBottom: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
    backgroundColor: theme.softFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipLabel: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: theme.text,
  },
  washDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  washRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  washItem: {
    alignItems: 'center',
    gap: 8,
    width: 56,
  },
  washSwatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  washLabel: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: theme.text,
  },
  search: {
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: theme.softFill,
    paddingHorizontal: 14,
    fontFamily: Fonts.regular,
    fontSize: 16,
    lineHeight: 22,
    color: theme.text,
    includeFontPadding: false,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  verseList: {
    maxHeight: 280,
  },
  verseRow: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
    gap: 4,
  },
  verseRef: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    lineHeight: 20,
    color: theme.text,
  },
  verseText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: theme.textSecondary,
  },
  doneVoice: {
    marginTop: 12,
    minHeight: 48,
    borderRadius: Radius.pill,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneVoiceLabel: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    lineHeight: 20,
    color: '#FFFFFF',
  },
});
