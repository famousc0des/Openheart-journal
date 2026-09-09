import { computeStreak } from '@/lib/date';
import type { JournalEntry, Prayer, SermonNote } from '@/lib/types';

export type ProfileBadgeId =
  | 'first-word'
  | 'faithful-five'
  | 'three-days-near'
  | 'week-of-returning'
  | 'thirty-days-faithful'
  | 'first-petition'
  | 'ten-prayers'
  | 'first-note';

export interface ProfileBadgeDef {
  id: ProfileBadgeId;
  name: string;
  emoji: string;
  description: string;
}

export interface ProfileBadgeProgress {
  current: number;
  target: number;
  label: string;
}

export interface ProfileBadgeStatus extends ProfileBadgeDef {
  earned: boolean;
  progress?: ProfileBadgeProgress;
}

export const PROFILE_BADGES: ProfileBadgeDef[] = [
  {
    id: 'first-word',
    name: 'First Word',
    emoji: '✍️',
    description: 'Write your first journal entry.',
  },
  {
    id: 'faithful-five',
    name: 'Faithful Five',
    emoji: '🕊️',
    description: 'Five journal entries whose days fall within a five-day span.',
  },
  {
    id: 'three-days-near',
    name: 'Three Days Near',
    emoji: '🌅',
    description: 'A three-day check-in streak.',
  },
  {
    id: 'week-of-returning',
    name: 'A Week of Returning',
    emoji: '🔥',
    description: 'A seven-day check-in streak.',
  },
  {
    id: 'thirty-days-faithful',
    name: 'Thirty Days Faithful',
    emoji: '🌿',
    description: 'A thirty-day check-in streak.',
  },
  {
    id: 'first-petition',
    name: 'First Petition',
    emoji: '🙏',
    description: 'Keep your first prayer.',
  },
  {
    id: 'ten-prayers',
    name: 'Ten Prayers',
    emoji: '✨',
    description: 'Ten prayers held in the app.',
  },
  {
    id: 'first-note',
    name: 'First Note',
    emoji: '📖',
    description: 'Capture your first sermon note.',
  },
];

function localDayNumber(iso: string): number {
  const date = new Date(iso);
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
}

/** Most journal entries that sit inside any inclusive 5-calendar-day window. */
export function maxEntriesInFiveDaySpan(createdAts: string[]): number {
  if (createdAts.length === 0) return 0;
  const days = createdAts.map(localDayNumber).sort((a, b) => a - b);
  let max = 0;
  let start = 0;
  for (let end = 0; end < days.length; end += 1) {
    while (days[end] - days[start] > 4) start += 1;
    max = Math.max(max, end - start + 1);
  }
  return max;
}

export function evaluateProfileBadges(input: {
  entries: JournalEntry[];
  prayers: Prayer[];
  sermonNotes: SermonNote[];
}): ProfileBadgeStatus[] {
  const entryCount = input.entries.length;
  const prayerCount = input.prayers.length;
  const sermonCount = input.sermonNotes.length;
  const streak = computeStreak(
    input.entries.filter((entry) => entry.type === 'checkin').map((entry) => entry.createdAt)
  );
  const faithfulCount = maxEntriesInFiveDaySpan(input.entries.map((entry) => entry.createdAt));

  const progressFor = (
    current: number,
    target: number,
    label: string
  ): ProfileBadgeProgress => ({
    current: Math.min(current, target),
    target,
    label,
  });

  return PROFILE_BADGES.map((def) => {
    switch (def.id) {
      case 'first-word':
        return {
          ...def,
          earned: entryCount >= 1,
          progress: entryCount >= 1 ? undefined : progressFor(entryCount, 1, '0 / 1 entries'),
        };
      case 'faithful-five':
        return {
          ...def,
          earned: faithfulCount >= 5,
          progress: progressFor(faithfulCount, 5, `${Math.min(faithfulCount, 5)} / 5 entries this span`),
        };
      case 'three-days-near':
        return {
          ...def,
          earned: streak >= 3,
          progress: streak >= 3 ? undefined : progressFor(streak, 3, `${streak} / 3 day streak`),
        };
      case 'week-of-returning':
        return {
          ...def,
          earned: streak >= 7,
          progress: streak >= 7 ? undefined : progressFor(streak, 7, `${streak} / 7 day streak`),
        };
      case 'thirty-days-faithful':
        return {
          ...def,
          earned: streak >= 30,
          progress: streak >= 30 ? undefined : progressFor(streak, 30, `${streak} / 30 day streak`),
        };
      case 'first-petition':
        return {
          ...def,
          earned: prayerCount >= 1,
          progress: prayerCount >= 1 ? undefined : progressFor(prayerCount, 1, '0 / 1 prayers'),
        };
      case 'ten-prayers':
        return {
          ...def,
          earned: prayerCount >= 10,
          progress: progressFor(prayerCount, 10, `${Math.min(prayerCount, 10)} / 10 prayers`),
        };
      case 'first-note':
        return {
          ...def,
          earned: sermonCount >= 1,
          progress: sermonCount >= 1 ? undefined : progressFor(sermonCount, 1, '0 / 1 sermon notes'),
        };
    }
  });
}
