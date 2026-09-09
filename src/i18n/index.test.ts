/// <reference types="mocha" />
import { expect } from '@esm-bundle/chai';
import { setLocale, subscribeLocale, t, getLocale } from './index.js';

describe('i18n', () => {
  afterEach(() => {
    setLocale('en');
  });

  it('returns the key itself for unknown keys', () => {
    expect(t('does.not.exist')).to.equal('does.not.exist');
  });

  it('resolves known english keys', () => {
    expect(t('nav.forums')).to.equal('Forums');
  });

  it('switches language and notifies subscribers', () => {
    let notified = 0;
    const unsub = subscribeLocale(() => {
      notified += 1;
    });
    setLocale('ru');
    expect(getLocale()).to.equal('ru');
    expect(t('nav.forums')).to.equal('Форумы');
    expect(notified).to.equal(1);
    unsub();
    setLocale('en');
    expect(notified).to.equal(1);
  });

  it('interpolates variables', () => {
    setLocale('en');
    expect(t('group.post_count', { count: 3 })).to.equal('3 posts');
  });
});