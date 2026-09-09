import { getAccessToken } from '../auth/token.js';
import type { Notification, PresenceUpdate, PrivateMessage } from '../api/types.js';

/** Typed realtime events pushed by the MasonicCore `/ws` endpoint. */
export interface RealtimeEventMap {
  pm: PrivateMessage;
  notification: Notification;
  presence: PresenceUpdate;
}

export type RealtimeEventName = keyof RealtimeEventMap;

type AnyListener = (data: unknown) => void;

const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 30000;

/**
 * Realtime client for the `/ws` endpoint.
 *
 * Connects with the current access token, reconnects with exponential backoff
 * and dispatches typed events (`pm`, `notification`, `presence`) to listeners.
 */
export class RealtimeClient {
  private ws: WebSocket | null = null;
  private reconnectAttempt = 0;
  private retryTimer: number | null = null;
  private shouldReconnect = false;
  private online = false;
  private listeners: Record<RealtimeEventName, Set<AnyListener>> = {
    pm: new Set(),
    notification: new Set(),
    presence: new Set(),
  };
  private statusListeners = new Set<(online: boolean) => void>();

  get isOnline(): boolean {
    return this.online;
  }

  /** Open the socket if a token exists and the socket is not already open. */
  connect(): void {
    if (this.ws !== null) return;
    this.shouldReconnect = true;
    this.open();
  }

  /** Close the socket and stop any reconnect attempts. */
  disconnect(): void {
    this.shouldReconnect = false;
    this.clearTimer();
    const ws = this.ws;
    this.ws = null;
    ws?.close();
    this.setOnline(false);
  }

  /** Register a listener for one event type; returns an unsubscribe function. */
  on<K extends RealtimeEventName>(type: K, fn: (data: RealtimeEventMap[K]) => void): () => void {
    this.listeners[type].add(fn as AnyListener);
    return () => {
      this.listeners[type].delete(fn as AnyListener);
    };
  }

  /** Register a listener for connection state changes; returns an unsubscribe function. */
  onStatus(fn: (online: boolean) => void): () => void {
    this.statusListeners.add(fn);
    return () => {
      this.statusListeners.delete(fn);
    };
  }

  private open(): void {
    const token = getAccessToken();
    if (!token) {
      this.setOnline(false);
      return;
    }
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const url = `${protocol}://${window.location.host}/ws?access_token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);
    this.ws = ws;

    ws.onopen = () => {
      this.reconnectAttempt = 0;
      this.setOnline(true);
    };
    ws.onmessage = (event) => {
      this.dispatch(event.data);
    };
    ws.onclose = () => {
      this.setOnline(false);
      if (this.ws === ws) {
        this.ws = null;
      }
      if (this.shouldReconnect) {
        this.scheduleReconnect();
      }
    };
    ws.onerror = () => {
      // onclose follows; nothing to do here
    };
  }

  private scheduleReconnect(): void {
    this.clearTimer();
    const delay = Math.min(RECONNECT_BASE_MS * 2 ** this.reconnectAttempt, RECONNECT_MAX_MS);
    this.reconnectAttempt += 1;
    this.retryTimer = window.setTimeout(() => this.open(), delay);
  }

  private clearTimer(): void {
    if (this.retryTimer !== null) {
      window.clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  private setOnline(online: boolean): void {
    if (this.online === online) return;
    this.online = online;
    for (const fn of this.statusListeners) {
      fn(online);
    }
  }

  private dispatch(raw: unknown): void {
    let type: RealtimeEventName;
    let data: unknown;
    try {
      const parsed = JSON.parse(String(raw)) as { type?: string; data?: unknown };
      if (typeof parsed.type !== 'string' || !(parsed.type in this.listeners)) {
        return;
      }
      type = parsed.type as RealtimeEventName;
      data = parsed.data;
    } catch {
      return; // malformed frame — ignore
    }
    for (const fn of this.listeners[type]) {
      fn(data);
    }
  }
}

/** Shared realtime connection used across the application. */
export const realtime = new RealtimeClient();