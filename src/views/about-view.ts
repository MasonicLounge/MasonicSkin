import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { t } from '../i18n/index.js';

/**
 * `about-view` renders the project description and links to the source repositories.
 */
@customElement('about-view')
export class AboutView extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }

    h1 {
      font-size: var(--font-size-xl);
      margin-bottom: var(--space-4);
    }

    section {
      max-width: 40rem;
      margin-bottom: var(--space-6);
      color: var(--color-text-secondary);
    }

    ul {
      padding-left: var(--space-6);
    }

    li {
      margin-bottom: var(--space-2);
    }
  `;

  override render() {
    return html`
      <h1>${t('about.title')}</h1>
      <section>
        <p>${t('about.p1')}</p>
      </section>
      <section>
        <ul>
          <li>${t('about.repo')}</li>
          <li>${t('about.auth')}</li>
          <li>${t('about.realtime')}</li>
          <li>${t('about.media')}</li>
        </ul>
      </section>
    `;
  }
}