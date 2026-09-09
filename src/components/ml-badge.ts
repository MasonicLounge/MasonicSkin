import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

type MlBadgeTone = 'accent' | 'primary';

/** `ml-badge` is a small pill label such as the pinned/locked marks. */
@customElement('ml-badge')
export class MlBadge extends LitElement {
  static override styles = css`
    :host {
      display: inline-block;
      font-size: var(--font-size-xs);
      padding: 2px var(--space-2);
      border-radius: var(--radius-full);
      margin-left: var(--space-2);
    }

    .accent {
      background: var(--color-bg);
      color: var(--color-accent);
    }

    .primary {
      background: color-mix(in srgb, var(--color-primary) 12%, transparent);
      color: var(--color-primary);
    }
  `;

  @property() tone: MlBadgeTone = 'accent';

  override render() {
    return html`<span class="${this.tone}"><slot></slot></span>`;
  }
}