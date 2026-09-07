import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { authenticateWithBiometrics, verifyPin } from '@/lib/app-lock';
import { useScalar } from '@/lib/scalar-store';
import { biometricUnlockStore, isLockedStore } from '@/lib/stores';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'] as const;

export function AppLockScreen() {
  const theme = useTheme();
  const biometricEnabled = useScalar(biometricUnlockStore);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!biometricEnabled) return;
    void authenticateWithBiometrics().then((ok) => {
      if (ok) isLockedStore.set(false);
    });
  }, [biometricEnabled]);

  async function submit(nextPin: string) {
    if (nextPin.length < 4) return;
    const ok = await verifyPin(nextPin);
    if (ok) {
      setPin('');
      setError('');
      isLockedStore.set(false);
      return;
    }
    setPin('');
    setError('That PIN doesn’t match.');
  }

  function pressKey(key: (typeof KEYS)[number]) {
    if (!key) return;
    setError('');
    if (key === 'del') {
      setPin((current) => current.slice(0, -1));
      return;
    }
    const next = (pin + key).slice(0, 4);
    setPin(next);
    if (next.length === 4) void submit(next);
  }

  return (
    <View style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <View style={styles.body}>
          <View style={[styles.heart, { backgroundColor: theme.accentSoft, borderColor: theme.border }]}>
            <Ionicons name="lock-closed" size={28} color={theme.accent} />
          </View>
          <ThemedText style={styles.title}>Openheart is locked</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.subtitle}>
            Enter your PIN to return to your journal.
          </ThemedText>

          <View style={styles.dots}>
            {[0, 1, 2, 3].map((index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor: index < pin.length ? theme.accent : 'transparent',
                    borderColor: theme.text,
                  },
                ]}
              />
            ))}
          </View>
          {error ? (
            <ThemedText type="small" themeColor="danger">
              {error}
            </ThemedText>
          ) : (
            <View style={styles.errorSpacer} />
          )}

          <View style={styles.pad}>
            {KEYS.map((key) => (
              <Pressable
                key={key || 'blank'}
                disabled={!key}
                onPress={() => pressKey(key)}
                style={({ pressed }) => [
                  styles.key,
                  { backgroundColor: key ? theme.backgroundElement : 'transparent' },
                  pressed && key ? { opacity: 0.7 } : null,
                ]}>
                {key === 'del' ? (
                  <Ionicons name="backspace-outline" size={22} color={theme.text} />
                ) : (
                  <ThemedText style={styles.keyLabel}>{key}</ThemedText>
                )}
              </Pressable>
            ))}
          </View>

          {biometricEnabled && (
            <Pressable
              onPress={() =>
                void authenticateWithBiometrics().then((ok) => {
                  if (ok) isLockedStore.set(false);
                })
              }
              style={styles.bioButton}>
              <Ionicons name="scan-outline" size={18} color={theme.accent} />
              <ThemedText type="smallBold" themeColor="accent">
                Use Face ID or fingerprint
              </ThemedText>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    gap: Spacing.two,
  },
  heart: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.two,
  },
  title: {
    fontFamily: Fonts.regular,
    fontSize: 26,
    lineHeight: 36,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: 280,
  },
  dots: {
    flexDirection: 'row',
    gap: 12,
    marginTop: Spacing.three,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
  },
  errorSpacer: { height: 20 },
  pad: {
    width: '100%',
    maxWidth: 280,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: Spacing.two,
  },
  key: {
    width: 72,
    height: 56,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyLabel: {
    fontFamily: Fonts.regular,
    fontSize: 22,
  },
  bioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    marginTop: Spacing.two,
  },
});
