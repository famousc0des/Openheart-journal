import { NamedIcon } from '@/components/ui/icon';
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
import { CIRCLE_TYPES, shareCircleInvite, withBuiltInCircles } from '@/lib/circles';
import { circleLimitError, circleMemberLimit, membersOfCircle, normalizeMemberName, searchMembers } from '@/lib/circle-membership';
import { useCollection } from '@/lib/collection-store';
import { createId } from '@/lib/id';
import {
  circleCommentStore,
  circleMemberStore,
  circleShareStore,
  circlesStore,
} from '@/lib/stores';
import { CircleMember } from '@/lib/types';

type CircleTab = 'shared' | 'people' | 'manage';

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
  const [limitDraft, setLimitDraft] = useState('');
  const [limitError, setLimitError] = useState('');
  const [memberError, setMemberError] = useState('');
  const [limitSaved, setLimitSaved] = useState(false);

  const circle = withBuiltInCircles(circles).find((item) => item.id === id);

  const savedLimit = circle ? circleMemberLimit(circle) : null;
  useEffect(() => {
    setLimitDraft(savedLimit === null ? '' : String(savedLimit));
    setLimitError('');
  }, [id, savedLimit]);

  const circleMembers = useMemo(
    () => membersOfCircle(allMembers, id),
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

  if (!circle) {
    return (
      <Screen stagger={false} bounces={false} alwaysBounceVertical={false} overScrollMode="never">
        <ThemedText themeColor="textSecondary">This circle could not be found.</ThemedText>
      </Screen>
    );
  }

  const type = CIRCLE_TYPES[circle.kind ?? 'cord'];
  const isFull = savedLimit !== null && circleMembers.length >= savedLimit;
  const filteredMembers = searchMembers(circleMembers, query);

  async function saveLimit() {
    await Promise.all([circlesStore.whenReady(), circleMemberStore.whenReady()]);
    const error = circleLimitError(limitDraft, membersOfCircle(circleMemberStore.getSnapshot(), id).length);
    setLimitError(error || '');
    if (error || !circle) return;
    const memberLimit = limitDraft.trim() ? Number(limitDraft.trim()) : null;
    if (circlesStore.getById(circle.id)) circlesStore.update(circle.id, { memberLimit });
    else circlesStore.add({ ...circle, memberLimit });
    setLimitSaved(true);
  }

  function guardFull(): boolean {
    const currentCircle = circlesStore.getById(id) || circle!;
    const limit = circleMemberLimit(currentCircle);
    if (limit === null || membersOfCircle(circleMemberStore.getSnapshot(), id).length < limit) return false;
    Alert.alert(
      `${type.label} is full`,
      `This group allows ${circleMemberLimit(circlesStore.getById(id) || circle!)} people. Change the people limit in Manage to add more people.`
    );
    return true;
  }

  async function addByName() {
    await circleMemberStore.whenReady();
    const name = draftName.trim().replace(/\s+/g, ' ');
    if (!name || guardFull()) return;
    if (membersOfCircle(circleMemberStore.getSnapshot(), id).some((member) => normalizeMemberName(member.name) === normalizeMemberName(name))) {
      setMemberError('This person is already in your circle.');
      return;
    }
    circleMemberStore.add({
      id: createId(),
      createdAt: new Date().toISOString(),
      name,
      circleId: circle!.id,
    });
    setDraftName('');
    setMemberError('');
    setQuery('');
    setTab('people');
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
          <Pill label="Manage" active={tab === 'manage'} onPress={() => setTab('manage')} />
        </View>

        {tab === 'shared' ? (
          <View style={styles.section}>
            {circleShares.length === 0 ? (
              <View style={[styles.emptyShared, { backgroundColor: theme.backgroundElement }]}>
                <NamedIcon name="chatbubbles-outline" size={22} color={theme.accent} />
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
        ) : tab === 'people' ? (
          <>
            <View style={[styles.searchBar, { borderColor: theme.border }]}>
              <NamedIcon name="search" size={18} color={theme.textSecondary} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search added people"
                accessibilityLabel="Search circle members"
                autoCapitalize="none"
                returnKeyType="search"
                placeholderTextColor={theme.textSecondary}
                autoCorrect={false}
                style={[styles.searchInput, { color: theme.text }]}
              />
              {query.length > 0 && (
                <Pressable onPress={() => setQuery('')} accessibilityRole="button" accessibilityLabel="Clear member search" style={styles.clearSearch}>
                  <NamedIcon name="close-circle" size={18} color={theme.textSecondary} />
                </Pressable>
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  Members
                </ThemedText>
                <Pressable onPress={() => setTab('manage')} accessibilityRole="button" accessibilityLabel="Edit circle people limit" style={styles.shareLink}>
                  <ThemedText type="small" themeColor="textSecondary">
                    {savedLimit === null ? `${circleMembers.length} people` : `${circleMembers.length}/${savedLimit}`}
                  </ThemedText>
                  <NamedIcon name="pencil-outline" size={14} color={theme.textSecondary} />
                </Pressable>
              </View>

              {filteredMembers.length === 0 && (
                <ThemedText type="small" themeColor="textSecondary">
                  {circleMembers.length === 0
                    ? 'No people added yet. Add someone in Manage.'
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
                    accessibilityRole="button"
                    onPress={() => removeMember(member)}
                    hitSlop={6}
                    style={[styles.actionCircle, { backgroundColor: theme.primary }]}>
                    <NamedIcon name="checkmark" size={16} color={theme.onPrimary} />
                  </Pressable>
                </View>
              ))}
            </View>

          </>
        ) : (
          <>
            <View style={styles.section}>
              <ThemedText type="smallBold">People limit</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {circleMembers.length} people added. Leave blank for no limit.
              </ThemedText>
              <TextInput
                value={limitDraft}
                onChangeText={(value) => { setLimitDraft(value); setLimitError(''); setLimitSaved(false); }}
                accessibilityLabel="People limit"
                keyboardType="number-pad"
                placeholder="No limit"
                placeholderTextColor={theme.textSecondary}
                style={[styles.limitInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
              />
              {limitError ? <ThemedText type="small" themeColor="danger" accessibilityRole="alert">{limitError}</ThemedText> : null}
              {limitSaved ? <ThemedText type="small" themeColor="textSecondary" accessibilityLiveRegion="polite">People limit saved.</ThemedText> : null}
              <Pressable onPress={() => void saveLimit()} accessibilityRole="button" style={[styles.saveLimit, { backgroundColor: theme.primary }]}>
                <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>Save people limit</ThemedText>
              </Pressable>
            </View>
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>Add people</ThemedText>
                <Pressable onPress={shareInvite} disabled={isFull} accessibilityRole="button" style={[styles.shareLink, { opacity: isFull ? 0.4 : 1 }]}>
                  <NamedIcon name="share-outline" size={18} color={theme.accent} />
                  <ThemedText type="smallBold" themeColor="accent">Share link</ThemedText>
                </Pressable>
              </View>
              {memberError ? <ThemedText type="small" themeColor="danger" accessibilityRole="alert">{memberError}</ThemedText> : null}
              {isFull ? (
                <View style={[styles.fullNotice, { backgroundColor: theme.accentSoft }]}>
                  <NamedIcon name="people" size={18} color={theme.accent} />
                  <ThemedText type="small" style={styles.fullNoticeText}>
                    This circle is full. Increase the people limit above to add someone.
                  </ThemedText>
                </View>
              ) : (
                <View style={[styles.personRow, { backgroundColor: theme.backgroundElement, borderWidth: 1, borderColor: theme.border }]}>
                  <View style={[styles.avatar, styles.avatarDashed, { borderColor: theme.border }]}>
                    <NamedIcon name="person-add-outline" size={15} color={theme.textSecondary} />
                  </View>
                  <TextInput
                    value={draftName}
                    onChangeText={(value) => { setDraftName(value); setMemberError(''); }}
                    accessibilityLabel="Person's name"
                    placeholder="Add someone by name"
                    placeholderTextColor={theme.textSecondary}
                    onSubmitEditing={addByName}
                    returnKeyType="done"
                    style={[styles.addInput, { color: theme.text }]}
                  />
                  <Pressable
                    accessibilityLabel="Add by name"
                    accessibilityRole="button"
                    disabled={!draftName.trim()}
                    onPress={addByName}
                    hitSlop={6}
                    style={[
                      styles.actionCircle,
                      { backgroundColor: theme.primary, opacity: draftName.trim() ? 1 : 0.4 },
                    ]}>
                    <NamedIcon name="add" size={17} color={theme.onPrimary} />
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
  limitInput: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
    fontFamily: Fonts.regular,
    fontSize: 16,
  },
  saveLimit: {
    minHeight: 48,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearSearch: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
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
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCircleGhost: {
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  shareLink: {
    minHeight: 44,
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
