/** Backend DTOs mirroring the MasonicCore REST API (stable error-code style). */

export interface User {
  id: string;
  username: string;
  email: string;
  display_name: string;
  avatar_url: string;
  status: string;
  created_at: string;
  updated_at: string;
  last_seen_at: string | null;
}

export interface Role {
  id: string;
  key: string;
  name: string;
  description: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
  roles: string[];
}

export interface Group {
  id: string;
  name: string;
  slug: string;
  description: string;
  parent_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ThreadSummary {
  id: string;
  group_id: string;
  author_id: string;
  title: string;
  pinned: boolean;
  locked: boolean;
  views: number;
  post_count: number;
  last_post_at: string | null;
  created_at: string;
  updated_at: string;
  author_username: string;
  author_display_name: string;
}

export interface PostSummary {
  id: string;
  thread_id: string;
  author_id: string;
  body: string;
  edited_by_id: string | null;
  edited_at: string | null;
  created_at: string;
  updated_at: string;
  author_username: string;
  author_display_name: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}