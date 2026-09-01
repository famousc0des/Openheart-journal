export type Mood =
  | 'peaceful'
  | 'joyful'
  | 'grateful'
  | 'hopeful'
  | 'anxious'
  | 'weary'
  | 'sorrowful'
  | 'restless';

export type CheckInPeriod = 'morning' | 'evening';

export type EntryType = 'checkin' | 'freeform' | 'sermon';

export interface JournalEntry {
  id: string;
  createdAt: string;
  updatedAt: string;
  type: EntryType;
  period?: CheckInPeriod;
  mood?: Mood;
  prompt?: string;
  title?: string;
  body: string;
  scriptureRefs?: string[];
  sermonNoteId?: string;
}

export type PrayerState = 'praying' | 'answered' | 'answered_differently' | 'entrusted';

export type PrayerCategory =
  | 'family'
  | 'health'
  | 'work'
  | 'church'
  | 'relationships'
  | 'other';

export interface PrayerUpdate {
  id: string;
  createdAt: string;
  body: string;
}

export interface Prayer {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  body: string;
  category: PrayerCategory;
  state: PrayerState;
  updates: PrayerUpdate[];
}

export interface SermonNote {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  rawNotes: string;
  tidiedNotes?: string;
  flaggedWords?: string[];
  resurfaceAt?: string;
  notificationId?: string;
  resurfacedAt?: string;
}

export interface ScriptureVerse {
  ref: string;
  text: string;
  tags: string[];
}

export type CircleGroup = 'cord' | 'fellowship';

export interface CircleMember {
  id: string;
  createdAt: string;
  name: string;
  group: CircleGroup;
}

export interface CircleInvite {
  id: string;
  createdAt: string;
  code: string;
  group: CircleGroup;
  claimedBy?: string;
}
