import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { hexToRgba } from '@/lib/color';
import { useScalar } from '@/lib/scalar-store';
import { accentOverrideStore } from '@/lib/stores';

export function useTheme() {
  const scheme = useColorScheme();
  const accentOverride = useScalar(accentOverrideStore);
  const theme = scheme === 'unspecified' ? 'light' : scheme;
  const base = Colors[theme];

  if (!accentOverride) return base;

  return {
    ...base,
    accent: accentOverride,
    accentSoft: hexToRgba(accentOverride, theme === 'dark' ? 0.28 : 0.16),
  };
}
