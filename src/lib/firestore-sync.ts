import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  type DocumentData,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { authUserStore } from '@/lib/firebase-auth';
import { readStorage, writeStorage, removeStorage } from '@/lib/encrypted-storage';

interface WithId {
  id: string;
}

function stripUndefined(data: DocumentData): DocumentData {
  const out: DocumentData = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) out[key] = value;
  }
  return out;
}

/**
 * Mirrors the CollectionStore public API (add/update/remove/clear/subscribe/
 * getSnapshot) but backs it with a live Firestore collection at
 * `users/{uid}/{name}`, scoped to whichever account is currently signed in.
 * A per-account encrypted local cache keeps the UI populated instantly and
 * offline; Firestore is the source of truth once a snapshot arrives.
 */
export class FirestoreCollectionStore<T extends WithId> {
  private items: T[] = [];
  private listeners = new Set<() => void>();
  private ready = false;
  private currentUid: string | null | undefined = undefined;
  private receivedSnapshot = false;
  private unsubscribeSnapshot: (() => void) | undefined;

  constructor(private name: string) {
    authUserStore.subscribe(() => this.handleAuthChange());
    this.handleAuthChange();
  }

  private handleAuthChange() {
    const uid = authUserStore.getSnapshot()?.uid ?? null;
    if (uid === this.currentUid) return;
    this.currentUid = uid;
    this.unsubscribeSnapshot?.();
    this.unsubscribeSnapshot = undefined;
    this.receivedSnapshot = false;
    this.items = [];

    if (!uid) {
      this.ready = true;
      this.emit();
      return;
    }

    this.ready = false;
    this.emit();
    void this.loadLocalCache(uid);
    this.attachListener(uid);
  }

  private cacheKey(uid: string) {
    return `openheart.${this.name}.v1.${uid}`;
  }

  private async loadLocalCache(uid: string) {
    try {
      const raw = await readStorage(this.cacheKey(uid));
      if (this.currentUid !== uid || this.receivedSnapshot || !raw) return;
      this.items = JSON.parse(raw) as T[];
      this.ready = true;
      this.emit();
    } catch {
      // fall through to the live listener
    }
  }

  private persistLocalCache(uid: string) {
    void writeStorage(this.cacheKey(uid), JSON.stringify(this.items)).catch(() => {});
  }

  private attachListener(uid: string) {
    const colRef = collection(db, 'users', uid, this.name);
    this.unsubscribeSnapshot = onSnapshot(
      colRef,
      (snapshot) => {
        if (this.currentUid !== uid) return;
        this.receivedSnapshot = true;
        this.items = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as T);
        this.ready = true;
        this.emit();
        this.persistLocalCache(uid);
      },
      (error) => {
        console.warn(`Firestore listener failed for users/${uid}/${this.name}:`, error);
        this.ready = true;
        this.emit();
      }
    );
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
    if (this.ready) return;
    await new Promise<void>((resolve) => {
      const unsubscribe = this.subscribe(() => {
        if (this.ready) {
          unsubscribe();
          resolve();
        }
      });
    });
  }

  getById(id: string): T | undefined {
    return this.items.find((item) => item.id === id);
  }

  add(item: T) {
    this.items = [item, ...this.items];
    this.emit();
    const uid = this.currentUid;
    if (!uid) return;
    this.persistLocalCache(uid);
    const { id, ...rest } = item as T & { id: string };
    void setDoc(doc(db, 'users', uid, this.name, id), stripUndefined(rest)).catch((error) => {
      console.warn(`Failed to write ${this.name}/${id}:`, error);
    });
  }

  update(id: string, patch: Partial<T>) {
    this.items = this.items.map((item) => (item.id === id ? { ...item, ...patch } : item));
    this.emit();
    const uid = this.currentUid;
    if (!uid) return;
    this.persistLocalCache(uid);
    const updated = this.items.find((item) => item.id === id);
    if (!updated) return;
    const { id: _dropped, ...rest } = updated as T & { id: string };
    void setDoc(doc(db, 'users', uid, this.name, id), stripUndefined(rest), { merge: true }).catch(
      (error) => {
        console.warn(`Failed to update ${this.name}/${id}:`, error);
      }
    );
  }

  remove(id: string) {
    this.items = this.items.filter((item) => item.id !== id);
    this.emit();
    const uid = this.currentUid;
    if (!uid) return;
    this.persistLocalCache(uid);
    void deleteDoc(doc(db, 'users', uid, this.name, id)).catch((error) => {
      console.warn(`Failed to delete ${this.name}/${id}:`, error);
    });
  }

  async clear() {
    const uid = this.currentUid;
    const staleIds = this.items.map((item) => item.id);
    this.items = [];
    this.emit();
    if (!uid) return;
    await removeStorage(this.cacheKey(uid));
    await Promise.all(
      staleIds.map((id) =>
        deleteDoc(doc(db, 'users', uid, this.name, id)).catch(() => {})
      )
    );
  }
}

/**
 * Mirrors the ScalarStore public API but stores its value as one field on the
 * shared `users/{uid}` profile document, so per-user settings and profile
 * data follow the account across devices.
 */
export class FirestoreScalarStore<T> {
  private value: T;
  private hydrated = false;
  private listeners = new Set<() => void>();
  private currentUid: string | null | undefined = undefined;
  private receivedSnapshot = false;
  private unsubscribeSnapshot: (() => void) | undefined;

  constructor(
    private field: string,
    private defaultValue: T
  ) {
    this.value = defaultValue;
    authUserStore.subscribe(() => this.handleAuthChange());
    this.handleAuthChange();
  }

  private handleAuthChange() {
    const uid = authUserStore.getSnapshot()?.uid ?? null;
    if (uid === this.currentUid) return;
    this.currentUid = uid;
    this.unsubscribeSnapshot?.();
    this.unsubscribeSnapshot = undefined;
    this.receivedSnapshot = false;
    this.value = this.defaultValue;

    if (!uid) {
      this.hydrated = true;
      this.emit();
      return;
    }

    this.hydrated = false;
    this.emit();
    void this.loadLocalCache(uid);
    this.attachListener(uid);
  }

  private cacheKey(uid: string) {
    return `openheart.profile.${this.field}.v1.${uid}`;
  }

  private async loadLocalCache(uid: string) {
    try {
      const raw = await readStorage(this.cacheKey(uid));
      if (this.currentUid !== uid || this.receivedSnapshot || raw === null) return;
      this.value = JSON.parse(raw) as T;
      this.hydrated = true;
      this.emit();
    } catch {
      // fall through to the live listener
    }
  }

  private persistLocalCache(uid: string) {
    void writeStorage(this.cacheKey(uid), JSON.stringify(this.value)).catch(() => {});
  }

  private attachListener(uid: string) {
    this.unsubscribeSnapshot = onSnapshot(
      doc(db, 'users', uid),
      (snapshot) => {
        if (this.currentUid !== uid) return;
        this.receivedSnapshot = true;
        const data = snapshot.data();
        this.value = data && this.field in data ? (data[this.field] as T) : this.defaultValue;
        this.hydrated = true;
        this.emit();
        this.persistLocalCache(uid);
      },
      (error) => {
        console.warn(`Firestore listener failed for users/${uid} field ${this.field}:`, error);
        this.hydrated = true;
        this.emit();
      }
    );
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
    const uid = this.currentUid;
    if (!uid) return;
    this.persistLocalCache(uid);
    try {
      await setDoc(doc(db, 'users', uid), { [this.field]: value }, { merge: true });
    } catch (error) {
      console.warn(`Failed to write profile field ${this.field}:`, error);
    }
  }

  async clear() {
    await this.set(this.defaultValue);
  }
}
