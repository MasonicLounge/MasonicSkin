import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { navigate } from '../router.js';
import { realtime } from '../ws/client.js';
import { fetchNotifications, fetchUnreadCount, markAllNotificationsRead } from '../api/endpoints.js';
import type { Notification } from '../api/types.js';
import { getLocale, subscribeLocale, t } from '../i18n/index.js';

function formatAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return t('time.just_now');
  if (minutes < 60) return t('time.min_ago', { m: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('time.hour_ago', { h: hours });
  return t('time.day_ago', { d: Math.floor(hours / 24) });
}

/**
 * `notifications-dropdown` shows a bell button with the unread count and a
 * popover listing recent notifications, updated live over the realtime socket.
 */
@customElement('notifications-dropdown')
export class NotificationsDropdown extends LitElement {
  static override styles = css`
    :host {
      position: relative;
      display: inline-flex;
    }

    .button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.25rem;
      height: 2.25rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: transparent;
      color: var(--color-text-secondary);
      position: relative;
      cursor: pointer;
      transition: color var(--transition-fast), border-color var(--transition-fast);
    }

    .button:hover {
      color: var(--color-text);
      border-color: var(--color-text-secondary);
    }

    .count {
      position: absolute;
      top: -0.375rem;
      right: -0.375rem;
      background: var(--color-danger);
      color: #fff;
      border-radius: var(--radius-full);
      font-size: var(--font-size-xs);
      font-weight: 700;
      min-width: 1.125rem;
      height: 1.125rem;
      padding: 0 0.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .panel {
      position: absolute;
      right: 0;
      top: calc(100% + 0.5rem);
      width: 340px;
      max-width: 90vw;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);
      z-index: 50;
      overflow: hidden;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      border-bottom: 1px solid var(--color-border);
      font-weight: 600;
      font-size: var(--font-size-sm);
    }

    .mark-all {
      border: none;
      background: none;
      color: var(--color-accent);
      font-size: var(--font-size-sm);
      cursor: pointer;
      padding: 0;
    }

    .items {
      max-height: 340px;
      overflow-y: auto;
    }

    .item {
      padding: var(--space-3) var(--space-4);
      border-bottom: 1px solid var(--color-border);
      cursor: pointer;
    }

    .item:last-child {
      border-bottom: none;
    }

    .item:hover {
      background: var(--color-bg);
    }

    .item-title {
      font-weight: 600;
      font-size: var(--font-size-sm);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-2);
    }

    .item-body {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      word-break: break-word;
    }

    .time {
      font-size: var(--font-size-xs);
      color: var(--color-text-secondary);
      white-space: nowrap;
    }

    .unread-dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: var(--radius-full);
      background: var(--color-accent);
      flex: none;
    }

    .empty {
      padding: var(--space-6);
      text-align: center;
      color: var(--color-text-secondary);
    }
  `;

  @state() private open = false;
  @state() private unreadMessages = 0;
  @state() private unreadNotifications = 0;
  @state() private items: Notification[] = [];

  private unsubs: (() => void)[] = [];

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('click', this.onDocumentClick);
    this.unsubs.push(
      subscribeLocale(() => this.requestUpdate()),
      realtime.on('notification', () => {
        void this.refresh();
      }),
      realtime.on('pm', () => {
        void this.refreshUnread();
      }),
    );
    void this.refresh();
  }

  override disconnectedCallback(): void {
    document.removeEventListener('click', this.onDocumentClick);
    for (const unsub of this.unsubs) {
      unsub();
    }
    this.unsubs = [];
    super.disconnectedCallback();
  }

  private onDocumentClick = (e: Event): void => {
    if (!this.open) return;
    const path = e.composedPath();
    if (!path.includes(this)) {
      this.open = false;
    }
  };

  private async refresh(): Promise<void> {
    await this.refreshUnread();
    try {
      const page = await fetchNotifications(20, 0);
      this.items = page.items;
    } catch {
      this.items = [];
    }
  }

  private async refreshUnread(): Promise<void> {
    try {
      const counts = await fetchUnreadCount();
      this.unreadMessages = counts.messages;
      this.unreadNotifications = counts.notifications;
    } catch {
      // keep previous counts on failure
    }
  }

  private toggle(): void {
    this.open = !this.open;
    if (this.open && this.unreadNotifications > 0) {
      void this.markAllRead();
    }
  }

  private async markAllRead(): Promise<void> {
    try {
      await markAllNotificationsRead();
      this.items = this.items.map((n) => ({ ...n, read_at: new Date().toISOString() }));
      this.unreadNotifications = 0;
    } catch {
      // tolerated
    }
  }

  private onItemClick(n: Notification): void {
    if (n.type === 'pm') {
      navigate('/pms');
    }
    this.open = false;
  }

  private describe(n: Notification): { title: string; body: string } {
    if (n.type === 'pm') {
      const previewText = typeof n.payload.preview === 'string' ? n.payload.preview : '';
      return { title: t('notifications.pm_title'), body: previewText };
    }
    return { title: n.type, body: '' };
  }

  override render() {
    const total = this.unreadMessages + this.unreadNotifications;
    return html`
      <button
        class="button"
        @click=${this.toggle}
        aria-label=${t('notifications.aria')}
        aria-expanded=${this.open}
      >
        <ml-icon name="bell" size="18"></ml-icon>
        ${total > 0 ? html`<span class="count">${total > 99 ? '99+' : total}</span>` : ''}
      </button>

      ${this.open
        ? html`
            <div class="panel">
              <div class="header">
                <span>${t('notifications.title')}</span>
                ${this.unreadMessages > 0 ? html`<a href="/pms" router-link @click=${() => (this.open = false)}>${t('notifications.unread_messages', { count: this.unreadMessages })}</a>` : ''}
              </div>
              <div class="items">
                ${this.items.length === 0
                  ? html`<div class="empty">${t('notifications.empty')}</div>`
                  : this.items.map((n) => {
                      const { title, body } = this.describe(n);
                      return html`
                        <button class="item" @click=${() => this.onItemClick(n)}>
                          <span class="item-title">
                            <span>${title}</span>
                            ${n.read_at === null ? html`<span class="unread-dot"></span>` : ''}
                            <span class="time">${formatAgo(n.created_at)}</span>
                          </span>
                          ${body ? html`<span class="item-body">${body}</span>` : ''}
                        </button>
                      `;
                    })}
              </div>
            </div>
          `
        : ''}
    `;
  }
}