import { NamedIcon } from '@/components/ui/icon';
import { router, useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  AppState,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CircleShareSheet } from '@/components/circle-share-sheet';
import { DailyVerseCard } from '@/components/daily-verse-card';
import { MoodFaceButton } from '@/components/mood-face';
import { DaySourceRow, SourceAvatars } from '@/components/today-story';
import { Fonts, Radius, Spacing, Tracking } from '@/constants/theme';
import { useTheme, useThemeScheme } from '@/hooks/use-theme';
import { verseOfTheDay } from '@/lib/bible-data';
import { hexToRgba } from '@/lib/color';
import { useCollection } from '@/lib/collection-store';
import { computeStreak, currentPeriod, isSameDay, timeGreeting } from '@/lib/date';
import { createId } from '@/lib/id';
import { MOOD_OPTIONS, promptForMood } from '@/lib/prompts';
import { useScalar } from '@/lib/scalar-store';
import { displayNameStore, journalStore, prayerStore, sermonStore } from '@/lib/stores';
import { buildTodayStory } from '@/lib/today-narrative';
import { EmojiText } from '@/lib/with-emoji-fallback';
import { CheckInPeriod, Mood } from '@/lib/types';

const CARD_RADIUS = 28;

const DAILY_MOOD_ROWS: Mood[][] = [
  ['sorrowful', 'weary', 'peaceful', 'joyful'],
  ['grateful', 'anxious', 'hopeful', 'restless'],
];

function moodByValue(value: Mood) {
  return MOOD_OPTIONS.find((option) => option.value === value)!;
}

export default function TodayScreen() {
  const theme = useTheme();
  const scheme = useThemeScheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const focused = useIsFocused();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const moodSize = Math.max(44, Math.min(56, Math.floor((screenWidth - 48) / 4) - 16));
  const scrollRef = useRef<ScrollView>(null);
  const bodyY = useRef(0);
  const checkInOffset = useRef(0);

  const entries = useCollection(journalStore);
  const prayers = useCollection(prayerStore);
  const sermonNotes = useCollection(sermonStore);
  const displayName = useScalar(displayNameStore);

  const [period, setPeriod] = useState<CheckInPeriod>(currentPeriod());
  const [mood, setMood] = useState<Mood | undefined>();
  const [body, setBody] = useState('');
  const [attachVerse, setAttachVerse] = useState(false);
  const [today, setToday] = useState(() => new Date());
  const [verseShareOpen, setVerseShareOpen] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (!focused) return;
    const refreshTime = () => setToday(new Date());
    refreshTime();
    const timer = setInterval(refreshTime, 60_000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshTime();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [focused]);

  useEffect(() => {
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    return () => sub.remove();
  }, []);

  const isDaytime = today.getHours() >= 6 && today.getHours() < 18;
  const todayKey = today.toDateString();
  const prompt = promptForMood(mood, period);
  const verse = verseOfTheDay();

  const todaysEntry = useMemo(
    () =>
      entries.find(
        (entry) =>
          entry.type === 'checkin' && entry.period === period && isSameDay(new Date(entry.createdAt), today)
      ),
    [entries, period, todayKey]
  );

  const streak = useMemo(
    () => computeStreak(entries.filter((entry) => entry.type === 'checkin').map((entry) => entry.createdAt)),
    [entries]
  );

  const stillPraying = useMemo(
    () => prayers.filter((prayer) => prayer.state === 'praying'),
    [prayers]
  );

  const sortedSermons = useMemo(
    () => [...sermonNotes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [sermonNotes]
  );
  const dueSermonNote = useMemo(
    () => sortedSermons.find((note) => note.resurfaceAt && !note.resurfacedAt && new Date(note.resurfaceAt) <= today),
    [sortedSermons]
  );
  const featuredSermon = dueSermonNote ?? sortedSermons[0];

  const story = useMemo(
    () =>
      buildTodayStory({
        displayName,
        period,
        checkIn: todaysEntry,
        praying: stillPraying,
        sermon: featuredSermon,
        verse,
      }),
    [displayName, featuredSermon, period, stillPraying, todaysEntry, verse]
  );

  const weekday = today.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  const shownMood = todaysEntry?.mood ?? mood;

  function scrollToCheckIn() {
    scrollRef.current?.scrollTo({ y: Math.max(checkInOffset.current - 16, 0), animated: true });
  }

  function onMoodPress(value: Mood) {
    if (todaysEntry) {
      router.push(`/journal/${todaysEntry.id}`);
      return;
    }
    setMood(value);
    scrollToCheckIn();
  }

  function saveCheckIn() {
    if (!body.trim()) return;
    const now = new Date().toISOString();
    journalStore.add({
      id: createId(),
      createdAt: now,
      updatedAt: now,
      type: 'checkin',
      period,
      mood,
      prompt,
      body: body.trim(),
      scriptureRefs: attachVerse ? [verse.ref] : undefined,
    });
    setBody('');
    setMood(undefined);
    setAttachVerse(false);
  }

  function shareVerse() {
    Alert.alert('Share this verse', undefined, [
      { text: 'Share with a circle', onPress: () => setVerseShareOpen(true) },
      {
        text: 'Share outside the app',
        onPress: () => {
          Share.share({ message: `“${verse.text}”\n${verse.ref}` }).catch(() => {});
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  return (
    <View style={styles.fill}>
      {focused ? <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} /> : null}
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}>
        <ScrollView
          ref={scrollRef}
          style={styles.fill}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Spacing.six + insets.bottom }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
            <View style={styles.topRow}>
              <EmojiText accessibilityRole="header" style={styles.pageTitle}>
                Today {isDaytime ? '☀️' : '🌙'}
              </EmojiText>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={dueSermonNote ? 'Open resurfacing sermon note' : 'Sermon notes'}
                onPress={() => router.push(dueSermonNote ? `/sermon/${dueSermonNote.id}` : '/sermon')}
                style={({ pressed }) => [
                  styles.bell,
                  { borderColor: hexToRgba(theme.accent, 0.2) },
                  pressed && styles.pressed,
                ]}>
                <NamedIcon name="notifications-outline" size={18} color={hexToRgba(theme.accent, 0.78)} />
                {dueSermonNote ? <View style={[styles.bellDot, { backgroundColor: theme.accent }]} /> : null}
              </Pressable>
            </View>

            <View style={styles.greeting}>
              <Text style={styles.greetingLead}>Good {timeGreeting(today).toLowerCase()},</Text>
              <Text style={styles.greetingTitle}>How’s your heart today?</Text>
            </View>

            <DailyVerseCard verse={verse} onShare={shareVerse} />
          </View>

          <View
            style={styles.body}
            onLayout={(event) => {
              bodyY.current = event.nativeEvent.layout.y;
            }}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Daily mood</Text>
              <Pressable
                onPress={() => setPeriod(period === 'morning' ? 'evening' : 'morning')}
                hitSlop={8}
                accessibilityLabel="Switch morning and evening"
                style={styles.periodToggle}>
                <NamedIcon
                  name={period === 'morning' ? 'sunny-outline' : 'moon-outline'}
                  size={18}
                  color={theme.text}
                />
              </Pressable>
            </View>

            <View style={styles.moodGrid}>
              {DAILY_MOOD_ROWS.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.moodRow}>
                  {row.map((value) => {
                    const option = moodByValue(value);
                    return (
                      <MoodFaceButton
                        key={value}
                        mood={value}
                        label={option.label}
                        size={moodSize}
                        selected={shownMood === value}
                        quiet={Boolean(shownMood) && shownMood !== value}
                        fill
                        reduceMotion={reduceMotion}
                        onPress={() => onMoodPress(value)}
                      />
                    );
                  })}
                </View>
              ))}
            </View>

            <View
              onLayout={(event) => {
                checkInOffset.current = bodyY.current + event.nativeEvent.layout.y;
              }}
              style={styles.softCard}>
              {todaysEntry ? (
                <Pressable
                  onPress={() => router.push(`/journal/${todaysEntry.id}`)}
                  style={({ pressed }) => [styles.doneRow, pressed && styles.pressed]}>
                  <NamedIcon name="checkmark-circle" size={20} color={theme.accent} />
                  <Text style={styles.doneText}>
                    {period === 'morning' ? 'Morning check-in is in' : 'Evening check-in is in'}
                  </Text>
                  <NamedIcon name="pencil" size={16} color={theme.text} />
                </Pressable>
              ) : (
                <>
                  <Text style={styles.checkInLabel}>{mood ? prompt : 'How is your heart?'}</Text>
                  {mood ? (
                    <>
                      <TextInput
                        value={body}
                        onChangeText={setBody}
                        placeholder="Write as much or as little as you need..."
                        placeholderTextColor={theme.textSecondary}
                        multiline
                        style={[
                          styles.input,
                          {
                            backgroundColor: theme.backgroundSelected,
                            borderColor: theme.border,
                          },
                        ]}
                      />
                      <View style={styles.toggleRow}>
                        <NamedIcon name="bookmark-outline" size={18} color={theme.textSecondary} />
                        <Text style={styles.toggleLabel}>Attach today's verse</Text>
                        <Switch value={attachVerse} onValueChange={setAttachVerse} trackColor={{ true: theme.accent }} />
                      </View>
                      <Pressable
                        onPress={saveCheckIn}
                        disabled={!body.trim()}
                        accessibilityRole="button"
                        style={({ pressed }) => [
                          styles.cta,
                          { opacity: body.trim() ? (pressed ? 0.86 : 1) : 0.4 },
                        ]}>
                        <Text style={styles.ctaText}>Save check-in</Text>
                      </Pressable>
                    </>
                  ) : null}
                </>
              )}

            </View>

            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>From your day</Text>
              <Text style={styles.sheetCount}>
                {story.sources.length} {story.sources.length === 1 ? 'note' : 'notes'}
              </Text>
            </View>
            <View style={styles.dayMeta}>
              <Text style={styles.basedLabel}>{weekday}</Text>
              <SourceAvatars sources={story.sources} ringColor={theme.background} />
              {streak > 0 ? (
                <View style={styles.streakChip}>
                  <NamedIcon name="flame" size={12} color="#E24B2A" />
                  <Text style={styles.streakText}>{streak}</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.softCard}>
              {story.sources.length === 0 ? (
                <Text style={styles.emptyDay}>Your notes from today will appear here.</Text>
              ) : (
                story.sources.map((source) => <DaySourceRow key={source.id} source={source} />)
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CircleShareSheet
        visible={verseShareOpen}
        draft={{
          kind: 'verse',
          sourceId: verse.ref,
          title: verse.ref,
          body: `“${verse.text}”`,
        }}
        onClose={() => setVerseShareOpen(false)}
      />
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 8,
    overflow: 'hidden',
    gap: 20,
  },
  greeting: {
    gap: 4,
  },
  greetingLead: {
    color: theme.textSecondary,
    fontFamily: Fonts.medium,
    fontSize: 18,
    lineHeight: 26,
  },
  greetingTitle: {
    color: theme.text,
    fontFamily: Fonts.bold,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: Tracking.heading,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageTitle: {
    flexShrink: 1,
    color: theme.text,
    fontFamily: Fonts.bold,
    fontSize: 34,
    lineHeight: 46,
    letterSpacing: Tracking.heading,
  },
  bell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.backgroundElement,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#121212',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  bellDot: {
    position: 'absolute',
    top: 11,
    right: 12,
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  body: {
    paddingHorizontal: 24,
    paddingTop: 0,
    gap: 12,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    minHeight: 28,
  },
  sectionTitle: {
    color: theme.text,
    fontFamily: Fonts.bold,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: Tracking.subheading,
    includeFontPadding: false,
  },
  periodToggle: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodGrid: {
    gap: 8,
    paddingVertical: 4,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 4,
  },
  softCard: {
    backgroundColor: theme.backgroundElement,
    borderRadius: CARD_RADIUS,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  checkInLabel: {
    color: theme.text,
    fontFamily: Fonts.medium,
    fontSize: 15,
    lineHeight: 22,
  },
  doneRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  doneText: {
    flex: 1,
    color: theme.text,
    fontFamily: Fonts.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    minHeight: 96,
    borderRadius: Radius.large,
    padding: Spacing.three,
    borderWidth: 1,
    color: theme.text,
    fontFamily: Fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    textAlignVertical: 'top',
    includeFontPadding: false,
  },
  toggleRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleLabel: {
    flex: 1,
    color: theme.text,
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  cta: {
    backgroundColor: theme.text,
    minHeight: 52,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: theme.background,
    fontFamily: Fonts.medium,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: Tracking.body,
  },
  dayMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 24,
    marginTop: -4,
  },
  basedLabel: {
    color: theme.textSecondary,
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  streakText: {
    color: theme.textSecondary,
    fontFamily: Fonts.medium,
    fontSize: 12,
    lineHeight: 16,
  },
  sheetCount: {
    color: theme.textSecondary,
    fontFamily: Fonts.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  emptyDay: {
    color: theme.textSecondary,
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    paddingVertical: 8,
  },
  pressed: {
    opacity: 0.72,
  },
});
