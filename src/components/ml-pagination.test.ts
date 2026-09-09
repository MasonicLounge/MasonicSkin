/// <reference types="mocha" />
import { expect } from '@esm-bundle/chai';
import { fixture } from '@open-wc/testing';
import { setLocale } from '../i18n/index.js';
import './ml-pagination.js';

async function render(props: { total: number; pageSize?: number; offset?: number }) {
  const el = await fixture<HTMLElement>(
    `<ml-pagination total="${props.total}" page-size="${props.pageSize ?? 50}" offset="${props.offset ?? 0}"></ml-pagination>`,
  );
  return el;
}

describe('ml-pagination', () => {
  beforeEach(() => {
    setLocale('en');
  });

  it('renders nothing for a single page', async () => {
    const el = await render({ total: 3 });
    expect(el.shadowRoot?.textContent ?? '').to.equal('');
  });

  it('renders page info and navigation', async () => {
    const el = await render({ total: 120, offset: 50 });
    const text = el.shadowRoot?.textContent ?? '';
    expect(text).to.contain('Page 2 of 3');
    expect(el.shadowRoot?.querySelectorAll('button').length).to.equal(2);
  });

  it('disables previous on the first page', async () => {
    const el = await render({ total: 120, offset: 0 });
    const buttons = el.shadowRoot?.querySelectorAll('button') ?? [];
    expect((buttons[0] as HTMLButtonElement).disabled).to.equal(true);
    expect((buttons[1] as HTMLButtonElement).disabled).to.equal(false);
  });

  it('disables next on the last page', async () => {
    const el = await render({ total: 120, offset: 100 });
    const buttons = el.shadowRoot?.querySelectorAll('button') ?? [];
    expect((buttons[0] as HTMLButtonElement).disabled).to.equal(false);
    expect((buttons[1] as HTMLButtonElement).disabled).to.equal(true);
  });

  it('emits a page-change event with the new offset', async () => {
    const el = await render({ total: 120 });
    let fired = 0;
    let detail = -1;
    el.addEventListener('page-change', (e) => {
      fired += 1;
      detail = (e as CustomEvent<number>).detail;
    });
    const next = el.shadowRoot?.querySelectorAll('button')[1] as HTMLButtonElement;
    next.click();
    expect(fired).to.equal(1);
    expect(detail).to.equal(50);
  });
});