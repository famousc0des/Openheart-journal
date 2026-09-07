import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AESEncryptionKey,
  AESSealedData,
  aesDecryptAsync,
  aesEncryptAsync,
} from 'expo-crypto';

import { secureDelete, secureGet, secureSet } from '@/lib/secure-key';

const KEY_ID = 'openheart.aes-key.v1';
const CIPHER_PREFIX = 'ohenc1:';

let readyResolve: (() => void) | undefined;
const ready = new Promise<void>((resolve) => {
  readyResolve = resolve;
});

let encryptionKey: AESEncryptionKey | null = null;
let initStarted = false;

async function loadOrCreateKey(): Promise<AESEncryptionKey | null> {
  try {
    const stored = await secureGet(KEY_ID);
    if (stored) {
      return AESEncryptionKey.import(stored, 'hex');
    }
    const generated = await AESEncryptionKey.generate();
    await secureSet(KEY_ID, await generated.encoded('hex'));
    return generated;
  } catch {
    return null;
  }
}

export function initEncryption(): Promise<void> {
  if (!initStarted) {
    initStarted = true;
    void loadOrCreateKey()
      .then((key) => {
        encryptionKey = key;
      })
      .finally(() => readyResolve?.());
  }
  return ready;
}

export function whenEncryptionReady(): Promise<void> {
  return ready;
}

export async function resetEncryptionKey() {
  await secureDelete(KEY_ID);
  encryptionKey = await loadOrCreateKey();
}

export async function readStorage(key: string): Promise<string | null> {
  await ready;
  const raw = await AsyncStorage.getItem(key);
  if (raw == null) return null;
  if (!raw.startsWith(CIPHER_PREFIX)) return raw;
  if (!encryptionKey) return null;

  try {
    const sealed = AESSealedData.fromCombined(raw.slice(CIPHER_PREFIX.length));
    const decrypted = await aesDecryptAsync(sealed, encryptionKey);
    return typeof decrypted === 'string' ? decrypted : new TextDecoder().decode(decrypted);
  } catch {
    return null;
  }
}

export async function writeStorage(key: string, value: string) {
  await ready;
  if (!encryptionKey) {
    await AsyncStorage.setItem(key, value);
    return;
  }

  const sealed = await aesEncryptAsync(new TextEncoder().encode(value), encryptionKey);
  const combined = await sealed.combined('base64');
  await AsyncStorage.setItem(key, `${CIPHER_PREFIX}${combined}`);
}

export async function removeStorage(key: string) {
  await AsyncStorage.removeItem(key);
}

export async function wipeOpenheartStorage() {
  const keys = await AsyncStorage.getAllKeys();
  const ours = keys.filter(
    (key) => key.startsWith('openheart.') || key.startsWith('openheart.secure.')
  );
  if (ours.length > 0) await AsyncStorage.multiRemove(ours);
}

void initEncryption();
