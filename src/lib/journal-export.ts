import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { Alert, Share } from 'react-native';

import { formatDateTime } from '@/lib/date';
import { entryLabel } from '@/lib/journal-display';
import { htmlToPlainText, looksLikeHtml, sanitizeRichHtml } from '@/lib/rich-text';
import { JournalEntry } from '@/lib/types';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function pageFill(entry: JournalEntry) {
  const color = entry.pageColor?.trim() ?? '#FFFFFF';
  return /^#[0-9A-Fa-f]{6}$/.test(color) ? color : '#FFFFFF';
}

function entryAsText(entry: JournalEntry) {
  const parts = [
    entryLabel(entry),
    formatDateTime(entry.createdAt),
    entry.prompt ? `Prompt: ${entry.prompt}` : '',
    htmlToPlainText(entry.body),
    entry.scriptureRefs?.length ? entry.scriptureRefs.join(', ') : '',
  ];
  return parts.filter(Boolean).join('\n\n');
}

async function shareEntryText(entry: JournalEntry) {
  await Share.share({
    title: entryLabel(entry),
    message: entryAsText(entry),
  });
}

async function exportEntryPdf(entry: JournalEntry) {
  const html = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body { font-family: -apple-system, Helvetica, sans-serif; color: #333333; padding: 32px; background: ${pageFill(entry)}; }
          h1 { font-weight: 500; font-size: 28px; margin: 0 0 8px; }
          .meta { color: #71717A; font-size: 13px; margin-bottom: 24px; }
          .prompt { color: #71717A; font-style: italic; margin-bottom: 16px; }
          p, .entry { font-size: 16px; line-height: 1.6; }
          .entry p { margin: 0 0 12px; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(entry.title ?? entryLabel(entry))}</h1>
        <div class="meta">${escapeHtml(formatDateTime(entry.createdAt))}</div>
        ${entry.prompt ? `<div class="prompt">${escapeHtml(entry.prompt)}</div>` : ''}
        <div class="entry">${
          looksLikeHtml(entry.body) ? sanitizeRichHtml(entry.body) : `<p>${escapeHtml(entry.body)}</p>`
        }</div>
      </body>
    </html>
  `;
  const { uri } = await Print.printToFileAsync({ html });
  await shareAsync(uri, { UTI: 'com.adobe.pdf', mimeType: 'application/pdf' });
}

export function exportJournalEntry(entry: JournalEntry) {
  Alert.alert(entryLabel(entry), 'Share this entry from your device. Nothing is uploaded.', [
    {
      text: 'Share text',
      onPress: () => {
        shareEntryText(entry).catch(() => {});
      },
    },
    {
      text: 'Export PDF',
      onPress: () => {
        exportEntryPdf(entry).catch(() => {
          Alert.alert('Export failed', 'The PDF could not be created on this device.');
        });
      },
    },
    { text: 'Cancel', style: 'cancel' },
  ]);
}
