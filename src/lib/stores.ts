import { MemoryScalar, ScalarStore } from '@/lib/scalar-store';
import { FirestoreCollectionStore, FirestoreScalarStore } from '@/lib/firestore-sync';
import {
  Church,
  ChurchHours,
  CircleComment,
  CircleInvite,
  CircleMember,
  CircleShare,
  DEFAULT_CHURCH_HOURS,
  DEFAULT_NOTIFICATION_PREFS,
  JournalEntry,
  NotificationPrefs,
  Prayer,
  SentChurchNote,
  SermonNote,
  ThemePreference,
  UserCircle,
  VaultItem,
  WeeklyPost,
  WeeklyReply,
} from '@/lib/types';

// Account data: synced to Firestore under users/{uid}/<name>, cached locally
// per-account for instant, offline-friendly reads.
export const journalStore = new FirestoreCollectionStore<JournalEntry>('journal');
export const prayerStore = new FirestoreCollectionStore<Prayer>('prayers');
export const sermonStore = new FirestoreCollectionStore<SermonNote>('sermons');
export const circlesStore = new FirestoreCollectionStore<UserCircle>('circles');
export const circleMemberStore = new FirestoreCollectionStore<CircleMember>('circleMembers');
export const circleInviteStore = new FirestoreCollectionStore<CircleInvite>('circleInvites');
export const circleShareStore = new FirestoreCollectionStore<CircleShare>('circleShares');
export const circleCommentStore = new FirestoreCollectionStore<CircleComment>('circleComments');
export const churchStore = new FirestoreCollectionStore<Church>('churches');
export const weeklyPostStore = new FirestoreCollectionStore<WeeklyPost>('weeklyPosts');
export const weeklyReplyStore = new FirestoreCollectionStore<WeeklyReply>('weeklyReplies');
export const sentChurchNoteStore = new FirestoreCollectionStore<SentChurchNote>('sentChurchNotes');
export const vaultStore = new FirestoreCollectionStore<VaultItem>('vault');

export const churchHoursStore = new FirestoreScalarStore<ChurchHours>('churchHours', DEFAULT_CHURCH_HOURS);
export const displayNameStore = new FirestoreScalarStore<string>('displayName', '');
export const profilePhotoUriStore = new FirestoreScalarStore<string>('profilePhotoUri', '');
export const profileLocationStore = new FirestoreScalarStore<string>('profileLocation', '');
export const seenBadgeIdsStore = new FirestoreScalarStore<string[]>('seenBadgeIds', []);
export const isPremiumStore = new FirestoreScalarStore<boolean>('isPremium', false);
export const accentOverrideStore = new FirestoreScalarStore<string | null>('accentOverride', null);
export const themePreferenceStore = new FirestoreScalarStore<ThemePreference>('themePreference', 'system');
export const notificationPrefsStore = new FirestoreScalarStore<NotificationPrefs>(
  'notificationPrefs',
  DEFAULT_NOTIFICATION_PREFS
);

// Device/session state: intentionally local-only, not part of account data.
export const hasOnboardedStore = new ScalarStore<boolean>('openheart.hasOnboarded.v1', false);
export const hasAccountStore = new ScalarStore<boolean>('openheart.hasAccount.v1', false);
export const accountEmailStore = new ScalarStore<string>('openheart.accountEmail.v1', '');
export const isAuthenticatedStore = new ScalarStore<boolean>('openheart.isAuthenticated.v1', false);
export const rememberMeStore = new ScalarStore<boolean>('openheart.rememberMe.v1', true);
export const pinEnabledStore = new ScalarStore<boolean>('openheart.pinEnabled.v1', false);
export const biometricUnlockStore = new ScalarStore<boolean>('openheart.biometricUnlock.v1', false);
export const sessionAuthStore = new MemoryScalar(false);
export const isLockedStore = new MemoryScalar(false);
export const showStartScreenStore = new MemoryScalar(true);
