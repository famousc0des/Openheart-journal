import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { JournalAvatar, JournalBlob, JOURNAL_BLOB_COLORS } from '@/components/journal-blob';
import { Fonts, Tracking } from '@/constants/theme';
import { CIRCLE_TYPES, ensureDummyMembersForCircles, pastelFor, shareCircleInvite, withBuiltInCircles } from '@/lib/circles';
import { useCollection } from '@/lib/collection-store';
import { formatRelative } from '@/lib/date';
import { churchStore, circleMemberStore, circlesStore } from '@/lib/stores';
import { UserCircle } from '@/lib/types';

const PAGE = 'transparent';
const INK = '#1C1917';
const INK_MUTED = 'rgba(28, 25, 23, 0.48)';

const KIND_STICKERS: Record<
  NonNullable<UserCircle['kind']>,
  { name: 'heart' | 'people' | 'sparkles'; bg: string; color: string }[]
> = {
  cord: [
    { name: 'heart', bg: '#F6F3EE', color: INK },
    { name: 'sparkles', bg: '#1C1917', color: '#F6F3EE' },
  ],
  fellowship: [
    { name: 'people', bg: '#F6F3EE', color: INK },
    { name: 'heart', bg: '#1C1917', color: '#F6F3EE' },
  ],
  custom: [
    { name: 'sparkles', bg: '#F6F3EE', color: INK },
  ],
};

function circleLine(circle: UserCircle, memberCount: number) {
  const type = CIRCLE_TYPES[circle.kind ?? 'cord'];
  if (type.limit === null) {
    return `${memberCount} ${memberCount === 1 ? 'person' : 'people'} in this group.`;
  }
  const left = type.limit - memberCount;
  if (left <= 0) return `${circle.name} is full.`;
  return left === 1 ? 'One seat still open.' : `${left} seats still open.`;
}

export default function CircleScreen() {
  const insets = useSafeAreaInsets();
  const circles = useCollection(circlesStore);
  const members = useCollection(circleMemberStore);
  const churches = useCollection(churchStore);
  const displayedCircles = withBuiltInCircles(circles);

  useEffect(() => {
    ensureDummyMembersForCircles(circles);
  }, [circles, members]);

  let blobIndex = 0;

  return (
    <View style={styles.page}>
      <ScrollView
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 10, paddingBottom: 128 + insets.bottom },
        ]}>
        <View style={styles.header}>
          <Text style={styles.title}>Circle</Text>
          <Text style={styles.lede}>Notes from the people around you.</Text>
        </View>

        <View style={styles.stack}>
          {displayedCircles.map((circle, index) => {
            const circleMembers = members.filter((member) => member.circleId === circle.id);
            const type = CIRCLE_TYPES[circle.kind ?? 'cord'];
            const face = circleMembers[0];
            const variant = blobIndex;
            blobIndex += 1;
            const canInvite = type.limit === null || circleMembers.length < type.limit;
            return (
              <View key={circle.id}>
                <JournalBlob
                  color={JOURNAL_BLOB_COLORS[variant % JOURNAL_BLOB_COLORS.length]}
                  variant={variant}
                  overlap={index > 0}
                  avatar={
                    <JournalAvatar
                      label={face?.name ?? circle.name}
                      color={pastelFor(face?.name ?? circle.name)}
                      icon={face ? undefined : 'person-add-outline'}
                    />
                  }
                  name={circle.name}
                  time={formatRelative(circle.createdAt)}
                  body={circleLine(circle, circleMembers.length)}
                  badge={type.limit === null ? circleMembers.length : `${circleMembers.length}/${type.limit}`}
                  stickers={KIND_STICKERS[circle.kind ?? 'cord']}
                  onPress={() => router.push({ pathname: '/circle/[id]', params: { id: circle.id } })}
                  onStickerPress={() => {
                    if (!canInvite) return;
                    void shareCircleInvite(circle);
                  }}
                />
              </View>
            );
          })}

          {churches.map((church) => {
            const variant = blobIndex;
            blobIndex += 1;
            return (
              <View key={church.id}>
                <JournalBlob
                  color={JOURNAL_BLOB_COLORS[variant % JOURNAL_BLOB_COLORS.length]}
                  variant={variant}
                  avatar={<JournalAvatar color="#F6F3EE" icon="home" />}
                  name={church.name}
                  time={formatRelative(church.createdAt)}
                  body={`Owned by ${church.ownerNames[0]}${church.ownedByMe ? ' (you)' : ''}.`}
                  badge={church.memberCount}
                  stickers={[{ name: 'sparkles', bg: '#1C1917', color: '#F6F3EE' }]}
                  onPress={() => router.push({ pathname: '/church/[id]', params: { id: church.id } })}
                />
              </View>
            );
          })}
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityLabel="Create a circle"
            onPress={() => router.push('/circle/new')}
            style={({ pressed }) => [styles.inkButton, pressed && styles.pressed]}>
            <Text style={styles.inkLabel}>Create New</Text>
          </Pressable>
          <View style={styles.churchActions}>
            <Pressable
              onPress={() => router.push('/church/new')}
              style={({ pressed }) => [styles.ghostButton, pressed && styles.pressed]}>
              <Text style={styles.ghostLabel}>Start a church</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/church/join')}
              style={({ pressed }) => [styles.ghostButton, pressed && styles.pressed]}>
              <Text style={styles.ghostLabel}>Join a church</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: PAGE,
  },
  content: {
    paddingHorizontal: 16,
    gap: 18,
  },
  header: {
    gap: 6,
    paddingHorizontal: 6,
    paddingBottom: 8,
  },
  title: {
    color: INK,
    fontFamily: Fonts.bold,
    fontSize: 34,
    lineHeight: 46,
    letterSpacing: Tracking.heading,
  },
  lede: {
    color: INK_MUTED,
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    maxWidth: 280,
  },
  stack: {
    overflow: 'visible',
  },
  actions: {
    gap: 10,
    marginTop: 8,
  },
  inkButton: {
    minHeight: 56,
    borderRadius: 28,
    backgroundColor: INK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inkLabel: {
    color: '#F6F3EE',
    fontFamily: Fonts.medium,
    fontSize: 16,
  },
  churchActions: {
    flexDirection: 'row',
    gap: 8,
  },
  ghostButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(28, 25, 23, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PAGE,
  },
  ghostLabel: {
    color: INK,
    fontFamily: Fonts.medium,
    fontSize: 14,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
});
