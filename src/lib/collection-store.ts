import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

interface WithId {
  id: string;
}

export class CollectionStore<T extends WithId> {
  private items: T[] = [];
  private listeners = new Set<() => void>();
  private ready = false;
  private loadPromise: Promise<void>;

  constructor(private storageKey: string) {
    this.loadPromise = this.load();
  }

  private async load() {
    try {
      const raw = await AsyncStorage.getItem(this.storageKey);
      this.items = raw ? (JSON.parse(raw) as T[]) : [];
    } catch {
      this.items = [];
    }
    this.ready = true;
    this.emit();
  }

  private async persist() {
    try {
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(this.items));
    } catch {
      // best-effort local persistence; nothing to fall back to on-device
    }
  }

  private emit() {
    this.listeners.forEach((listener) => listener());
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): T[] => this.items;

  isReady() {
    return this.ready;
  }

  async whenReady() {
    await this.loadPromise;
  }

  getById(id: string): T | undefined {
    return this.items.find((item) => item.id === id);
  }

  add(item: T) {
    this.items = [item, ...this.items];
    this.emit();
    this.persist();
  }

  update(id: string, patch: Partial<T>) {
    this.items = this.items.map((item) => (item.id === id ? { ...item, ...patch } : item));
    this.emit();
    this.persist();
  }

  remove(id: string) {
    this.items = this.items.filter((item) => item.id !== id);
    this.emit();
    this.persist();
  }
}

export function useCollection<T extends WithId>(store: CollectionStore<T>): T[] {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}
