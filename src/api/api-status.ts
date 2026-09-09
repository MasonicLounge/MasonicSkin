import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { fetchHealth, fetchVersion, ApiError } from './client.js';

type Status = 'checking' | 'online' | 'offline';

/**
 * `api-status` pings the backend on connect and renders a small badge
 * with the API and DB schema versions.
 */
@customElement('api-status')
export class ApiStatus extends LitElement {
  static override styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      font-size: var(--font-size-xs);
      color: var(--color-text-secondary);
    }

    .dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: var(--radius-full);
    }

    .online {
      background: var(--color-success);
    }

    .offline {
      background: var(--color-danger);
    }

    .checking {
      background: var(--color-accent);
    }
  `;

  @state() private status: Status = 'checking';
  @state() private label = '';

  override connectedCallback(): void {
    super.connectedCallback();
    void this.refresh();
  }

  async refresh(): Promise<void> {
    this.status = 'checking';
    this.label = '';
    try {
      const [health, version] = await Promise.all([fetchHealth(), fetchVersion()]);
      if (health.status === 'ok') {
        this.status = 'online';
        this.label = `API ${version.backend} · db ${version.db}`;
      } else {
        this.status = 'offline';
      }
    } catch (err) {
      this.status = 'offline';
      this.label = err instanceof ApiError ? '' : '';
    }
  }

  override render() {
    return html`
      <span class="dot ${this.status}"></span>
      <span>${this.status === 'checking' ? 'Checking API…' : this.status === 'online' ? this.label : 'API offline'}</span>
    `;
  }
}