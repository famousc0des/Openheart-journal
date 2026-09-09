import * as Notifications from 'expo-notifications';

import { deletePin } from '@/lib/app-lock';
import { resetEncryptionKey, wipeOpenheartStorage } from '@/lib/encrypted-storage';
import { deleteLocalAccount } from '@/lib/local-account';
import {
  accountEmailStore,
  accentOverrideStore,
  biometricUnlockStore,
  churchHoursStore,
  churchStore,
  circleCommentStore,
  circleInviteStore,
  circleMemberStore,
  circleShareStore,
  circlesStore,
  displayNameStore,
  hasAccountStore,
  hasOnboardedStore,
  isAuthenticatedStore,
  isLockedStore,
  isPremiumStore,
  journalStore,
  notificationPrefsStore,
  pinEnabledStore,
  prayerStore,
  profileLocationStore,
  profilePhotoUriStore,
  rememberMeStore,
  seenBadgeIdsStore,
  sentChurchNoteStore,
  sermonStore,
  sessionAuthStore,
  showStartScreenStore,
  themePreferenceStore,
  vaultStore,
  weeklyPostStore,
  weeklyReplyStore,
} from '@/lib/stores';

export async function clearAllAppData() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // permissions or web, nothing scheduled to cancel
  }

  await Promise.all([
    journalStore.clear(),
    prayerStore.clear(),
    sermonStore.clear(),
    circlesStore.clear(),
    circleMemberStore.clear(),
    circleInviteStore.clear(),
    circleShareStore.clear(),
    circleCommentStore.clear(),
    churchStore.clear(),
    weeklyPostStore.clear(),
    weeklyReplyStore.clear(),
    sentChurchNoteStore.clear(),
    vaultStore.clear(),
    churchHoursStore.clear(),
    displayNameStore.clear(),
    profilePhotoUriStore.clear(),
    profileLocationStore.clear(),
    seenBadgeIdsStore.clear(),
    isPremiumStore.clear(),
    accentOverrideStore.clear(),
    hasOnboardedStore.clear(),
    hasAccountStore.clear(),
    accountEmailStore.clear(),
    isAuthenticatedStore.clear(),
    rememberMeStore.clear(),
    themePreferenceStore.clear(),
    pinEnabledStore.clear(),
    biometricUnlockStore.clear(),
    notificationPrefsStore.clear(),
  ]);

  sessionAuthStore.set(false);
  isLockedStore.set(false);
  showStartScreenStore.set(true);

  await deleteLocalAccount();
  await deletePin();
  await wipeOpenheartStorage();
  await resetEncryptionKey();
}
