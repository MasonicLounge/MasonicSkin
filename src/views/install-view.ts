import { html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { navigate } from '../router.js';
import { fetchInstallStatus, submitInstall } from '../api/endpoints.js';

@customElement('install-view')
export class InstallView extends LitElement {
  @state() private checking = true;
  @state() private submitting = false;
  @state() private error = '';

  connectedCallback() {
    super.connectedCallback();
    void this.checkStatus();
  }

  private async checkStatus() {
    this.checking = true;
    try {
      const status = await fetchInstallStatus();
      if (status.installed) {
        navigate('/');
      }
    } catch {
      this.error = 'Unable to reach the server. Please try again.';
    } finally {
      this.checking = false;
    }
  }

  private async onInstall(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    const forumName = String(data.get('forum_name') ?? '').trim();
    const adminUsername = String(data.get('admin_username') ?? '').trim();
    const adminEmail = String(data.get('admin_email') ?? '').trim();
    const adminPassword = String(data.get('admin_password') ?? '');

    if (!forumName || !adminUsername || !adminEmail || !adminPassword) {
      this.error = 'All fields are required.';
      return;
    }
    if (adminPassword.length < 8) {
      this.error = 'Password must be at least 8 characters long.';
      return;
    }

    this.error = '';
    this.submitting = true;
    try {
      await submitInstall({ forum_name: forumName, admin_username: adminUsername, admin_email: adminEmail, admin_password: adminPassword });
      navigate('/login');
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Installation failed. Please check your details.';
    } finally {
      this.submitting = false;
    }
  }

  render() {
    if (this.checking) {
      return html`<section class="card"><p>Checking setup status…</p></section>`;
    }
    return html`
      <section class="install">
        <h1>Set up your forum</h1>
        <p class="muted">This is the first-run setup. It will create the administrator account and initialize the forum.</p>

        <form @submit=${this.onInstall}>
          <label>
            Forum name
            <input name="forum_name" maxlength="100" required autocomplete="off" />
          </label>
          <label>
            Administrator username
            <input name="admin_username" minlength="3" maxlength="32" required autocomplete="username" />
          </label>
          <label>
            Administrator email
            <input name="admin_email" type="email" required autocomplete="email" />
          </label>
          <label>
            Password
            <input name="admin_password" type="password" minlength="8" required autocomplete="new-password" />
          </label>

          ${this.error ? html`<p class="error">${this.error}</p>` : ''}

          <button type="submit" ?disabled=${this.submitting}>${this.submitting ? 'Setting up…' : 'Create administrator'}</button>
        </form>
      </section>
    `;
  }
}