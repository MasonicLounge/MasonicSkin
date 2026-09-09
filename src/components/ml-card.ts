import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/** `ml-card` is a surface container with the standard border and radius. */
@customElement('ml-card')
export class MlCard extends LitElement {
  static override styles = css`
    :host {
      display: block;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
    }

    .card {
      padding: var(--space-6);
    }

    .compact {
      padding: var(--space-4) var(--space-5);
    }
  `;

  @property({ type: Boolean }) compact = false;

  override render() {
    return html`<div class="card ${this.compact ? 'compact' : ''}"><slot></slot></div>`;
  }
}