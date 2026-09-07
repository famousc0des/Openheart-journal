import { currentUserName } from '@/lib/church';
import { createId } from '@/lib/id';
import {
  circleCommentStore,
  circleShareStore,
  prayerStore,
} from '@/lib/stores';
import { CircleShare, CircleShareKind } from '@/lib/types';

export const COMMENT_MAX_LENGTH = 400;

export const SHARE_KIND_META: Record<
  CircleShareKind,
  { label: string; icon: 'bookmark-outline' | 'book-outline' | 'document-text-outline' | 'heart-outline' | 'home-outline' }
> = {
  verse: { label: 'Verse', icon: 'bookmark-outline' },
  journal: { label: 'Journal', icon: 'book-outline' },
  sermon: { label: 'Notes', icon: 'document-text-outline' },
  prayer: { label: 'Prayer', icon: 'heart-outline' },
  church: { label: 'Church', icon: 'home-outline' },
};

export interface ShareDraft {
  kind: CircleShareKind;
  sourceId: string;
  title: string;
  body: string;
}

export function findCircleShare(
  kind: CircleShareKind,
  sourceId: string,
  circleId: string
): CircleShare | undefined {
  return circleShareStore
    .getSnapshot()
    .find((share) => share.kind === kind && share.sourceId === sourceId && share.circleId === circleId);
}

export function isSharedToCircle(kind: CircleShareKind, sourceId: string, circleId: string): boolean {
  return Boolean(findCircleShare(kind, sourceId, circleId));
}

function syncPrayerCircleIds(sourceId: string, circleId: string, shared: boolean) {
  const prayer = prayerStore.getById(sourceId);
  if (!prayer) return;
  const current = prayer.sharedCircleIds ?? [];
  const next = shared
    ? current.includes(circleId)
      ? current
      : [...current, circleId]
    : current.filter((id) => id !== circleId);
  prayerStore.update(sourceId, { sharedCircleIds: next, updatedAt: new Date().toISOString() });
}

export function shareToCircle(circleId: string, draft: ShareDraft) {
  if (findCircleShare(draft.kind, draft.sourceId, circleId)) return;
  circleShareStore.add({
    id: createId(),
    createdAt: new Date().toISOString(),
    circleId,
    kind: draft.kind,
    sourceId: draft.sourceId,
    authorName: currentUserName(),
    title: draft.title.trim(),
    body: draft.body.trim(),
    likeCount: 0,
    likedByMe: false,
  });
  if (draft.kind === 'prayer') syncPrayerCircleIds(draft.sourceId, circleId, true);
}

export function toggleCircleShare(circleId: string, draft: ShareDraft) {
  const existing = findCircleShare(draft.kind, draft.sourceId, circleId);
  if (existing) {
    circleCommentStore
      .getSnapshot()
      .filter((comment) => comment.shareId === existing.id)
      .forEach((comment) => circleCommentStore.remove(comment.id));
    circleShareStore.remove(existing.id);
    if (draft.kind === 'prayer') syncPrayerCircleIds(draft.sourceId, circleId, false);
    return;
  }
  shareToCircle(circleId, draft);
}

/** Older prayer shares only stored circle ids. Turn those into commentable posts. */
export function backfillPrayerShares() {
  prayerStore.getSnapshot().forEach((prayer) => {
    (prayer.sharedCircleIds ?? []).forEach((circleId) => {
      const already = circleShareStore
        .getSnapshot()
        .some(
          (share) => share.kind === 'prayer' && share.sourceId === prayer.id && share.circleId === circleId
        );
      if (already) return;
      circleShareStore.add({
        id: createId(),
        createdAt: prayer.updatedAt,
        circleId,
        kind: 'prayer',
        sourceId: prayer.id,
        authorName: currentUserName(),
        title: prayer.title,
        body: prayer.body,
        likeCount: 0,
        likedByMe: false,
      });
    });
  });
}

export function addCircleComment(shareId: string, body: string, parentId: string | null) {
  const trimmed = body.trim().slice(0, COMMENT_MAX_LENGTH);
  if (!trimmed) return;
  circleCommentStore.add({
    id: createId(),
    createdAt: new Date().toISOString(),
    shareId,
    parentId,
    authorName: currentUserName(),
    body: trimmed,
    likeCount: 0,
    likedByMe: false,
  });
}

function toggleLikeCount(likedByMe: boolean | undefined, likeCount: number | undefined) {
  const liked = !likedByMe;
  return {
    likedByMe: liked,
    likeCount: Math.max(0, (likeCount ?? 0) + (liked ? 1 : -1)),
  };
}

export function toggleShareLike(shareId: string) {
  const share = circleShareStore.getById(shareId);
  if (!share) return;
  circleShareStore.update(shareId, toggleLikeCount(share.likedByMe, share.likeCount));
}

export function toggleCommentLike(commentId: string) {
  const comment = circleCommentStore.getById(commentId);
  if (!comment) return;
  circleCommentStore.update(commentId, toggleLikeCount(comment.likedByMe, comment.likeCount));
}
