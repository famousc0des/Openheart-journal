import { CollectionStore } from '@/lib/collection-store';
import { MemoryScalar, ScalarStore } from '@/lib/scalar-store';
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

export const journalStore = new CollectionStore<JournalEntry>('openheart.journal.v1');
export const prayerStore = new CollectionStore<Prayer>('openheart.prayers.v1');
export const sermonStore = new CollectionStore<SermonNote>('openheart.sermons.v1');
export const circlesStore = new CollectionStore<UserCircle>('openheart.circles.v1');
export const circleMemberStore = new CollectionStore<CircleMember>('openheart.circleMembers.v1');
export const circleInviteStore = new CollectionStore<CircleInvite>('openheart.circleInvites.v1');
export const circleShareStore = new CollectionStore<CircleShare>('openheart.circleShares.v1');
export const circleCommentStore = new CollectionStore<CircleComment>('openheart.circleComments.v1');
export const churchStore = new CollectionStore<Church>('openheart.churches.v1');
export const weeklyPostStore = new CollectionStore<WeeklyPost>('openheart.weeklyPosts.v1');
export const weeklyReplyStore = new CollectionStore<WeeklyReply>('openheart.weeklyReplies.v1');
export const sentChurchNoteStore = new CollectionStore<SentChurchNote>('openheart.sentChurchNotes.v1');
export const vaultStore = new CollectionStore<VaultItem>('openheart.vault.v1');
export const churchHoursStore = new ScalarStore<ChurchHours>('openheart.churchHours.v1', DEFAULT_CHURCH_HOURS);
export const displayNameStore = new ScalarStore<string>('openheart.displayName.v1', '');
export const isPremiumStore = new ScalarStore<boolean>('openheart.isPremium.v1', false);
export const accentOverrideStore = new ScalarStore<string | null>('openheart.accentOverride.v1', null);
export const hasOnboardedStore = new ScalarStore<boolean>('openheart.hasOnboarded.v1', false);
export const hasAccountStore = new ScalarStore<boolean>('openheart.hasAccount.v1', false);
export const accountEmailStore = new ScalarStore<string>('openheart.accountEmail.v1', '');
export const isAuthenticatedStore = new ScalarStore<boolean>('openheart.isAuthenticated.v1', false);
export const rememberMeStore = new ScalarStore<boolean>('openheart.rememberMe.v1', true);
export const themePreferenceStore = new ScalarStore<ThemePreference>('openheart.themePreference.v1', 'system');
export const pinEnabledStore = new ScalarStore<boolean>('openheart.pinEnabled.v1', false);
export const biometricUnlockStore = new ScalarStore<boolean>('openheart.biometricUnlock.v1', false);
export const notificationPrefsStore = new ScalarStore<NotificationPrefs>(
  'openheart.notificationPrefs.v1',
  DEFAULT_NOTIFICATION_PREFS
);
export const sessionAuthStore = new MemoryScalar(false);
export const isLockedStore = new MemoryScalar(false);
export const showStartScreenStore = new MemoryScalar(true);
