import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import * as session from '../auth/session.js';
import { navigate, initRouter } from '../router.js';

const THEME_KEY = 'masonic_theme';

/**
 * `app-shell` is the application layout: header with navigation and a theme
 * switcher, a router outlet and a footer carrying the API status badge.
 */
@customElement('app-shell')
export class AppShell extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100dvh;
    }

    .header {
      position: sticky;
      top: 0;
      z-index: 10;
      height: var(--header-height);
      background: var(--color-surface);
      border-bottom: 1px solid var(--color-border);
      transition: background var(--transition-base), border-color var(--transition-base);
    }

    .header-inner {
      max-width: var(--layout-max-width);
      margin: 0 auto;
      padding: 0 var(--space-4);
      height: 100%;
      display: flex;
      align-items: center;
      gap: var(--space-4);
    }

    .brand {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      font-weight: 700;
      color: var(--color-text);
    }

    .brand-img {
      width: 1.75rem;
      height: 1.75rem;
    }

    nav {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      flex: 1;
    }

    nav a {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-md);
      color: var(--color-text-secondary);
      transition: color var(--transition-fast), background var(--transition-fast);
    }

    nav a:hover,
    nav a[aria-current="page"] {
      color: var(--color-text);
      background: var(--color-bg);
      text-decoration: none;
    }

    .theme-toggle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.25rem;
      height: 2.25rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: transparent;
      color: var(--color-text-secondary);
      transition: color var(--transition-fast), border-color var(--transition-fast);
    }

    .theme-toggle:hover {
      color: var(--color-text);
      border-color: var(--color-text-secondary);
    }

    .auth {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin-left: var(--space-2);
    }

    .user {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
    }

    .signout {
      background: transparent;
      border: none;
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm);
      cursor: pointer;
      padding: var(--space-1) var(--space-2);
    }

    .signout:hover {
      color: var(--color-danger);
    }

    .outlet {
      flex: 1;
      width: 100%;
      max-width: var(--layout-max-width);
      margin: 0 auto;
      padding: var(--space-8) var(--space-4);
    }

    .footer {
      border-top: 1px solid var(--color-border);
      background: var(--color-surface);
      transition: background var(--transition-base), border-color var(--transition-base);
    }

    .footer-inner {
      max-width: var(--layout-max-width);
      margin: 0 auto;
      padding: var(--space-4);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-4);
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
    }
  `;

  @state() private dark = document.documentElement.dataset.theme === 'dark';
  @state() private user = session.currentUser;
  @state() private forumName = '';

  override firstUpdated(): void {
    const outlet = this.renderRoot.querySelector<HTMLElement>('#outlet');
    if (outlet) initRouter(outlet);

    const stored = localStorage.getItem(THEME_KEY);
    if (stored !== null) {
      this.dark = stored === 'dark';
    } else {
      this.dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    this.applyTheme();
    void session.refreshSession();
    this.unsubscribe = session.subscribeSession(() => {
      this.user = session.currentUser;
    });
    void this.guardInstall();
    void this.loadPublicSettings();
  }

  private async loadPublicSettings(): Promise<void> {
    try {
      const { fetchPublicSettings } = await import('../api/endpoints.js');
      const settings = await fetchPublicSettings();
      this.forumName = settings.forum_name ?? '';
      document.title = this.forumName ? `${this.forumName} — Masonic Lounge` : 'Masonic Lounge';
    } catch {
      // backend unreachable — keep the default title and brand
    }
  }

  private async guardInstall(): Promise<void> {
    if (window.location.pathname === '/install') return;
    try {
      const { fetchInstallStatus } = await import('../api/endpoints.js');
      const status = await fetchInstallStatus();
      if (!status.installed) {
        navigate('/install');
      }
    } catch {
      // backend unreachable — stay on the current page
    }
  }

  private unsubscribe: (() => void) | null = null;

  override disconnectedCallback(): void {
    this.unsubscribe?.();
    super.disconnectedCallback();
  }

  private async signOut(): Promise<void> {
    await session.logout();
    navigate('/');
  }

  private toggleTheme(): void {
    this.dark = !this.dark;
    localStorage.setItem(THEME_KEY, this.dark ? 'dark' : 'light');
    this.applyTheme();
  }

  private applyTheme(): void {
    document.documentElement.dataset.theme = this.dark ? 'dark' : 'light';
  }

  override render() {
    return html`
      <header class="header">
        <div class="header-inner">
          <a href="/" class="brand" aria-label="Masonic Lounge home">
            <img class="brand-img" src="/favicon.svg" alt="" aria-hidden="true" />
            <span>${this.forumName || 'Masonic Lounge'}</span>
          </a>
          <nav aria-label="Main navigation">
            <a href="/" router-link><ml-icon name="home" size="18"></ml-icon>Forums</a>
            ${session.currentRoles.includes('admin') ? html`<a href="/admin" router-link>Admin</a>` : ''}
            <a href="/about" router-link><ml-icon name="info" size="18"></ml-icon>About</a>
          </nav>
          <div class="auth">
            ${this.user
              ? html`
                  <a class="user" href="/profile" router-link>${this.user.display_name || this.user.username}</a>
                  <button class="signout" @click=${() => void this.signOut()}>Sign out</button>
                `
              : html`
                  <a href="/login" router-link>Log in</a>
                  <a href="/register" router-link>Sign up</a>
                `}
          </div>
          <button
            class="theme-toggle"
            @click=${this.toggleTheme}
            aria-label=${this.dark ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            <ml-icon name=${this.dark ? 'sun' : 'moon'} size="18"></ml-icon>
          </button>
        </div>
      </header>

      <main class="outlet" id="outlet"></main>

      <footer class="footer">
        <div class="footer-inner">
          <span>Masonic Lounge — open-source forum engine</span>
          <api-status></api-status>
        </div>
      </footer>
    `;
  }
}