import { getApp, getApps, initializeApp } from 'firebase/app';
import type { Analytics } from 'firebase/analytics';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: 'AIzaSyBBCiIujl8kUf9hQ_EQxoyts1hX_9nGpzg',
  authDomain: 'openheart-journal.firebaseapp.com',
  projectId: 'openheart-journal',
  storageBucket: 'openheart-journal.firebasestorage.app',
  messagingSenderId: '581029770206',
  appId: '1:581029770206:web:5a7d79b14c336ac9ba234f',
  measurementId: 'G-TPE7PQRJSL',
};

// Reuse the default app during Fast Refresh.
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let analyticsPromise: Promise<Analytics | null> | undefined;

export function initializeFirebaseAnalytics(): Promise<Analytics | null> {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return Promise.resolve(null);
  }

  analyticsPromise ??= import('firebase/analytics')
    .then(async ({ getAnalytics, isSupported }) =>
      (await isSupported()) ? getAnalytics(app) : null,
    )
    .catch((error: unknown) => {
      console.warn('Firebase Analytics could not initialize:', error);
      return null;
    });

  return analyticsPromise;
}
