import { useSyncExternalStore } from 'react';

import { readStorage, removeStorage, writeStorage } from '@/lib/encrypted-storage';

export class ScalarStore<T> {
  private value: T;
  private hydrated = false;
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
      const raw = await readStorage(this.storageKey);
      if (raw !== null) this.value = JSON.parse(raw) as T;
    } catch {
      this.value = this.defaultValue;
    }
    this.hydrated = true;
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

  getHydratedSnapshot = (): boolean => this.hydrated;

  async set(value: T) {
    this.value = value;
    this.emit();
    try {
      await writeStorage(this.storageKey, JSON.stringify(value));
    } catch {
      // best-effort local persistence
    }
  }

  async clear() {
    this.value = this.defaultValue;
    this.hydrated = true;
    this.emit();
    await removeStorage(this.storageKey);
  }
}

export class MemoryScalar<T> {
  private value: T;
  private listeners = new Set<() => void>();

  constructor(initialValue: T) {
    this.value = initialValue;
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): T => this.value;

  set(value: T) {
    this.value = value;
    this.listeners.forEach((listener) => listener());
  }
}

export function useScalar<T>(store: ScalarStore<T> | MemoryScalar<T>): T {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}

export function useScalarHydrated<T>(store: ScalarStore<T>): boolean {
  return useSyncExternalStore(store.subscribe, store.getHydratedSnapshot, store.getHydratedSnapshot);
}
