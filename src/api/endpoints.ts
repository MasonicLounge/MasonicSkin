import { api } from './client.js';
import type {
  AttachmentWithOwner,
  ForumSettings,
  Group,
  LoginResponse,
  Paginated,
  PostSummary,
  ThreadSummary,
  User,
  UserWithRoles,
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

export type InstallStatus = {
  installed: boolean;
  forum_name: string | null;
};

export type InstallInput = {
  forum_name: string;
  admin_username: string;
  admin_email: string;
  admin_password: string;
};

export function fetchInstallStatus(): Promise<InstallStatus> {
  return api.get<InstallStatus>('/install');
}

export function submitInstall(input: InstallInput): Promise<InstallStatus> {
  return api.post<InstallStatus>('/install', input);
}

export function updateGroup(
  id: string,
  input: Partial<{ name: string; slug: string; description: string; parent_id: string | null; sort_order: number }>,
): Promise<Group> {
  return api.patch<Group>(`/groups/${id}`, input, true);
}

export function deleteGroup(id: string): Promise<void> {
  return api.delete<void>(`/groups/${id}`, true);
}

export function fetchAdminUsers(limit = 50, offset = 0): Promise<Paginated<UserWithRoles>> {
  return api.get<Paginated<UserWithRoles>>(`/admin/users?limit=${limit}&offset=${offset}`, true);
}

export function updateAdminUser(
  id: string,
  input: { roles?: string[]; status?: string },
): Promise<UserWithRoles> {
  return api.patch<UserWithRoles>(`/admin/users/${id}`, input, true);
}

export function fetchAdminSettings(): Promise<ForumSettings> {
  return api.get<ForumSettings>('/admin/settings', true);
}

export function putAdminSettings(input: ForumSettings): Promise<ForumSettings> {
  return api.put<ForumSettings>('/admin/settings', input, true);
}

export function fetchAdminMedia(limit = 50, offset = 0): Promise<Paginated<AttachmentWithOwner>> {
  return api.get<Paginated<AttachmentWithOwner>>(`/admin/media?limit=${limit}&offset=${offset}`, true);
}

export function deleteAttachment(id: string): Promise<void> {
  return api.delete<void>(`/media/attachments/${id}`, true);
}