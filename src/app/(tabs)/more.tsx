import { NamedIcon } from '@/components/ui/icon';
import type { IconName } from '@/lib/icons/app';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PressScale } from '@/components/press-scale';
import { ProfileAvatar, profileCompletenessPercent } from '@/components/profile-avatar';
import { CircleIconButton } from '@/components/ui/soft-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, HairlineBorder, Radius, Spacing, Tracking } from '@/constants/theme';
import { useTheme, useThemeScheme } from '@/hooks/use-theme';
import { clearAllAppData } from '@/lib/app-data';
import { useCollection } from '@/lib/collection-store';
import { signOutUser } from '@/lib/firebase-auth';
import { computeStreak } from '@/lib/date';
import { evaluateProfileBadges, type ProfileBadgeStatus } from '@/lib/profile-badges';
import { promptProfilePhoto } from '@/lib/pick-profile-photo';
import { useScalar, useScalarHydrated } from '@/lib/scalar-store';
import {
  displayNameStore,
  isAuthenticatedStore,
  isPremiumStore,
  journalStore,
  prayerStore,
  profileLocationStore,
  profilePhotoUriStore,
  seenBadgeIdsStore,
  sermonStore,
  sessionAuthStore,
  showStartScreenStore,
} from '@/lib/stores';

function SettingsRow({
  icon,
  label,
  subtitle,
  onPress,
  right,
  showChevron = true,
  destructive = false,
}: {
  icon: IconName;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  right?: ReactNode;
  showChevron?: boolean;
  destructive?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.settingsRow,
        pressed && onPress ? { backgroundColor: theme.backgroundSelected } : null,
      ]}>
      <View style={styles.rowIcon}>
        <NamedIcon name={icon} size={24} color={destructive ? theme.danger : theme.accent} />
      </View>
      <View style={styles.rowCopy}>
        <ThemedText type="default" style={[styles.rowLabel, destructive ? { color: theme.danger } : undefined]}>
          {label}
        </ThemedText>
        {subtitle ? (
          <ThemedText type="small" themeColor="textSecondary">
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {right ??
        (onPress && showChevron ? <NamedIcon name="chevron-forward" size={18} color={theme.textSecondary} /> : null)}
    </Pressable>
  );
}

function SettingsGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={styles.groupBlock}>
      <ThemedText type="small" style={styles.groupLabel}>
        {title}
      </ThemedText>
      <View style={[styles.groupCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        {children}
      </View>
    </View>
  );
}

function StatColumn({
  icon,
  value,
  label,
  onPress,
  showNew,
}: {
  icon: IconName;
  value: string;
  label: string;
  onPress: () => void;
  showNew?: boolean;
}) {
  const theme = useTheme();
  return (
    <PressScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={showNew ? `${label}, ${value}, new badge` : `${label}, ${value}`}
      style={[
        styles.statColumn,
      ]}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.statLabel}>
        {label}
      </ThemedText>
      <View style={styles.statTop}>
        <View style={styles.statIconWrap}>
          <NamedIcon name={icon} size={18} color={theme.accent} />
          {showNew ? <View style={[styles.newDot, { backgroundColor: theme.primary }]} /> : null}
        </View>
        <ThemedText type="smallBold" style={styles.statValue}>
          {value}
        </ThemedText>
      </View>
    </PressScale>
  );
}

function BadgeTile({ badge }: { badge: ProfileBadgeStatus }) {
  const theme = useTheme();
  const ratio = badge.progress ? Math.min(1, badge.progress.current / badge.progress.target) : 0;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${badge.name}. ${badge.earned ? 'Earned' : badge.progress?.label ?? 'Locked'}. ${badge.description}`}
      onPress={() =>
        Alert.alert(badge.name, badge.earned ? `${badge.description}\n\nEarned.` : `${badge.description}\n\n${badge.progress?.label ?? 'Keep going.'}`)
      }
      style={[
        styles.badgeTile,
        HairlineBorder,
        {
          backgroundColor: badge.earned ? theme.accentSoft : theme.softFill,
          borderColor: badge.earned ? theme.accent : theme.border,
          opacity: badge.earned ? 1 : 0.78,
        },
      ]}>
      <ThemedText style={[styles.badgeEmoji, !badge.earned && styles.badgeLocked]}>{badge.emoji}</ThemedText>
      <ThemedText type="smallBold" numberOfLines={2} style={styles.badgeName}>
        {badge.name}
      </ThemedText>
      {badge.earned ? (
        <ThemedText type="small" themeColor="accent">
          Earned
        </ThemedText>
      ) : (
        <View style={styles.badgeLockedCol}>
          <View style={styles.badgeLockedRow}>
            <NamedIcon name="lock-closed-outline" size={12} color={theme.textSecondary} />
            {badge.progress ? (
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={2} style={styles.badgeProgress}>
                {badge.progress.label}
              </ThemedText>
            ) : null}
          </View>
          {badge.progress ? (
            <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
              <View style={[styles.progressFill, { width: `${Math.round(ratio * 100)}%`, backgroundColor: theme.accent }]} />
            </View>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const theme = useTheme();
  const scheme = useThemeScheme();
  const displayName = useScalar(displayNameStore);
  const photoUri = useScalar(profilePhotoUriStore);
  const location = useScalar(profileLocationStore);
  const isPremium = useScalar(isPremiumStore);
  const seenBadgeIds = useScalar(seenBadgeIdsStore);
  const seenHydrated = useScalarHydrated(seenBadgeIdsStore);
  const entries = useCollection(journalStore);
  const prayers = useCollection(prayerStore);
  const sermonNotes = useCollection(sermonStore);

  const streak = computeStreak(
    entries.filter((entry) => entry.type === 'checkin').map((entry) => entry.createdAt)
  );
  const badges = useMemo(
    () => evaluateProfileBadges({ entries, prayers, sermonNotes }),
    [entries, prayers, sermonNotes]
  );
  const earnedCount = badges.filter((badge) => badge.earned).length;
  const completeness = profileCompletenessPercent(photoUri, displayName, location);
  const profileComplete = completeness === 100;
  const trimmedName = displayName.trim();
  const [celebration, setCelebration] = useState<string | null>(null);
  const [justEarnedIds, setJustEarnedIds] = useState<string[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const badgesY = useRef(0);
  const markedSeenKey = useRef('');

  useEffect(() => {
    if (!seenHydrated) return;
    const unseen = badges.filter((badge) => badge.earned && !seenBadgeIds.includes(badge.id));
    if (unseen.length === 0) return;
    const key = unseen.map((badge) => badge.id).sort().join(',');
    if (markedSeenKey.current === key) return;
    markedSeenKey.current = key;
    const names = unseen.map((badge) => badge.name);
    setJustEarnedIds(unseen.map((badge) => badge.id));
    setCelebration(names.length === 1 ? `${names[0]} earned` : `${names.length} badges earned`);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    void seenBadgeIdsStore.set([...seenBadgeIds, ...unseen.map((badge) => badge.id)]);
  }, [badges, seenBadgeIds, seenHydrated]);

  useEffect(() => {
    if (!celebration) return;
    const timer = setTimeout(() => {
      setCelebration(null);
      setJustEarnedIds([]);
    }, 4200);
    return () => clearTimeout(timer);
  }, [celebration]);

  function onBadgesLayout(event: LayoutChangeEvent) {
    badgesY.current = event.nativeEvent.layout.y;
  }

  function scrollToBadges() {
    scrollRef.current?.scrollTo({ y: Math.max(0, badgesY.current - 12), animated: true });
  }

  function inviteToCircle() {
    Share.share({
      message: "I'm using Openheart for private journaling and prayer. Thought you might like it too.",
    }).catch(() => {});
  }

  function exportData() {
    const payload = {
      exportedAt: new Date().toISOString(),
      journalEntries: entries,
      prayers,
      sermonNotes,
    };
    Share.share({ message: JSON.stringify(payload, null, 2) }).catch(() => {});
  }

  function signOut() {
    sessionAuthStore.set(false);
    void isAuthenticatedStore.set(false);
    showStartScreenStore.set(true);
    void signOutUser();
    router.replace('/');
  }

  function deleteEverything() {
    Alert.alert(
      'Delete everything',
      'This erases your journal, prayers, account, and lock on this device. It cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Erase everything',
          style: 'destructive',
          onPress: () => {
            void clearAllAppData().then(() => router.replace('/'));
          },
        },
      ]
    );
  }

  const washColors: [string, string] =
    scheme === 'light' ? ['#F6F3EE', 'rgba(246, 243, 238, 0)'] : [theme.backgroundSelected, 'rgba(255, 255, 255, 0)'];

  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.fill} edges={['top']}>
        <View style={styles.washWrap} pointerEvents="none">
          <LinearGradient colors={washColors} style={styles.wash} />
        </View>
        <View style={styles.profileHeader}>
          <View style={styles.headerSide} />
          <ThemedText accessibilityRole="header" type="smallBold" style={styles.profileHeaderTitle}>
            Profile
          </ThemedText>
          <View style={styles.headerSide}>
            <CircleIconButton icon="notifications-outline" accessibilityLabel="Notification settings" onPress={() => router.push('/settings/notifications')} />
          </View>
        </View>
        <ScrollView
          ref={scrollRef}
          bounces={false}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {celebration ? (
            <Animated.View
              entering={FadeInDown.duration(220)}
              exiting={FadeOutUp.duration(180)}
              style={[styles.toast, { backgroundColor: theme.primary }]}>
              <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
                {celebration}
              </ThemedText>
            </Animated.View>
          ) : null}

          <View style={styles.profileSummary}>
            <View style={[styles.summarySurface, { backgroundColor: theme.backgroundElement }]} pointerEvents="none" />
            <View style={styles.identity}>
              <View style={[styles.portraitFrame, { backgroundColor: theme.backgroundElement }]}>
                <ProfileAvatar
                  uri={photoUri}
                  name={displayName}
                  size={132}
                  completeness={completeness}
                  minimal
                  onPress={() =>
                    promptProfilePhoto(
                      (uri) => void profilePhotoUriStore.set(uri),
                      photoUri ? () => void profilePhotoUriStore.set('') : undefined
                    )
                  }
                />
              </View>
              <Pressable
                onPress={() => router.push('/profile/edit')}
                accessibilityRole="button"
                accessibilityLabel={profileComplete ? 'Edit Profile' : 'Complete your profile'}
                style={styles.identityCopy}>
                <ThemedText type="subtitle" style={styles.name}>
                  {trimmedName ? trimmedName : 'Add your name'}
                </ThemedText>
                <View style={styles.locationRow}>
                  <NamedIcon name="location-outline" size={16} color={theme.textSecondary} />
                  <ThemedText type="small" themeColor="textSecondary" style={styles.location}>
                    {location.trim() || 'Add where you are'}
                  </ThemedText>
                </View>
              </Pressable>
            </View>

            <View style={styles.statRow}>
              <StatColumn
                icon="create-outline"
                value={String(entries.length)}
                label="Entries"
                onPress={() => router.push('/journal')}
                showNew={justEarnedIds.some((id) => id === 'first-word' || id === 'faithful-five')}
              />
              <StatColumn
                icon="flame"
                value={String(streak)}
                label="Day streak"
                showNew={justEarnedIds.some(
                  (id) => id === 'three-days-near' || id === 'week-of-returning' || id === 'thirty-days-faithful'
                )}
                onPress={scrollToBadges}
              />
              <StatColumn
                icon="heart"
                value={String(prayers.length)}
                label="Prayers"
                showNew={justEarnedIds.some((id) => id === 'first-petition' || id === 'ten-prayers')}
                onPress={() => router.push('/prayer')}
              />
            </View>
          </View>

          <View style={[styles.modeRow, { backgroundColor: theme.backgroundSelected }]}>
            <NamedIcon name="sparkles-outline" size={24} color={theme.accent} />
            <ThemedText style={styles.modeLabel}>Preview premium</ThemedText>
            <Switch
              accessibilityLabel="Preview premium"
              accessibilityHint="Demo toggle. No payment in this prototype"
              value={isPremium}
              onValueChange={(value) => void isPremiumStore.set(value)}
              trackColor={{ true: theme.accent }}
            />
          </View>

          <SettingsGroup title="General">
            <SettingsRow icon="person-outline" label="Profile settings" onPress={() => router.push('/profile/edit')} />
            <SettingsRow icon="location-outline" label="Location" onPress={() => router.push('/profile/edit')} />
            <SettingsRow icon="color-palette-outline" label="Appearance" onPress={() => router.push('/settings/appearance')} />
          </SettingsGroup>

          <SettingsGroup title="Content">
            <SettingsRow icon="gift-outline" label="Invite to Circle" subtitle="Share Openheart" onPress={inviteToCircle} />
            <SettingsRow icon="chatbubble-ellipses-outline" label="Sermon Notes" subtitle={`${sermonNotes.length} notes`} onPress={() => router.push('/sermon')} />
            <SettingsRow icon="bookmark-outline" label="Bible Library" subtitle="Offline scripture lookup" onPress={() => router.push('/bible')} />
            <SettingsRow icon="archive-outline" label="Vault" subtitle="Voice notes, writings, and verses" onPress={() => router.push('/vault')} />
            <SettingsRow icon="home-outline" label="How was church?" subtitle="Sunday check-in" onPress={() => router.push('/church/check-in')} />
          </SettingsGroup>

          <PressScale
            accessibilityRole="button"
            accessibilityLabel={
              isPremium ? 'Premium. Themes and accent colors unlocked' : 'Openheart Premium. Themes and accent colors'
            }
            onPress={() => router.push('/settings/appearance')}
            style={styles.promoCard}>
            <LinearGradient
              colors={
                scheme === 'light'
                  ? [theme.accentSoft, 'rgba(59, 130, 246, 0.04)']
                  : [theme.accentSoft, 'rgba(96, 165, 250, 0.08)']
              }
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.promoCopy}>
              <ThemedText
                type="smallBold"
                themeColor={isPremium ? 'text' : 'accent'}
                style={isPremium ? styles.promoTitleQuiet : styles.promoTitle}>
                {isPremium ? 'Premium' : 'Openheart Premium'}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.promoSubtitle}>
                {isPremium ? 'Themes and accent colors unlocked' : 'Themes and accent colors'}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Demo preview. No payment in this prototype.
              </ThemedText>
            </View>
            <View style={[styles.promoGlyph, { backgroundColor: theme.background }]}>
              <NamedIcon name={isPremium ? 'checkmark' : 'sparkles'} size={22} color={theme.accent} />
            </View>
          </PressScale>

          <SettingsGroup title="Account">
            <SettingsRow icon="business-outline" label="Join a church" subtitle="Connect with a join code" onPress={() => router.push('/church/join')} />
            <SettingsRow icon="shield-outline" label="App lock" subtitle="PIN and Face ID" onPress={() => router.push('/settings/lock')} />
            <SettingsRow
              icon="notifications-outline"
              label="Notifications"
              subtitle="Check-in, prayer, and Sunday church"
              onPress={() => router.push('/settings/notifications')}
            />
            <SettingsRow icon="download-outline" label="Export everything" subtitle="Full export, always free" onPress={exportData} />
            <SettingsRow icon="document-text-outline" label="Terms of Service" onPress={() => router.push('/legal/terms')} />
            <SettingsRow icon="lock-closed-outline" label="Privacy" subtitle="Encrypted on this device" onPress={() => router.push('/legal/privacy')} />
            <SettingsRow
              icon="information-circle-outline"
              label="About Openheart"
              subtitle="v1.0.0"
              onPress={() => Alert.alert('Openheart', 'A private, Christian journaling app. Your words stay on this device.')}
            />
            <SettingsRow icon="log-out-outline" label="Sign Out" subtitle="Keep your data on this device" onPress={signOut} showChevron={false} />
          </SettingsGroup>

          <View onLayout={onBadgesLayout} style={styles.badgesSection}>
            <View style={styles.badgesHeader}>
              <ThemedText type="smallBold">Badges</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {earnedCount} of {badges.length}
              </ThemedText>
            </View>
            {earnedCount === 0 ? (
              <ThemedText type="small" themeColor="textSecondary" style={styles.badgesEmpty}>
                Write, pray, and return. Badges appear when the work is real.
              </ThemedText>
            ) : null}
            <View style={styles.badgeGrid}>
              {badges.map((badge) => (
                <BadgeTile key={badge.id} badge={badge} />
              ))}
            </View>
          </View>

          <Pressable
            onPress={deleteEverything}
            accessibilityRole="button"
            accessibilityLabel="Delete everything"
            style={styles.deleteQuiet}>
            <ThemedText type="small" themeColor="textSecondary">
              Delete everything
            </ThemedText>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  washWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320,
    overflow: 'hidden',
  },
  wash: {
    flex: 1,
  },
  profileHeader: {
    minHeight: 80,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: 2,
    paddingBottom: Spacing.one,
  },
  headerSide: {
    width: 44,
  },
  profileHeaderTitle: {
    fontFamily: Fonts.bold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: Tracking.subheading,
  },
  scrollContent: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingBottom: Spacing.six * 2,
    gap: Spacing.four,
  },
  toast: {
    borderRadius: Radius.medium,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
  },
  profileSummary: {
    position: 'relative',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  summarySurface: {
    ...StyleSheet.absoluteFill,
    top: 120,
    borderRadius: 28,
  },
  identity: {
    alignItems: 'center',
    gap: Spacing.three,
    paddingTop: 40,
    paddingBottom: Spacing.two,
  },
  portraitFrame: {
    padding: 6,
    borderRadius: Radius.pill,
  },
  identityCopy: {
    alignItems: 'center',
    gap: 4,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  name: {
    fontFamily: Fonts.bold,
    fontSize: 26,
    lineHeight: 34,
    letterSpacing: Tracking.display,
    textAlign: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  location: {
    flexShrink: 1,
    textAlign: 'center',
  },
  statRow: {
    marginTop: Spacing.three,
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: Spacing.one,
  },
  statColumn: {
    flex: 1,
    minWidth: 0,
    minHeight: 72,
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  statTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statIconWrap: {
    position: 'relative',
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newDot: {
    position: 'absolute',
    top: -1,
    right: -3,
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statValue: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: Tracking.heading,
  },
  statLabel: {
    fontSize: 12,
    lineHeight: 18,
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 60,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.large,
  },
  modeLabel: {
    flex: 1,
    fontSize: 17,
    lineHeight: 24,
  },
  promoCard: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 80,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.large,
    gap: Spacing.three,
    overflow: 'hidden',
  },
  promoCopy: {
    flex: 1,
    gap: 4,
    zIndex: 1,
  },
  promoTitle: {
    fontFamily: Fonts.bold,
    fontSize: 17,
    lineHeight: 24,
    letterSpacing: Tracking.subheading,
  },
  promoTitleQuiet: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: Tracking.heading,
  },
  promoSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  promoGlyph: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  badgesSection: {
    gap: Spacing.two,
  },
  badgesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  badgesEmpty: {
    marginBottom: Spacing.one,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  badgeTile: {
    width: '48%',
    flexGrow: 1,
    minHeight: 108,
    borderRadius: Radius.large,
    padding: Spacing.three,
    gap: 4,
  },
  badgeEmoji: {
    fontSize: 22,
    lineHeight: 28,
  },
  badgeLocked: {
    opacity: 0.45,
  },
  badgeName: {
    fontSize: 13,
    lineHeight: 18,
  },
  badgeLockedCol: {
    gap: 8,
    marginTop: 2,
  },
  badgeLockedRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  badgeProgress: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  groupBlock: {
    gap: Spacing.two,
  },
  groupLabel: {
    paddingHorizontal: 0,
  },
  groupCard: {
    borderRadius: Radius.large,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: 18,
    minHeight: 76,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    fontSize: 18,
    lineHeight: 26,
  },
  rowCopy: {
    flex: 1,
    gap: 4,
  },
  deleteQuiet: {
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
    marginTop: -Spacing.two,
  },
});
