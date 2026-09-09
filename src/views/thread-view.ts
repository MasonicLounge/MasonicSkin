import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { RouterLocation } from '@vaadin/router';
import { ApiError } from '../api/client.js';
import { createPost, fetchThread, fetchThreadPosts } from '../api/endpoints.js';
import { isLoggedIn } from '../auth/session.js';
import type { PostSummary, ThreadSummary } from '../api/types.js';

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

/** `thread-view` renders a thread with its posts and a reply composer. */
@customElement('thread-view')
export class ThreadView extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }

    .thread-header {
      margin-bottom: var(--space-6);
    }

    .thread-header h1 {
      font-size: var(--font-size-xl);
      color: var(--color-primary);
      margin: 0 0 var(--space-2);
    }

    .meta {
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm);
      margin: 0;
    }

    .badge {
      font-size: var(--font-size-xs);
      padding: 2px var(--space-2);
      border-radius: var(--radius-full);
      background: var(--color-bg);
      color: var(--color-accent);
      margin-left: var(--space-2);
    }

    .posts {
      display: grid;
      gap: var(--space-4);
    }

    .post {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
      overflow: hidden;
    }

    .post-head {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: var(--space-4);
      padding: var(--space-3) var(--space-5);
      background: var(--color-bg);
      border-bottom: 1px solid var(--color-border);
      font-size: var(--font-size-sm);
    }

    .author {
      font-weight: 600;
      color: var(--color-text);
    }

    .timestamp {
      color: var(--color-text-secondary);
      white-space: nowrap;
    }

    .post-body {
      padding: var(--space-5);
      white-space: pre-wrap;
      overflow-wrap: break-word;
      line-height: 1.6;
    }

    .edited {
      margin-top: var(--space-3);
      font-size: var(--font-size-xs);
      color: var(--color-text-secondary);
      font-style: italic;
    }

    .composer {
      margin-top: var(--space-8);
      padding: var(--space-6);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
    }

    .composer h2 {
      font-size: var(--font-size-lg);
      margin-top: 0;
    }

    textarea {
      width: 100%;
      box-sizing: border-box;
      margin-bottom: var(--space-3);
    }

    .error {
      color: var(--color-danger);
      font-size: var(--font-size-sm);
      margin-top: var(--space-2);
    }

    .empty {
      padding: var(--space-8);
      border: 1px dashed var(--color-border);
      border-radius: var(--radius-lg);
      color: var(--color-text-secondary);
      text-align: center;
    }
  `;

  location?: RouterLocation;
  @state() private thread: ThreadSummary | null = null;
  @state() private posts: PostSummary[] = [];
  @state() private loading = true;
  @state() private error = '';
  @state() private reply = '';
  @state() private submitting = false;
  @state() private replyError = '';

  override firstUpdated(): void {
    this.load();
  }

  private async load(): Promise<void> {
    const id = this.location?.params.id as string | undefined;
    if (!id) {
      this.error = 'Thread not found';
      this.loading = false;
      return;
    }
    try {
      const [thread, posts] = await Promise.all([fetchThread(id), fetchThreadPosts(id)]);
      this.thread = thread;
      this.posts = posts.items;
    } catch (err) {
      this.error = err instanceof ApiError ? err.message : 'Failed to load thread';
    } finally {
      this.loading = false;
    }
  }

  private async submitReply(): Promise<void> {
    const id = this.location?.params.id as string | undefined;
    this.replyError = '';
    if (!this.reply.trim()) {
      this.replyError = 'Reply is required';
      return;
    }
    this.submitting = true;
    try {
      const created = await createPost(id!, { body: this.reply.trim() });
      this.posts = [...this.posts, created];
      this.reply = '';
      if (this.thread) {
        this.thread = { ...this.thread, post_count: this.thread.post_count + 1, last_post_at: created.created_at };
      }
    } catch (err) {
      this.replyError = err instanceof ApiError ? err.message : 'Failed to post reply';
    } finally {
      this.submitting = false;
    }
  }

  override render() {
    return html`
      ${this.loading
        ? html`<p>Loading…</p>`
        : this.error
          ? html`<div class="error">${this.error}</div>`
          : html`
              <header class="thread-header">
                <h1>
                  ${this.thread?.pinned ? html`<span class="badge">pinned</span>` : ''}
                  ${this.thread?.locked ? html`<span class="badge">locked</span>` : ''}
                  ${this.thread?.title ?? ''}
                </h1>
                <p class="meta">
                  ${this.thread?.author_display_name} · ${this.thread?.views ?? 0} views · ${this.thread?.post_count ?? 0} posts
                </p>
              </header>

              ${this.posts.length === 0
                ? html`<div class="empty">No posts yet.</div>`
                : html`
                    <div class="posts">
                      ${this.posts.map(
                        (p) => html`
                          <article class="post">
                            <div class="post-head">
                              <span class="author">${p.author_display_name}</span>
                              <span class="timestamp">${formatDate(p.created_at)}</span>
                            </div>
                            <div class="post-body">${p.body}</div>
                            ${p.edited_at
                              ? html`<div class="edited">edited ${formatDate(p.edited_at)}</div>`
                              : ''}
                          </article>
                        `,
                      )}
                    </div>
                  `}

              ${isLoggedIn()
                ? html`
                    <section class="composer">
                      <h2>Reply</h2>
                      <form @submit=${(e: Event) => {
                        e.preventDefault();
                        this.submitReply();
                      }}>
                        <textarea rows="6" .value=${this.reply} @input=${(e: Event) => (this.reply = (e.target as HTMLTextAreaElement).value)} maxlength="50000" placeholder="Write a reply…"></textarea>
                        <button type="submit" ?disabled=${this.submitting || !!this.thread?.locked}>
                          ${this.submitting ? 'Posting…' : 'Post reply'}
                        </button>
                      </form>
                      ${this.replyError ? html`<div class="error">${this.replyError}</div>` : ''}
                    </section>
                  `
                : html`<p><a href="/login" router-link>Log in</a> to reply.</p>`}
            `}
    `;
  }
}