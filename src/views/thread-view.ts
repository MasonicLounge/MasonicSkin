import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { RouterLocation } from '@vaadin/router';
import { ApiError } from '../api/client.js';
import { createPost, fetchThread, fetchThreadPosts, uploadAttachment } from '../api/endpoints.js';
import { isLoggedIn } from '../auth/session.js';
import type { AttachmentWithOwner, PostSummary, ThreadSummary } from '../api/types.js';
import { getLocale, subscribeLocale, t } from '../i18n/index.js';
import '../components/presence-dot.js';
import '../components/ml-loading.js';
import '../components/ml-message.js';
import '../components/ml-badge.js';
import '../components/ml-card.js';
import '../components/ml-button.js';
import '../components/ml-pagination.js';

function formatDate(value: string): string {
  return new Date(value).toLocaleString(getLocale());
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
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
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

    .attachments {
      margin-top: var(--space-4);
      display: grid;
      gap: var(--space-2);
    }

    .attachments img {
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
      max-height: 24rem;
    }

    .file-label {
      margin: var(--space-2) 0 var(--space-3);
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
    }

    .file-label input {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
    }

    .edited {
      margin-top: var(--space-3);
      font-size: var(--font-size-xs);
      color: var(--color-text-secondary);
      font-style: italic;
    }

    .composer {
      margin-top: var(--space-8);
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
  @state() private postsTotal = 0;
  @state() private postOffset = 0;
  @state() private pageSize = 50;
  @state() private loading = true;
  @state() private error = '';
  @state() private reply = '';
  @state() private selectedFiles: File[] = [];
  @state() private submitting = false;
  @state() private replyError = '';

  private unsubscribeLocale: (() => void) | null = null;

  override firstUpdated(): void {
    this.load();
    this.unsubscribeLocale = subscribeLocale(() => this.requestUpdate());
  }

  override disconnectedCallback(): void {
    this.unsubscribeLocale?.();
    super.disconnectedCallback();
  }

  private async load(): Promise<void> {
    const id = this.location?.params.id as string | undefined;
    if (!id) {
      this.error = t('thread.not_found');
      this.loading = false;
      return;
    }
    try {
      const [thread, posts] = await Promise.all([fetchThread(id), fetchThreadPosts(id, this.pageSize, 0)]);
      this.thread = thread;
      this.posts = posts.items;
      this.postsTotal = posts.total;
      this.postOffset = 0;
    } catch (err) {
      this.error = err instanceof ApiError ? err.message : t('thread.load_failed');
    } finally {
      this.loading = false;
    }
  }

  private async onPageChange(e: CustomEvent<number>): Promise<void> {
    const id = this.location?.params.id as string | undefined;
    if (!id) return;
    this.loading = true;
    this.error = '';
    try {
      const posts = await fetchThreadPosts(id, this.pageSize, e.detail);
      this.posts = posts.items;
      this.postsTotal = posts.total;
      this.postOffset = e.detail;
    } catch (err) {
      this.error = err instanceof ApiError ? err.message : t('thread.load_failed');
    } finally {
      this.loading = false;
    }
  }

  private async submitReply(): Promise<void> {
    const id = this.location?.params.id as string | undefined;
    this.replyError = '';
    if (!this.reply.trim()) {
      this.replyError = t('thread.reply_required');
      return;
    }
    this.submitting = true;
    try {
      const ids: string[] = [];
      for (const file of this.selectedFiles) {
        const att = await uploadAttachment(file);
        ids.push(att.id);
      }
      const created = await createPost(id!, {
        body: this.reply.trim(),
        attachment_ids: ids.length > 0 ? ids : undefined,
      });
      this.posts = [...this.posts, created];
      this.postsTotal += 1;
      if (this.posts.length > this.pageSize) {
        this.posts = this.posts.slice(this.posts.length - this.pageSize);
        this.postOffset += this.pageSize;
      }
      this.reply = '';
      this.selectedFiles = [];
      if (this.thread) {
        this.thread = { ...this.thread, post_count: this.thread.post_count + 1, last_post_at: created.created_at };
      }
    } catch (err) {
      this.replyError = err instanceof ApiError ? err.message : t('thread.post_failed');
    } finally {
      this.submitting = false;
    }
  }

  private renderAttachments(atts?: AttachmentWithOwner[] | null) {
    if (!atts || atts.length === 0) {
      return '';
    }
    return html`
      <div class="attachments">
        ${atts.map(
          (a) =>
            a.content_type.startsWith('image/')
              ? html`<img src=${a.public_url} alt=${a.filename} loading="lazy" />`
              : html`<a href=${a.public_url} target="_blank" rel="noopener">${a.filename}</a>`,
        )}
      </div>
    `;
  }

  override render() {
    return html`
      ${this.loading
        ? html`<ml-loading></ml-loading>`
        : this.error
          ? html`<ml-message tone="error" text=${this.error}></ml-message>`
          : html`
              <header class="thread-header">
                <h1>
                  ${this.thread?.pinned ? html`<ml-badge>${t('thread.pinned')}</ml-badge>` : ''}
                  ${this.thread?.locked ? html`<ml-badge tone="primary">${t('thread.locked')}</ml-badge>` : ''}
                  ${this.thread?.title ?? ''}
                </h1>
                <p class="meta">
                  ${this.thread?.author_display_name} · ${t('thread.views', { count: this.thread?.views ?? 0 })} · ${t('thread.posts', { count: this.thread?.post_count ?? 0 })}
                </p>
              </header>

              ${this.posts.length === 0
                ? html`<div class="empty">${t('thread.no_posts')}</div>`
                : html`
                    <div class="posts">
                      ${this.posts.map(
                        (p) => html`
                          <article class="post">
                            <div class="post-head">
                              <span class="author">${p.author_display_name}<presence-dot user-id=${p.author_id}></presence-dot></span>
                              <span class="timestamp">${formatDate(p.created_at)}</span>
                            </div>
                            <div class="post-body">${p.body}</div>
                            ${this.renderAttachments(p.attachments)}
                            ${p.edited_at
                              ? html`<div class="edited">${t('thread.edited', { date: formatDate(p.edited_at) })}</div>`
                              : ''}
                          </article>
                        `,
                      )}
                    </div>
                    <ml-pagination
                      total=${this.postsTotal}
                      pageSize=${this.pageSize}
                      offset=${this.postOffset}
                      @page-change=${(e: CustomEvent<number>) => void this.onPageChange(e)}
                    ></ml-pagination>
                  `}

              ${isLoggedIn()
                ? html`
                    <ml-card class="composer">
                      <h2>${t('thread.reply')}</h2>
                      <form @submit=${(e: Event) => {
                        e.preventDefault();
                        this.submitReply();
                      }}>
                        <textarea rows="6" .value=${this.reply} @input=${(e: Event) => (this.reply = (e.target as HTMLTextAreaElement).value)} maxlength="50000" placeholder=${t('thread.reply_placeholder')}></textarea>
                        <label class="file-label">
                          <span>${t('thread.attach')}</span>
                          <input
                            type="file"
                            multiple
                            @change=${(e: Event) => {
                              const input = e.target as HTMLInputElement;
                              this.selectedFiles = Array.from(input.files ?? []);
                            }}
                          />
                        </label>
                        ${this.selectedFiles.length > 0
                          ? html`<p class="meta">${this.selectedFiles.map((f) => f.name).join(', ')}</p>`
                          : ''}
                        <ml-button type="submit" ?disabled=${this.submitting || !!this.thread?.locked}>
                          ${this.submitting ? t('thread.posting') : t('thread.post_reply')}
                        </ml-button>
                      </form>
                      ${this.replyError ? html`<ml-message tone="error" text=${this.replyError}></ml-message>` : ''}
                    </ml-card>
                  `
                : html`<p><a href="/login" router-link>${t('nav.login')}</a> ${t('thread.login_to_reply')}</p>`}
            `}
    `;
  }
}