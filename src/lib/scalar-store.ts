import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

export class ScalarStore<T> {
  private value: T;
  private listeners = new Set<() => void>();

  constructor(
    private storageKey: string,
    private defaultValue: T
  ) {
    this.value = defaultValue;
    this.load();
  }

  private async load() {
    try {
      const raw = await AsyncStorage.getItem(this.storageKey);
      if (raw !== null) this.value = JSON.parse(raw) as T;
    } catch {
      this.value = this.defaultValue;
    }
    this.emit();
  }

  private emit() {
    this.listeners.forEach((listener) => listener());
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): T => this.value;

  async set(value: T) {
    this.value = value;
    this.emit();
    try {
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(value));
    } catch {
      // best-effort local persistence
    }
  }
}

export function useScalar<T>(store: ScalarStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}
