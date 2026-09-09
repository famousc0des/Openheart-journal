import type { CircleMember, UserCircle } from '@/lib/types';

export type CircleKind = NonNullable<UserCircle['kind']>;

export const CIRCLE_TYPES: Record<CircleKind, { label: string; limit: number | null }> = {
  cord: { label: 'Cord', limit: 3 },
  fellowship: { label: 'Fellowship', limit: 12 },
  custom: { label: 'Your group', limit: null },
};

export function circleMemberLimit(circle: UserCircle): number | null {
  return circle.memberLimit === undefined ? CIRCLE_TYPES[circle.kind ?? 'cord'].limit : circle.memberLimit;
}

/** Legacy demo records are retained in storage, but aren't people the user added. */
export function membersOfCircle(members: CircleMember[], circleId: string): CircleMember[] {
  return members.filter((member) => member.circleId === circleId && !member.id.startsWith('dummy-member-'));
}

export function normalizeMemberName(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').trim().replace(/\s+/g, ' ').toLowerCase();
}

export function searchMembers(members: CircleMember[], query: string): CircleMember[] {
  const words = normalizeMemberName(query).split(' ').filter(Boolean);
  return members.filter((member) => words.every((word) => normalizeMemberName(member.name).includes(word)));
}

export function circleLimitError(value: string, memberCount: number): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const limit = Number(trimmed);
  if (!/^\d+$/.test(trimmed) || !Number.isSafeInteger(limit) || limit < 1) {
    return 'Enter a whole number of at least 1, or leave blank for no limit.';
  }
  if (limit < memberCount) return `You already have ${memberCount} people. Choose at least ${memberCount}.`;
  return null;
}
