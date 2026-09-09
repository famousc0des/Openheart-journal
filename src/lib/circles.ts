import * as Linking from 'expo-linking';
import { Share } from 'react-native';

import { createId } from '@/lib/id';
import { accountEmailStore, circleInviteStore, circleMemberStore, displayNameStore } from '@/lib/stores';
import { UserCircle } from '@/lib/types';

export { CIRCLE_TYPES, type CircleKind } from '@/lib/circle-membership';
import { circleMemberLimit, membersOfCircle } from '@/lib/circle-membership';

export const BUILT_IN_CIRCLES: UserCircle[] = [
  { id: 'openheart-cord', createdAt: '2026-01-01T00:00:00.000Z', name: 'Cord', kind: 'cord' },
  {
    id: 'openheart-fellowship',
    createdAt: '2026-01-01T00:00:00.000Z',
    name: 'Fellowship',
    kind: 'fellowship',
  },
];

const AVATAR_PASTELS = ['#DCEBFA', '#DFF3E7', '#FDEBDD', '#EEE8FB', '#FBE5EA', '#FBF3D8'];

/** Stable pastel for a member's initial avatar, derived from their name. */
export function pastelFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) % 997;
  return AVATAR_PASTELS[hash % AVATAR_PASTELS.length];
}

export function withBuiltInCircles(circles: UserCircle[]): UserCircle[] {
  return [
    ...BUILT_IN_CIRCLES.map((builtIn) => ({ ...builtIn, ...circles.find((circle) => circle.id === builtIn.id) })),
    ...circles.filter((circle) => !BUILT_IN_CIRCLES.some((builtIn) => builtIn.id === circle.id)),
  ];
}

export function shareCircleInvite(circle: UserCircle) {
  const limit = circleMemberLimit(circle);
  const memberCount = membersOfCircle(circleMemberStore.getSnapshot(), circle.id).length;
  if (limit !== null && memberCount >= limit) {
    return Promise.resolve();
  }

  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  const ownerName =
    displayNameStore.getSnapshot().trim() ||
    accountEmailStore.getSnapshot().split('@')[0] ||
    'An Openheart member';

  circleInviteStore.add({
    id: createId(),
    createdAt: new Date().toISOString(),
    code,
    circleId: circle.id,
  });

  const inviteUrl = Linking.createURL('circle/invite', {
    queryParams: { code, circleId: circle.id, circleName: circle.name, ownerName },
  });

  return Share.share({
    title: `Join ${circle.name} on Openheart`,
    message: `${ownerName} has invited you to join ${circle.name} on Openheart.\n\n${inviteUrl}`,
    url: inviteUrl,
  }).catch(() => {});
}
