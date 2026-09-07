import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { hexToRgba } from '@/lib/color';
import { useScalar } from '@/lib/scalar-store';
import { accentOverrideStore, themePreferenceStore } from '@/lib/stores';

export function useThemeScheme(): 'light' | 'dark' {
  const preference = useScalar(themePreferenceStore);
  const system = useColorScheme();
  if (preference === 'light' || preference === 'dark') return preference;
  return system === 'dark' ? 'dark' : 'light';
}

export function useTheme() {
  const scheme = useThemeScheme();
  const accentOverride = useScalar(accentOverrideStore);
  const base = Colors[scheme];

  if (!accentOverride) return base;

  return {
    ...base,
    accent: accentOverride,
    accentSoft: hexToRgba(accentOverride, 0.12),
    primary: accentOverride,
  };
}
