import { Ionicons } from '@expo/vector-icons';

import { PrayerState } from '@/lib/types';

export const PRAYER_STATE_META: Record<
  PrayerState,
  { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  praying: { label: 'Still praying', color: '#7A8CA8', icon: 'flame-outline' },
  answered: { label: 'Answered', color: '#4E8B5C', icon: 'checkmark-circle-outline' },
  answered_differently: { label: 'Answered differently', color: '#B08A3E', icon: 'water-outline' },
  entrusted: { label: 'Entrusted', color: '#8A6BAE', icon: 'hand-left-outline' },
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
