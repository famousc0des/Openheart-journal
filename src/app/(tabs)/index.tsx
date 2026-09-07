import { Ionicons } from '@expo/vector-icons';
import { router, useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
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
import { DaySourceRow, NarrativeBlock, SourceAvatars } from '@/components/today-story';
import { Fonts, Palette, Radius, Spacing, Tracking } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { computeStreak, currentPeriod, isSameDay } from '@/lib/date';
import { createId } from '@/lib/id';
import { MOOD_OPTIONS, promptForMood } from '@/lib/prompts';
import { useCollection } from '@/lib/collection-store';
import { useScalar } from '@/lib/scalar-store';
import { displayNameStore, journalStore, prayerStore, sermonStore } from '@/lib/stores';
import { verseOfTheDay } from '@/lib/bible-data';
import { buildTodayStory } from '@/lib/today-narrative';
import { CheckInPeriod, Mood } from '@/lib/types';

const INK = '#121212';
const PAPER = '#F3EEE6';
const ACCENT_DOT = '#E24B2A';
const SHEET_OVERLAP = 28;
const SHEET_RADIUS = 36;

export default function TodayScreen() {
  const theme = useTheme();
  const focused = useIsFocused();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [headerHeight, setHeaderHeight] = useState(Math.round(insets.top + 56));
  const [narrativeHeight, setNarrativeHeight] = useState(Math.round(height * 0.38));
  const entries = useCollection(journalStore);
  const prayers = useCollection(prayerStore);
  const sermonNotes = useCollection(sermonStore);
  const displayName = useScalar(displayNameStore);

  const [period, setPeriod] = useState<CheckInPeriod>(currentPeriod());
  const [mood, setMood] = useState<Mood | undefined>();
  const [body, setBody] = useState('');
  const [attachVerse, setAttachVerse] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(displayName);
  const [verseShareOpen, setVerseShareOpen] = useState(false);

  useEffect(() => setNameDraft(displayName), [displayName]);

  const today = new Date();
  const prompt = promptForMood(mood, period);
  const verse = useMemo(() => verseOfTheDay(), []);

  const todaysEntry = useMemo(
    () =>
      entries.find(
        (entry) =>
          entry.type === 'checkin' && entry.period === period && isSameDay(new Date(entry.createdAt), today)
      ),
    [entries, period]
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

  const monthLabel = today.toLocaleDateString(undefined, { month: 'short' });
  const yearShort = String(today.getFullYear()).slice(-2);
  const weekday = today.toLocaleDateString(undefined, { weekday: 'long' });
  const restOffset = Math.max(headerHeight + narrativeHeight - SHEET_OVERLAP, headerHeight);
  const sheetMinHeight = Math.max(height, 320);

  function submitName() {
    displayNameStore.set(nameDraft.trim());
    setEditingName(false);
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
      {focused ? <StatusBar style="light" /> : null}
      <View
        pointerEvents="box-none"
        style={[styles.stickyHeader, { paddingTop: insets.top + 8 }]}
        onLayout={(event) => {
          const next = Math.ceil(event.nativeEvent.layout.height);
          if (next > 0 && next !== headerHeight) setHeaderHeight(next);
        }}>
        <View style={styles.heroHeader} pointerEvents="box-none">
          <Pressable onPress={() => setEditingName(true)} hitSlop={8}>
            <Text style={styles.todayTitle}>Today</Text>
          </Pressable>
          <View style={styles.heroMeta}>
            <View style={styles.dateBlock}>
              <View style={styles.dateRow}>
                <View style={styles.dateDot} />
                <Text style={styles.dateMonth}>
                  {monthLabel} '{yearShort}
                </Text>
              </View>
              <Text style={styles.weekday}>{weekday}</Text>
            </View>
            <Pressable
              accessibilityLabel="Sermon notes"
              onPress={() => router.push(dueSermonNote ? `/sermon/${dueSermonNote.id}` : '/sermon')}
              style={styles.bell}>
              <Ionicons name="notifications-outline" size={18} color="#F6F3EE" />
              {dueSermonNote ? <View style={styles.bellDot} /> : null}
            </Pressable>
          </View>
        </View>
      </View>

      <View
        collapsable={false}
        style={[styles.narrative, { top: headerHeight }]}
        onLayout={(event) => {
          const next = Math.ceil(event.nativeEvent.layout.height);
          if (next > 0 && next !== narrativeHeight) setNarrativeHeight(next);
        }}>
        {editingName ? (
          <View style={styles.nameEdit}>
            <TextInput
              value={nameDraft}
              onChangeText={setNameDraft}
              placeholder="Your name"
              placeholderTextColor="rgba(246,243,238,0.35)"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={submitName}
              style={styles.nameInput}
            />
            <Pressable onPress={submitName} hitSlop={8}>
              <Ionicons name="checkmark-circle" size={26} color="#F6F3EE" />
            </Pressable>
          </View>
        ) : (
          <Pressable onLongPress={() => setEditingName(true)}>
            <NarrativeBlock tokens={story.tokens} />
          </Pressable>
        )}

        <View style={styles.basedRow}>
          <Text style={styles.basedLabel}>
            Based from {story.sources.length} {story.sources.length === 1 ? 'note' : 'notes'}
          </Text>
          <SourceAvatars sources={story.sources} />
          {streak > 0 ? (
            <View style={styles.streakChip}>
              <Ionicons name="flame" size={12} color={ACCENT_DOT} />
              <Text style={styles.streakText}>{streak}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <ScrollView
        style={styles.sheetScroll}
        pointerEvents="box-none"
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.sheetScrollContent}>
        <View pointerEvents="none" style={{ height: restOffset }} />
        <View
          collapsable={false}
          style={[
            styles.sheet,
            { minHeight: sheetMinHeight, paddingBottom: 120 + insets.bottom },
          ]}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>From your day:</Text>
            <View style={styles.sheetMeta}>
              <Text style={styles.sheetCount}>
                {story.sources.length} {story.sources.length === 1 ? 'note' : 'notes'}
              </Text>
              <Pressable
                onPress={() => setPeriod(period === 'morning' ? 'evening' : 'morning')}
                hitSlop={8}
                accessibilityLabel="Switch morning and evening">
                <Ionicons
                  name={period === 'morning' ? 'sunny-outline' : 'moon-outline'}
                  size={18}
                  color={INK}
                />
              </Pressable>
            </View>
          </View>

          {story.sources.map((source) => (
            <DaySourceRow key={source.id} source={source} />
          ))}

          <View style={styles.checkIn}>
            {todaysEntry ? (
              <Pressable onPress={() => router.push(`/journal/${todaysEntry.id}`)} style={styles.doneRow}>
                <Ionicons name="checkmark-circle" size={18} color={theme.accent} />
                <Text style={styles.doneText}>
                  {period === 'morning' ? 'Morning check-in is in' : 'Evening check-in is in'}
                </Text>
                <Ionicons name="pencil" size={15} color={INK} />
              </Pressable>
            ) : (
              <>
                <Text style={styles.checkInLabel}>How are you feeling?</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.moodRow}>
                  {MOOD_OPTIONS.map((option) => {
                    const active = mood === option.value;
                    return (
                      <Pressable key={option.value} onPress={() => setMood(option.value)} style={styles.moodItem}>
                        <View
                          style={[
                            styles.moodCircle,
                            {
                              backgroundColor: option.color,
                              borderColor: active ? INK : 'transparent',
                            },
                          ]}>
                          <Ionicons name={option.icon} size={22} color={INK} />
                        </View>
                        <Text style={styles.moodLabel}>{option.label}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <Text style={styles.prompt}>{prompt}</Text>
                <TextInput
                  value={body}
                  onChangeText={setBody}
                  placeholder="Write as much or as little as you need..."
                  placeholderTextColor="rgba(22,21,19,0.35)"
                  multiline
                  style={styles.input}
                />

                <View style={styles.toggleRow}>
                  <Ionicons name="bookmark-outline" size={18} color="rgba(22,21,19,0.45)" />
                  <Text style={styles.toggleLabel}>Attach today's verse</Text>
                  <Switch value={attachVerse} onValueChange={setAttachVerse} trackColor={{ true: theme.accent }} />
                </View>

                <Pressable
                  onPress={saveCheckIn}
                  disabled={!body.trim()}
                  style={[styles.cta, { opacity: body.trim() ? 1 : 0.45 }]}>
                  <Text style={styles.ctaText}>Save check-in</Text>
                </Pressable>
              </>
            )}

            <Pressable onPress={shareVerse} style={styles.shareVerse}>
              <Text style={styles.shareVerseText}>Share {verse.ref}</Text>
              <Ionicons name="share-outline" size={16} color={INK} />
            </Pressable>
          </View>
        </View>
      </ScrollView>

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

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: INK,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    paddingHorizontal: 22,
    paddingBottom: 14,
  },
  narrative: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 0,
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 36,
    gap: 28,
  },
  sheetScroll: {
    ...StyleSheet.absoluteFill,
    zIndex: 2,
    backgroundColor: 'transparent',
  },
  sheetScrollContent: {
    flexGrow: 0,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  todayTitle: {
    color: '#F6F3EE',
    fontFamily: Fonts.bold,
    fontSize: 34,
    lineHeight: 46,
    letterSpacing: Tracking.heading,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  dateBlock: {
    alignItems: 'flex-end',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: ACCENT_DOT,
  },
  dateMonth: {
    color: '#F6F3EE',
    fontFamily: Fonts.medium,
    fontSize: 15,
    letterSpacing: Tracking.body,
  },
  weekday: {
    color: 'rgba(246,243,238,0.42)',
    fontFamily: Fonts.regular,
    fontSize: 13,
    marginTop: 2,
  },
  bell: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 6,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Palette.signalBlue,
  },
  nameEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  nameInput: {
    flex: 1,
    color: '#F6F3EE',
    fontFamily: Fonts.regular,
    fontSize: 28,
    letterSpacing: Tracking.heading,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(246,243,238,0.28)',
    paddingVertical: 4,
  },
  basedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  basedLabel: {
    color: 'rgba(246,243,238,0.4)',
    fontFamily: Fonts.regular,
    fontSize: 13,
  },
  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 4,
  },
  streakText: {
    color: 'rgba(246,243,238,0.55)',
    fontFamily: Fonts.medium,
    fontSize: 12,
  },
  sheet: {
    backgroundColor: PAPER,
    elevation: 12,
    shadowColor: '#121212',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    borderTopLeftRadius: SHEET_RADIUS,
    borderTopRightRadius: SHEET_RADIUS,
    paddingHorizontal: 22,
    paddingTop: 22,
    gap: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sheetTitle: {
    color: INK,
    fontFamily: Fonts.bold,
    fontSize: 16,
    letterSpacing: Tracking.body,
  },
  sheetMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sheetCount: {
    color: 'rgba(22,21,19,0.45)',
    fontFamily: Fonts.medium,
    fontSize: 13,
  },
  checkIn: {
    marginTop: 18,
    paddingTop: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(22,21,19,0.1)',
    gap: 12,
  },
  checkInLabel: {
    color: INK,
    fontFamily: Fonts.medium,
    fontSize: 14,
  },
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  doneText: {
    flex: 1,
    color: INK,
    fontFamily: Fonts.medium,
    fontSize: 14,
  },
  moodRow: {
    gap: 14,
    paddingRight: 12,
  },
  moodItem: {
    alignItems: 'center',
    gap: 6,
    width: 62,
  },
  moodCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodLabel: {
    color: 'rgba(22,21,19,0.55)',
    fontFamily: Fonts.regular,
    fontSize: 11,
  },
  prompt: {
    color: INK,
    fontFamily: Fonts.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    minHeight: 92,
    borderRadius: Radius.medium,
    padding: Spacing.three,
    backgroundColor: '#EBE4D8',
    color: INK,
    fontFamily: Fonts.regular,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleLabel: {
    flex: 1,
    color: INK,
    fontFamily: Fonts.regular,
    fontSize: 14,
  },
  cta: {
    backgroundColor: INK,
    paddingVertical: 16,
    borderRadius: Radius.pill,
    alignItems: 'center',
  },
  ctaText: {
    color: '#F6F3EE',
    fontFamily: Fonts.medium,
    fontSize: 16,
    letterSpacing: Tracking.body,
  },
  shareVerse: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shareVerseText: {
    color: 'rgba(22,21,19,0.55)',
    fontFamily: Fonts.medium,
    fontSize: 13,
  },
});
