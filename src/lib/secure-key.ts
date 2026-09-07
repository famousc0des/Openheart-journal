import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const WEB_PREFIX = 'openheart.secure.';

export async function secureSet(key: string, value: string) {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(`${WEB_PREFIX}${key}`, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function secureGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return AsyncStorage.getItem(`${WEB_PREFIX}${key}`);
  }
  return SecureStore.getItemAsync(key);
}

export async function secureDelete(key: string) {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(`${WEB_PREFIX}${key}`);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
