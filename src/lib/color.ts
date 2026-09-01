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
  { name: 'Maroon', value: '#A83E3E' },
  { name: 'Amber', value: '#B8752E' },
  { name: 'Forest', value: '#3F6B4A' },
  { name: 'Teal', value: '#2E7D74' },
  { name: 'Indigo', value: '#4A4E9E' },
  { name: 'Plum', value: '#7A4E8C' },
  { name: 'Slate', value: '#4E5A66' },
  { name: 'Rose', value: '#B85C7A' },
];
