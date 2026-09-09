import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

/**
 * `about-view` renders the project description and links to the source repositories.
 */
@customElement('about-view')
export class AboutView extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }

    h1 {
      font-size: var(--font-size-xl);
      margin-bottom: var(--space-4);
    }

    section {
      max-width: 40rem;
      margin-bottom: var(--space-6);
      color: var(--color-text-secondary);
    }

    ul {
      padding-left: var(--space-6);
    }

    li {
      margin-bottom: var(--space-2);
    }
  `;

  override render() {
    return html`
      <h1>About</h1>
      <section>
        <p>
          Masonic Lounge is an open-source, self-hostable forum engine built around a small,
          explicit stack: Go + PostgreSQL + MinIO on the backend, Lit + TypeScript + Vite on the frontend.
        </p>
      </section>
      <section>
        <ul>
          <li>Multi-repo: <strong>MasonicCore</strong> (Go API) and <strong>MasonicSkin</strong> (web client)</li>
          <li>JWT auth with refresh sessions, argon2id password hashing</li>
          <li>Realtime private messages, notifications and presence via WebSocket</li>
          <li>S3-compatible media storage (avatars, attachments)</li>
        </ul>
      </section>
    `;
  }
}