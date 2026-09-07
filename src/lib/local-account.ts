import * as Crypto from 'expo-crypto';

import { secureDelete, secureGet, secureSet } from '@/lib/secure-key';

const ACCOUNT_KEY = 'openheart.account.v1';

interface StoredAccount {
  email: string;
  salt: string;
  passwordHash: string;
}

async function hashSecret(secret: string, salt: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${secret}`);
}

async function randomSalt() {
  const bytes = await Crypto.getRandomBytesAsync(16);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function readAccount(): Promise<StoredAccount | null> {
  const raw = await secureGet(ACCOUNT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredAccount;
  } catch {
    return null;
  }
}

export async function getStoredAccountEmail(): Promise<string | null> {
  return (await readAccount())?.email ?? null;
}

export async function createLocalAccount(email: string, password: string) {
  const salt = await randomSalt();
  const passwordHash = await hashSecret(password, salt);
  const account: StoredAccount = {
    email: email.trim().toLowerCase(),
    salt,
    passwordHash,
  };
  await secureSet(ACCOUNT_KEY, JSON.stringify(account));
}

export async function verifyLocalAccount(email: string, password: string): Promise<boolean> {
  const account = await readAccount();
  if (!account) return false;
  if (account.email !== email.trim().toLowerCase()) return false;
  const passwordHash = await hashSecret(password, account.salt);
  return passwordHash === account.passwordHash;
}

export async function deleteLocalAccount() {
  await secureDelete(ACCOUNT_KEY);
}

export { hashSecret, randomSalt };
