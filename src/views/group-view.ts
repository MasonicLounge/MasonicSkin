import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { RouterLocation } from '@vaadin/router';
import { ApiError } from '../api/client.js';
import { createThread, fetchGroup, fetchGroupThreads } from '../api/endpoints.js';
import { isLoggedIn } from '../auth/session.js';
import { navigate } from '../router.js';
import type { Group, ThreadSummary } from '../api/types.js';

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
      padding: var(--space-6);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
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

    .composer .actions {
      display: flex;
      gap: var(--space-3);
      align-items: center;
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
  @state() private loading = true;
  @state() private error = '';
  @state() private threadTitle = '';
  @state() private body = '';
  @state() private submitting = false;
  @state() private composerError = '';

  override firstUpdated(): void {
    this.load();
  }

  private async load(): Promise<void> {
    const id = this.location?.params.id as string | undefined;
    if (!id) {
      this.error = 'Forum not found';
      this.loading = false;
      return;
    }
    try {
      const [group, threads] = await Promise.all([fetchGroup(id), fetchGroupThreads(id)]);
      this.group = group;
      this.threads = threads.items;
    } catch (err) {
      this.error = err instanceof ApiError ? err.message : 'Failed to load forum';
    } finally {
      this.loading = false;
    }
  }

  private async submitThread(): Promise<void> {
    const id = this.location?.params.id as string | undefined;
    this.composerError = '';
    if (!this.threadTitle.trim()) {
      this.composerError = 'Title is required';
      return;
    }
    if (!this.body.trim()) {
      this.composerError = 'Message is required';
      return;
    }
    this.submitting = true;
    try {
      const created = await createThread(id!, { title: this.threadTitle.trim(), body: this.body.trim() });
      navigate(`/threads/${created.id}`);
    } catch (err) {
      this.composerError = err instanceof ApiError ? err.message : 'Failed to create thread';
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
              <header class="group-header">
                <h1>${this.group?.name ?? ''}</h1>
                ${this.group?.description ? html`<p class="description">${this.group.description}</p>` : ''}
              </header>

              <div class="toolbar">
                <h2>Threads</h2>
                ${this.threads.length ? html`<span class="threads-count">${this.threads.length}</span>` : ''}
              </div>

              ${this.threads.length === 0
                ? html`<div class="empty">No threads yet.</div>`
                : html`
                    <div class="threads">
                      ${this.threads.map(
                        (t) => html`
                          <a class="thread" href="/threads/${t.id}" router-link>
                            <span class="thread-title">
                              ${t.pinned ? html`<span class="badge">pinned</span>` : ''}
                              ${t.locked ? html`<span class="badge">locked</span>` : ''}
                              ${t.title}
                            </span>
                            <span class="thread-meta">
                              ${t.post_count} posts · ${t.author_display_name}
                            </span>
                          </a>
                        `,
                      )}
                    </div>
                  `}

              ${isLoggedIn()
                ? html`
                    <section class="composer">
                      <h2>New thread</h2>
                      <form @submit=${(e: Event) => {
                        e.preventDefault();
                        this.submitThread();
                      }}>
                        <label for="thread-title">Title</label>
                        <input id="thread-title" .value=${this.threadTitle} @input=${(e: Event) => (this.threadTitle = (e.target as HTMLInputElement).value)} maxlength="200" />
                        <label for="thread-body">Message</label>
                        <textarea id="thread-body" rows="6" .value=${this.body} @input=${(e: Event) => (this.body = (e.target as HTMLTextAreaElement).value)} maxlength="50000"></textarea>
                        <div class="actions">
                          <button type="submit" ?disabled=${this.submitting}>
                            ${this.submitting ? 'Posting…' : 'Post thread'}
                          </button>
                        </div>
                      </form>
                      ${this.composerError ? html`<div class="error">${this.composerError}</div>` : ''}
                    </section>
                  `
                : html`<p><a href="/login" router-link>Log in</a> to start a thread.</p>`}
            `}
    `;
  }
}