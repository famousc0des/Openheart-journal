import type { ImageSource } from 'expo-image';

/** Bundled sunset cover for circles that have no user-picked `coverUri`. */
export const DEFAULT_CIRCLE_COVER: ImageSource = require('../../assets/images/circle-cover-default.jpg');

const CHURCH_COVERS = [
  'https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&w=900&h=1200&q=80',
  'https://images.unsplash.com/photo-1473177104440-ffee2f376098?auto=format&fit=crop&w=900&h=1200&q=80',
  'https://images.unsplash.com/photo-1548625149-fc4a29cf7092?auto=format&fit=crop&w=900&h=1200&q=80',
] as const;

function hashId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Church cards still pick from the church photo pool. Circles return nothing — use `circleCoverSource`. */
export function defaultCoverUri(id: string, variant: 'circle' | 'church'): string | undefined {
  if (variant !== 'church') return undefined;
  return CHURCH_COVERS[hashId(id) % CHURCH_COVERS.length];
}

export function circleCoverSource(coverUri?: string): ImageSource {
  if (coverUri) return { uri: coverUri };
  return DEFAULT_CIRCLE_COVER;
}

export function deckCoverSource(
  variant: 'circle' | 'church',
  id: string,
  coverUri?: string
): ImageSource {
  if (variant === 'church') {
    return { uri: coverUri || defaultCoverUri(id, 'church') || CHURCH_COVERS[0] };
  }
  return circleCoverSource(coverUri);
}

export function relativeCircleDate(iso: string) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const days = Math.round((Date.now() - then) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 14) return `${days} days ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
