import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { CircleAvatar } from '@/components/circle-avatar';
import { CircleShareCard } from '@/components/circle-share-card';
import { ThemedText } from '@/components/themed-text';
import { Pill } from '@/components/ui/pill';
import { Screen } from '@/components/ui/screen';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { backfillPrayerShares } from '@/lib/circle-share';
import { CIRCLE_TYPES, ensureDummyCircleMembers, shareCircleInvite, withBuiltInCircles } from '@/lib/circles';
import { useCollection } from '@/lib/collection-store';
import { createId } from '@/lib/id';
import {
  circleCommentStore,
  circleMemberStore,
  circleShareStore,
  circlesStore,
} from '@/lib/stores';
import { CircleMember } from '@/lib/types';

type CircleTab = 'shared' | 'people';

export default function CircleDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const circles = useCollection(circlesStore);
  const allMembers = useCollection(circleMemberStore);
  const shares = useCollection(circleShareStore);
  const comments = useCollection(circleCommentStore);

  const [tab, setTab] = useState<CircleTab>('shared');
  const [query, setQuery] = useState('');
  const [draftName, setDraftName] = useState('');

  const circle = withBuiltInCircles(circles).find((item) => item.id === id);

  useEffect(() => {
    if (circle) ensureDummyCircleMembers(circle);
  }, [circle, allMembers]);

  const circleMembers = useMemo(
    () => allMembers.filter((member) => member.circleId === id),
    [allMembers, id]
  );
  const circleShares = useMemo(
    () =>
      shares
        .filter((share) => share.circleId === id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [shares, id]
  );

  useEffect(() => {
    backfillPrayerShares();
  }, []);

  // People from your other circles who aren't in this one yet, the
  // natural invite candidates, like a friends list.
  const inviteCandidates = useMemo(() => {
    const namesHere = new Set(circleMembers.map((member) => member.name.toLowerCase()));
    const seen = new Set<string>();
    return allMembers.filter((member) => {
      if (member.circleId === id) return false;
      const key = member.name.toLowerCase();
      if (namesHere.has(key) || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [allMembers, circleMembers, id]);

  if (!circle) {
    return (
      <Screen stagger={false} bounces={false} alwaysBounceVertical={false} overScrollMode="never">
        <ThemedText themeColor="textSecondary">This circle could not be found.</ThemedText>
      </Screen>
    );
  }

  const type = CIRCLE_TYPES[circle.kind ?? 'cord'];
  const isFull = type.limit !== null && circleMembers.length >= type.limit;
  const normalizedQuery = query.trim().toLowerCase();
  const filteredMembers = normalizedQuery
    ? circleMembers.filter((member) => member.name.toLowerCase().includes(normalizedQuery))
    : circleMembers;
  const filteredCandidates = normalizedQuery
    ? inviteCandidates.filter((member) => member.name.toLowerCase().includes(normalizedQuery))
    : inviteCandidates;

  function guardFull(): boolean {
    if (!isFull) return false;
    Alert.alert(
      `${type.label} is full`,
      `This group allows ${type.limit} people. Create another group to include more people.`
    );
    return true;
  }

  function addByName() {
    const name = draftName.trim();
    if (!name || guardFull()) return;
    circleMemberStore.add({
      id: createId(),
      createdAt: new Date().toISOString(),
      name,
      circleId: circle!.id,
    });
    setDraftName('');
  }

  function addCandidate(candidate: CircleMember) {
    if (guardFull()) return;
    circleMemberStore.add({
      id: createId(),
      createdAt: new Date().toISOString(),
      name: candidate.name,
      circleId: circle!.id,
    });
  }

  function removeMember(member: CircleMember) {
    Alert.alert('Remove from circle', `Remove ${member.name}? They won't be notified.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => circleMemberStore.remove(member.id) },
    ]);
  }

  function shareInvite() {
    if (!circle || guardFull()) return;
    void shareCircleInvite(circle);
  }

  return (
    <>
      <Stack.Screen options={{ title: circle.name }} />
      <Screen stagger={false} bounces={false} alwaysBounceVertical={false} overScrollMode="never">
        <View style={styles.tabRow}>
          <Pill label="Shared" active={tab === 'shared'} onPress={() => setTab('shared')} />
          <Pill label="People" active={tab === 'people'} onPress={() => setTab('people')} />
        </View>

        {tab === 'shared' ? (
          <View style={styles.section}>
            {circleShares.length === 0 ? (
              <View style={[styles.emptyShared, { backgroundColor: theme.backgroundElement }]}>
                <Ionicons name="chatbubbles-outline" size={22} color={theme.accent} />
                <ThemedText type="smallBold">Nothing shared yet</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.emptySharedBody}>
                  A verse, journal entry, sermon note, or prayer can land here. Members with
                  Premium can comment.
                </ThemedText>
              </View>
            ) : (
              circleShares.map((share) => (
                <CircleShareCard
                  key={share.id}
                  share={share}
                  commentCount={comments.filter((comment) => comment.shareId === share.id).length}
                />
              ))
            )}
          </View>
        ) : (
          <>
            <View style={[styles.searchBar, { borderColor: theme.border }]}>
              <Ionicons name="search" size={18} color={theme.textSecondary} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search people"
                placeholderTextColor={theme.textSecondary}
                autoCorrect={false}
                style={[styles.searchInput, { color: theme.text }]}
              />
              {query.length > 0 && (
                <Pressable onPress={() => setQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
                </Pressable>
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  Members
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {type.limit === null
                    ? `${circleMembers.length} people`
                    : `${circleMembers.length}/${type.limit}`}
                </ThemedText>
              </View>

              {filteredMembers.length === 0 && (
                <ThemedText type="small" themeColor="textSecondary">
                  {circleMembers.length === 0
                    ? 'No one here yet. Invite someone below.'
                    : 'No members match your search.'}
                </ThemedText>
              )}

              {filteredMembers.map((member) => (
                <View
                  key={member.id}
                  style={[styles.personRow, { backgroundColor: theme.backgroundElement }]}>
                  <CircleAvatar name={member.name} />
                  <ThemedText style={styles.personName}>{member.name}</ThemedText>
                  <Pressable
                    accessibilityLabel={`Remove ${member.name}`}
                    onPress={() => removeMember(member)}
                    hitSlop={6}
                    style={[styles.actionCircle, { backgroundColor: theme.primary }]}>
                    <Ionicons name="checkmark" size={16} color={theme.onPrimary} />
                  </Pressable>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  Invite
                </ThemedText>
                <Pressable
                  onPress={shareInvite}
                  disabled={isFull}
                  hitSlop={6}
                  style={[styles.shareLink, { opacity: isFull ? 0.4 : 1 }]}>
                  <Ionicons name="share-outline" size={15} color={theme.accent} />
                  <ThemedText type="smallBold" themeColor="accent">
                    Share link
                  </ThemedText>
                </Pressable>
              </View>

              {filteredCandidates.map((candidate) => (
                <View
                  key={candidate.id}
                  style={[styles.personRow, { backgroundColor: theme.backgroundElement }]}>
                  <CircleAvatar name={candidate.name} />
                  <ThemedText style={styles.personName}>{candidate.name}</ThemedText>
                  <Pressable
                    accessibilityLabel={`Add ${candidate.name}`}
                    onPress={() => addCandidate(candidate)}
                    hitSlop={6}
                    style={[
                      styles.actionCircle,
                      styles.actionCircleGhost,
                      { borderColor: theme.accent, opacity: isFull ? 0.4 : 1 },
                    ]}>
                    <Ionicons name="add" size={17} color={theme.accent} />
                  </Pressable>
                </View>
              ))}

              {isFull ? (
                <View style={[styles.fullNotice, { backgroundColor: theme.accentSoft }]}>
                  <Ionicons name="people" size={18} color={theme.accent} />
                  <ThemedText type="small" style={styles.fullNoticeText}>
                    This circle is full.
                  </ThemedText>
                </View>
              ) : (
                <View style={[styles.personRow, { backgroundColor: theme.backgroundElement }]}>
                  <View style={[styles.avatar, styles.avatarDashed, { borderColor: theme.border }]}>
                    <Ionicons name="person-add-outline" size={15} color={theme.textSecondary} />
                  </View>
                  <TextInput
                    value={draftName}
                    onChangeText={setDraftName}
                    placeholder="Add someone by name"
                    placeholderTextColor={theme.textSecondary}
                    onSubmitEditing={addByName}
                    returnKeyType="done"
                    style={[styles.addInput, { color: theme.text }]}
                  />
                  <Pressable
                    accessibilityLabel="Add by name"
                    onPress={addByName}
                    hitSlop={6}
                    style={[
                      styles.actionCircle,
                      { backgroundColor: theme.primary, opacity: draftName.trim() ? 1 : 0.4 },
                    ]}>
                    <Ionicons name="add" size={17} color={theme.onPrimary} />
                  </Pressable>
                </View>
              )}
            </View>
          </>
        )}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  tabRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  emptyShared: {
    gap: Spacing.two,
    padding: Spacing.four,
    borderRadius: Radius.medium,
    alignItems: 'flex-start',
  },
  emptySharedBody: { lineHeight: 20 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 52,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 16,
    paddingVertical: 0,
  },
  section: {
    gap: Spacing.two,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 22,
    lineHeight: 28,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Radius.pill,
  },
  personName: {
    flex: 1,
    fontSize: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: 'rgba(19, 20, 22, 0.75)',
  },
  avatarDashed: {
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  actionCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCircleGhost: {
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  shareLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  addInput: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 16,
    paddingVertical: 0,
  },
  fullNotice: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.medium,
  },
  fullNoticeText: {
    flex: 1,
    lineHeight: 19,
  },
});
