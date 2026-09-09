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
  pageColor?: string;
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
  sharedCircleIds?: string[];
}

export interface SermonNote {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  rawNotes: string;
  youtubeUrl?: string;
  tidiedNotes?: string;
  resurfaceAt?: string;
  notificationId?: string;
  resurfacedAt?: string;
}

export interface ScriptureVerse {
  ref: string;
  text: string;
  tags: string[];
}

export interface UserCircle {
  id: string;
  createdAt: string;
  name: string;
  kind?: 'cord' | 'fellowship' | 'custom';
  /** Undefined uses the circle type default; null means no limit. */
  memberLimit?: number | null;
  /** Optional full-bleed cover for the Circle deck. */
  coverUri?: string;
}

export interface CircleMember {
  id: string;
  createdAt: string;
  name: string;
  circleId: string;
}

export interface CircleInvite {
  id: string;
  createdAt: string;
  code: string;
  circleId: string;
  claimedBy?: string;
}

export type CircleShareKind = 'verse' | 'journal' | 'sermon' | 'prayer' | 'church';

/** Snapshot of something sent into a circle so members can comment on it. */
export interface CircleShare {
  id: string;
  createdAt: string;
  circleId: string;
  kind: CircleShareKind;
  /** Journal/prayer/sermon id, or verse reference. */
  sourceId: string;
  authorName: string;
  title: string;
  body: string;
  likeCount?: number;
  likedByMe?: boolean;
}

export interface CircleComment {
  id: string;
  createdAt: string;
  shareId: string;
  /** Null for a top-level comment; set when replying to one. */
  parentId: string | null;
  authorName: string;
  body: string;
  likeCount?: number;
  likedByMe?: boolean;
}

/**
 * A church is a third kind of group, distinct from Cord/Fellowship circles:
 * shared membership, one reusable join code, and explicit ownership.
 * There is no role field, whoever creates the group owns it, and ownership
 * is always visible to members ("Owned by [Name]").
 */
export interface Church {
  id: string;
  createdAt: string;
  name: string;
  /** Primary owner first; extras are co-owners added via the code flow. */
  ownerNames: string[];
  /** True when the current user created (or was handed) this church. */
  ownedByMe: boolean;
  /** Reusable, revocable join code, not single-use like a Cord invite. */
  joinCode: string;
  joinCodeActive: boolean;
  /** Count only, the roster stays hidden from owners by design. */
  memberCount: number;
}

export type WeeklyPostStatus = 'draft' | 'scheduled' | 'sent';

export interface WeeklyPost {
  id: string;
  churchId: string;
  createdAt: string;
  scripture: string;
  /** One point per line; replies group under these on the Sundays view. */
  points: string[];
  /** Capped at 200 characters. */
  question: string;
  status: WeeklyPostStatus;
  /** The Wednesday this post goes out. */
  scheduledFor: string;
}

export interface WeeklyReply {
  id: string;
  churchId: string;
  postId: string;
  /** Index into the post's points, or null when answering the week's question. */
  pointIndex: number | null;
  body: string;
  senderName: string;
  createdAt: string;
}

export type ThemePreference = 'system' | 'light' | 'dark';

export interface NotificationPrefs {
  morningEnabled: boolean;
  morningHour: number;
  morningMinute: number;
  eveningEnabled: boolean;
  eveningHour: number;
  eveningMinute: number;
  prayerEnabled: boolean;
  prayerHour: number;
  prayerMinute: number;
  churchEnabled: boolean;
  churchStartHour: number;
  churchStartMinute: number;
  churchEndHour: number;
  churchEndMinute: number;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  morningEnabled: false,
  morningHour: 7,
  morningMinute: 30,
  eveningEnabled: false,
  eveningHour: 20,
  eveningMinute: 30,
  prayerEnabled: false,
  prayerHour: 12,
  prayerMinute: 0,
  churchEnabled: false,
  churchStartHour: 10,
  churchStartMinute: 0,
  churchEndHour: 12,
  churchEndMinute: 0,
};

export interface ChurchHours {
  asked: boolean;
  enabled: boolean;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

export const DEFAULT_CHURCH_HOURS: ChurchHours = {
  asked: false,
  enabled: true,
  startHour: 10,
  startMinute: 0,
  endHour: 12,
  endMinute: 0,
};

export type VaultKind = 'voice' | 'note' | 'verse';
export type VaultSource = 'vault' | 'church';

export interface VaultItem {
  id: string;
  createdAt: string;
  kind: VaultKind;
  source: VaultSource;
  title: string;
  body: string;
  audioUri?: string;
  verseRef?: string;
}

export interface SentChurchNote {
  id: string;
  sermonNoteId: string;
  churchId: string;
  senderName: string;
  /** Only fields the member explicitly chose to include. */
  fieldsIncluded: ('title' | 'notes' | 'tidied')[];
  title?: string;
  body?: string;
  sentAt: string;
}
