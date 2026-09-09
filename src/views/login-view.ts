import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { ApiError } from '../api/client.js';
import { login } from '../auth/session.js';
import { navigate } from '../router.js';
import { subscribeLocale, t } from '../i18n/index.js';

/** `login-view` signs a user in and stores the access token. */
@customElement('login-view')
export class LoginView extends LitElement {
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

  @state() private identifier = '';
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
    if (!this.identifier.trim() || !this.password) {
      this.error = t('login.required');
      return;
    }
    this.busy = true;
    try {
      await login(this.identifier.trim(), this.password);
      navigate('/');
    } catch (err) {
      this.error = err instanceof ApiError ? err.message : t('login.failed');
    } finally {
      this.busy = false;
    }
  }

  override render() {
    return html`
      <h1>${t('login.title')}</h1>
      <form @submit=${(e: Event) => {
        e.preventDefault();
        void this.submit();
      }}>
        <label for="identifier">${t('login.identifier')}</label>
        <input id="identifier" autocomplete="username" .value=${this.identifier} @input=${(e: Event) => (this.identifier = (e.target as HTMLInputElement).value)} />
        <label for="password">${t('login.password')}</label>
        <input id="password" type="password" autocomplete="current-password" .value=${this.password} @input=${(e: Event) => (this.password = (e.target as HTMLInputElement).value)} />
        <button type="submit" ?disabled=${this.busy}>${this.busy ? t('login.signing_in') : t('login.title')}</button>
      </form>
      ${this.error ? html`<p class="error">${this.error}</p>` : ''}
      <p class="switch">${t('login.no_account')} <a href="/register" router-link>${t('nav.signup')}</a>.</p>
    `;
  }
}