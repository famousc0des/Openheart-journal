import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CircleShareSheet } from '@/components/circle-share-sheet';
import { JournalWritingCanvas } from '@/components/journal-writing-canvas';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SoftHeader } from '@/components/ui/soft-header';
import { Spacing } from '@/constants/theme';
import { useCollection, useCollectionReady } from '@/lib/collection-store';
import { entryLabel } from '@/lib/journal-display';
import { exportJournalEntry } from '@/lib/journal-export';
import { DEFAULT_PAGE_COLOR } from '@/lib/journal-page';
import { htmlToPlainText, isRichEmpty, sanitizeRichHtml } from '@/lib/rich-text';
import { journalStore } from '@/lib/stores';

export default function JournalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const entries = useCollection(journalStore);
  const ready = useCollectionReady(journalStore);
  const entry = entries.find((item) => item.id === id);

  const [editing, setEditing] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [pageColor, setPageColor] = useState(DEFAULT_PAGE_COLOR);
  const [prompt, setPrompt] = useState<string | undefined>();
  const [scriptureRefs, setScriptureRefs] = useState<string[]>([]);
  const initialized = useRef(false);

  useEffect(() => {
    if (entry && !initialized.current) {
      setTitle(entry.title ?? entryLabel(entry));
      setBody(entry.body);
      setPageColor(entry.pageColor ?? DEFAULT_PAGE_COLOR);
      setPrompt(entry.prompt);
      setScriptureRefs(entry.scriptureRefs ?? []);
      initialized.current = true;
    }
  }, [entry]);

  if (!ready) {
    return <ThemedView style={styles.fill} />;
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
    if (!entry || isRichEmpty(body)) return;
    journalStore.update(entry.id, {
      title: title.trim() || undefined,
      body: sanitizeRichHtml(body),
      pageColor,
      prompt,
      scriptureRefs: scriptureRefs.length ? scriptureRefs : undefined,
      updatedAt: new Date().toISOString(),
    });
    setEditing(false);
  }

  const bigTitle = title.trim() || entryLabel(entry);

  return (
    <>
      <JournalWritingCanvas
        key={`${entry.id}-${editing ? 'edit' : 'read'}`}
        title={title}
        onTitleChange={setTitle}
        body={body}
        onBodyChange={setBody}
        pageColor={pageColor}
        onPageColorChange={(value) => {
          setPageColor(value);
          journalStore.update(entry.id, { pageColor: value, updatedAt: new Date().toISOString() });
        }}
        prompt={prompt}
        onPromptChange={setPrompt}
        scriptureRefs={scriptureRefs}
        onScriptureRefsChange={setScriptureRefs}
        canSave={!isRichEmpty(body)}
        onSave={save}
        editing={editing}
        onEdit={() => setEditing(true)}
        onShare={() => setShareOpen(true)}
        onExport={() => exportJournalEntry({ ...entry, title: title.trim() || entry.title, body, pageColor })}
        onDelete={() => {
          Alert.alert('Delete this entry?', 'This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => {
                journalStore.remove(entry.id);
                router.back();
              },
            },
          ]);
        }}
      />
      <CircleShareSheet
        visible={shareOpen}
        draft={{
          kind: 'journal',
          sourceId: entry.id,
          title: bigTitle,
          body: htmlToPlainText(body),
        }}
        onClose={() => setShareOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
