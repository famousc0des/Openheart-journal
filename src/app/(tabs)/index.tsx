import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Switch, TextInput, View } from 'react-native';
import Animated, { useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PressableCard } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { Radius, SoftShadow, Spacing } from '@/constants/theme';
import { PRAYER_STATE_META } from '@/constants/status-colors';
import { useTheme } from '@/hooks/use-theme';
import { computeStreak, currentPeriod, formatDate, isSameDay } from '@/lib/date';
import { createId } from '@/lib/id';
import { moodOption, MOOD_OPTIONS, promptForPeriod } from '@/lib/prompts';
import { useCollection } from '@/lib/collection-store';
import { useScalar } from '@/lib/scalar-store';
import { displayNameStore, journalStore, prayerStore, sermonStore } from '@/lib/stores';
import { verseOfTheDay } from '@/lib/bible-data';
import { CheckInPeriod, Mood } from '@/lib/types';

const MORNING_GRADIENT = ['#D98A4E', '#A83E3E'] as const;
const EVENING_GRADIENT = ['#5B3A5C', '#2B1E3A'] as const;
const HERO_HEIGHT = 300;
const HERO_PEEK_OVERLAP = 28;
const BELL_ICON = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path fill="#FFFFFF" d="M23.259,16.2l-2.6-9.371A9.321,9.321,0,0,0,2.576,7.3L.565,16.35A3,3,0,0,0,3.493,20H7.1a5,5,0,0,0,9.8,0h3.47a3,3,0,0,0,2.89-3.8ZM12,22a3,3,0,0,1-2.816-2h5.632A3,3,0,0,1,12,22Zm9.165-4.395a.993.993,0,0,1-.8.395H3.493a1,1,0,0,1-.976-1.217l2.011-9.05a7.321,7.321,0,0,1,14.2-.372l2.6,9.371A.993.993,0,0,1,21.165,17.605Z" />
  </svg>
`;

export default function TodayScreen() {
  const theme = useTheme();
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

  useEffect(() => setNameDraft(displayName), [displayName]);

  const greetingOpacity = useSharedValue(1);
  const verseOpacity = useSharedValue(0);

  useEffect(() => {
    greetingOpacity.value = withDelay(2200, withTiming(0, { duration: 700 }));
    verseOpacity.value = withDelay(2200, withTiming(1, { duration: 700 }));
  }, [greetingOpacity, verseOpacity]);

  const today = new Date();
  const prompt = promptForPeriod(period);
  const verse = useMemo(() => verseOfTheDay(), []);
  const heroGradient = period === 'morning' ? MORNING_GRADIENT : EVENING_GRADIENT;

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

  const stillPraying = prayers.filter((prayer) => prayer.state === 'praying').length;
  const answered = prayers.filter((prayer) => prayer.state === 'answered').length;

  const sortedSermons = useMemo(
    () => [...sermonNotes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [sermonNotes]
  );
  const dueSermonNote = useMemo(
    () => sortedSermons.find((note) => note.resurfaceAt && !note.resurfacedAt && new Date(note.resurfaceAt) <= today),
    [sortedSermons]
  );

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

  function reflectOnVerse() {
    const now = new Date().toISOString();
    const id = createId();
    journalStore.add({
      id,
      createdAt: now,
      updatedAt: now,
      type: 'freeform',
      title: verse.ref,
      body: `“${verse.text}”\n\n`,
      scriptureRefs: [verse.ref],
    });
    router.push(`/journal/${id}`);
  }

  function shareVerse() {
    Share.share({ message: `“${verse.text}”\n— ${verse.ref}` }).catch(() => {});
  }

  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.fill} edges={['top']}>
        <View style={styles.fill}>
          <LinearGradient
            colors={heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroFixed}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroIconsRow}>
                {streak > 0 && (
                  <View style={styles.heroIconBadge}>
                    <Ionicons name="flame" size={15} color="#fff" />
                    <ThemedText type="smallBold" style={styles.heroIconBadgeText}>
                      {streak}
                    </ThemedText>
                  </View>
                )}
                <Pressable
                  style={styles.heroBellCircle}
                  onPress={() => router.push(dueSermonNote ? `/sermon/${dueSermonNote.id}` : '/sermon')}>
                  <SvgXml xml={BELL_ICON} width={19} height={19} />
                  {dueSermonNote && <View style={styles.heroDot} />}
                </Pressable>
              </View>
            </View>

            <Ionicons
              name={period === 'morning' ? 'sunny' : 'moon'}
              size={168}
              color="rgba(255,255,255,0.14)"
              style={styles.heroIllustration}
            />

            {editingName ? (
              <View style={styles.nameEditRow}>
                <TextInput
                  value={nameDraft}
                  onChangeText={setNameDraft}
                  placeholder="Your name"
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={submitName}
                  style={styles.nameInput}
                />
                <Pressable onPress={submitName} hitSlop={8}>
                  <Ionicons name="checkmark-circle" size={26} color="#fff" />
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={() => setEditingName(true)} style={styles.heroTitleWrap}>
                <Animated.Text style={[styles.heroTitle, styles.heroTitleAbsolute, { opacity: greetingOpacity }]}>
                  {period === 'morning' ? 'Good morning' : 'Good evening'}
                  {displayName ? `, ${displayName}` : ''}
                </Animated.Text>
                <Animated.View style={[styles.heroTitleAbsolute, { opacity: verseOpacity }]}>
                  <ThemedText style={styles.heroVerseRef}>{verse.ref}</ThemedText>
                  <ThemedText style={styles.heroVerseText} numberOfLines={2}>
                    “{verse.text}”
                  </ThemedText>
                </Animated.View>
              </Pressable>
            )}
          </LinearGradient>

          <ScrollView
            style={styles.fill}
            bounces={false}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            <View style={{ height: HERO_HEIGHT - HERO_PEEK_OVERLAP }} />

            <View style={[styles.sheet, SoftShadow, { backgroundColor: theme.background }]}>
            <View style={styles.row}>
              <Pill label="Morning" size="lg" active={period === 'morning'} onPress={() => setPeriod('morning')} />
              <Pill label="Evening" size="lg" active={period === 'evening'} onPress={() => setPeriod('evening')} />
            </View>

            {todaysEntry ? (
              <View style={styles.doneWrap}>
                <View style={styles.doneHeaderRow}>
                  <Ionicons
                    name={moodOption(todaysEntry.mood)?.icon ?? 'checkmark-circle'}
                    size={18}
                    color={theme.accent}
                  />
                  <ThemedText type="smallBold" themeColor="accent">
                    {period === 'morning' ? 'Morning check-in done' : 'Evening check-in done'}
                  </ThemedText>
                </View>
                <ThemedText numberOfLines={4}>{todaysEntry.body}</ThemedText>
                <Pressable onPress={() => router.push(`/journal/${todaysEntry.id}`)}>
                  <ThemedText type="link" themeColor="accent">
                    Edit entry →
                  </ThemedText>
                </Pressable>
              </View>
            ) : (
              <>
                <ThemedText type="smallBold" style={styles.sheetLabel}>
                  How are you feeling?
                </ThemedText>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.moodScrollRow}>
                  {MOOD_OPTIONS.map((option) => {
                    const active = mood === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => setMood(option.value)}
                        style={styles.moodCircleWrap}>
                        <View
                          style={[
                            styles.moodCircle,
                            {
                              backgroundColor: theme.backgroundElement,
                              borderColor: active ? theme.accent : 'transparent',
                            },
                          ]}>
                          <Ionicons name={option.icon} size={26} color={active ? theme.accent : theme.textSecondary} />
                        </View>
                        <ThemedText type="small" numberOfLines={1}>
                          {option.label}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <ThemedText type="smallBold" style={styles.promptText}>
                  {prompt}
                </ThemedText>
                <TextInput
                  value={body}
                  onChangeText={setBody}
                  placeholder="Write as much or as little as you need..."
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                />

                <View style={[styles.toggleRow, { borderTopColor: theme.border }]}>
                  <Ionicons name="bookmark-outline" size={19} color={theme.textSecondary} />
                  <ThemedText style={styles.toggleLabel}>Attach today's verse</ThemedText>
                  <Switch value={attachVerse} onValueChange={setAttachVerse} trackColor={{ true: theme.accent }} />
                </View>

                <Pressable
                  onPress={saveCheckIn}
                  disabled={!body.trim()}
                  style={[styles.ctaButton, { backgroundColor: theme.accent, opacity: body.trim() ? 1 : 0.5 }]}>
                  <ThemedText style={styles.ctaText}>Save check-in</ThemedText>
                </Pressable>
              </>
            )}
          </View>

          <View style={styles.belowSheet}>
            <PressableCard style={styles.verseCard} onPress={reflectOnVerse}>
              <View style={styles.verseTopRow}>
                <ThemedText type="small" themeColor="textSecondary" style={styles.verseLabel}>
                  VERSE OF THE DAY
                </ThemedText>
                <Pressable onPress={shareVerse} hitSlop={8}>
                  <Ionicons name="share-outline" size={17} color={theme.textSecondary} />
                </Pressable>
              </View>
              <ThemedText type="smallBold" themeColor="accent">
                {verse.ref}
              </ThemedText>
              <ThemedText numberOfLines={2} style={styles.verseText}>
                “{verse.text}”
              </ThemedText>
            </PressableCard>

            {dueSermonNote ? (
              <GuidedCard
                icon="notifications"
                iconColor={theme.accent}
                title="Your sermon note is waiting"
                subtitle={dueSermonNote.title}
                onPress={() => router.push(`/sermon/${dueSermonNote.id}`)}
              />
            ) : sortedSermons.length > 0 ? (
              <GuidedCard
                icon="chatbubble-ellipses"
                iconColor={theme.accent}
                title="Revisit your last note"
                subtitle={`${sortedSermons[0].title} · ${formatDate(sortedSermons[0].createdAt)}`}
                onPress={() => router.push(`/sermon/${sortedSermons[0].id}`)}
              />
            ) : (
              <GuidedCard
                icon="add-circle"
                iconColor={theme.textSecondary}
                title="Capture this week's sermon"
                subtitle="Fragments are fine — tidy it up later"
                onPress={() => router.push('/sermon/new')}
              />
            )}

            <GuidedCard
              icon="heart"
              iconColor={PRAYER_STATE_META.praying.color}
              title="Prayer log"
              subtitle={`${stillPraying} still praying${answered ? ` · ${answered} answered` : ''}`}
              onPress={() => router.push('/(tabs)/prayer')}
            />
          </View>
        </ScrollView>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

function GuidedCard({
  icon,
  iconColor,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <PressableCard style={styles.guidedCard} onPress={onPress}>
      <View style={[styles.guidedIcon, { backgroundColor: iconColor }]}>
        <Ionicons name={icon} size={20} color="#fff" />
      </View>
      <View style={styles.guidedTextWrap}>
        <ThemedText type="smallBold">{title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {subtitle}
        </ThemedText>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
    </PressableCard>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scrollContent: {
    paddingBottom: Spacing.six * 2,
  },
  heroFixed: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HERO_HEIGHT,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    overflow: 'hidden',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
  },
  heroTitleWrap: {
    minHeight: 96,
    marginTop: Spacing.four,
    justifyContent: 'flex-start',
  },
  heroTitleAbsolute: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 32,
    lineHeight: 39,
    fontWeight: '700',
  },
  heroVerseRef: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  heroVerseText: {
    color: '#ffffff',
    fontSize: 24,
    lineHeight: 31,
    fontStyle: 'italic',
    fontWeight: '700',
  },
  heroIconsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  heroIconBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  heroIconBadgeText: {
    color: '#fff',
  },
  heroBellCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  heroDot: {
    position: 'absolute',
    top: 4,
    right: 5,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  heroIllustration: {
    position: 'absolute',
    right: -20,
    bottom: 60,
  },
  nameEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  nameInput: {
    flex: 1,
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.5)',
    paddingVertical: 4,
  },
  sheet: {
    borderTopLeftRadius: Radius.large + 6,
    borderTopRightRadius: Radius.large + 6,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  doneWrap: {
    gap: Spacing.two,
  },
  doneHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetLabel: {
    marginTop: Spacing.one,
  },
  moodScrollRow: {
    gap: Spacing.three,
    paddingVertical: Spacing.one,
    paddingRight: Spacing.three,
  },
  moodCircleWrap: {
    alignItems: 'center',
    gap: 6,
    width: 68,
  },
  moodCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptText: {
    marginTop: Spacing.one,
  },
  input: {
    minHeight: 100,
    borderRadius: Radius.medium,
    padding: Spacing.three,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  toggleLabel: {
    flex: 1,
  },
  ctaButton: {
    paddingVertical: 18,
    borderRadius: Radius.pill,
    alignItems: 'center',
  },
  ctaText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  belowSheet: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.two,
  },
  verseCard: {
    gap: 4,
  },
  verseTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  verseLabel: {
    letterSpacing: 1,
  },
  verseText: {
    fontStyle: 'italic',
    lineHeight: 21,
  },
  guidedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  guidedIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guidedTextWrap: {
    flex: 1,
    gap: 2,
  },
});
