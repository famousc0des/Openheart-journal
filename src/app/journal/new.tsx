import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';

import { JournalWritingCanvas } from '@/components/journal-writing-canvas';
import { verseByRef } from '@/lib/bible-data';
import { createId } from '@/lib/id';
import { DEFAULT_PAGE_COLOR } from '@/lib/journal-page';
import { isRichEmpty, sanitizeRichHtml } from '@/lib/rich-text';
import { journalStore } from '@/lib/stores';

export default function NewJournalEntryScreen() {
  const { verseRef } = useLocalSearchParams<{ verseRef?: string }>();
  const verse = verseRef ? verseByRef(verseRef) : undefined;
  const [title, setTitle] = useState(verse?.ref ?? '');
  const [body, setBody] = useState('');
  const [pageColor, setPageColor] = useState(DEFAULT_PAGE_COLOR);
  const [prompt, setPrompt] = useState<string | undefined>(verse ? `What stands out to you in ${verse.ref} today?` : undefined);
  const [scriptureRefs, setScriptureRefs] = useState<string[]>(verse ? [verse.ref] : []);
  const canSave = !isRichEmpty(body);
  const saving = useRef(false);

  async function save() {
    if (!canSave || saving.current) return;
    saving.current = true;
    await journalStore.whenReady();
    const now = new Date().toISOString();
    journalStore.add({
      id: createId(),
      createdAt: now,
      updatedAt: now,
      type: 'freeform',
      title: title.trim() || undefined,
      body: sanitizeRichHtml(body),
      pageColor,
      prompt,
      scriptureRefs: scriptureRefs.length ? scriptureRefs : undefined,
    });
    router.back();
  }

  return (
    <JournalWritingCanvas
      title={title}
      onTitleChange={setTitle}
      body={body}
      onBodyChange={setBody}
      pageColor={pageColor}
      onPageColorChange={setPageColor}
      prompt={prompt}
      onPromptChange={setPrompt}
      scriptureRefs={scriptureRefs}
      onScriptureRefsChange={setScriptureRefs}
      canSave={canSave}
      onSave={save}
    />
  );
}
