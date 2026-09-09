import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

type MlButtonVariant = 'primary' | 'secondary' | 'danger';

/** `ml-button` is a themed action button. */
@customElement('ml-button')
export class MlButton extends LitElement {
  static override styles = css`
    :host {
      display: inline-block;
    }

    button {
      font: inherit;
      cursor: pointer;
      border: 1px solid transparent;
      border-radius: var(--radius-md);
      padding: var(--space-2) var(--space-3);
      transition: background var(--transition-base), opacity var(--transition-base),
        border-color var(--transition-base), color var(--transition-base);
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .primary {
      background: var(--color-primary);
      color: var(--color-on-primary);
    }

    .primary:hover:not(:disabled) {
      background: var(--color-primary-hover);
    }

    .secondary {
      background: transparent;
      color: var(--color-text);
      border-color: var(--color-border);
    }

    .secondary:hover:not(:disabled) {
      border-color: var(--color-primary);
      color: var(--color-primary);
    }

    .danger {
      background: transparent;
      color: var(--color-danger);
      border-color: var(--color-danger);
    }

    .danger:hover:not(:disabled) {
      background: color-mix(in srgb, var(--color-danger) 12%, transparent);
    }
  `;

  @property() variant: MlButtonVariant = 'primary';
  @property({ type: Boolean }) disabled = false;
  @property() type = 'button';

  private handleClick(): void {
    if (this.disabled) return;
    if (this.type === 'submit') {
      const form = this.closest('form');
      if (form) {
        form.requestSubmit();
      }
    }
  }

  override render() {
    return html`
      <button class="${this.variant}" ?disabled=${this.disabled} type=${this.type} @click=${this.handleClick}>
        <slot></slot>
      </button>
    `;
  }
}