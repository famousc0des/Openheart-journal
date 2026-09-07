import * as Linking from 'expo-linking';
import { Share } from 'react-native';

import { createId } from '@/lib/id';
import { accountEmailStore, circleInviteStore, circleMemberStore, displayNameStore } from '@/lib/stores';
import { UserCircle } from '@/lib/types';

export type CircleKind = NonNullable<UserCircle['kind']>;

export const CIRCLE_TYPES: Record<CircleKind, { label: string; limit: number | null }> = {
  cord: { label: 'Cord', limit: 3 },
  fellowship: { label: 'Fellowship', limit: 12 },
  custom: { label: 'Your group', limit: null },
};

export const BUILT_IN_CIRCLES: UserCircle[] = [
  { id: 'openheart-cord', createdAt: '2026-01-01T00:00:00.000Z', name: 'Cord', kind: 'cord' },
  {
    id: 'openheart-fellowship',
    createdAt: '2026-01-01T00:00:00.000Z',
    name: 'Fellowship',
    kind: 'fellowship',
  },
];

/** Placeholder people so a circle is not an empty room. Leaves room under each limit. */
export const DUMMY_CIRCLE_MEMBERS: Record<CircleKind, readonly string[]> = {
  cord: ['Nia Blackwell', 'Caleb Okafor'],
  fellowship: [
    'Ruth Afolabi',
    'Eli Vargas',
    'Sanaa Whitfield',
    'Kwame Boateng',
    'Lila Moreau',
    'Theo Park',
    'Imani Brooks',
    'Yusuf Rahman',
  ],
  custom: ['Mara Ellison', 'Jonah Whitaker', 'Priya Nair', 'Levi Santos'],
};

function dummyMemberId(circleId: string, index: number) {
  return `dummy-member-${circleId}-${index}`;
}

const AVATAR_PASTELS = ['#DCEBFA', '#DFF3E7', '#FDEBDD', '#EEE8FB', '#FBE5EA', '#FBF3D8'];

/** Stable pastel for a member's initial avatar, derived from their name. */
export function pastelFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) % 997;
  return AVATAR_PASTELS[hash % AVATAR_PASTELS.length];
}

export function withBuiltInCircles(circles: UserCircle[]): UserCircle[] {
  return [
    ...BUILT_IN_CIRCLES,
    ...circles.filter((circle) => !BUILT_IN_CIRCLES.some((builtIn) => builtIn.id === circle.id)),
  ];
}

/** Fills named members once per circle, without exceeding the circle's size limit. */
export function ensureDummyCircleMembers(circle: UserCircle) {
  if (!circleMemberStore.isReady()) return;

  const kind = circle.kind ?? 'cord';
  const names = DUMMY_CIRCLE_MEMBERS[kind];
  const alreadySeeded = circleMemberStore
    .getSnapshot()
    .some((member) => member.circleId === circle.id && member.id.startsWith(`dummy-member-${circle.id}-`));
  if (alreadySeeded) return;

  const existingCount = circleMemberStore.getSnapshot().filter((member) => member.circleId === circle.id).length;
  const limit = CIRCLE_TYPES[kind].limit;
  const remaining = limit === null ? names.length : Math.max(0, limit - existingCount);

  names.slice(0, remaining).forEach((name, index) => {
    const id = dummyMemberId(circle.id, index);
    if (circleMemberStore.getById(id)) return;
    circleMemberStore.add({
      id,
      createdAt: '2026-03-12T14:00:00.000Z',
      name,
      circleId: circle.id,
    });
  });
}

export function ensureDummyMembersForCircles(circles: UserCircle[]) {
  withBuiltInCircles(circles).forEach(ensureDummyCircleMembers);
}

export function shareCircleInvite(circle: UserCircle) {
  const kind = circle.kind ?? 'cord';
  const limit = CIRCLE_TYPES[kind].limit;
  const memberCount = circleMemberStore.getSnapshot().filter((member) => member.circleId === circle.id)
    .length;
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
