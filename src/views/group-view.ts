import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { RouterLocation } from '@vaadin/router';
import { ApiError } from '../api/client.js';
import { createThread, fetchGroup, fetchGroupThreads, uploadAttachment } from '../api/endpoints.js';
import { isLoggedIn } from '../auth/session.js';
import { navigate } from '../router.js';
import type { Group, ThreadSummary } from '../api/types.js';
import { subscribeLocale, t } from '../i18n/index.js';
import '../components/presence-dot.js';
import '../components/ml-loading.js';
import '../components/ml-message.js';
import '../components/ml-badge.js';
import '../components/ml-card.js';
import '../components/ml-button.js';
import '../components/ml-pagination.js';

/** `group-view` renders a forum category with its threads. */
@customElement('group-view')
export class GroupView extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }

    .group-header {
      margin-bottom: var(--space-6);
    }

    .group-header h1 {
      font-size: var(--font-size-xl);
      color: var(--color-primary);
      margin: 0 0 var(--space-2);
    }

    .description {
      color: var(--color-text-secondary);
      margin: 0;
    }

    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-4);
      margin-bottom: var(--space-4);
    }

    .toolbar h2 {
      font-size: var(--font-size-lg);
      margin: 0;
    }

    .threads {
      display: grid;
      gap: var(--space-3);
    }

    .thread {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: var(--space-4);
      padding: var(--space-4) var(--space-5);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
      transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
    }

    .thread:hover {
      border-color: var(--color-primary);
      box-shadow: var(--shadow-sm);
      text-decoration: none;
    }

    .thread-title {
      font-weight: 600;
      color: var(--color-text);
    }

    .thread .badge {
      font-size: var(--font-size-xs);
      padding: 2px var(--space-2);
      border-radius: var(--radius-full);
      background: var(--color-bg);
      color: var(--color-accent);
      margin-left: var(--space-2);
    }

    .thread-meta {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      white-space: nowrap;
    }

    .composer {
      margin-top: var(--space-8);
    }

    .composer label {
      display: block;
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      margin-bottom: var(--space-1);
    }

    .composer input,
    .composer textarea {
      width: 100%;
      box-sizing: border-box;
      margin-bottom: var(--space-3);
    }

    .file-label {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      margin: 0 0 var(--space-3);
    }

    .file-label input {
      width: auto;
      margin: 0;
    }

    .file-label:hover {
      color: var(--color-primary);
    }

    .file-label:has(input:disabled) {
      opacity: 0.5;
    }

    .composer .actions {
      display: flex;
      gap: var(--space-3);
      align-items: center;
    }

    .meta {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      margin: 0 0 var(--space-3);
      overflow-wrap: anywhere;
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
  @state() private group: Group | null = null;
  @state() private threads: ThreadSummary[] = [];
  @state() private threadsTotal = 0;
  @state() private threadOffset = 0;
  @state() private pageSize = 50;
  @state() private loading = true;
  @state() private error = '';
  @state() private threadTitle = '';
  @state() private body = '';
  @state() private selectedFiles: File[] = [];
  @state() private submitting = false;
  @state() private composerError = '';

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
      this.error = t('group.not_found');
      this.loading = false;
      return;
    }
    try {
      const [group, threads] = await Promise.all([fetchGroup(id), fetchGroupThreads(id, this.pageSize, 0)]);
      this.group = group;
      this.threads = threads.items;
      this.threadsTotal = threads.total;
      this.threadOffset = 0;
    } catch (err) {
      this.error = err instanceof ApiError ? err.message : t('group.load_failed');
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
      const threads = await fetchGroupThreads(id, this.pageSize, e.detail);
      this.threads = threads.items;
      this.threadsTotal = threads.total;
      this.threadOffset = e.detail;
    } catch (err) {
      this.error = err instanceof ApiError ? err.message : t('group.load_failed');
    } finally {
      this.loading = false;
    }
  }

  private async submitThread(): Promise<void> {
    const id = this.location?.params.id as string | undefined;
    this.composerError = '';
    if (!this.threadTitle.trim()) {
      this.composerError = t('group.title_required');
      return;
    }
    if (!this.body.trim()) {
      this.composerError = t('group.message_required');
      return;
    }
    this.submitting = true;
    try {
      const attachmentIds: string[] = [];
      for (const file of this.selectedFiles) {
        const uploaded = await uploadAttachment(file);
        attachmentIds.push(uploaded.id);
      }
      const created = await createThread(id!, {
        title: this.threadTitle.trim(),
        body: this.body.trim(),
        attachment_ids: attachmentIds.length > 0 ? attachmentIds : undefined,
      });
      navigate(`/threads/${created.id}`);
    } catch (err) {
      this.composerError = err instanceof ApiError ? err.message : t('group.create_failed');
    } finally {
      this.submitting = false;
    }
  }

  override render() {
    return html`
      ${this.loading
        ? html`<ml-loading></ml-loading>`
        : this.error
          ? html`<ml-message tone="error" text=${this.error}></ml-message>`
          : html`
              <header class="group-header">
                <h1>${this.group?.name ?? ''}</h1>
                ${this.group?.description ? html`<p class="description">${this.group.description}</p>` : ''}
              </header>

              <div class="toolbar">
                <h2>${t('group.threads')}</h2>
                ${this.threads.length ? html`<span class="threads-count">${this.threads.length}</span>` : ''}
              </div>

              ${this.threads.length === 0
                ? html`<div class="empty">${t('group.no_threads')}</div>`
                : html`
                    <div class="threads">
                      ${this.threads.map(
                        (th) => html`
                          <a class="thread" href="/threads/${th.id}" router-link>
                            <span class="thread-title">
                              ${th.pinned ? html`<ml-badge>${t('group.pinned')}</ml-badge>` : ''}
                              ${th.locked ? html`<ml-badge tone="primary">${t('group.locked')}</ml-badge>` : ''}
                              ${th.title}
                            </span>
                            <span class="thread-meta">
                              ${t('group.post_count', { count: th.post_count })} · ${th.author_display_name}
                              <presence-dot user-id=${th.author_id}></presence-dot>
                            </span>
                          </a>
                        `,
                      )}
                    </div>
                    <ml-pagination
                      total=${this.threadsTotal}
                      pageSize=${this.pageSize}
                      offset=${this.threadOffset}
                      @page-change=${(e: CustomEvent<number>) => void this.onPageChange(e)}
                    ></ml-pagination>
                  `}

              ${isLoggedIn()
                ? html`
                    <ml-card class="composer">
                      <h2>${t('group.new_thread')}</h2>
                      <form @submit=${(e: Event) => {
                        e.preventDefault();
                        this.submitThread();
                      }}>
                        <label for="thread-title">${t('group.title')}</label>
                        <input id="thread-title" .value=${this.threadTitle} @input=${(e: Event) => (this.threadTitle = (e.target as HTMLInputElement).value)} maxlength="200" />
                        <label for="thread-body">${t('group.message')}</label>
                        <textarea id="thread-body" rows="6" .value=${this.body} @input=${(e: Event) => (this.body = (e.target as HTMLTextAreaElement).value)} maxlength="50000"></textarea>
                        <label class="file-label" for="thread-files">
                          <span>${t('group.attach')}</span>
                          <input
                            id="thread-files"
                            type="file"
                            multiple
                            ?disabled=${this.submitting}
                            @change=${(e: Event) => {
                              const input = e.target as HTMLInputElement;
                              this.selectedFiles = Array.from(input.files ?? []);
                            }}
                          />
                        </label>
                        ${this.selectedFiles.length > 0 ? html`<p class="meta">${this.selectedFiles.map((f) => f.name).join(', ')}</p>` : ''}
                        <div class="actions">
                          <ml-button type="submit" ?disabled=${this.submitting}>
                            ${this.submitting ? t('group.posting') : t('group.post_thread')}
                          </ml-button>
                        </div>
                      </form>
                      ${this.composerError ? html`<ml-message tone="error" text=${this.composerError}></ml-message>` : ''}
                    </ml-card>
                  `
                : html`<p><a href="/login" router-link>${t('nav.login')}</a> ${t('group.login_to_start')}</p>`}
            `}
    `;
  }
}