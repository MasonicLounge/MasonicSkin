import { api } from './client.js';
import type {
  Group,
  LoginResponse,
  Paginated,
  PostSummary,
  ThreadSummary,
  User,
} from './types.js';

/** Typed helpers for the MasonicCore REST API. */

export function fetchGroups(): Promise<{ items: Group[] }> {
  return api.get<{ items: Group[] }>('/groups');
}

export function fetchGroup(id: string): Promise<Group> {
  return api.get<Group>(`/groups/${id}`);
}

export function fetchGroupThreads(groupID: string, limit = 50, offset = 0): Promise<Paginated<ThreadSummary>> {
  return api.get<Paginated<ThreadSummary>>(`/groups/${groupID}/threads?limit=${limit}&offset=${offset}`);
}

export function fetchThread(id: string): Promise<ThreadSummary> {
  return api.get<ThreadSummary>(`/threads/${id}`);
}

export function fetchThreadPosts(threadID: string, limit = 50, offset = 0): Promise<Paginated<PostSummary>> {
  return api.get<Paginated<PostSummary>>(`/threads/${threadID}/posts?limit=${limit}&offset=${offset}`);
}

export function createGroup(input: { name: string; slug: string; description?: string; parent_id?: string }): Promise<Group> {
  return api.post<Group>('/groups', input, true);
}

export function createThread(groupID: string, input: { title: string; body: string }): Promise<ThreadSummary> {
  return api.post<ThreadSummary>(`/groups/${groupID}/threads`, input, true);
}

export function createPost(threadID: string, input: { body: string }): Promise<PostSummary> {
  return api.post<PostSummary>(`/threads/${threadID}/posts`, input, true);
}

export function registerUser(input: { username: string; email: string; password: string }): Promise<{ user: User }> {
  return api.post<{ user: User }>('/auth/register', input);
}

export function loginUser(input: { identifier: string; password: string }): Promise<LoginResponse> {
  return api.post<LoginResponse>('/auth/login', input);
}

export function logoutUser(): Promise<void> {
  return api.delete<void>('/auth/logout', true);
}

export function fetchMe(): Promise<{ user: User; roles: string[] }> {
  return api.get<{ user: User; roles: string[] }>('/auth/me', true);
}