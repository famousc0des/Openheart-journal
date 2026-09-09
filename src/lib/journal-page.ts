export const DEFAULT_PAGE_COLOR = '#FFFFFF';

export const PAGE_WASHES = [
  { id: 'white', label: 'White', value: DEFAULT_PAGE_COLOR, premium: false },
  { id: 'cream', label: 'Cream', value: '#F6F1E7', premium: true },
  { id: 'blush', label: 'Blush', value: '#F6E8E6', premium: true },
  { id: 'sage', label: 'Sage', value: '#E7EFE8', premium: true },
  { id: 'sky', label: 'Sky', value: '#E7F0F6', premium: true },
] as const;

export type PageWashId = (typeof PAGE_WASHES)[number]['id'];

export function resolvePageColor(value?: string) {
  return value?.trim() || DEFAULT_PAGE_COLOR;
}

export function isLightWash(hex: string) {
  const color = hex.replace('#', '');
  if (color.length !== 6) return true;
  const r = parseInt(color.slice(0, 2), 16);
  const g = parseInt(color.slice(2, 4), 16);
  const b = parseInt(color.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 160;
}
