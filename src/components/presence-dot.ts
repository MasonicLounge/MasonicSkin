import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { isOnline, subscribePresence } from '../ws/presence.js';
import { subscribeLocale, t } from '../i18n/index.js';

/**
 * `presence-dot` renders a small online/offline indicator for a user.
 */
@customElement('presence-dot')
export class PresenceDot extends LitElement {
  static override styles = css`
    :host {
      display: inline-flex;
      align-items: center;
    }

    .dot {
      width: 0.625rem;
      height: 0.625rem;
      border-radius: var(--radius-full);
      background: var(--color-text-secondary);
      opacity: 0.4;
      flex: none;
    }

    .dot.online {
      background: var(--color-success);
      opacity: 1;
    }
  `;

  @property({ attribute: 'user-id', reflect: false }) userID = '';
  @property({ type: Boolean }) withLabel = false;

  @state() private online = false;

  private unsubs: (() => void)[] = [];

  override connectedCallback(): void {
    super.connectedCallback();
    this.online = isOnline(this.userID);
    this.unsubs.push(
      subscribePresence(() => {
        this.online = isOnline(this.userID);
      }),
      subscribeLocale(() => this.requestUpdate()),
    );
  }

  override disconnectedCallback(): void {
    for (const unsub of this.unsubs) {
      unsub();
    }
    this.unsubs = [];
    super.disconnectedCallback();
  }

  override render() {
    return html`
      <span class="dot ${this.online ? 'online' : ''}" title=${this.online ? t('presence.online') : t('presence.offline')}>
      </span>
      ${this.withLabel ? html`<span>${this.online ? t('presence.online') : t('presence.offline')}</span>` : ''}
    `;
  }
}