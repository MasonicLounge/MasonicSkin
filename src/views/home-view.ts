import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { ApiError } from '../api/client.js';
import { fetchGroups } from '../api/endpoints.js';
import type { Group } from '../api/types.js';

/** `home-view` lists forum categories (groups). */
@customElement('home-view')
export class HomeView extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }

    .hero {
      padding: var(--space-8) 0 var(--space-6);
    }

    .hero h1 {
      font-size: var(--font-size-2xl);
      color: var(--color-primary);
      margin-bottom: var(--space-2);
    }

    .hero p {
      color: var(--color-text-secondary);
      margin: 0;
    }

    .groups {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr));
      gap: var(--space-4);
    }

    .group {
      display: block;
      padding: var(--space-6);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
      transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
    }

    .group:hover {
      border-color: var(--color-primary);
      box-shadow: var(--shadow-sm);
      text-decoration: none;
    }

    .group h2 {
      font-size: var(--font-size-lg);
      margin: 0 0 var(--space-1);
      color: var(--color-text);
    }

    .group .description {
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm);
      margin: 0 0 var(--space-3);
    }

    .group .meta {
      font-size: var(--font-size-xs);
      color: var(--color-text-tertiary, var(--color-text-secondary));
    }

    .empty,
    .error {
      padding: var(--space-8);
      border: 1px dashed var(--color-border);
      border-radius: var(--radius-lg);
      color: var(--color-text-secondary);
      text-align: center;
    }

    .error {
      color: var(--color-danger);
      border-color: var(--color-danger);
    }

    .loading {
      color: var(--color-text-secondary);
    }
  `;

  @state() private groups: Group[] = [];
  @state() private loading = true;
  @state() private error = '';

  override async connectedCallback(): Promise<void> {
    super.connectedCallback();
    try {
      const res = await fetchGroups();
      this.groups = res.items;
    } catch (err) {
      this.error = err instanceof ApiError ? err.message : 'Failed to load forums';
    } finally {
      this.loading = false;
    }
  }

  override render() {
    return html`
      <section class="hero">
        <h1>Forums</h1>
        <p>Browse the discussion categories.</p>
      </section>

      ${this.loading
        ? html`<p class="loading">Loading forums…</p>`
        : this.error
          ? html`<div class="error">${this.error}</div>`
          : this.groups.length === 0
            ? html`<div class="empty">No forums yet. Ask an administrator to create one.</div>`
            : html`
                <div class="groups">
                  ${this.groups.map(
                    (g) => html`
                      <a class="group" href="/groups/${g.id}" router-link>
                        <h2>${g.name}</h2>
                        ${g.description ? html`<p class="description">${g.description}</p>` : ''}
                        <div class="meta">${g.slug}</div>
                      </a>
                    `,
                  )}
                </div>
              `}
    `;
  }
}