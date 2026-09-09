import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { ApiError } from '../api/client.js';
import { login, register } from '../auth/session.js';
import { navigate } from '../router.js';
import { subscribeLocale, t } from '../i18n/index.js';

/** `register-view` creates an account and signs the user in. */
@customElement('register-view')
export class RegisterView extends LitElement {
  static override styles = css`
    :host {
      display: block;
      max-width: 24rem;
      margin: 0 auto;
    }

    h1 {
      font-size: var(--font-size-xl);
      color: var(--color-primary);
    }

    form {
      display: grid;
      gap: var(--space-3);
      margin-top: var(--space-4);
    }

    label {
      display: block;
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
    }

    input {
      width: 100%;
      box-sizing: border-box;
    }

    .error {
      color: var(--color-danger);
      font-size: var(--font-size-sm);
    }

    .switch {
      margin-top: var(--space-3);
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
    }
  `;

  @state() private username = '';
  @state() private email = '';
  @state() private password = '';
  @state() private error = '';
  @state() private busy = false;

  private unsubscribeLocale: (() => void) | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.unsubscribeLocale = subscribeLocale(() => this.requestUpdate());
  }

  override disconnectedCallback(): void {
    this.unsubscribeLocale?.();
    super.disconnectedCallback();
  }

  private async submit(): Promise<void> {
    this.error = '';
    if (!this.username.trim() || !this.email.trim() || !this.password) {
      this.error = t('register.all_required');
      return;
    }
    if (this.password.length < 8) {
      this.error = t('register.password_min');
      return;
    }
    this.busy = true;
    try {
      const user = await register(this.username.trim(), this.email.trim(), this.password);
      await login(user.username, this.password);
      navigate('/');
    } catch (err) {
      this.error = err instanceof ApiError ? err.message : t('register.failed');
    } finally {
      this.busy = false;
    }
  }

  override render() {
    return html`
      <h1>${t('register.title')}</h1>
      <form @submit=${(e: Event) => {
        e.preventDefault();
        void this.submit();
      }}>
        <label for="username">${t('register.username')}</label>
        <input id="username" autocomplete="username" .value=${this.username} @input=${(e: Event) => (this.username = (e.target as HTMLInputElement).value)} />
        <label for="email">${t('register.email')}</label>
        <input id="email" type="email" autocomplete="email" .value=${this.email} @input=${(e: Event) => (this.email = (e.target as HTMLInputElement).value)} />
        <label for="password">${t('login.password')}</label>
        <input id="password" type="password" autocomplete="new-password" .value=${this.password} @input=${(e: Event) => (this.password = (e.target as HTMLInputElement).value)} />
        <button type="submit" ?disabled=${this.busy}>${this.busy ? t('register.creating') : t('register.title')}</button>
      </form>
      ${this.error ? html`<p class="error">${this.error}</p>` : ''}
      <p class="switch">${t('register.have_account')} <a href="/login" router-link>${t('nav.login')}</a>.</p>
    `;
  }
}