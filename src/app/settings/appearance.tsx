import { NamedIcon } from '@/components/ui/icon';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Pill } from '@/components/ui/pill';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { setThemePreference, useTheme } from '@/hooks/use-theme';
import { ACCENT_PRESETS } from '@/lib/color';
import { useScalar } from '@/lib/scalar-store';
import { accentOverrideStore, isPremiumStore, themePreferenceStore } from '@/lib/stores';
import { ThemePreference } from '@/lib/types';

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function AppearanceScreen() {
  const theme = useTheme();
  const isPremium = useScalar(isPremiumStore);
  const accentOverride = useScalar(accentOverrideStore);
  const themePreference = useScalar(themePreferenceStore);

  if (!isPremium) {
    return (
      <Screen>
        <ThemedText themeColor="textSecondary">Light, dark, or follow the phone. This is always free.</ThemedText>
        <View style={styles.themeRow}>
          {THEME_OPTIONS.map((option) => (
            <Pill
              key={option.value}
              label={option.label}
              active={themePreference === option.value}
              onPress={() => void setThemePreference(option.value)}
            />
          ))}
        </View>
        <View style={styles.lockedBlock}>
          <View style={[styles.lockIcon, { backgroundColor: theme.accentSoft }]}>
            <NamedIcon name="color-palette" size={32} color={theme.accent} />
          </View>
          <ThemedText type="subtitle" style={styles.lockedTitle}>
            Custom colors are a premium feature
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.lockedBody}>
            Everything that touches your own words stays free forever. Accent colors are part of
            Openheart Premium.
          </ThemedText>
          <Pressable
            onPress={() => isPremiumStore.set(true)}
            style={[styles.previewButton, { backgroundColor: theme.primary }]}>
            <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
              Preview premium
            </ThemedText>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ThemedText themeColor="textSecondary">Light, dark, or follow the phone. This is always free.</ThemedText>
      <View style={styles.themeRow}>
        {THEME_OPTIONS.map((option) => (
          <Pill
            key={option.value}
            label={option.label}
            active={themePreference === option.value}
            onPress={() => void setThemePreference(option.value)}
          />
        ))}
      </View>
      <ThemedText themeColor="textSecondary">Pick an accent color used across buttons, links, and highlights.</ThemedText>
      <View style={styles.grid}>
        {ACCENT_PRESETS.map((preset) => {
          const active = accentOverride === preset.value || (!accentOverride && preset.value === '#3B82F6');
          return (
            <Pressable
              key={preset.value}
              onPress={() => accentOverrideStore.set(preset.value)}
              style={styles.swatchWrap}>
              <View style={[styles.swatch, { backgroundColor: preset.value }]}>
                {active && <NamedIcon name="checkmark" size={22} color="#fff" />}
              </View>
              <ThemedText type="small">{preset.name}</ThemedText>
            </Pressable>
          );
        })}
      </View>
      <Pressable onPress={() => accentOverrideStore.set(null)}>
        <ThemedText type="link" themeColor="accent">
          Reset to default
        </ThemedText>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  themeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  lockedBlock: {
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.four,
  },
  lockIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedTitle: {
    fontSize: 20,
    textAlign: 'center',
  },
  lockedBody: {
    textAlign: 'center',
    lineHeight: 22,
  },
  previewButton: {
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: Radius.pill,
    marginTop: Spacing.two,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.four,
  },
  swatchWrap: {
    alignItems: 'center',
    gap: Spacing.one,
    width: 80,
  },
  swatch: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
