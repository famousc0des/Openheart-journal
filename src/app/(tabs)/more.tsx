import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, HairlineBorder, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { computeStreak } from '@/lib/date';
import { useCollection } from '@/lib/collection-store';
import { useScalar } from '@/lib/scalar-store';
import { clearAllAppData } from '@/lib/app-data';
import {
  displayNameStore,
  isAuthenticatedStore,
  isPremiumStore,
  journalStore,
  prayerStore,
  sermonStore,
  sessionAuthStore,
  showStartScreenStore,
} from '@/lib/stores';

type Tab = 'content' | 'personalize' | 'account';

function Row({
  icon,
  label,
  subtitle,
  onPress,
  right,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  right?: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, HairlineBorder, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
      disabled={!onPress}>
      <View style={[styles.rowIcon, { backgroundColor: theme.accentSoft }]}>
        <Ionicons name={icon} size={18} color={theme.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <ThemedText type="smallBold">{label}</ThemedText>
        {subtitle && (
          <ThemedText type="small" themeColor="textSecondary">
            {subtitle}
          </ThemedText>
        )}
      </View>
      {right ?? (onPress && <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />)}
    </Pressable>
  );
}

function StatCol({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statCol}>
      <ThemedText type="smallBold" style={styles.statValue}>
        {value}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.tabButton,
        HairlineBorder,
        {
          backgroundColor: active ? theme.primary : theme.softFill,
        },
      ]}>
      <ThemedText type="smallBold" style={{ color: active ? theme.onPrimary : theme.textSecondary }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export default function MoreScreen() {
  const theme = useTheme();
  const displayName = useScalar(displayNameStore);
  const isPremium = useScalar(isPremiumStore);
  const entries = useCollection(journalStore);
  const prayers = useCollection(prayerStore);
  const sermonNotes = useCollection(sermonStore);

  const streak = computeStreak(
    entries.filter((entry) => entry.type === 'checkin').map((entry) => entry.createdAt)
  );

  const [tab, setTab] = useState<Tab>('content');
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(displayName);
  useEffect(() => setNameDraft(displayName), [displayName]);

  function submitName() {
    displayNameStore.set(nameDraft.trim());
    setEditingName(false);
  }

  function inviteToCircle() {
    Share.share({
      message: "I'm using Openheart for private journaling and prayer. Thought you might like it too.",
    }).catch(() => {});
  }

  function joinChurch() {
    router.push('/church/join');
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

  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.fill} edges={['top']}>
        <ScrollView bounces={false} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.banner, { backgroundColor: theme.backgroundElement, borderBottomColor: theme.border }]}>
            <Pressable
              style={styles.gearButton}
              onPress={() => setEditingName(true)}>
              <Ionicons name="settings-outline" size={19} color={theme.text} />
            </Pressable>
          </View>

          <View style={styles.headerRow}>
            <View style={[styles.avatarRing, { backgroundColor: theme.background }]}>
              <View style={[styles.avatar, { backgroundColor: theme.accentSoft }]}>
                <Text allowFontScaling={false} style={[styles.avatarLetter, { color: theme.accent }]}>
                  {(displayName || '?').charAt(0).toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={[styles.statusPill, { backgroundColor: theme.backgroundElement }]}>
              <View style={[styles.statusDot, { backgroundColor: isPremium ? theme.success : theme.textSecondary }]} />
              <ThemedText type="small">{isPremium ? 'Premium' : 'Free plan'}</ThemedText>
            </View>
          </View>

          <View style={styles.identityBlock}>
            {editingName ? (
              <View style={styles.nameEditRow}>
                <TextInput
                  value={nameDraft}
                  onChangeText={setNameDraft}
                  placeholder="Your name"
                  placeholderTextColor={theme.textSecondary}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={submitName}
                  style={[styles.nameInput, { color: theme.text, borderColor: theme.border }]}
                />
                <Pressable onPress={submitName} hitSlop={10}>
                  <Ionicons name="checkmark-circle" size={26} color={theme.accent} />
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={() => setEditingName(true)}>
                <ThemedText type="subtitle" style={styles.nameText}>
                  {displayName || 'Tap to set your name'}
                </ThemedText>
              </Pressable>
            )}
            <ThemedText type="small" themeColor="textSecondary">
              Journaling privately since day one
            </ThemedText>
          </View>

          <View style={[styles.statsCard, HairlineBorder, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <StatCol value={String(entries.length)} label="Entries" />
            <StatCol value={String(prayers.length)} label="Prayers" />
            <StatCol value={String(streak)} label="Day streak" />
            <StatCol value={String(sermonNotes.length)} label="Sermons" />
          </View>

          <Pressable onPress={inviteToCircle} style={[styles.ctaButton, { backgroundColor: theme.primary }]}>
            <Ionicons name="gift-outline" size={18} color={theme.onPrimary} />
            <ThemedText style={[styles.ctaText, { color: theme.onPrimary }]}>Invite to your Circle</ThemedText>
          </Pressable>

          <View style={styles.tabRow}>
            <TabButton label="Content" active={tab === 'content'} onPress={() => setTab('content')} />
            <TabButton label="Personalize" active={tab === 'personalize'} onPress={() => setTab('personalize')} />
            <TabButton label="Account" active={tab === 'account'} onPress={() => setTab('account')} />
          </View>

          <View style={{ gap: Spacing.two }}>
            {tab === 'content' && (
              <>
                <Row
                  icon="chatbubble-ellipses-outline"
                  label="Sermon Notes"
                  subtitle="Capture and tidy up"
                  onPress={() => router.push('/sermon')}
                />
                <Row
                  icon="bookmark-outline"
                  label="Bible Library"
                  subtitle="Offline scripture lookup"
                  onPress={() => router.push('/bible')}
                />
                <Row
                  icon="archive-outline"
                  label="Vault"
                  subtitle="Voice notes, writings, and verses"
                  onPress={() => router.push('/vault')}
                />
                <Row
                  icon="home-outline"
                  label="How was church?"
                  subtitle="Sunday check-in"
                  onPress={() => router.push('/church/check-in')}
                />
              </>
            )}

            {tab === 'personalize' && (
              <>
                <Row
                  icon="color-palette-outline"
                  label="Appearance"
                  subtitle={isPremium ? 'Theme and accent color' : 'Light / dark free · colors are Premium'}
                  onPress={() => router.push('/settings/appearance')}
                  right={
                    !isPremium ? (
                      <View style={[styles.premiumBadge, { backgroundColor: theme.accentSoft }]}>
                        <ThemedText type="small" themeColor="accent">
                          PRO
                        </ThemedText>
                      </View>
                    ) : undefined
                  }
                />
                <Row
                  icon="sparkles-outline"
                  label="Preview premium"
                  subtitle="Demo toggle. No payment in this prototype"
                  right={
                    <Switch
                      value={isPremium}
                      onValueChange={(value) => isPremiumStore.set(value)}
                      trackColor={{ true: theme.accent }}
                    />
                  }
                />
              </>
            )}

            {tab === 'account' && (
              <>
                <Row icon="business-outline" label="Join a church" subtitle="Connect with a join code" onPress={joinChurch} />
                <Row
                  icon="shield-outline"
                  label="App lock"
                  subtitle="PIN and Face ID"
                  onPress={() => router.push('/settings/lock')}
                />
                <Row
                  icon="notifications-outline"
                  label="Notifications"
                  subtitle="Check-in, prayer, and Sunday church"
                  onPress={() => router.push('/settings/notifications')}
                />
                <Row icon="download-outline" label="Export everything" subtitle="Full export, always free" onPress={exportData} />
                <Row
                  icon="document-text-outline"
                  label="Terms of Service"
                  onPress={() => router.push('/legal/terms')}
                />
                <Row
                  icon="lock-closed-outline"
                  label="Privacy"
                  subtitle="Encrypted on this device"
                  onPress={() => router.push('/legal/privacy')}
                />
                <Row
                  icon="information-circle-outline"
                  label="About Openheart"
                  subtitle="v1.0.0"
                  onPress={() =>
                    Alert.alert('Openheart', 'A private, Christian journaling app. Your words stay on this device.')
                  }
                />
                <Row
                  icon="log-out-outline"
                  label="Sign Out"
                  subtitle="Keep your data on this device"
                  onPress={signOut}
                />
                <Row
                  icon="trash-outline"
                  label="Delete everything"
                  subtitle="Erase this device’s Openheart data"
                  onPress={deleteEverything}
                />
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scrollContent: {
    paddingBottom: Spacing.six * 2,
  },
  banner: {
    height: 130,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    alignItems: 'flex-end',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  gearButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.four,
    marginTop: -42,
  },
  avatarRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarLetter: {
    fontFamily: Fonts.medium,
    fontSize: 28,
    lineHeight: 34,
    includeFontPadding: false,
    textAlign: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    marginBottom: Spacing.one,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  identityBlock: {
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.three,
    gap: 2,
  },
  nameText: {
    fontSize: 22,
    lineHeight: 32,
  },
  nameEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  nameInput: {
    fontFamily: Fonts.regular,
    fontSize: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 4,
    minWidth: 140,
  },
  statsCard: {
    flexDirection: 'row',
    marginHorizontal: Spacing.four,
    marginTop: Spacing.four,
    borderRadius: Radius.large,
    paddingVertical: Spacing.three,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 18,
    lineHeight: 26,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: Spacing.four,
    marginTop: Spacing.three,
    paddingVertical: 16,
    borderRadius: Radius.pill,
  },
  ctaText: {
    fontFamily: Fonts.medium,
    fontSize: 16,
  },
  tabRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginHorizontal: Spacing.four,
    marginTop: Spacing.four,
    marginBottom: Spacing.three,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: Radius.pill,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    marginHorizontal: Spacing.four,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
});
