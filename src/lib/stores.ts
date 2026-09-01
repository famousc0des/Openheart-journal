import { CollectionStore } from '@/lib/collection-store';
import { ScalarStore } from '@/lib/scalar-store';
import { CircleInvite, CircleMember, JournalEntry, Prayer, SermonNote } from '@/lib/types';

export const journalStore = new CollectionStore<JournalEntry>('openheart.journal.v1');
export const prayerStore = new CollectionStore<Prayer>('openheart.prayers.v1');
export const sermonStore = new CollectionStore<SermonNote>('openheart.sermons.v1');
export const circleMemberStore = new CollectionStore<CircleMember>('openheart.circleMembers.v1');
export const circleInviteStore = new CollectionStore<CircleInvite>('openheart.circleInvites.v1');
export const displayNameStore = new ScalarStore<string>('openheart.displayName.v1', '');
export const isPremiumStore = new ScalarStore<boolean>('openheart.isPremium.v1', false);
export const accentOverrideStore = new ScalarStore<string | null>('openheart.accentOverride.v1', null);
