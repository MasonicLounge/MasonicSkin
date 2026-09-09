import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { subscribeLocale, t } from '../i18n/index.js';

/** `ml-loading` renders a localized loading indicator. */
@customElement('ml-loading')
export class MlLoading extends LitElement {
  static override styles = css`
    :host {
      display: block;
      color: var(--color-text-secondary);
    }

    p {
      margin: 0;
    }
  `;

  private unsubscribeLocale: (() => void) | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.unsubscribeLocale = subscribeLocale(() => this.requestUpdate());
  }

  override disconnectedCallback(): void {
    this.unsubscribeLocale?.();
    super.disconnectedCallback();
  }

  override render() {
    return html`<p>${t('common.loading')}</p>`;
  }
}