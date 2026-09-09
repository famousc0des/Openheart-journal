import { NamedIcon } from '@/components/ui/icon';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Screen } from '@/components/ui/screen';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { biometricUnlockAvailable, deletePin, setPin, verifyPin } from '@/lib/app-lock';
import { useScalar } from '@/lib/scalar-store';
import { biometricUnlockStore, pinEnabledStore } from '@/lib/stores';

type DraftMode = 'off' | 'create' | 'confirm' | 'disable';

export default function LockSettingsScreen() {
  const theme = useTheme();
  const pinEnabled = useScalar(pinEnabledStore);
  const biometricEnabled = useScalar(biometricUnlockStore);
  const [mode, setMode] = useState<DraftMode>('off');
  const [draft, setDraft] = useState('');
  const [pendingPin, setPendingPin] = useState('');
  const [error, setError] = useState('');
  const [biometricsReady, setBiometricsReady] = useState(false);

  useEffect(() => {
    void biometricUnlockAvailable().then(setBiometricsReady);
  }, []);

  function resetDraft() {
    setMode('off');
    setDraft('');
    setPendingPin('');
    setError('');
  }

  async function handleSubmit() {
    const pin = draft.trim();
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setError('Use a 4-digit PIN.');
      return;
    }

    if (mode === 'create') {
      setPendingPin(pin);
      setDraft('');
      setError('');
      setMode('confirm');
      return;
    }

    if (mode === 'confirm') {
      if (pin !== pendingPin) {
        setError('The PINs didn’t match. Try again.');
        setDraft('');
        setMode('create');
        setPendingPin('');
        return;
      }
      await setPin(pin);
      await pinEnabledStore.set(true);
      resetDraft();
      return;
    }

    if (mode === 'disable') {
      const ok = await verifyPin(pin);
      if (!ok) {
        setError('That PIN doesn’t match.');
        setDraft('');
        return;
      }
      await deletePin();
      await pinEnabledStore.set(false);
      await biometricUnlockStore.set(false);
      resetDraft();
    }
  }

  async function toggleBiometrics(value: boolean) {
    if (value && !biometricsReady) {
      Alert.alert('Not available', 'This device doesn’t have Face ID or a fingerprint enrolled.');
      return;
    }
    await biometricUnlockStore.set(value);
  }

  return (
    <Screen>
      <ThemedText themeColor="textSecondary">
        A PIN stays on this device. Face ID is optional once a PIN exists, so you always have a
        fallback.
      </ThemedText>

      <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <ThemedText type="smallBold">App lock</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {pinEnabled ? 'PIN required after you leave the app' : 'Off'}
            </ThemedText>
          </View>
          <Switch
            value={pinEnabled || mode !== 'off'}
            onValueChange={(value) => {
              if (value) {
                setMode('create');
                setError('');
                return;
              }
              if (pinEnabled) {
                setMode('disable');
                setError('');
                return;
              }
              resetDraft();
            }}
            trackColor={{ true: theme.accent }}
          />
        </View>

        {pinEnabled && (
          <View style={[styles.row, styles.rowBorder, { borderTopColor: theme.border }]}>
            <View style={{ flex: 1 }}>
              <ThemedText type="smallBold">Face ID / fingerprint</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Unlock without typing your PIN
              </ThemedText>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={(value) => void toggleBiometrics(value)}
              trackColor={{ true: theme.accent }}
            />
          </View>
        )}
      </View>

      {mode !== 'off' && (
        <View style={{ gap: Spacing.two }}>
          <ThemedText type="smallBold">
            {mode === 'create'
              ? 'Choose a 4-digit PIN'
              : mode === 'confirm'
                ? 'Confirm your PIN'
                : 'Enter your PIN to turn lock off'}
          </ThemedText>
          <TextInput
            value={draft}
            onChangeText={(text) => {
              setDraft(text.replace(/\D/g, '').slice(0, 4));
              setError('');
            }}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            placeholder="••••"
            placeholderTextColor={theme.textSecondary}
            onSubmitEditing={() => void handleSubmit()}
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
          />
          {error ? (
            <ThemedText type="small" themeColor="danger">
              {error}
            </ThemedText>
          ) : null}
          <Pressable
            onPress={() => void handleSubmit()}
            style={[styles.button, { backgroundColor: theme.primary }]}>
            <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
              {mode === 'disable' ? 'Turn off lock' : 'Continue'}
            </ThemedText>
          </Pressable>
        </View>
      )}

      {pinEnabled && mode === 'off' && (
        <Pressable
          onPress={() => {
            setMode('create');
            setError('');
          }}
          style={styles.linkRow}>
          <NamedIcon name="keypad-outline" size={18} color={theme.accent} />
          <ThemedText type="smallBold" themeColor="accent">
            Change PIN
          </ThemedText>
        </Pressable>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.large,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  rowBorder: {
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    minHeight: 52,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
    fontFamily: Fonts.regular,
    fontSize: 22,
    letterSpacing: 8,
    borderWidth: 1,
  },
  button: {
    minHeight: 50,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
  },
});
