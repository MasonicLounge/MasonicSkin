import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import * as session from '../auth/session.js';
import { navigate } from '../router.js';
import { realtime } from '../ws/client.js';
import { fetchConversation, fetchInbox, markMessageRead, sendPrivateMessage } from '../api/endpoints.js';
import type { PMConversation, PrivateMessage } from '../api/types.js';
import { getLocale, subscribeLocale, t } from '../i18n/index.js';
import '../components/ml-pagination.js';

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(getLocale(), { day: 'numeric', month: 'short' }) +
    ' · ' + d.toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit' });
}

/**
 * `pms-view` renders the private message inbox, an open conversation with a
 * partner (with live delivery via the realtime socket) and a composer for
 * starting a new conversation.
 */
@customElement('pms-view')
export class PmsView extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }

    h1 {
      font-size: var(--font-size-2xl);
      margin: 0 0 var(--space-6);
    }

    .layout {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: var(--space-6);
      align-items: start;
    }

    .sidebar {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      border-bottom: 1px solid var(--color-border);
      font-weight: 600;
    }

    .sidebar-meta {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
    }

    .conversation {
      display: block;
      width: 100%;
      padding: var(--space-3) var(--space-4);
      border: none;
      border-bottom: 1px solid var(--color-border);
      background: transparent;
      text-align: left;
      cursor: pointer;
      color: var(--color-text);
    }

    .conversation:last-child {
      border-bottom: none;
    }

    .conversation[aria-selected="true"] {
      background: var(--color-bg);
    }

    .conversation-name {
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-2);
    }

    .conversation-preview {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: var(--space-1);
    }

    .badge {
      background: var(--color-accent);
      color: #fff;
      border-radius: var(--radius-full);
      font-size: var(--font-size-xs);
      min-width: 1.25rem;
      height: 1.25rem;
      padding: 0 0.25rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .empty {
      padding: var(--space-6);
      color: var(--color-text-secondary);
      text-align: center;
    }

    .chat {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
      min-height: 420px;
    }

    .chat-header {
      padding: var(--space-3) var(--space-4);
      border-bottom: 1px solid var(--color-border);
      font-weight: 600;
    }

    .chat-body {
      flex: 1;
      padding: var(--space-4);
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      max-height: 420px;
      overflow-y: auto;
      background: var(--color-bg);
    }

    .msg {
      max-width: 75%;
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-md);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
    }

    .msg.own {
      align-self: flex-end;
      background: var(--color-accent);
      color: #fff;
      border-color: transparent;
    }

    .msg-time {
      display: block;
      font-size: var(--font-size-xs);
      opacity: 0.75;
      margin-top: var(--space-1);
    }

    .composer {
      display: flex;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      border-top: 1px solid var(--color-border);
    }

    .composer input,
    .composer textarea {
      flex: 1;
    }

    .composer textarea {
      resize: vertical;
      min-height: 3rem;
    }

    .new-chat {
      margin: 0 0 var(--space-6);
      padding: var(--space-3) var(--space-4);
      border: 1px dashed var(--color-border);
      border-radius: var(--radius-lg);
      display: grid;
      gap: var(--space-3);
    }

    .error {
      color: var(--color-danger);
      font-size: var(--font-size-sm);
    }

    .hint {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      margin-top: 0;
    }
  `;

  @state() private loading = true;
  @state() private inbox: PMConversation[] = [];
  @state() private inboxTotal = 0;
  @state() private inboxOffset = 0;
  @state() private pageSize = 50;
  @state() private activePartnerID = '';
  @state() private activePartnerName = '';
  @state() private messages: PMConversation[] = [];
  @state() private reply = '';
  @state() private sending = false;
  @state() private showComposer = false;
  @state() private composerTo = '';
  @state() private composerBody = '';
  @state() private composerError = '';

  private unsubscribe: (() => void) | null = null;
  private unsubscribeLocale: (() => void) | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    if (!session.isLoggedIn()) {
      navigate('/login');
      return;
    }
    this.unsubscribe = realtime.on('pm', (pm) => this.onPM(pm));
    this.unsubscribeLocale = subscribeLocale(() => this.requestUpdate());
    void this.loadInbox();
  }

  override disconnectedCallback(): void {
    this.unsubscribe?.();
    this.unsubscribeLocale?.();
    super.disconnectedCallback();
  }

  private async loadInbox(): Promise<void> {
    this.loading = true;
    try {
      const page = await fetchInbox(this.pageSize, 0);
      this.inbox = page.items;
      this.inboxTotal = page.total;
      this.inboxOffset = 0;
    } catch {
      this.inbox = [];
    }
    this.loading = false;
  }

  private async onInboxPage(e: CustomEvent<number>): Promise<void> {
    this.loading = true;
    try {
      const page = await fetchInbox(this.pageSize, e.detail);
      this.inbox = page.items;
      this.inboxTotal = page.total;
      this.inboxOffset = e.detail;
    } catch {
      this.inbox = [];
    }
    this.loading = false;
  }

  private async openConversation(conv: PMConversation): Promise<void> {
    this.activePartnerID = conv.sender_id;
    this.activePartnerName = conv.sender_display || conv.sender_username;
    this.showComposer = false;
    try {
      const page = await fetchConversation(conv.sender_id, 100, 0);
      this.messages = page.items;
    } catch {
      this.messages = [];
    }
    void this.markPartnerRead(conv.sender_id);
    void this.requestUpdate();
  }

  private async markPartnerRead(partnerID: string): Promise<void> {
    for (const m of this.messages) {
      if (m.sender_id === partnerID && m.read_at === null) {
        await markMessageRead(m.id).catch(() => undefined);
        m.read_at = new Date().toISOString();
      }
    }
    const conv = this.inbox.find((c) => c.sender_id === partnerID);
    if (conv) {
      conv.read_at = new Date().toISOString();
    }
    this.requestUpdate();
  }

  private onPM(pm: PrivateMessage): void {
    if (!session.currentUser || pm.recipient_id !== session.currentUser.id) return;
    if (this.activePartnerID !== '' && pm.sender_id === this.activePartnerID && this.messages.length > 0) {
      const exists = this.messages.some((m) => m.id === pm.id);
      if (!exists) {
        this.messages = [...this.messages, { ...pm, sender_username: this.activePartnerName, sender_display: this.activePartnerName }];
      }
      void this.requestUpdate();
      return;
    }
    void this.loadInbox();
  }

  private async sendReply(): Promise<void> {
    const body = this.reply.trim();
    if (body === '' || this.activePartnerID === '') return;
    this.sending = true;
    try {
      const sent = await sendPrivateMessage({ recipient_id: this.activePartnerID, body });
      this.messages = [...this.messages, sent];
      this.reply = '';
    } catch {
      this.reply = body; // keep the text on failure
    }
    this.sending = false;
  }

  private async sendNew(): Promise<void> {
    this.composerError = '';
    const body = this.composerBody.trim();
    const to = this.composerTo.trim();
    if (to === '' || body === '') {
      this.composerError = t('pms.required');
      return;
    }
    this.sending = true;
    try {
      const sent = await sendPrivateMessage({ recipient_id: to, body });
      await this.loadInbox();
      await this.openConversation({ ...sent, sender_username: '', sender_display: this.composerTo });
      this.showComposer = false;
      this.composerBody = '';
      this.composerTo = '';
    } catch {
      this.composerError = t('pms.send_failed');
    }
    this.sending = false;
  }

  private toggleComposer(): void {
    this.showComposer = !this.showComposer;
  }

  override render() {
    const me = session.currentUser;
    const activeSet = this.activePartnerID !== '';
    return html`
      <h1>${t('pms.title')}</h1>

      <button @click=${this.toggleComposer}>${this.showComposer ? t('pms.cancel') : t('pms.new_conversation')}</button>

      ${this.showComposer
        ? html`
            <div class="new-chat">
              <input
                .value=${this.composerTo}
                @input=${(e: Event) => (this.composerTo = (e.target as HTMLInputElement).value)}
                placeholder=${t('pms.recipient_id')}
                aria-label=${t('pms.recipient_id')}
              />
              <textarea
                .value=${this.composerBody}
                @input=${(e: Event) => (this.composerBody = (e.target as HTMLTextAreaElement).value)}
                placeholder=${t('pms.message')}
                aria-label=${t('pms.message')}
              ></textarea>
              <button @click=${() => void this.sendNew()} ?disabled=${this.sending}>
                ${this.sending ? t('pms.sending') : t('pms.send')}
              </button>
              ${this.composerError ? html`<p class="error">${this.composerError}</p>` : ''}
            </div>
          `
        : ''}

      <div class="layout">
        <div class="sidebar">
          <div class="sidebar-header">
            <span>${t('pms.inbox')}</span>
            <span class="sidebar-meta">${this.inbox.length}</span>
          </div>
          ${this.loading
            ? html`<div class="empty">${t('common.loading')}</div>`
            : this.inbox.length === 0
              ? html`<div class="empty">${t('pms.no_conversations')}</div>`
              : this.inbox.map(
                  (c) => html`
                    <button
                      class="conversation"
                      aria-selected=${c.sender_id === this.activePartnerID}
                      @click=${() => void this.openConversation(c)}
                    >
                      <span class="conversation-name">
                        <span>${c.sender_display || c.sender_username}</span>
                        ${c.sender_id !== me?.id && c.read_at === null ? html`<span class="badge">•</span>` : ''}
                      </span>
                      <span class="conversation-preview">${c.body}</span>
                    </button>
                  `,
                )}
          <ml-pagination
            total=${this.inboxTotal}
            pageSize=${this.pageSize}
            offset=${this.inboxOffset}
            @page-change=${(e: CustomEvent<number>) => void this.onInboxPage(e)}
          ></ml-pagination>
        </div>

        <div class="chat">
          ${activeSet
            ? html`
                <div class="chat-header">${this.activePartnerName}</div>
                <div class="chat-body">
                  ${this.messages.length === 0
                    ? html`<div class="empty">${t('pms.no_messages')}</div>`
                    : this.messages.map(
                        (m) => html`
                          <div class="msg ${m.sender_id === me?.id ? 'own' : ''}">
                            <span>${m.body}</span>
                            <span class="msg-time">${formatTime(m.created_at)}</span>
                          </div>
                        `,
                      )}
                </div>
                <div class="composer">
                  <textarea
                    .value=${this.reply}
                    @input=${(e: Event) => (this.reply = (e.target as HTMLTextAreaElement).value)}
                    @keydown=${(e: KeyboardEvent) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) void this.sendReply();
                    }}
                    placeholder=${t('pms.reply_placeholder')}
                    aria-label=${t('pms.reply_aria')}
                  ></textarea>
                  <button @click=${() => void this.sendReply()} ?disabled=${this.sending || this.reply.trim() === ''}>
                    ${this.sending ? t('pms.sending') : t('pms.send')}
                  </button>
                </div>
              `
            : html`<div class="empty">${t('pms.select')}</div>`}
        </div>
      </div>

      <p class="hint">${me ? t('pms.signed_in_as', { name: me.display_name || me.username }) : ''}</p>
    `;
  }
}