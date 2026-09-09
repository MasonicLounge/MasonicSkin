import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { ApiError, fetchVersion, type VersionResponse } from '../api/client.js';
import * as session from '../auth/session.js';
import { navigate } from '../router.js';
import type { AttachmentWithOwner, ForumSettings, Group, UserWithRoles } from '../api/types.js';
import {
  fetchAdminMedia,
  fetchAdminSettings,
  fetchAdminUsers,
  fetchGroups,
  createGroup,
  deleteGroup,
  updateAdminUser,
  putAdminSettings,
  deleteAttachment,
} from '../api/endpoints.js';

const ROLE_KEYS = ['admin', 'moderator', 'member'];
const STATUS_KEYS = ['active', 'banned', 'pending'];

/** `admin-view` is the administration panel; guarded to admins only. */
@customElement('admin-view')
export class AdminView extends LitElement {
  static override styles = css`
    :host {
      display: block;
      max-width: 64rem;
    }

    h1 {
      font-size: var(--font-size-xl);
      color: var(--color-primary);
    }

    .tabs {
      display: flex;
      gap: var(--space-2);
      flex-wrap: wrap;
      margin-bottom: var(--space-5);
      border-bottom: 1px solid var(--color-border);
    }

    .tab {
      appearance: none;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      padding: var(--space-3) var(--space-4);
      font: inherit;
      color: var(--color-text-secondary);
      cursor: pointer;
    }

    .tab[aria-selected='true'] {
      color: var(--color-primary);
      border-bottom-color: var(--color-primary);
      font-weight: 600;
    }

    .error {
      color: var(--color-danger);
      padding: var(--space-4);
      border: 1px dashed var(--color-danger);
      border-radius: var(--radius-lg);
    }

    .hint {
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm);
      margin: var(--space-2) 0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--font-size-sm);
    }

    th,
    td {
      text-align: left;
      padding: var(--space-3);
      border-bottom: 1px solid var(--color-border);
      vertical-align: top;
    }

    th {
      color: var(--color-text-secondary);
      font-weight: 600;
    }

    label {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      margin-right: var(--space-3);
      font-size: var(--font-size-sm);
    }

    input,
    select {
      font: inherit;
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-surface);
      color: var(--color-text);
    }

    button {
      font: inherit;
    }

    .primary {
      background: var(--color-primary);
      color: #fff;
      border: none;
      border-radius: var(--radius-md);
      padding: var(--space-2) var(--space-4);
      cursor: pointer;
    }

    .danger {
      background: none;
      border: 1px solid var(--color-danger);
      color: var(--color-danger);
      border-radius: var(--radius-md);
      padding: var(--space-1) var(--space-3);
      cursor: pointer;
    }

    .badge {
      display: inline-block;
      padding: 1px var(--space-2);
      border-radius: var(--radius-full);
      font-size: var(--font-size-xs);
      border: 1px solid var(--color-border);
      background: var(--color-bg);
    }

    .group-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-4);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      margin-bottom: var(--space-3);
      background: var(--color-surface);
    }

    details {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-3);
      margin-bottom: var(--space-3);
      background: var(--color-surface);
    }

    summary {
      cursor: pointer;
      font-weight: 600;
    }

    .form-grid {
      display: grid;
      gap: var(--space-3);
      margin-top: var(--space-3);
    }

    .summary {
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm);
    }
  `;

  @state() private activeTab = 'groups';
  @state() private busy = true;
  @state() private error = '';

  @state() private groups: Group[] = [];
  @state() private users: UserWithRoles[] = [];
  @state() private media: AttachmentWithOwner[] = [];
  @state() private settings: ForumSettings | null = null;
  @state() private version: VersionResponse | null = null;

  @state() private savedMessage = '';

  private unsubscribe: (() => void) | null = null;

  override async connectedCallback(): Promise<void> {
    super.connectedCallback();
    await this.guard();
    this.unsubscribe = session.subscribeSession(() => {
      if (!session.currentRoles.includes('admin')) {
        navigate('/');
      }
    });
    await this.loadTab(this.activeTab);
  }

  override disconnectedCallback(): void {
    this.unsubscribe?.();
    super.disconnectedCallback();
  }

  private async guard(): Promise<boolean> {
    try {
      await session.refreshSession();
    } catch {
      // session refresh is allowed to fail; role check below decides
    }
    if (!session.isLoggedIn() || !session.currentRoles.includes('admin')) {
      navigate('/');
      return false;
    }
    return true;
  }

  private flash(message: string): void {
    this.savedMessage = message;
    setTimeout(() => {
      this.savedMessage = '';
    }, 3000);
  }

  private async loadTab(tab: string): Promise<void> {
    this.busy = true;
    this.error = '';
    try {
      if (tab === 'groups') {
        this.groups = (await fetchGroups()).items;
      } else if (tab === 'users') {
        this.users = (await fetchAdminUsers(100)).items;
      } else if (tab === 'settings') {
        this.settings = await fetchAdminSettings();
      } else if (tab === 'media') {
        this.media = (await fetchAdminMedia(100)).items;
      } else if (tab === 'version') {
        this.version = await fetchVersion();
      }
    } catch (err) {
      this.error = err instanceof ApiError ? err.message : 'Failed to load';
    } finally {
      this.busy = false;
    }
  }

  private async switchTab(tab: string): Promise<void> {
    this.activeTab = tab;
    await this.loadTab(tab);
  }

  override render() {
    return html`
      <h1>Admin panel</h1>
      ${this.savedMessage ? html`<p class="summary">✓ ${this.savedMessage}</p>` : ''}
      ${this.error ? html`<div class="error">${this.error}</div>` : ''}
      <nav class="tabs" role="tablist">
        ${['groups', 'users', 'settings', 'media', 'version'].map(
          (tab) => html`
            <button
              class="tab"
              role="tab"
              aria-selected=${this.activeTab === tab}
              @click=${() => void this.switchTab(tab)}
            >
              ${tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          `,
        )}
      </nav>
      ${this.busy ? html`<p>Loading…</p>` : this.renderTab(this.activeTab)}
    `;
  }

  private renderTab(tab: string) {
    switch (tab) {
      case 'groups':
        return this.renderGroups();
      case 'users':
        return this.renderUsers();
      case 'settings':
        return this.renderSettings();
      case 'media':
        return this.renderMedia();
      case 'version':
        return this.renderVersion();
      default:
        return '';
    }
  }

  private renderGroups() {
    return html`
      <details>
        <summary>New group</summary>
        <form class="form-grid" @submit=${(e: SubmitEvent) => void this.onCreateGroup(e)}>
          <input name="name" placeholder="Name" maxlength="100" required />
          <input name="slug" placeholder="slug (lowercase, hyphens)" pattern="[a-z0-9]+(-[a-z0-9]+)*" maxlength="80" required />
          <input name="description" placeholder="Description (optional)" maxlength="2000" />
          <button class="primary" type="submit">Create group</button>
        </form>
      </details>
      <p class="hint">${this.groups.length} group(s)</p>
      ${this.groups.map((g) => this.renderGroupRow(g))}
    `;
  }

  private renderGroupRow(g: Group) {
    return html`
      <div class="group-card">
        <div>
          <strong>${g.name}</strong>
          <span class="summary"> /${g.slug} · ${g.description || 'no description'}</span>
        </div>
        <div>
          <a href="/groups/${g.id}" class="hint">view →</a>
          <button class="danger" @click=${() => void this.onDeleteGroup(g.id)}>Delete</button>
        </div>
      </div>
    `;
  }

  private async onCreateGroup(e: SubmitEvent): Promise<void> {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    try {
      const group = await createGroup({
        name: String(data.get('name') ?? ''),
        slug: String(data.get('slug') ?? ''),
        description: String(data.get('description') ?? '') || undefined,
      });
      this.groups = [...this.groups, group];
      form.reset();
      this.flash('Group created');
    } catch (err) {
      this.error = err instanceof ApiError ? err.message : 'Failed to create group';
    }
  }

  private async onDeleteGroup(id: string): Promise<void> {
    if (!window.confirm('Delete this group? All its threads will be removed.')) return;
    try {
      await deleteGroup(id);
      this.groups = this.groups.filter((g) => g.id !== id);
      this.flash('Group deleted');
    } catch (err) {
      this.error = err instanceof ApiError ? err.message : 'Failed to delete group';
    }
  }

  private renderUsers() {
    if (this.users.length === 0) return html`<p class="hint">No users yet.</p>`;
    return html`
      <table>
        <thead>
          <tr>
            <th>User</th>
            <th>Status</th>
            <th>Roles</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${this.users.map((u) => this.renderUserRow(u))}
        </tbody>
      </table>
    `;
  }

  private renderUserRow(u: UserWithRoles) {
    return html`
      <tr>
        <td>
          <strong>${u.display_name || u.username}</strong>
          <br /><span class="hint">@${u.username} · ${u.email}</span>
        </td>
        <td>
          <select data-status=${u.id} @change=${() => void this.onUserChange(u.id)}>
            ${STATUS_KEYS.map(
              (s) => html`<option value=${s} ?selected=${u.status === s}>${s}</option>`,
            )}
          </select>
        </td>
        <td>
          ${ROLE_KEYS.map(
            (r) => html`
              <label>
                <input
                  type="checkbox"
                  value=${r}
                  data-role=${u.id}
                  ?checked=${u.roles.includes(r)}
                  @change=${() => void this.onUserChange(u.id)}
                />
                ${r}
              </label>
            `,
          )}
        </td>
        <td>${u.roles.includes('admin') ? html`<span class="badge">admin</span>` : ''}</td>
      </tr>
    `;
  }

  private async onUserChange(id: string): Promise<void> {
    const root = this.shadowRoot as ShadowRoot;
    const status = String((root.querySelector(`select[data-status="${id}"]`) as HTMLSelectElement).value);
    const roles = Array.from(
      root.querySelectorAll<HTMLInputElement>(`input[data-role="${id}"]:checked`),
    ).map((cb) => cb.value);
    try {
      const updated = await updateAdminUser(id, { status, roles });
      const idx = this.users.findIndex((x) => x.id === id);
      if (idx >= 0) {
        const next = [...this.users];
        next[idx] = updated;
        this.users = next;
      }
      this.flash('User updated');
    } catch (err) {
      this.error = err instanceof ApiError ? err.message : 'Failed to update user';
    }
  }

  private renderSettings() {
    if (!this.settings) return html`<p class="hint">No settings loaded.</p>`;
    const name = this.settings.forum_name;
    return html`
      <form class="form-grid" @submit=${(e: SubmitEvent) => void this.onSaveSettings(e)}>
        <label>
          Forum name
          <input name="forum_name" value=${name} maxlength="100" required />
        </label>
        <button class="primary" type="submit">Save settings</button>
      </form>
    `;
  }

  private async onSaveSettings(e: SubmitEvent): Promise<void> {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    try {
      const updated = await putAdminSettings({
        forum_name: String(data.get('forum_name') ?? ''),
      });
      this.settings = updated;
      this.flash('Settings saved');
    } catch (err) {
      this.error = err instanceof ApiError ? err.message : 'Failed to save settings';
    }
  }

  private renderMedia() {
    if (this.media.length === 0) return html`<p class="hint">No attachments yet.</p>`;
    return html`
      <table>
        <thead>
          <tr>
            <th>File</th>
            <th>Owner</th>
            <th>Size</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${this.media.map(
            (m) => html`
              <tr>
                <td><a href=${m.public_url} target="_blank" rel="noopener">${m.filename}</a></td>
                <td>@${m.owner_username}</td>
                <td>${(m.size_bytes / 1024).toFixed(1)} KiB</td>
                <td>
                  <button class="danger" @click=${() => void this.onDeleteMedia(m.id)}>Delete</button>
                </td>
              </tr>
            `,
          )}
        </tbody>
      </table>
    `;
  }

  private async onDeleteMedia(id: string): Promise<void> {
    if (!window.confirm('Delete this attachment?')) return;
    try {
      await deleteAttachment(id);
      this.media = this.media.filter((m) => m.id !== id);
      this.flash('Attachment deleted');
    } catch (err) {
      this.error = err instanceof ApiError ? err.message : 'Failed to delete attachment';
    }
  }

  private renderVersion() {
    if (!this.version) return html`<p class="hint">Version unavailable.</p>`;
    return html`
      <table>
        <tbody>
          <tr>
            <th>Backend</th>
            <td>${this.version.backend}</td>
          </tr>
          <tr>
            <th>Database schema</th>
            <td>v${this.version.db}</td>
          </tr>
        </tbody>
      </table>
    `;
  }
}