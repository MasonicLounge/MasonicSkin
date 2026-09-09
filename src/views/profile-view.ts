import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { ApiError } from '../api/client.js';
import * as session from '../auth/session.js';
import { navigate } from '../router.js';
import type { User } from '../api/types.js';

/** `profile-view` shows the signed-in user's profile; guards /login. */
@customElement('profile-view')
export class ProfileView extends LitElement {
  static override styles = css`
    :host {
      display: block;
      max-width: 34rem;
    }

    h1 {
      font-size: var(--font-size-xl);
      color: var(--color-primary);
    }

    .card {
      display: flex;
      gap: var(--space-5);
      align-items: center;
      padding: var(--space-6);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
    }

    .avatar {
      width: 4rem;
      height: 4rem;
      border-radius: var(--radius-full);
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      object-fit: cover;
    }

    .name {
      font-weight: 700;
      font-size: var(--font-size-lg);
    }

    .username {
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm);
    }

    .error {
      color: var(--color-danger);
      padding: var(--space-4);
      border: 1px dashed var(--color-danger);
      border-radius: var(--radius-lg);
    }

    .signout {
      margin-top: var(--space-4);
    }
  `;

  @state() private user: User | null = null;
  @state() private roles: string[] = [];
  @state() private error = '';
  @state() private busy = true;

  override async connectedCallback(): Promise<void> {
    super.connectedCallback();
    await this.load();
    this.unsubscribe = session.subscribeSession(() => this.requestUpdate());
  }

  private unsubscribe: (() => void) | null = null;

  override disconnectedCallback(): void {
    this.unsubscribe?.();
    super.disconnectedCallback();
  }

  private async load(): Promise<void> {
    try {
      await session.refreshSession();
      if (!session.isLoggedIn()) {
        navigate('/login');
        return;
      }
      this.user = session.currentUser;
      this.roles = session.currentRoles;
    } catch (err) {
      this.error = err instanceof ApiError ? err.message : 'Failed to load profile';
    } finally {
      this.busy = false;
    }
  }

  private async signOut(): Promise<void> {
    await session.logout();
    navigate('/');
  }

  override render() {
    if (this.busy) return html`<p>Loading…</p>`;
    if (this.error) return html`<div class="error">${this.error}</div>`;
    if (!this.user) return html`<p>Not signed in. <a href="/login" router-link>Log in</a>.</p>`;
    return html`
      <h1>Profile</h1>
      <div class="card">
        ${this.user.avatar_url
          ? html`<img class="avatar" src=${this.user.avatar_url} alt="" />`
          : html`<div class="avatar"></div>`}
        <div>
          <div class="name">${this.user.display_name || this.user.username}</div>
          <div class="username">@${this.user.username}</div>
          <div class="username">${this.roles.join(', ') || 'member'}</div>
        </div>
      </div>
      <button class="signout" @click=${() => void this.signOut()}>Sign out</button>
    `;
  }
}