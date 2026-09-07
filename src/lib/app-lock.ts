import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

import { hashSecret, randomSalt } from '@/lib/local-account';
import { secureDelete, secureGet, secureSet } from '@/lib/secure-key';

const PIN_KEY = 'openheart.pin.v1';

interface StoredPin {
  salt: string;
  hash: string;
}

async function readPin(): Promise<StoredPin | null> {
  const raw = await secureGet(PIN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredPin;
  } catch {
    return null;
  }
}

export async function hasPin(): Promise<boolean> {
  return (await readPin()) != null;
}

export async function setPin(pin: string) {
  const salt = await randomSalt();
  const stored: StoredPin = { salt, hash: await hashSecret(pin, salt) };
  await secureSet(PIN_KEY, JSON.stringify(stored));
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = await readPin();
  if (!stored) return false;
  return (await hashSecret(pin, stored.salt)) === stored.hash;
}

export async function deletePin() {
  await secureDelete(PIN_KEY);
}

export async function biometricUnlockAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const [hasHardware, enrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    return hasHardware && enrolled;
  } catch {
    return false;
  }
}

export async function authenticateWithBiometrics(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Openheart',
      cancelLabel: 'Use PIN',
      disableDeviceFallback: true,
    });
    return result.success;
  } catch {
    return false;
  }
}
