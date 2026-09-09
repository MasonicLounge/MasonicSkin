import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/** `ml-avatar` renders a user avatar image with an initials fallback. */
@customElement('ml-avatar')
export class MlAvatar extends LitElement {
  static override styles = css`
    :host {
      display: inline-block;
    }

    .avatar {
      display: flex;
      align-items: center;
      justify-content: center;
      width: var(--avatar-size, 4rem);
      height: var(--avatar-size, 4rem);
      border-radius: var(--radius-full);
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      object-fit: cover;
      overflow: hidden;
      font-weight: 600;
      font-size: calc(var(--avatar-size, 4rem) * 0.4);
      color: var(--color-primary);
      user-select: none;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  `;

  @property() src = '';
  @property() name = '';

  private initials(): string {
    const parts = this.name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    return parts
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join('');
  }

  override render() {
    if (this.src) {
      return html`<span class="avatar"><img src=${this.src} alt=${this.name || 'avatar'} loading="lazy" /></span>`;
    }
    return html`<span class="avatar" role="img" aria-label=${this.name || 'avatar'}>${this.initials()}</span>`;
  }
}