import { LitElement, html, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export interface IconDefinition {
  paths: string[];
  fill?: boolean;
}

const registry = new Map<string, IconDefinition>([
  ['home', { paths: ['M3 10.5 12 3l9 7.5', 'M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5'] }],
  ['info', { paths: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 11v5', 'M12 8h.01'] }],
  ['sun', { paths: ['M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z', 'M12 1v3', 'M12 20v3', 'M4.22 4.22l2.12 2.12', 'M17.66 17.66l2.12 2.12', 'M1 12h3', 'M20 12h3', 'M4.22 19.78l2.12-2.12', 'M17.66 6.34l2.12-2.12'] }],
  ['moon', { paths: ['M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z'] }],
]);

/**
 * `ml-icon` renders an inline SVG icon from the internal registry.
 */
@customElement('ml-icon')
export class Icon extends LitElement {
  @property() name = '';

  @property({ type: Number }) size = 20;

  override render(): TemplateResult {
    const def = registry.get(this.name) as IconDefinition | undefined;
    if (!def) {
      return html``;
    }
    const fillAttr = def.fill ? 'fill="currentColor"' : 'fill="none"';
    return html`
      <svg
        width=${this.size}
        height=${this.size}
        viewBox="0 0 24 24"
        aria-hidden="true"
        role="img"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        ${fillAttr}
      >
        ${def.paths.map((d) => html`<path d=${d}></path>`)}
      </svg>
    `;
  }
}

/** Registers an icon under a name at runtime. */
export function registerIcon(name: string, def: IconDefinition): void {
  registry.set(name, def);
}