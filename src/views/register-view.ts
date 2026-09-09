import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { ApiError } from '../api/client.js';
import { login, register } from '../auth/session.js';
import { navigate } from '../router.js';

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

  private async submit(): Promise<void> {
    this.error = '';
    if (!this.username.trim() || !this.email.trim() || !this.password) {
      this.error = 'All fields are required';
      return;
    }
    if (this.password.length < 8) {
      this.error = 'Password must be at least 8 characters';
      return;
    }
    this.busy = true;
    try {
      const user = await register(this.username.trim(), this.email.trim(), this.password);
      await login(user.username, this.password);
      navigate('/');
    } catch (err) {
      this.error = err instanceof ApiError ? err.message : 'Registration failed';
    } finally {
      this.busy = false;
    }
  }

  override render() {
    return html`
      <h1>Sign up</h1>
      <form @submit=${(e: Event) => {
        e.preventDefault();
        void this.submit();
      }}>
        <label for="username">Username</label>
        <input id="username" autocomplete="username" .value=${this.username} @input=${(e: Event) => (this.username = (e.target as HTMLInputElement).value)} />
        <label for="email">Email</label>
        <input id="email" type="email" autocomplete="email" .value=${this.email} @input=${(e: Event) => (this.email = (e.target as HTMLInputElement).value)} />
        <label for="password">Password</label>
        <input id="password" type="password" autocomplete="new-password" .value=${this.password} @input=${(e: Event) => (this.password = (e.target as HTMLInputElement).value)} />
        <button type="submit" ?disabled=${this.busy}>${this.busy ? 'Creating account…' : 'Sign up'}</button>
      </form>
      ${this.error ? html`<p class="error">${this.error}</p>` : ''}
      <p class="switch">Already have an account? <a href="/login" router-link>Log in</a>.</p>
    `;
  }
}