import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

/**
 * `not-found-view` is shown for unmatched routes.
 */
@customElement('not-found-view')
export class NotFoundView extends LitElement {
  static override styles = css`
    :host {
      display: block;
      text-align: center;
      padding: var(--space-12) var(--space-4);
    }

    h1 {
      font-size: var(--font-size-2xl);
      color: var(--color-primary);
    }

    a {
      font-weight: 600;
    }
  `;

  override render() {
    return html`
      <h1>404</h1>
      <p>This page does not exist.</p>
      <a href="/" router-link>Go back home</a>
    `;
  }
}