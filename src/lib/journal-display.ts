import type { IconName } from '@/lib/icons/app';

import { JournalEntry } from '@/lib/types';

// Soft pastel washes for journal cards, ink text stays legible on all of them.
export const CARD_PALETTE = [
  '#E3EDFB', // powder blue
  '#E5F5E9', // mint cream
  '#FDEEE3', // peach
  '#F3E8FA', // lavender
  '#FBE9EC', // rose
  '#FDF6DF', // butter
];

export const DARK_CARD_PALETTE = ['#202D40', '#22362B', '#3C2D24', '#32273E', '#3C2730', '#383321'];

export function entryLabel(entry: JournalEntry): string {
  if (entry.type === 'checkin') return entry.period === 'morning' ? 'Morning check-in' : 'Evening check-in';
  if (entry.type === 'sermon') return entry.title ?? 'From a sermon note';
  return entry.title ?? 'Journal entry';
}

export function entryIcon(entry: JournalEntry): IconName {
  if (entry.type === 'checkin') return entry.period === 'morning' ? 'sunny' : 'moon';
  if (entry.type === 'sermon') return 'chatbubble-ellipses';
  return 'create';
}
