import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

/**
 * `home-view` is the landing page placeholder for the forum.
 */
@customElement('home-view')
export class HomeView extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }

    .hero {
      padding: var(--space-12) var(--space-4);
      text-align: center;
    }

    .hero h1 {
      font-size: var(--font-size-2xl);
      color: var(--color-primary);
    }

    .hero p {
      max-width: 34rem;
      margin: 0 auto var(--space-8);
      color: var(--color-text-secondary);
    }

    .placeholder {
      max-width: 34rem;
      margin: 0 auto;
      padding: var(--space-8);
      border: 1px dashed var(--color-border);
      border-radius: var(--radius-lg);
      color: var(--color-text-secondary);
    }
  `;

  override render() {
    return html`
      <section class="hero">
        <h1>Welcome to Masonic Lounge</h1>
        <p>
          A self-hostable forum engine. The community area — forums, threads and posts —
          arrives in the next milestone.
        </p>
      </section>
      <div class="placeholder">Forum categories will be listed here.</div>
    `;
  }
}