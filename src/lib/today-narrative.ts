import { Ionicons } from '@expo/vector-icons';

import { moodOption } from '@/lib/prompts';
import type { CheckInPeriod, JournalEntry, Prayer, ScriptureVerse, SermonNote } from '@/lib/types';

export type StickerTone = {
  name: keyof typeof Ionicons.glyphMap;
  bg: string;
  color: string;
  rotate: `${number}deg`;
};

export type NarrativeToken =
  | { kind: 'muted'; text: string }
  | { kind: 'strong'; text: string }
  | { kind: 'icon'; sticker: StickerTone };

export type DaySource = {
  id: string;
  href: string;
  sender: string;
  snippet: string;
  highlights: string[];
  avatar: StickerTone;
  stickers: StickerTone[];
};

const STICKERS = {
  journal: { name: 'book', bg: '#F3C9A4', color: '#6B3E1F', rotate: '-12deg' },
  mood: { name: 'heart', bg: '#F0C2CF', color: '#7A3048', rotate: '8deg' },
  prayer: { name: 'sparkles', bg: '#C9D6F2', color: '#2F4A7A', rotate: '-6deg' },
  sermon: { name: 'mic', bg: '#C5D9B8', color: '#35512A', rotate: '10deg' },
  verse: { name: 'leaf', bg: '#E8D5A8', color: '#6A5220', rotate: '-4deg' },
  checkin: { name: 'sunny', bg: '#F6D9A8', color: '#7A4E12', rotate: '6deg' },
} as const satisfies Record<string, StickerTone>;

function clip(text: string, max = 92): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).trimEnd()}…`;
}

function firstName(displayName: string): string {
  const name = displayName.trim();
  if (!name) return '';
  return name.split(/\s+/)[0];
}

export function buildTodayStory({
  displayName,
  period,
  checkIn,
  praying,
  sermon,
  verse,
}: {
  displayName: string;
  period: CheckInPeriod;
  checkIn?: JournalEntry;
  praying: Prayer[];
  sermon?: SermonNote;
  verse: ScriptureVerse;
}): { tokens: NarrativeToken[]; sources: DaySource[] } {
  const name = firstName(displayName);
  const prayer = praying[0];
  const tokens: NarrativeToken[] = [];
  const sources: DaySource[] = [];

  tokens.push({ kind: 'muted', text: name ? `Hi, ${name}! ` : 'Hi. ' });

  if (!checkIn && !prayer && !sermon) {
    tokens.push({
      kind: 'muted',
      text: period === 'morning' ? "Today you're going to " : "Tonight you're going to ",
    });
    tokens.push({ kind: 'strong', text: 'write a check-in' });
    tokens.push({ kind: 'icon', sticker: STICKERS.checkin });
    tokens.push({ kind: 'muted', text: ', then ' });
    tokens.push({ kind: 'strong', text: 'carry this verse' });
    tokens.push({ kind: 'icon', sticker: STICKERS.verse });
    tokens.push({ kind: 'muted', text: ` ${verse.ref}.` });
  } else {
    tokens.push({
      kind: 'muted',
      text: period === 'morning' ? "Today you're " : "Tonight you're ",
    });

    const clauses: NarrativeToken[][] = [];

    if (checkIn) {
      const mood = moodOption(checkIn.mood);
      const moodLabel = mood?.label.toLowerCase() ?? 'honest';
      clauses.push([
        { kind: 'strong', text: `sitting with a ${moodLabel} heart` },
        { kind: 'icon', sticker: STICKERS.mood },
      ]);
    } else {
      clauses.push([
        { kind: 'strong', text: 'starting with a check-in' },
        { kind: 'icon', sticker: STICKERS.checkin },
      ]);
    }

    if (prayer) {
      clauses.push([
        { kind: 'muted', text: 'keep praying for ' },
        { kind: 'strong', text: prayer.title },
        { kind: 'icon', sticker: STICKERS.prayer },
      ]);
    }

    if (sermon) {
      clauses.push([
        { kind: 'muted', text: 'sit with ' },
        { kind: 'strong', text: sermon.title },
        { kind: 'icon', sticker: STICKERS.sermon },
      ]);
    }

    clauses.forEach((clause, index) => {
      if (index > 0 && index === clauses.length - 1) {
        tokens.push({ kind: 'muted', text: ', and ' });
      } else if (index > 0) {
        tokens.push({ kind: 'muted', text: ', ' });
      }
      tokens.push(...clause);
    });

    tokens.push({ kind: 'muted', text: '.' });
  }

  if (checkIn) {
    const mood = moodOption(checkIn.mood);
    sources.push({
      id: checkIn.id,
      href: `/journal/${checkIn.id}`,
      sender: 'You wrote:',
      snippet: clip(checkIn.body),
      highlights: mood ? [mood.label.toLowerCase()] : [],
      avatar: { name: 'person', bg: '#E8C4B0', color: '#5C3A2A', rotate: '0deg' },
      stickers: [STICKERS.mood, STICKERS.journal],
    });
  }

  praying.slice(0, 2).forEach((item) => {
    sources.push({
      id: item.id,
      href: `/prayer/${item.id}`,
      sender: 'Still praying:',
      snippet: clip(item.body || item.title),
      highlights: [item.title],
      avatar: { name: 'heart', bg: '#E7B7C6', color: '#6E2E44', rotate: '0deg' },
      stickers: [STICKERS.prayer],
    });
  });

  if (sermon) {
    sources.push({
      id: sermon.id,
      href: `/sermon/${sermon.id}`,
      sender: 'From your notes:',
      snippet: clip(sermon.tidiedNotes || sermon.rawNotes || sermon.title),
      highlights: [sermon.title],
      avatar: { name: 'mic', bg: '#C5D4B4', color: '#3A4F2C', rotate: '0deg' },
      stickers: [STICKERS.sermon],
    });
  }

  sources.push({
    id: verse.ref,
    href: '/bible',
    sender: 'Verse of the day:',
    snippet: clip(`“${verse.text}” ${verse.ref}`),
    highlights: [verse.ref],
    avatar: { name: 'leaf', bg: '#E4D3A4', color: '#5C4A1E', rotate: '0deg' },
    stickers: [STICKERS.verse],
  });

  return { tokens, sources };
}
