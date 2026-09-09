import type { IconName } from '@/lib/icons/app';

import { PrayerState } from '@/lib/types';

export const PRAYER_STATE_META: Record<
  PrayerState,
  { label: string; color: string; icon: IconName }
> = {
  praying: { label: 'Still praying', color: '#3B82F6', icon: 'flame-outline' },
  answered: { label: 'Answered', color: '#22C55E', icon: 'checkmark-circle-outline' },
  answered_differently: { label: 'Answered differently', color: '#EA580C', icon: 'water-outline' },
  entrusted: { label: 'Entrusted', color: '#8B5CF6', icon: 'hand-left-outline' },
};

export const PRAYER_STATES: PrayerState[] = ['praying', 'answered', 'answered_differently', 'entrusted'];

export const PRAYER_CATEGORY_LABELS: Record<string, string> = {
  family: 'Family',
  health: 'Health',
  work: 'Work',
  church: 'Church',
  relationships: 'Relationships',
  other: 'Other',
};
