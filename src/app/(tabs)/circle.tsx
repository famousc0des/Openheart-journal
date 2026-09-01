import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCollection } from '@/lib/collection-store';
import { createId } from '@/lib/id';
import { circleInviteStore, circleMemberStore } from '@/lib/stores';
import { CircleGroup, CircleMember } from '@/lib/types';

const GROUPS: { key: CircleGroup; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'cord', label: 'Cord', icon: 'link' },
  { key: 'fellowship', label: 'Fellowship', icon: 'people' },
];

const GROUP_GOAL = 10;

function randomCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export default function CircleScreen() {
  const theme = useTheme();
  const members = useCollection(circleMemberStore);
  const invites = useCollection(circleInviteStore);
  const [draftName, setDraftName] = useState<Record<CircleGroup, string>>({ cord: '', fellowship: '' });

  const progress = Math.min(members.length / GROUP_GOAL, 1);

  function addMember(group: CircleGroup) {
    const name = draftName[group].trim();
    if (!name) return;
    circleMemberStore.add({ id: createId(), createdAt: new Date().toISOString(), name, group });
    setDraftName((prev) => ({ ...prev, [group]: '' }));
  }

  function removeMember(member: CircleMember) {
    Alert.alert('Remove from circle', `Remove ${member.name}? They won't be notified.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => circleMemberStore.remove(member.id) },
    ]);
  }

  function invite(group: CircleGroup) {
    const code = randomCode();
    circleInviteStore.add({ id: createId(), createdAt: new Date().toISOString(), code, group });
    Share.share({
      message: `Join me on Openheart so I can share a few things with you privately. Use invite code ${code} — it expires after one use.`,
    }).catch(() => {});
  }

  return (
    <Screen>
      <View style={styles.pitchBlock}>
        <ThemedText type="title" style={styles.pitchTitle}>
          Invite your people.{'\n'}Share life together.
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.pitchBody}>
          Add a few close people to Cord, and a wider few to Fellowship. Sharing stays private and
          per-item — never a public wall.
        </ThemedText>
      </View>

      <View style={{ gap: Spacing.two }}>
        <View style={[styles.progressTrack, { backgroundColor: theme.backgroundElement }]}>
          <View style={[styles.progressFill, { backgroundColor: theme.accent, width: `${progress * 100}%` }]} />
        </View>
        <View style={styles.progressRow}>
          <ThemedText type="small" themeColor="textSecondary">
            {members.length} / {GROUP_GOAL} in your circle
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {invites.length} invite{invites.length === 1 ? '' : 's'} sent
          </ThemedText>
        </View>
      </View>

      <Pressable onPress={() => invite('fellowship')} style={[styles.shareButton, { backgroundColor: theme.accent }]}>
        <Ionicons name="share-outline" size={18} color="#fff" />
        <ThemedText style={styles.shareButtonText}>Share invite</ThemedText>
      </Pressable>

      {GROUPS.map((group) => {
        const groupMembers = members.filter((member) => member.group === group.key);
        return (
          <View key={group.key} style={{ gap: Spacing.two }}>
            <View style={styles.sectionHeaderRow}>
              <ThemedText type="smallBold" style={styles.sectionTitle}>
                {group.label}
              </ThemedText>
              <Pressable onPress={() => invite(group.key)} hitSlop={8}>
                <Ionicons name="person-add-outline" size={19} color={theme.textSecondary} />
              </Pressable>
            </View>

            {groupMembers.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                No one here yet — send an invite or add someone you've already connected with.
              </ThemedText>
            ) : (
              groupMembers.map((member) => (
                <View key={member.id} style={styles.memberRow}>
                  <View style={[styles.avatar, { backgroundColor: theme.backgroundElement }]}>
                    <ThemedText type="smallBold" themeColor="accent">
                      {member.name.trim().charAt(0).toUpperCase() || '?'}
                    </ThemedText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText type="smallBold">{member.name}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {group.label}
                    </ThemedText>
                  </View>
                  <Pressable
                    onPress={() => removeMember(member)}
                    style={[styles.removeButton, { borderColor: theme.border }]}>
                    <ThemedText type="small">Remove</ThemedText>
                  </Pressable>
                </View>
              ))
            )}

            <View style={styles.addRow}>
              <TextInput
                value={draftName[group.key]}
                onChangeText={(text) => setDraftName((prev) => ({ ...prev, [group.key]: text }))}
                placeholder={`Add someone to ${group.label}`}
                placeholderTextColor={theme.textSecondary}
                onSubmitEditing={() => addMember(group.key)}
                returnKeyType="done"
                style={[styles.addInput, { color: theme.text, backgroundColor: theme.backgroundElement }]}
              />
              <Pressable
                onPress={() => addMember(group.key)}
                hitSlop={10}
                style={styles.addButton}>
                <Ionicons name="add-circle" size={40} color={theme.accent} />
              </Pressable>
            </View>
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  pitchBlock: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
  },
  pitchTitle: {
    fontSize: 26,
    lineHeight: 32,
    textAlign: 'center',
  },
  pitchBody: {
    textAlign: 'center',
    lineHeight: 20,
  },
  progressTrack: {
    height: 8,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    borderRadius: Radius.pill,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: Radius.pill,
  },
  shareButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  addInput: {
    flex: 1,
    minHeight: 56,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: 16,
    fontSize: 16,
  },
  addButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
