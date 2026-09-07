export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const bigint = parseInt(
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean,
    16
  );
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const ACCENT_PRESETS = [
  { name: 'Signal', value: '#3B82F6' },
  { name: 'Iris', value: '#314EF0' },
  { name: 'Violet', value: '#8B5CF6' },
  { name: 'Fern', value: '#22C55E' },
  { name: 'Teal', value: '#0D9488' },
  { name: 'Ember', value: '#EA580C' },
  { name: 'Rose', value: '#EC4899' },
  { name: 'Slate', value: '#64748B' },
];
