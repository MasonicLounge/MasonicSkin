import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { subscribeLocale, t } from '../i18n/index.js';

/** `ml-pagination` renders previous/next navigation for cursor-paginated lists. */
@customElement('ml-pagination')
export class MlPagination extends LitElement {
  static override styles = css`
    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-3);
      margin-top: var(--space-6);
    }

    .page-info {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
    }

    button {
      font: inherit;
      font-size: var(--font-size-sm);
      padding: var(--space-2) var(--space-4);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-surface);
      color: var(--color-text);
      cursor: pointer;
      transition: border-color var(--transition-fast), color var(--transition-fast);
    }

    button:hover:not(:disabled) {
      border-color: var(--color-primary);
      color: var(--color-primary);
    }

    button:disabled {
      opacity: 0.5;
      cursor: default;
    }
  `;

  @property({ type: Number }) total = 0;
  @property({ type: Number }) pageSize = 50;
  @property({ type: Number }) offset = 0;

  private unsubscribeLocale: (() => void) | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.unsubscribeLocale = subscribeLocale(() => this.requestUpdate());
  }

  override disconnectedCallback(): void {
    this.unsubscribeLocale?.();
    super.disconnectedCallback();
  }

  private get page(): number {
    return this.pageSize > 0 ? Math.floor(this.offset / this.pageSize) + 1 : 1;
  }

  private get pages(): number {
    return this.pageSize > 0 ? Math.ceil(this.total / this.pageSize) : 1;
  }

  private emit(offset: number): void {
    this.dispatchEvent(new CustomEvent<number>('page-change', { detail: offset }));
  }

  override render() {
    if (this.pages <= 1) {
      return '';
    }
    return html`
      <nav class="pagination" aria-label="pagination">
        <button ?disabled=${this.page <= 1} @click=${() => this.emit(this.offset - this.pageSize)}>
          ${t('pagination.previous')}
        </button>
        <span class="page-info">${t('pagination.page', { page: this.page, pages: this.pages })}</span>
        <button ?disabled=${this.page >= this.pages} @click=${() => this.emit(this.offset + this.pageSize)}>
          ${t('pagination.next')}
        </button>
      </nav>
    `;
  }
}