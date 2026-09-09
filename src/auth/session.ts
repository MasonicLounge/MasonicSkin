import { clearAccessToken, getAccessToken, setAccessToken } from './token.js';
import { fetchMe, loginUser, logoutUser, registerUser } from '../api/endpoints.js';
import type { User } from '../api/types.js';

/** In-memory auth state shared across views. */

type Listener = () => void;

export let currentUser: User | null = null;
export let currentRoles: string[] = [];

const listeners = new Set<Listener>();

function notify(): void {
  for (const fn of listeners) {
    fn();
  }
}

export function subscribeSession(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function isLoggedIn(): boolean {
  return currentUser !== null;
}

/** Refresh the session from /auth/me when an access token is present. */
export async function refreshSession(): Promise<void> {
  if (!getAccessToken()) {
    if (currentUser !== null) {
      currentUser = null;
      currentRoles = [];
      notify();
    }
    return;
  }
  try {
    const me = await fetchMe();
    currentUser = me.user;
    currentRoles = me.roles;
    notify();
  } catch {
    currentUser = null;
    currentRoles = [];
    notify();
  }
}

export async function login(identifier: string, password: string): Promise<void> {
  const res = await loginUser({ identifier, password });
  setAccessToken(res.access_token);
  currentUser = res.user;
  currentRoles = res.roles;
  notify();
}

export async function register(username: string, email: string, password: string): Promise<User> {
  const res = await registerUser({ username, email, password });
  return res.user;
}

export async function logout(): Promise<void> {
  try {
    await logoutUser();
  } catch {
    // tolerate network errors on sign-out
  }
  clearAccessToken();
  currentUser = null;
  currentRoles = [];
  notify();
}