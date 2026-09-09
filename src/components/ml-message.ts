import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

type MlMessageTone = 'info' | 'error' | 'success';

/** `ml-message` shows a short status line in a color-coded tone. */
@customElement('ml-message')
export class MlMessage extends LitElement {
  static override styles = css`
    :host {
      display: block;
      font-size: var(--font-size-sm);
      margin-top: var(--space-2);
    }

    p {
      margin: 0;
    }

    .info {
      color: var(--color-text-secondary);
    }

    .error {
      color: var(--color-danger);
    }

    .success {
      color: var(--color-success);
    }
  `;

  @property() tone: MlMessageTone = 'info';
  @property() text = '';

  override render() {
    return this.text
      ? html`<p class="${this.tone}" role="status">${this.text}</p>`
      : '';
  }
}