import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { ApiError } from '../api/client.js';
import { changePassword, updateMe, uploadAvatar } from '../api/endpoints.js';
import * as session from '../auth/session.js';
import { navigate } from '../router.js';
import type { User } from '../api/types.js';
import { subscribeLocale, t } from '../i18n/index.js';
import '../components/presence-dot.js';
import '../components/ml-loading.js';
import '../components/ml-message.js';
import '../components/ml-avatar.js';
import '../components/ml-card.js';

/** `profile-view` shows the signed-in user's profile and allows editing it. */
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

    .profile-head {
      display: flex;
      gap: var(--space-5);
      align-items: center;
    }

    .profile-head ml-avatar {
      --avatar-size: 4rem;
      flex: none;
    }

    .name {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      font-weight: 700;
      font-size: var(--font-size-lg);
    }

    .username {
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm);
    }

    section {
      margin-top: var(--space-6);
      padding: var(--space-5);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
    }

    section h2 {
      margin: 0 0 var(--space-4);
      font-size: var(--font-size-md);
    }

    .avatar-input {
      margin-top: var(--space-3);
    }

    label {
      display: block;
      margin-bottom: var(--space-2);
      font-size: var(--font-size-sm);
    }

    .row {
      display: flex;
      gap: var(--space-3);
      align-items: end;
    }

    .row input {
      flex: 1;
    }

    .flash {
      margin-top: var(--space-3);
      font-size: var(--font-size-sm);
      color: var(--color-success);
    }

    .error {
      margin-top: var(--space-3);
      font-size: var(--font-size-sm);
      color: var(--color-danger);
    }

    .actions {
      margin-top: var(--space-6);
    }
  `;

  @state() private user: User | null = null;
  @state() private roles: string[] = [];
  @state() private error = '';
  @state() private busy = true;
  @state() private nameSaved = '';
  @state() private nameError = '';
  @state() private avatarSaved = '';
  @state() private avatarError = '';
  @state() private pwdSaved = '';
  @state() private pwdError = '';

  private unsubscribeLocale: (() => void) | null = null;
  private unsubscribe: (() => void) | null = null;

  override async connectedCallback(): Promise<void> {
    super.connectedCallback();
    this.unsubscribeLocale = subscribeLocale(() => this.requestUpdate());
    this.unsubscribe = session.subscribeSession(() => this.requestUpdate());
    await this.load();
  }

  override disconnectedCallback(): void {
    this.unsubscribe?.();
    this.unsubscribeLocale?.();
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
      this.error = err instanceof ApiError ? err.message : t('profile.load_failed');
    } finally {
      this.busy = false;
    }
  }

  private async onNameSubmit(e: Event): Promise<void> {
    e.preventDefault();
    e.stopPropagation();
    this.nameSaved = '';
    this.nameError = '';
    const form = e.target as HTMLFormElement;
    const input = form.elements.namedItem('display_name') as HTMLInputElement;
    const displayName = input.value.trim();
    if (!this.user) return;
    try {
      const { user } = await updateMe({ display_name: displayName });
      this.user = user;
      session.updateCurrentUser(user);
      this.nameSaved = t('profile.saved');
    } catch (err) {
      this.nameError = err instanceof ApiError ? err.message : t('profile.save_failed');
    }
  }

  private async onAvatarChange(e: Event): Promise<void> {
    this.avatarSaved = '';
    this.avatarError = '';
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const user = await uploadAvatar(file);
      this.user = user;
      session.updateCurrentUser(user);
      this.avatarSaved = t('profile.avatar_uploaded');
    } catch (err) {
      this.avatarError = err instanceof ApiError ? err.message : t('profile.avatar_failed');
    } finally {
      input.value = '';
    }
  }

  private async onPasswordSubmit(e: Event): Promise<void> {
    e.preventDefault();
    e.stopPropagation();
    this.pwdSaved = '';
    this.pwdError = '';
    const form = e.target as HTMLFormElement;
    const current = (form.elements.namedItem('current_password') as HTMLInputElement).value;
    const next = (form.elements.namedItem('new_password') as HTMLInputElement).value;
    if (!this.user) return;
    if (!current) {
      this.pwdError = t('profile.current_password_required');
      return;
    }
    if (next.length < 8) {
      this.pwdError = t('profile.new_password_min');
      return;
    }
    try {
      await changePassword({ current_password: current, new_password: next });
      this.pwdSaved = t('profile.password_changed');
      form.reset();
    } catch (err) {
      this.pwdError = err instanceof ApiError ? err.message : t('profile.password_change_failed');
    }
  }

  private async signOut(): Promise<void> {
    await session.logout();
    navigate('/');
  }

  override render() {
    if (this.busy) return html`<ml-loading></ml-loading>`;
    if (this.error) return html`<ml-message tone="error" text=${this.error}></ml-message>`;
    if (!this.user) return html`<p>${t('profile.not_signed_in')} <a href="/login" router-link>${t('nav.login')}</a>.</p>`;
    const u = this.user;
    return html`
      <h1>${t('profile.title')}</h1>
      <ml-card class="card" compact>
        <div class="profile-head">
          <ml-avatar src=${u.avatar_url} name=${u.display_name || u.username}></ml-avatar>
          <div>
            <div class="name">${u.display_name || u.username}<presence-dot user-id=${u.id}></presence-dot></div>
            <div class="username">@${u.username}</div>
            <div class="username">${this.roles.join(', ') || t('profile.member')}</div>
          </div>
        </div>
      </ml-card>

      <section>
        <h2>${t('profile.display_name')}</h2>
        <form @submit=${this.onNameSubmit}>
          <label for="display_name">${t('profile.display_name')}</label>
          <div class="row">
            <input id="display_name" name="display_name" value="${u.display_name}" />
            <button type="submit">${t('profile.save')}</button>
          </div>
          ${this.nameSaved ? html`<ml-message tone="success" text=${this.nameSaved}></ml-message>` : ''}
          ${this.nameError ? html`<ml-message tone="error" text=${this.nameError}></ml-message>` : ''}
        </form>
      </section>

      <section>
        <h2>${t('profile.upload_avatar')}</h2>
        <input class="avatar-input" type="file" accept="image/*" @change=${this.onAvatarChange} />
        ${this.avatarSaved ? html`<ml-message tone="success" text=${this.avatarSaved}></ml-message>` : ''}
        ${this.avatarError ? html`<ml-message tone="error" text=${this.avatarError}></ml-message>` : ''}
      </section>

      <section>
        <h2>${t('profile.change_password')}</h2>
        <form @submit=${this.onPasswordSubmit}>
          <label for="current_password">${t('profile.current_password')}</label>
          <input id="current_password" name="current_password" type="password" />
          <label for="new_password">${t('profile.new_password')}</label>
          <input id="new_password" name="new_password" type="password" />
          <div class="row">
            <button type="submit">${t('profile.save')}</button>
          </div>
          ${this.pwdSaved ? html`<ml-message tone="success" text=${this.pwdSaved}></ml-message>` : ''}
          ${this.pwdError ? html`<ml-message tone="error" text=${this.pwdError}></ml-message>` : ''}
        </form>
      </section>

      <div class="actions">
        <button class="signout" @click=${() => void this.signOut()}>${t('nav.signout')}</button>
      </div>
    `;
  }
}