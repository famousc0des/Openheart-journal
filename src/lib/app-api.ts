import Constants from 'expo-constants';
import { Platform } from 'react-native';

export function appApiBase(): string {
  const override = process.env.EXPO_PUBLIC_APP_ORIGIN?.replace(/\/$/, '');
  if (override) return override;

  if (Platform.OS === 'web' && typeof globalThis.location?.origin === 'string') {
    return globalThis.location.origin;
  }

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const looksLocal =
      hostUri.startsWith('localhost') ||
      hostUri.startsWith('127.') ||
      hostUri.startsWith('192.168.') ||
      hostUri.startsWith('10.') ||
      hostUri.startsWith('172.');
    return `${looksLocal ? 'http' : 'https'}://${hostUri}`;
  }

  return '';
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const raw = await response.text();
  let payload: (T & { error?: unknown }) | { error?: unknown } | null = null;
  if (raw.trim()) {
    try {
      payload = JSON.parse(raw) as T & { error?: unknown };
    } catch {
      throw new Error(
        response.ok
          ? 'The transcription service returned an incomplete response. Try again.'
          : 'The transcription service could not be reached. Restart Expo after setting web.output to server.'
      );
    }
  }
  if (!response.ok) {
    const message = typeof payload?.error === 'string' ? payload.error : 'The request failed.';
    throw new Error(message);
  }
  if (!payload) throw new Error('The request returned an empty response.');
  return payload as T;
}

export async function getAppJson<T>(path: string): Promise<T> {
  const response = await fetch(`${appApiBase()}${path}`, {
    headers: { Accept: 'application/json' },
  });
  return parseJsonResponse<T>(response);
}

export async function postAppJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${appApiBase()}${path}`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return parseJsonResponse<T>(response);
}
