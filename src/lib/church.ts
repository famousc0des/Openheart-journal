import { createId } from '@/lib/id';
import {
  accountEmailStore,
  churchStore,
  displayNameStore,
  sentChurchNoteStore,
  weeklyPostStore,
  weeklyReplyStore,
} from '@/lib/stores';

export const QUESTION_MAX_LENGTH = 200;

/** Reusable join code, longer than a Cord invite since it lives forever. */
export function generateJoinCode(): string {
  // Skip ambiguous characters (0/O, 1/I/L) so the code survives being read aloud.
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

export function normalizeJoinCode(input: string): string {
  const stripped = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (stripped.length <= 4) return stripped;
  return `${stripped.slice(0, 4)}-${stripped.slice(4, 8)}`;
}

/** The Wednesday the next weekly post goes out (this week's if still ahead). */
export function nextWednesday(from: Date = new Date()): Date {
  const target = new Date(from);
  const day = target.getDay();
  let daysAhead = (3 - day + 7) % 7;
  // If it's already Wednesday past 8am, aim for next week.
  if (daysAhead === 0 && from.getHours() >= 8) daysAhead = 7;
  target.setDate(target.getDate() + daysAhead);
  target.setHours(8, 0, 0, 0);
  return target;
}

export function currentUserName(): string {
  return (
    displayNameStore.getSnapshot().trim() ||
    accountEmailStore.getSnapshot().split('@')[0] ||
    'An Openheart member'
  );
}

export function formatWeekOf(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** Placeholder congregation so a new church is not an empty room of one. */
export const DUMMY_CHURCH_MEMBERS = [
  'Amara Okonkwo',
  'Daniel Reyes',
  'Grace Adeyemi',
  'Jordan Hale',
  'Mei Chen',
  'Samuel Ibe',
  'Hannah Cole',
] as const;

export const DUMMY_CHURCH_MEMBER_COUNT = 1 + DUMMY_CHURCH_MEMBERS.length;

function lastWednesdayMorning(from: Date = new Date()): Date {
  const target = new Date(from);
  const day = target.getDay();
  const daysBack = day === 3 ? 7 : (day - 3 + 7) % 7 || 7;
  target.setDate(target.getDate() - daysBack);
  target.setHours(8, 0, 0, 0);
  return target;
}

function dummyPostId(churchId: string) {
  return `dummy-week-${churchId}`;
}

/** Fills member count plus a past week of named replies, once per church. */
export function ensureDummyChurchMembers(churchId: string) {
  const church = churchStore.getById(churchId);
  if (!church) return;
  if (weeklyPostStore.getById(dummyPostId(churchId))) return;

  if (church.memberCount < DUMMY_CHURCH_MEMBER_COUNT) {
    churchStore.update(churchId, { memberCount: DUMMY_CHURCH_MEMBER_COUNT });
  }

  const scheduledFor = lastWednesdayMorning().toISOString();
  const postId = dummyPostId(churchId);
  weeklyPostStore.add({
    id: postId,
    churchId,
    createdAt: scheduledFor,
    scripture: 'Romans 8:28',
    points: ['God works in all things', 'Called according to purpose'],
    question: 'Where did you notice God at work this week, even in something small?',
    status: 'sent',
    scheduledFor,
  });

  const replyBodies: { name: (typeof DUMMY_CHURCH_MEMBERS)[number]; pointIndex: number | null; body: string }[] =
    [
      {
        name: 'Amara Okonkwo',
        pointIndex: 0,
        body: 'A delayed meeting turned into a longer walk. That quiet felt like mercy, not inconvenience.',
      },
      {
        name: 'Daniel Reyes',
        pointIndex: 1,
        body: 'I kept circling a decision at work. This point made me ask who I am actually following.',
      },
      {
        name: 'Grace Adeyemi',
        pointIndex: null,
        body: 'In the ordinary: my daughter asking to pray before school. I almost rushed past it.',
      },
      {
        name: 'Jordan Hale',
        pointIndex: 0,
        body: 'Hard week with family. I do not see the good yet, but I am trying to stay open.',
      },
      {
        name: 'Mei Chen',
        pointIndex: null,
        body: 'A neighbor brought soup when I was sick. I had not told anyone I needed help.',
      },
    ];

  replyBodies.forEach((reply, index) => {
    weeklyReplyStore.add({
      id: `dummy-reply-${churchId}-${index}`,
      churchId,
      postId,
      pointIndex: reply.pointIndex,
      body: reply.body,
      senderName: reply.name,
      createdAt: new Date(Date.parse(scheduledFor) + (index + 1) * 3600000).toISOString(),
    });
  });

  sentChurchNoteStore.add({
    id: `dummy-note-${churchId}-1`,
    sermonNoteId: createId(),
    churchId,
    senderName: 'Samuel Ibe',
    fieldsIncluded: ['title', 'notes'],
    title: 'Notes from Sunday',
    body: 'Rest is not laziness. Trust looks like stopping when I want to prove myself.',
    sentAt: new Date(Date.parse(scheduledFor) + 2 * 86400000).toISOString(),
  });
  sentChurchNoteStore.add({
    id: `dummy-note-${churchId}-2`,
    sermonNoteId: createId(),
    churchId,
    senderName: 'Hannah Cole',
    fieldsIncluded: ['notes'],
    body: 'Kept the tidied version private. The raw line that stayed with me: grace is not a wage.',
    sentAt: new Date(Date.parse(scheduledFor) + 3 * 86400000).toISOString(),
  });
}
