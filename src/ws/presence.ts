import { realtime } from './client.js';
import { fetchPresence } from '../api/endpoints.js';
import type { PresenceUpdate } from '../api/types.js';

/** In-memory store of currently online user ids, kept fresh by the realtime socket. */

const online = new Set<string>();
const listeners = new Set<() => void>();
let bootstrapped = false;

function notify(): void {
  for (const fn of listeners) {
    fn();
  }
}

/** Subscribe to presence changes; returns an unsubscribe function. */
export function subscribePresence(fn: () => void): () => void {
  if (!bootstrapped) {
    void bootstrapPresence();
  }
  listeners.add(fn);
  fn();
  return () => {
    listeners.delete(fn);
  };
}

/** Register live handler and seed the store with the current online list. */
export async function bootstrapPresence(): Promise<void> {
  if (bootstrapped) return;
  bootstrapped = true;
  realtime.on('presence', (update: PresenceUpdate) => {
    if (update.online) {
      online.add(update.user_id);
    } else {
      online.delete(update.user_id);
    }
    notify();
  });
  try {
    const ids = await fetchPresence();
    online.clear();
    for (const id of ids) {
      online.add(id);
    }
    notify();
  } catch {
    // backend unreachable — presence stays empty
  }
}

export function isOnline(userID: string): boolean {
  return online.has(userID);
}