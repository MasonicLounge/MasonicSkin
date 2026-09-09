import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { navigate } from '../router.js';
import { fetchInstallStatus, submitInstall } from '../api/endpoints.js';
import { subscribeLocale, t } from '../i18n/index.js';

@customElement('install-view')
export class InstallView extends LitElement {
  static styles = css`
    .install {
      max-width: 34rem;
      margin: var(--space-8) auto;
    }
    .install form {
      margin-top: var(--space-4);
    }
    ol.steps {
      margin: 0;
      padding: 0;
      list-style: none;
    }
    ol.steps li {
      margin: 0 0 var(--space-4);
    }
    ol.steps li:last-child {
      margin-bottom: 0;
    }
  `;
  @state() private checking = true;
  @state() private submitting = false;
  @state() private error = '';

  private unsubscribeLocale: (() => void) | null = null;

  connectedCallback() {
    super.connectedCallback();
    this.unsubscribeLocale = subscribeLocale(() => this.requestUpdate());
    void this.checkStatus();
  }

  disconnectedCallback() {
    this.unsubscribeLocale?.();
    super.disconnectedCallback();
  }

  private async checkStatus() {
    this.checking = true;
    try {
      const status = await fetchInstallStatus();
      if (status.installed) {
        navigate('/');
      }
    } catch {
      this.error = t('install.server_unreachable');
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
      this.error = t('install.all_required');
      return;
    }
    if (adminPassword.length < 8) {
      this.error = t('install.password_min');
      return;
    }

    this.error = '';
    this.submitting = true;
    try {
      await submitInstall({ forum_name: forumName, admin_username: adminUsername, admin_email: adminEmail, admin_password: adminPassword });
      navigate('/login');
    } catch (err) {
      this.error = err instanceof Error ? err.message : t('install.failed');
    } finally {
      this.submitting = false;
    }
  }

  render() {
    if (this.checking) {
      return html`<section class="card"><p>${t('install.checking')}</p></section>`;
    }
    return html`
      <section class="install">
        <h1>${t('install.title')}</h1>
        <p class="muted">${t('install.subtitle')}</p>

        <form @submit=${this.onInstall}>
          <ol class="steps">
            <li>
              <label>
                ${t('install.forum_name')}
                <input name="forum_name" maxlength="100" required autocomplete="off" />
              </label>
            </li>
            <li>
              <label>
                ${t('install.admin_username')}
                <input name="admin_username" minlength="3" maxlength="32" required autocomplete="username" />
              </label>
            </li>
            <li>
              <label>
                ${t('install.admin_email')}
                <input name="admin_email" type="email" required autocomplete="email" />
              </label>
            </li>
            <li>
              <label>
                ${t('login.password')}
                <input name="admin_password" type="password" minlength="8" required autocomplete="new-password" />
              </label>
            </li>
          </ol>

          ${this.error ? html`<p class="error">${this.error}</p>` : ''}

          <button type="submit" ?disabled=${this.submitting}>${this.submitting ? t('install.setting_up') : t('install.create_admin')}</button>
        </form>
      </section>
    `;
  }
}