import { NamedIcon } from '@/components/ui/icon';
import * as Haptics from 'expo-haptics';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SocialNoteCard } from '@/components/social-note-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  COMMENT_MAX_LENGTH,
  addCircleComment,
  toggleCommentLike,
  toggleShareLike,
} from '@/lib/circle-share';
import { useCollection, useCollectionReady } from '@/lib/collection-store';
import { formatSocialTime } from '@/lib/date';
import { useScalar } from '@/lib/scalar-store';
import { circleCommentStore, circleShareStore, isPremiumStore } from '@/lib/stores';
import { tidySermonNotes } from '@/lib/tidy-up';
import { CircleComment } from '@/lib/types';

export default function CircleShareThreadScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const shares = useCollection(circleShareStore);
  const comments = useCollection(circleCommentStore);
  const ready = useCollectionReady(circleShareStore);
  const isPremium = useScalar(isPremiumStore);
  const share = shares.find((item) => item.id === id);

  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<CircleComment | null>(null);
  const [tidying, setTidying] = useState(false);

  const thread = useMemo(() => {
    const mine = comments
      .filter((comment) => comment.shareId === id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const roots = mine.filter((comment) => !comment.parentId);
    return roots.map((root) => ({
      root,
      replies: mine.filter((comment) => comment.parentId === root.id),
    }));
  }, [comments, id]);

  if (!ready) {
    return <ThemedView style={styles.fill} />;
  }

  if (!share) {
    return (
      <ThemedView style={styles.fill}>
        <SafeAreaView style={styles.fill} edges={['top', 'bottom']}>
          <CommentHeader />
          <View style={styles.missing}>
            <ThemedText themeColor="textSecondary">This share is no longer in the circle.</ThemedText>
            <Pressable onPress={() => router.back()} style={styles.missingBack} hitSlop={8}>
              <ThemedText type="smallBold" themeColor="accent">
                Go back
              </ThemedText>
            </Pressable>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const remaining = COMMENT_MAX_LENGTH - draft.length;
  const canSend = draft.trim().length > 0;

  function send() {
    if (!share || !canSend || !isPremium) return;
    addCircleComment(share.id, draft, replyTo?.id ?? null);
    setDraft('');
    setReplyTo(null);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function startReply(comment: CircleComment) {
    if (!isPremium) return;
    const root =
      comment.parentId == null
        ? comment
        : comments.find((item) => item.id === comment.parentId) ?? comment;
    setReplyTo(root);
  }

  async function tidyDraft() {
    if (!draft.trim() || tidying) return;
    setTidying(true);
    try {
      const result = await tidySermonNotes(draft);
      if (!result.fellBack && result.changed) setDraft(result.text.slice(0, COMMENT_MAX_LENGTH));
    } finally {
      setTidying(false);
    }
  }

  function shareText(text: string) {
    Share.share({ message: text }).catch(() => {});
  }

  function commentMore(comment: CircleComment) {
    Alert.alert(comment.authorName, undefined, [
      { text: 'Reply', onPress: () => startReply(comment) },
      { text: 'Share', onPress: () => shareText(comment.body) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  return (
    <ThemedView style={styles.fill}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <CommentHeader />
      </SafeAreaView>
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          data={thread}
          keyExtractor={(item) => item.root.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <SocialNoteCard
              name={share.authorName}
              time={formatSocialTime(share.createdAt)}
              title={share.title || undefined}
              body={share.body || undefined}
              likeCount={share.likeCount ?? 0}
              liked={share.likedByMe}
              commentCount={comments.filter((comment) => comment.shareId === share.id).length}
              onLike={() => {
                toggleShareLike(share.id);
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              onShare={() => shareText([share.title, share.body].filter(Boolean).join('\n\n'))}
              onMore={() =>
                Alert.alert(share.authorName, undefined, [
                  { text: 'Share', onPress: () => shareText([share.title, share.body].filter(Boolean).join('\n\n')) },
                  { text: 'Cancel', style: 'cancel' },
                ])
              }
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <ThemedText type="smallBold">No comments yet</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.emptyBody}>
                {isPremium
                  ? 'Be the first to reply. Keep it short and kind.'
                  : 'Comments on shared posts are part of Openheart Premium.'}
              </ThemedText>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.threadBlock}>
              <SocialNoteCard
                name={item.root.authorName}
                time={formatSocialTime(item.root.createdAt)}
                body={item.root.body}
                likeCount={item.root.likeCount ?? 0}
                liked={item.root.likedByMe}
                commentCount={item.replies.length}
                onLike={() => toggleCommentLike(item.root.id)}
                onComment={() => startReply(item.root)}
                onShare={() => shareText(item.root.body)}
                onMore={() => commentMore(item.root)}
              />
              {item.replies.map((reply) => (
                <SocialNoteCard
                  key={reply.id}
                  nested
                  name={reply.authorName}
                  time={formatSocialTime(reply.createdAt)}
                  body={reply.body}
                  likeCount={reply.likeCount ?? 0}
                  liked={reply.likedByMe}
                  onLike={() => toggleCommentLike(reply.id)}
                  onComment={() => startReply(item.root)}
                  onShare={() => shareText(reply.body)}
                  onMore={() => commentMore(reply)}
                />
              ))}
            </View>
          )}
        />

        {isPremium ? (
          <SafeAreaView edges={['bottom']} style={styles.composerSafe}>
            {replyTo ? (
              <View style={[styles.replyChip, { backgroundColor: theme.accentSoft }]}>
                <ThemedText type="small" themeColor="accent" numberOfLines={1} style={styles.replyChipText}>
                  Replying to {replyTo.authorName}
                </ThemedText>
                <Pressable
                  accessibilityLabel="Cancel reply"
                  onPress={() => setReplyTo(null)}
                  hitSlop={8}
                  style={styles.replyChipClose}>
                  <NamedIcon name="close" size={16} color={theme.accent} />
                </Pressable>
              </View>
            ) : null}
            <View style={styles.composerRow}>
              <View style={[styles.inputWrap, { backgroundColor: theme.softFill, borderColor: theme.border }]}>
                <TextInput
                  value={draft}
                  onChangeText={(text) => setDraft(text.slice(0, COMMENT_MAX_LENGTH))}
                  placeholder={replyTo ? 'Write a reply' : 'Write Comment..'}
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  maxLength={COMMENT_MAX_LENGTH}
                  style={[styles.input, { color: theme.text }]}
                />
                <Pressable
                  accessibilityLabel="Tidy up"
                  onPress={() => void tidyDraft()}
                  disabled={!draft.trim() || tidying}
                  hitSlop={6}
                  style={[styles.moon, { opacity: draft.trim() ? 1 : 0.35 }]}>
                  <NamedIcon name="moon" size={18} color={theme.textSecondary} />
                </Pressable>
              </View>
              <Pressable
                accessibilityLabel="Send comment"
                disabled={!canSend}
                onPress={send}
                style={({ pressed }) => [styles.send, { opacity: canSend ? (pressed ? 0.7 : 1) : 0.35 }]}>
                <NamedIcon name="paper-plane" size={22} color={theme.text} />
              </Pressable>
            </View>
            {remaining < 40 ? (
              <ThemedText type="small" themeColor="danger" style={styles.counter}>
                {remaining}
              </ThemedText>
            ) : null}
          </SafeAreaView>
        ) : (
          <SafeAreaView edges={['bottom']} style={styles.composerSafe}>
            <Pressable
              onPress={() => void isPremiumStore.set(true)}
              style={({ pressed }) => [
                styles.lockBar,
                { backgroundColor: theme.accentSoft, opacity: pressed ? 0.85 : 1 },
              ]}>
              <View style={[styles.lockIcon, { backgroundColor: theme.background }]}>
                <NamedIcon name="lock-closed" size={16} color={theme.accent} />
              </View>
              <View style={styles.lockCopy}>
                <ThemedText type="smallBold">Comments are Premium</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Reply to verses, journal, notes, and prayers in your circle.
                </ThemedText>
              </View>
              <ThemedText type="smallBold" themeColor="accent">
                Preview
              </ThemedText>
            </Pressable>
          </SafeAreaView>
        )}
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

function CommentHeader() {
  const theme = useTheme();
  return (
    <View style={styles.header}>
      <View style={styles.headerSide} />
      <ThemedText type="smallBold" style={styles.headerTitle}>
        Comment
      </ThemedText>
      <Pressable
        accessibilityLabel="Close comments"
        onPress={() => router.back()}
        hitSlop={10}
        style={styles.headerSide}>
        <NamedIcon name="close" size={22} color={theme.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  headerSafe: {
    paddingHorizontal: Spacing.three,
  },
  header: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 24,
  },
  headerSide: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missing: {
    padding: Spacing.four,
    gap: Spacing.two,
  },
  missingBack: { minHeight: 44, justifyContent: 'center' },
  list: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  empty: {
    paddingVertical: Spacing.five,
    gap: 6,
    alignItems: 'center',
  },
  emptyBody: { textAlign: 'center', maxWidth: 280 },
  threadBlock: { gap: Spacing.two },
  composerSafe: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    gap: Spacing.two,
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputWrap: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingLeft: 18,
    paddingRight: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  input: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    paddingVertical: Platform.OS === 'ios' ? 6 : 4,
    maxHeight: 88,
  },
  moon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  send: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counter: { alignSelf: 'flex-end', fontSize: 11, lineHeight: 14 },
  replyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
    paddingLeft: Spacing.three,
    paddingRight: 6,
    borderRadius: Radius.pill,
    gap: Spacing.two,
  },
  replyChipText: { flex: 1 },
  replyChipClose: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBar: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    borderRadius: Radius.medium,
  },
  lockIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockCopy: { flex: 1, gap: 1 },
});
