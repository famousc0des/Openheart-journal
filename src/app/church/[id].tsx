import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { Screen } from '@/components/ui/screen';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  currentUserName,
  ensureDummyChurchMembers,
  formatWeekOf,
  generateJoinCode,
  nextWednesday,
  QUESTION_MAX_LENGTH,
} from '@/lib/church';
import { useCollection, useCollectionReady } from '@/lib/collection-store';
import { formatDate } from '@/lib/date';
import { createId } from '@/lib/id';
import { churchStore, sentChurchNoteStore, weeklyPostStore, weeklyReplyStore } from '@/lib/stores';
import { WeeklyPost, WeeklyReply } from '@/lib/types';

type OwnerTab = 'thisWeek' | 'sundays' | 'manage';

export default function ChurchScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const churches = useCollection(churchStore);
  const posts = useCollection(weeklyPostStore);
  const sentNotes = useCollection(sentChurchNoteStore);
  const replies = useCollection(weeklyReplyStore);
  const ready = useCollectionReady(churchStore);
  const church = churches.find((item) => item.id === id);

  const [tab, setTab] = useState<OwnerTab>('thisWeek');

  useEffect(() => {
    if (church) ensureDummyChurchMembers(church.id);
  }, [church]);

  const churchPosts = useMemo(
    () =>
      posts
        .filter((post) => post.churchId === id)
        .sort((a, b) => b.scheduledFor.localeCompare(a.scheduledFor)),
    [posts, id]
  );
  const upcoming = churchPosts.find((post) => new Date(post.scheduledFor).getTime() > Date.now());
  const latestDelivered = churchPosts.find(
    (post) => new Date(post.scheduledFor).getTime() <= Date.now()
  );
  const churchNotes = useMemo(
    () => sentNotes.filter((note) => note.churchId === id),
    [sentNotes, id]
  );

  if (!ready) {
    return <Screen />;
  }

  if (!church) {
    return (
      <Screen>
        <ThemedText themeColor="textSecondary">This church could not be found.</ThemedText>
      </Screen>
    );
  }

  function leaveChurch() {
    if (!church) return;
    Alert.alert('Leave church', `Leave ${church.name}? You can rejoin anytime with the code.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: () => {
          churchStore.remove(church.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <Screen>
      <View style={styles.heading}>
        <ThemedText type="title" style={styles.title}>
          {church.name}
        </ThemedText>
        {/* Ownership is always visible, no member should wonder who reads what they send. */}
        <View style={styles.ownerRow}>
          <Ionicons name="person-circle-outline" size={16} color={theme.textSecondary} />
          <ThemedText type="small" themeColor="textSecondary">
            Owned by {church.ownerNames.join(' & ')}
            {church.ownedByMe ? ' (you)' : ''}
          </ThemedText>
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          {church.memberCount} {church.memberCount === 1 ? 'person' : 'people'}
        </ThemedText>
      </View>

      {church.ownedByMe ? (
        <>
          <View style={styles.tabRow}>
            <Pill label="This week" active={tab === 'thisWeek'} onPress={() => setTab('thisWeek')} />
            <Pill label="Sundays" active={tab === 'sundays'} onPress={() => setTab('sundays')} />
            <Pill label="Manage" active={tab === 'manage'} onPress={() => setTab('manage')} />
          </View>
          {tab === 'thisWeek' && <ThisWeekComposer churchId={church.id} upcoming={upcoming} />}
          {tab === 'sundays' && (
            <SundaysBrowser
              posts={churchPosts}
              notes={churchNotes}
              replies={replies.filter((reply) => reply.churchId === id)}
              memberCount={church.memberCount}
            />
          )}
          {tab === 'manage' && <ManagePanel churchId={church.id} />}
        </>
      ) : (
        <MemberView
          churchId={church.id}
          latestPost={upcoming ?? latestDelivered}
          onLeave={leaveChurch}
        />
      )}
    </Screen>
  );
}

function ThisWeekComposer({ churchId, upcoming }: { churchId: string; upcoming?: WeeklyPost }) {
  const theme = useTheme();
  const [scripture, setScripture] = useState(upcoming?.scripture ?? '');
  const [pointsText, setPointsText] = useState(upcoming?.points.join('\n') ?? '');
  const [question, setQuestion] = useState(upcoming?.question ?? '');

  const wednesday = upcoming ? new Date(upcoming.scheduledFor) : nextWednesday();
  const remaining = QUESTION_MAX_LENGTH - question.length;
  const canSchedule =
    scripture.trim().length > 0 && pointsText.trim().length > 0 && question.trim().length > 0;

  function schedule() {
    if (!canSchedule) return;
    const points = pointsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    if (upcoming) {
      weeklyPostStore.update(upcoming.id, {
        scripture: scripture.trim(),
        points,
        question: question.trim(),
      });
    } else {
      weeklyPostStore.add({
        id: createId(),
        churchId,
        createdAt: new Date().toISOString(),
        scripture: scripture.trim(),
        points,
        question: question.trim(),
        status: 'scheduled',
        scheduledFor: nextWednesday().toISOString(),
      });
    }
  }

  return (
    <View style={styles.stack}>
      <ThemedText type="small" themeColor="textSecondary">
        Three fields, sent to everyone on Wednesday {formatWeekOf(wednesday.toISOString())} morning.
        Points group members' replies later, one per line.
      </ThemedText>

      <TextInput
        value={scripture}
        onChangeText={setScripture}
        placeholder="Scripture, e.g. Romans 8:28"
        placeholderTextColor={theme.textSecondary}
        style={[styles.fieldInput, { color: theme.text, backgroundColor: theme.backgroundElement }]}
      />
      <TextInput
        value={pointsText}
        onChangeText={setPointsText}
        placeholder={'Points, one per line\ne.g. God works in all things\nCalled according to purpose'}
        placeholderTextColor={theme.textSecondary}
        multiline
        style={[
          styles.fieldInput,
          styles.multilineInput,
          { color: theme.text, backgroundColor: theme.backgroundElement },
        ]}
      />
      <View style={styles.stackTight}>
        <TextInput
          value={question}
          onChangeText={(text) => setQuestion(text.slice(0, QUESTION_MAX_LENGTH))}
          placeholder="One question for the week"
          placeholderTextColor={theme.textSecondary}
          multiline
          style={[
            styles.fieldInput,
            styles.questionInput,
            { color: theme.text, backgroundColor: theme.backgroundElement },
          ]}
        />
        <ThemedText
          type="small"
          themeColor={remaining < 20 ? 'danger' : 'textSecondary'}
          style={styles.counter}>
          {remaining} characters left
        </ThemedText>
      </View>

      <Pressable
        disabled={!canSchedule}
        onPress={schedule}
        style={[styles.primaryButton, { backgroundColor: theme.primary, opacity: canSchedule ? 1 : 0.4 }]}>
        <Ionicons name="paper-plane-outline" size={16} color={theme.onPrimary} />
        <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
          {upcoming ? 'Update Wednesday post' : `Schedule for Wednesday`}
        </ThemedText>
      </Pressable>

      {upcoming && (
        <ThemedText type="small" themeColor="success">
          ✓ Scheduled for {formatDate(upcoming.scheduledFor)}. You can edit it until it goes out.
        </ThemedText>
      )}
    </View>
  );
}

function SundaysBrowser({
  posts,
  notes,
  replies,
  memberCount,
}: {
  posts: WeeklyPost[];
  notes: ReturnType<typeof sentChurchNoteStore.getSnapshot>;
  replies: WeeklyReply[];
  memberCount: number;
}) {
  const theme = useTheme();
  const [query, setQuery] = useState('');

  const filteredNotes = query.trim()
    ? notes.filter((note) =>
        `${note.title ?? ''} ${note.body ?? ''}`.toLowerCase().includes(query.trim().toLowerCase())
      )
    : notes;

  // Group notes under the most recent post that preceded them.
  // that week's points are the headings members' notes sit under.
  const weeks = posts.map((post) => ({
    post,
    notes: filteredNotes.filter((note) => {
      const sent = new Date(note.sentAt).getTime();
      const start = new Date(post.scheduledFor).getTime() - 7 * 86400000;
      const end = new Date(post.scheduledFor).getTime() + 7 * 86400000;
      return sent >= start && sent < end;
    }),
  }));
  const groupedIds = new Set(weeks.flatMap((week) => week.notes.map((note) => note.id)));
  const ungrouped = filteredNotes.filter((note) => !groupedIds.has(note.id));

  return (
    <View style={styles.stack}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search inside notes"
        placeholderTextColor={theme.textSecondary}
        style={[styles.fieldInput, { color: theme.text, backgroundColor: theme.backgroundElement }]}
      />

      {weeks.length === 0 && ungrouped.length === 0 && (
        <ThemedText type="small" themeColor="textSecondary">
          Nothing here yet. Once you post a weekly question and members send notes, past Sundays
          collect here.
        </ThemedText>
      )}

      {weeks.map(({ post, notes: weekNotes }) => (
        <Card key={post.id}>
          <View style={styles.weekHeader}>
            <ThemedText type="smallBold">Week of {formatWeekOf(post.scheduledFor)}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {weekNotes.length} {weekNotes.length === 1 ? 'note' : 'notes'}
            </ThemedText>
          </View>
          <ThemedText type="small" themeColor="accent">
            {post.scripture}
          </ThemedText>
          {post.points.map((point, index) => {
            const pointReplies = replies.filter(
              (reply) => reply.postId === post.id && reply.pointIndex === index
            );
            return (
              <View key={`${post.id}-point-${index}`} style={{ gap: 6 }}>
                <ThemedText type="small" themeColor="textSecondary">
                  • {point}
                </ThemedText>
                {pointReplies.map((reply) => (
                  <View key={reply.id} style={[styles.noteBlock, { backgroundColor: theme.softFill }]}>
                    <ThemedText type="smallBold">{reply.senderName}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {reply.body}
                    </ThemedText>
                  </View>
                ))}
              </View>
            );
          })}
          {replies
            .filter((reply) => reply.postId === post.id && reply.pointIndex === null)
            .map((reply) => (
              <View key={reply.id} style={[styles.noteBlock, { backgroundColor: theme.softFill }]}>
                <ThemedText type="smallBold">{reply.senderName}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  On the question: {reply.body}
                </ThemedText>
              </View>
            ))}
          {weekNotes.map((note) => (
            <View
              key={note.id}
              style={[styles.noteBlock, { backgroundColor: theme.softFill }]}>
              <ThemedText type="smallBold">{note.senderName}</ThemedText>
              {note.title ? <ThemedText type="small">{note.title}</ThemedText> : null}
              {note.body ? (
                <ThemedText type="small" themeColor="textSecondary" numberOfLines={6}>
                  {note.body}
                </ThemedText>
              ) : null}
            </View>
          ))}
        </Card>
      ))}

      {ungrouped.length > 0 && (
        <Card>
          <ThemedText type="smallBold">Other notes</ThemedText>
          {ungrouped.map((note) => (
            <View key={note.id} style={[styles.noteBlock, { backgroundColor: theme.softFill }]}>
              <ThemedText type="smallBold">{note.senderName}</ThemedText>
              {note.title ? <ThemedText type="small">{note.title}</ThemedText> : null}
              {note.body ? (
                <ThemedText type="small" themeColor="textSecondary" numberOfLines={6}>
                  {note.body}
                </ThemedText>
              ) : null}
            </View>
          ))}
        </Card>
      )}

      <View style={[styles.privacyPanel, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
        <Ionicons name="shield-checkmark" size={18} color={theme.success} />
        <View style={styles.privacyCopy}>
          <ThemedText type="smallBold" themeColor="success">
            What you cannot see
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.privacyLine}>
            Journals, prayers, and any field a member left out never reach you. The roster is
            hidden too. You see {memberCount} {memberCount === 1 ? 'person' : 'people'}, and a
            name appears only when someone chooses to send a note.
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

function ManagePanel({ churchId }: { churchId: string }) {
  const theme = useTheme();
  const churches = useCollection(churchStore);
  const church = churches.find((item) => item.id === churchId);
  const [coOwnerName, setCoOwnerName] = useState('');
  const [transferName, setTransferName] = useState('');

  if (!church) return null;

  function shareCode() {
    if (!church) return;
    const joinUrl = Linking.createURL('church/join', {
      queryParams: {
        code: church.joinCode,
        churchId: church.id,
        churchName: church.name,
        ownerName: church.ownerNames[0],
      },
    });
    Share.share({
      title: `Join ${church.name} on Openheart`,
      message: `You're invited to ${church.name} on Openheart. Join with code ${church.joinCode} or tap the link.\n\n${joinUrl}`,
      url: joinUrl,
    }).catch(() => {});
  }

  function rotateCode() {
    if (!church) return;
    Alert.alert('Rotate join code', 'The old code stops working immediately.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Rotate',
        onPress: () =>
          churchStore.update(church.id, { joinCode: generateJoinCode(), joinCodeActive: true }),
      },
    ]);
  }

  function toggleCode() {
    if (!church) return;
    churchStore.update(church.id, { joinCodeActive: !church.joinCodeActive });
  }

  function addCoOwner() {
    if (!church) return;
    const name = coOwnerName.trim();
    if (!name) return;
    churchStore.update(church.id, { ownerNames: [...church.ownerNames, name] });
    setCoOwnerName('');
  }

  function transferOwnership() {
    if (!church) return;
    const name = transferName.trim();
    if (!name) return;
    Alert.alert(
      'Transfer ownership',
      `${name} becomes the owner and you stay on as a member. Members will see the change. Ownership is always visible.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Transfer',
          style: 'destructive',
          onPress: () => {
            churchStore.update(church.id, { ownerNames: [name], ownedByMe: false });
            setTransferName('');
          },
        },
      ]
    );
  }

  return (
    <View style={styles.stack}>
      <Card style={styles.codeCard}>
        <ThemedText type="small" themeColor="textSecondary">
          Join code {church.joinCodeActive ? '' : '(paused)'}
        </ThemedText>
        <ThemedText style={[styles.code, !church.joinCodeActive && { opacity: 0.35 }]}>
          {church.joinCode}
        </ThemedText>
        <View style={styles.codeActions}>
          <Pressable onPress={shareCode} style={[styles.smallButton, { backgroundColor: theme.primary }]}>
            <Ionicons name="share-outline" size={14} color={theme.onPrimary} />
            <ThemedText type="small" style={{ color: theme.onPrimary }}>
              Share
            </ThemedText>
          </Pressable>
          <Pressable onPress={rotateCode} style={[styles.smallButton, { borderColor: theme.border, borderWidth: StyleSheet.hairlineWidth }]}>
            <Ionicons name="refresh" size={14} color={theme.text} />
            <ThemedText type="small">Rotate</ThemedText>
          </Pressable>
          <Pressable onPress={toggleCode} style={[styles.smallButton, { borderColor: theme.border, borderWidth: StyleSheet.hairlineWidth }]}>
            <Ionicons
              name={church.joinCodeActive ? 'pause' : 'play'}
              size={14}
              color={theme.text}
            />
            <ThemedText type="small">{church.joinCodeActive ? 'Pause' : 'Resume'}</ThemedText>
          </Pressable>
        </View>
      </Card>

      <Card>
        <ThemedText type="smallBold">Owners</ThemedText>
        {church.ownerNames.map((name, index) => (
          <ThemedText key={`${name}-${index}`} type="small" themeColor="textSecondary">
            {name}
            {index === 0 ? ' (owner)' : ' (co-owner)'}
          </ThemedText>
        ))}
        <View style={styles.inlineRow}>
          <TextInput
            value={coOwnerName}
            onChangeText={setCoOwnerName}
            placeholder="Add a co-owner by name"
            placeholderTextColor={theme.textSecondary}
            onSubmitEditing={addCoOwner}
            returnKeyType="done"
            style={[styles.inlineInput, { color: theme.text, backgroundColor: theme.softFill }]}
          />
          <Pressable onPress={addCoOwner} hitSlop={10}>
            <Ionicons name="add-circle" size={34} color={theme.accent} />
          </Pressable>
        </View>
        <ThemedText type="small" themeColor="textSecondary" style={styles.helperText}>
          A co-owner can post the weekly question and read sent notes. The group survives even if
          one owner steps away.
        </ThemedText>
      </Card>

      <Card>
        <ThemedText type="smallBold">Transfer ownership</ThemedText>
        <View style={styles.inlineRow}>
          <TextInput
            value={transferName}
            onChangeText={setTransferName}
            placeholder="New owner's name"
            placeholderTextColor={theme.textSecondary}
            onSubmitEditing={transferOwnership}
            returnKeyType="done"
            style={[styles.inlineInput, { color: theme.text, backgroundColor: theme.softFill }]}
          />
          <Pressable onPress={transferOwnership} hitSlop={10}>
            <Ionicons name="swap-horizontal" size={28} color={theme.danger} />
          </Pressable>
        </View>
      </Card>
    </View>
  );
}

function MemberView({
  churchId,
  latestPost,
  onLeave,
}: {
  churchId: string;
  latestPost?: WeeklyPost;
  onLeave: () => void;
}) {
  const theme = useTheme();
  const replies = useCollection(weeklyReplyStore);
  const [replyText, setReplyText] = useState('');
  const [pointIndex, setPointIndex] = useState<number | null>(null);
  const myReplies = replies.filter((reply) => reply.postId === latestPost?.id);

  function sendReply() {
    if (!latestPost || !replyText.trim()) return;
    weeklyReplyStore.add({
      id: createId(),
      churchId,
      postId: latestPost.id,
      pointIndex,
      body: replyText.trim(),
      senderName: currentUserName(),
      createdAt: new Date().toISOString(),
    });
    setReplyText('');
  }

  return (
    <View style={styles.stack}>
      {latestPost ? (
        <Card>
          <ThemedText type="small" themeColor="textSecondary">
            Week of {formatWeekOf(latestPost.scheduledFor)}
          </ThemedText>
          <ThemedText type="smallBold" themeColor="accent">
            {latestPost.scripture}
          </ThemedText>
          {latestPost.points.map((point, index) => (
            <ThemedText key={`point-${index}`} type="small">
              • {point}
            </ThemedText>
          ))}
          <ThemedText style={styles.questionText}>{latestPost.question}</ThemedText>

          <ThemedText type="small" themeColor="textSecondary">
            Reply under a point, or leave it on the question.
          </ThemedText>
          <View style={styles.tabRow}>
            <Pill
              label="Question"
              active={pointIndex === null}
              onPress={() => setPointIndex(null)}
            />
            {latestPost.points.map((point, index) => (
              <Pill
                key={`reply-point-${index}`}
                label={`Point ${index + 1}`}
                active={pointIndex === index}
                onPress={() => setPointIndex(index)}
              />
            ))}
          </View>
          <TextInput
            value={replyText}
            onChangeText={setReplyText}
            placeholder="Write a short reply"
            placeholderTextColor={theme.textSecondary}
            multiline
            style={[
              styles.fieldInput,
              styles.questionInput,
              { color: theme.text, backgroundColor: theme.softFill },
            ]}
          />
          <Pressable
            disabled={!replyText.trim()}
            onPress={sendReply}
            style={[
              styles.primaryButton,
              { backgroundColor: theme.primary, opacity: replyText.trim() ? 1 : 0.4 },
            ]}>
            <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
              Send reply
            </ThemedText>
          </Pressable>
          {myReplies.map((reply) => (
            <View key={reply.id} style={[styles.noteBlock, { backgroundColor: theme.softFill }]}>
              <ThemedText type="smallBold">
                {reply.pointIndex === null
                  ? 'Your reply to the question'
                  : `Your reply to point ${reply.pointIndex + 1}`}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {reply.body}
              </ThemedText>
            </View>
          ))}
        </Card>
      ) : (
        <Card>
          <ThemedText type="small" themeColor="textSecondary">
            No weekly post yet. When the owner schedules one, it lands here on Wednesday.
          </ThemedText>
        </Card>
      )}

      <View style={[styles.privacyPanel, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
        <Ionicons name="shield-checkmark" size={18} color={theme.success} />
        <View style={styles.privacyCopy}>
          <ThemedText type="smallBold" themeColor="success">
            What the owner cannot see
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.privacyLine}>
            Your journal, your prayers, and anything you don't explicitly send. They can't see
            who's in the group either, only a member count. Your name appears only if you choose
            to send a note.
          </ThemedText>
        </View>
      </View>

      <Pressable onPress={onLeave} style={styles.leaveButton}>
        <Ionicons name="exit-outline" size={16} color={theme.danger} />
        <ThemedText type="smallBold" themeColor="danger">
          Leave church
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { gap: 4 },
  title: { fontSize: 28, lineHeight: 38 },
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  tabRow: { flexDirection: 'row', gap: Spacing.one },
  stack: { gap: Spacing.three },
  stackTight: { gap: 6 },
  fieldInput: {
    minHeight: 52,
    fontFamily: Fonts.regular,
    fontSize: 16,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
  },
  multilineInput: { minHeight: 110, textAlignVertical: 'top' },
  questionInput: { minHeight: 80, textAlignVertical: 'top' },
  counter: { alignSelf: 'flex-end' },
  primaryButton: {
    minHeight: 54,
    flexDirection: 'row',
    gap: 8,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  noteBlock: {
    gap: 3,
    padding: Spacing.two,
    borderRadius: Radius.medium,
  },
  privacyPanel: {
    flexDirection: 'row',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.medium,
  },
  privacyCopy: { flex: 1, gap: 4 },
  privacyLine: { lineHeight: 19 },
  codeCard: { alignItems: 'center', gap: Spacing.one },
  code: { fontSize: 28, lineHeight: 36, letterSpacing: 3, fontFamily: Fonts.medium },
  codeActions: { flexDirection: 'row', gap: Spacing.one, marginTop: 4 },
  smallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: Radius.pill,
  },
  inlineRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  inlineInput: {
    flex: 1,
    minHeight: 44,
    fontFamily: Fonts.regular,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.two,
    paddingVertical: 0,
  },
  helperText: { lineHeight: 18 },
  questionText: { fontSize: 17, lineHeight: 24, marginTop: 4 },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
});
