import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ACCENT_PRESETS } from '@/lib/color';
import { useScalar } from '@/lib/scalar-store';
import { accentOverrideStore, isPremiumStore } from '@/lib/stores';

export default function AppearanceScreen() {
  const theme = useTheme();
  const isPremium = useScalar(isPremiumStore);
  const accentOverride = useScalar(accentOverrideStore);

  if (!isPremium) {
    return (
      <Screen contentContainerStyle={styles.lockedContent}>
        <View style={[styles.lockIcon, { backgroundColor: theme.accentSoft }]}>
          <Ionicons name="color-palette" size={32} color={theme.accent} />
        </View>
        <ThemedText type="subtitle" style={styles.lockedTitle}>
          Custom colors are a premium feature
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.lockedBody}>
          Everything that touches your own words stays free forever. Themes and accent colors are
          part of Openheart Premium.
        </ThemedText>
        <Pressable
          onPress={() => isPremiumStore.set(true)}
          style={[styles.previewButton, { backgroundColor: theme.accent }]}>
          <ThemedText type="smallBold" style={{ color: '#fff' }}>
            Preview premium
          </ThemedText>
        </Pressable>
      </Screen>
    );
  }

  return (
    <Screen>
      <ThemedText themeColor="textSecondary">Pick an accent color used across buttons, links, and highlights.</ThemedText>
      <View style={styles.grid}>
        {ACCENT_PRESETS.map((preset) => {
          const active = accentOverride === preset.value || (!accentOverride && preset.value === '#A83E3E');
          return (
            <Pressable
              key={preset.value}
              onPress={() => accentOverrideStore.set(preset.value)}
              style={styles.swatchWrap}>
              <View style={[styles.swatch, { backgroundColor: preset.value }]}>
                {active && <Ionicons name="checkmark" size={22} color="#fff" />}
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
  lockedContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.five,
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
