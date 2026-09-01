import { Ionicons } from '@expo/vector-icons';

import { JournalEntry } from '@/lib/types';

export const CARD_PALETTE = ['#5B3A5C', '#43506B', '#6B3F3F', '#3F5B4E', '#5C4A2E', '#4A3F5C'];

export function entryLabel(entry: JournalEntry): string {
  if (entry.type === 'checkin') return entry.period === 'morning' ? 'Morning check-in' : 'Evening check-in';
  if (entry.type === 'sermon') return entry.title ?? 'From a sermon note';
  return entry.title ?? 'Journal entry';
}

export function entryIcon(entry: JournalEntry): keyof typeof Ionicons.glyphMap {
  if (entry.type === 'checkin') return entry.period === 'morning' ? 'sunny' : 'moon';
  if (entry.type === 'sermon') return 'chatbubble-ellipses';
  return 'create';
}
