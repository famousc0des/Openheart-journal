import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CircleDeck, type CircleDeckHandle, type CircleDeckItem } from '@/components/circle-deck';
import { HeaderAddButton } from '@/components/ui/header-add-button';
import { Fonts, Tracking } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { defaultCoverUri, relativeCircleDate } from '@/lib/circle-covers';
import { CIRCLE_TYPES, shareCircleInvite, withBuiltInCircles } from '@/lib/circles';
import { circleMemberLimit, membersOfCircle } from '@/lib/circle-membership';
import { useCollection } from '@/lib/collection-store';
import { churchStore, circleMemberStore, circlesStore } from '@/lib/stores';
import { UserCircle } from '@/lib/types';
import { EmojiText } from '@/lib/with-emoji-fallback';


function circleMeta(circle: UserCircle, memberCount: number) {
  const limit = circleMemberLimit(circle);
  if (limit === null) {
    return memberCount === 1 ? '1 person' : `${memberCount} people`;
  }
  return `${memberCount} of ${limit}`;
}

function circleLine(circle: UserCircle, memberCount: number) {
  const limit = circleMemberLimit(circle);
  if (limit === null) {
    return `${memberCount} ${memberCount === 1 ? 'person' : 'people'} in this group.`;
  }
  const left = limit - memberCount;
  if (left <= 0) return `${circle.name} is full.`;
  return left === 1 ? 'One seat still open.' : `${left} seats still open.`;
}

export default function CircleScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const circles = useCollection(circlesStore);
  const members = useCollection(circleMemberStore);
  const churches = useCollection(churchStore);
  const displayedCircles = withBuiltInCircles(circles);
  const deckRef = useRef<CircleDeckHandle>(null);
  const [frontId, setFrontId] = useState<string | null>(null);

  const items = useMemo<CircleDeckItem[]>(() => {
    const circleCards = displayedCircles.map((circle) => {
      const circleMembers = membersOfCircle(members, circle.id);
      const type = CIRCLE_TYPES[circle.kind ?? 'cord'];
      const limit = circleMemberLimit(circle);
      return {
        id: circle.id,
        name: circle.name,
        kindLabel: type.label,
        body: circleMeta(circle, circleMembers.length),
        footerLine: relativeCircleDate(circle.createdAt) || circleLine(circle, circleMembers.length),
        badge: limit === null ? circleMembers.length : `${circleMembers.length}/${limit}`,
        members: circleMembers.map((member) => ({ name: member.name })),
        canInvite: limit === null || circleMembers.length < limit,
        variant: 'circle' as const,
        coverUri: circle.coverUri,
      };
    });

    const churchCards = churches.map((church) => ({
      id: church.id,
      name: church.name,
      kindLabel: 'Church',
      body: `${church.memberCount} ${church.memberCount === 1 ? 'member' : 'members'}`,
      footerLine: relativeCircleDate(church.createdAt) || `Owned by ${church.ownerNames[0]}`,
      badge: church.memberCount,
      members: church.ownerNames.map((name) => ({ name })),
      canInvite: false,
      variant: 'church' as const,
      coverUri: defaultCoverUri(church.id, 'church'),
    }));

    return [...circleCards, ...churchCards];
  }, [churches, displayedCircles, members]);

  useEffect(() => {
    if (items.length === 0) {
      setFrontId(null);
      return;
    }
    if (!frontId || !items.some((item) => item.id === frontId)) {
      setFrontId(items[0].id);
    }
  }, [frontId, items]);

  return (
    <View style={styles.page}>
      <ScrollView
        bounces={false}
        alwaysBounceVertical={false}
        nestedScrollEnabled
        overScrollMode="never"
        removeClippedSubviews={false}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 10, paddingBottom: 128 + insets.bottom },
        ]}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Circle</Text>
            <HeaderAddButton
              accessibilityLabel="Create a circle"
              onPress={() => router.push('/circle/new')}
            />
          </View>
          <Text style={styles.lede}>Notes from the people around you.</Text>
        </View>

        {items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No circles yet</Text>
            <Text style={styles.emptyBody}>Start a group for the people who walk with you.</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Create a circle"
              onPress={() => router.push('/circle/new')}
              style={({ pressed }) => [
                styles.inkButton,
                { backgroundColor: theme.primary },
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.inkLabel, { color: theme.onPrimary }]}>Create a circle</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <ScrollView
              horizontal
              bounces={false}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
              accessibilityRole="tablist">
              {items.map((item) => {
                const selected = item.id === frontId;
                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="tab"
                    accessibilityState={{ selected }}
                    accessibilityLabel={item.name}
                    onPress={() => {
                      setFrontId(item.id);
                      deckRef.current?.select(item.id);
                    }}
                    style={({ pressed }) => [
                      styles.chip,
                      selected ? { backgroundColor: theme.primary } : styles.chipOff,
                      pressed && styles.pressed,
                    ]}>
                    <EmojiText
                      style={[
                        styles.chipLabel,
                        selected ? { color: theme.onPrimary } : styles.chipLabelOff,
                      ]}
                      numberOfLines={1}>
                      {item.name}
                    </EmojiText>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View collapsable={false} style={styles.deckSlot}>
              <CircleDeck
                ref={deckRef}
                items={items}
                frontId={frontId}
                onFrontChange={setFrontId}
                onOpen={(item) => {
                  if (item.variant === 'church') {
                    router.push({ pathname: '/church/[id]', params: { id: item.id } });
                    return;
                  }
                  router.push({ pathname: '/circle/[id]', params: { id: item.id } });
                }}
                onInvite={(item) => {
                  const circle = displayedCircles.find((entry) => entry.id === item.id);
                  if (circle) void shareCircleInvite(circle);
                }}
              />
            </View>
          </>
        )}

        <View style={styles.actions}>
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

const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scroll: {
    overflow: 'visible',
  },
  content: {
    paddingHorizontal: 16,
    gap: 18,
    overflow: 'visible',
  },
  deckSlot: {
    overflow: 'visible',
    zIndex: 2,
  },
  header: {
    gap: 6,
    paddingHorizontal: 6,
    paddingBottom: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    flexShrink: 1,
    color: theme.text,
    fontFamily: Fonts.bold,
    fontSize: 34,
    lineHeight: 46,
    letterSpacing: Tracking.heading,
  },
  lede: {
    color: theme.textSecondary,
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    maxWidth: 280,
  },
  chips: {
    gap: 8,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  chip: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 180,
  },
  chipOff: {
    backgroundColor: theme.background,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
  },
  chipLabel: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  chipLabelOff: {
    color: theme.text,
  },
  empty: {
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: theme.text,
    fontFamily: Fonts.bold,
    fontSize: 22,
    lineHeight: 30,
    textAlign: 'center',
  },
  emptyBody: {
    color: theme.textSecondary,
    fontFamily: Fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 260,
    marginBottom: 8,
  },
  actions: {
    gap: 10,
    marginTop: 4,
  },
  inkButton: {
    minHeight: 56,
    minWidth: 200,
    paddingHorizontal: 24,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inkLabel: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    lineHeight: 22,
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
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.background,
  },
  ghostLabel: {
    color: theme.text,
    fontFamily: Fonts.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
});
