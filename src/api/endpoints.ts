import { api } from './client.js';
import type {
  AttachmentWithOwner,
  ForumSettings,
  Group,
  LoginResponse,
  Notification,
  Paginated,
  PMConversation,
  PostSummary,
  PresenceUpdate,
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

export function createThread(groupID: string, input: { title: string; body: string; attachment_ids?: string[] }): Promise<ThreadSummary> {
  return api.post<ThreadSummary>(`/groups/${groupID}/threads`, input, true);
}

export function createPost(threadID: string, input: { body: string; attachment_ids?: string[] }): Promise<PostSummary> {
  return api.post<PostSummary>(`/threads/${threadID}/posts`, input, true);
}

/** Upload a file as an attachment (multipart). Returns the created attachment. */
export function uploadAttachment(file: File, postID?: string): Promise<AttachmentWithOwner> {
  const form = new FormData();
  form.append('file', file);
  if (postID) {
    form.append('post_id', postID);
  }
  return api.postForm<AttachmentWithOwner>('/media/attachments', form);
}

export function fetchPublicSettings(): Promise<{ forum_name: string | null }> {
  return api.get<{ forum_name: string | null }>('/settings');
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

/** Upload an image as the caller's avatar (multipart). Returns the updated user. */
export function uploadAvatar(file: File): Promise<User> {
  const form = new FormData();
  form.append('file', file);
  return api.postForm<User>('/media/avatar', form);
}

/** Update the caller's profile (display name). */
export function updateMe(input: { display_name: string }): Promise<{ user: User }> {
  return api.patch<{ user: User }>('/auth/me', input, true);
}

/** Change the caller's password; revokes all refresh sessions. */
export function changePassword(input: { current_password: string; new_password: string }): Promise<{ changed: boolean }> {
  return api.post<{ changed: boolean }>('/auth/change-password', input, true);
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

// --- Private messaging, notifications and presence ---

export function fetchInbox(limit = 50, offset = 0): Promise<Paginated<PMConversation>> {
  return api.get<Paginated<PMConversation>>(`/pms?limit=${limit}&offset=${offset}`, true);
}

export function fetchConversation(withUserID: string, limit = 50, offset = 0): Promise<Paginated<PMConversation>> {
  return api.get<Paginated<PMConversation>>(`/pms/with?with=${withUserID}&limit=${limit}&offset=${offset}`, true);
}

export function sendPrivateMessage(input: { recipient_id: string; body: string }): Promise<PMConversation> {
  return api.post<PMConversation>('/pms', input, true);
}

export function fetchUnreadCount(): Promise<{ messages: number; notifications: number }> {
  return api.get<{ messages: number; notifications: number }>('/pms/unread-count', true);
}

export function markMessageRead(id: string): Promise<void> {
  return api.patch<void>(`/pms/${id}/read`, {}, true);
}

export function fetchNotifications(limit = 50, offset = 0): Promise<Paginated<Notification>> {
  return api.get<Paginated<Notification>>(`/notifications?limit=${limit}&offset=${offset}`, true);
}

export function markNotificationRead(id: string): Promise<void> {
  return api.patch<void>(`/notifications/${id}/read`, {}, true);
}

export function markAllNotificationsRead(): Promise<void> {
  return api.patch<void>('/notifications/read-all', {}, true);
}

export function fetchPresence(): Promise<string[]> {
  return api.get<string[]>('/presence', true);
}

export function fetchUserPresence(userID: string): Promise<PresenceUpdate> {
  return api.get<PresenceUpdate>(`/presence/${userID}`, true);
}