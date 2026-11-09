// Unit tests for extension/i18n.js, loaded in a fresh VM context like the browser would run it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const source = await readFile(new URL('../../extension/i18n.js', import.meta.url), 'utf8');
const sandbox = {};
sandbox.globalThis = sandbox;
runInNewContext(source, sandbox);
const i18n = sandbox.YTTS_I18N;

test('ships the common YouTube interface languages', () => {
  for (const locale of ['en', 'de', 'es', 'fr', 'it', 'pt', 'pt-PT', 'nl', 'pl', 'tr', 'ru', 'uk', 'ja', 'ko', 'zh-CN', 'zh-TW', 'hi', 'id', 'vi', 'ar', 'sv']) {
    assert.ok(i18n.LOCALES.includes(locale), `missing ${locale}`);
  }
});

test('every language translates every key, non-empty and trimmed', () => {
  for (const [locale, table] of Object.entries(i18n.MESSAGES)) {
    assert.deepEqual(Object.keys(table), [...i18n.KEYS], `${locale}: keys differ`);
    for (const [key, value] of Object.entries(table)) {
      assert.equal(typeof value, 'string', `${locale}.${key}`);
      assert.ok(value.length > 0 && value === value.trim(), `${locale}.${key} is empty or padded`);
    }
  }
});

test('placeholders survive translation', () => {
  for (const [locale, table] of Object.entries(i18n.MESSAGES)) {
    const placeholders = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    for (const key of i18n.KEYS) {
      assert.deepEqual(placeholders(table[key]), placeholders(i18n.MESSAGES.en[key]), `${locale}.${key}`);
    }
  }
});

test('manifest strings fit the Chrome Web Store limits', () => {
  for (const [locale, table] of Object.entries(i18n.MESSAGES)) {
    assert.ok(table.extDescription.length <= 132, `${locale}.extDescription is longer than 132 characters`);
    assert.ok(table.actionTitle.startsWith('YTTS'), `${locale}.actionTitle should start with the product name`);
  }
});

test('locale resolution handles regions, scripts, underscores and unknown languages', () => {
  const cases = {
    de: 'de', 'de-DE': 'de', 'de-AT': 'de', 'en-GB': 'en', 'pt-BR': 'pt', pt: 'pt', pt_PT: 'pt-PT', 'pt-pt': 'pt-PT', 'es-419': 'es', in: 'id', 'in-ID': 'id',
    'zh-CN': 'zh-CN', 'zh-Hans': 'zh-CN', 'zh-SG': 'zh-CN', zh: 'zh-CN',
    'zh-TW': 'zh-TW', 'zh-Hant-HK': 'zh-TW', 'zh-HK': 'zh-TW', zh_TW: 'zh-TW', 'zh-Hans-HK': 'zh-CN', 'zh-Hant': 'zh-TW',
    'JA': 'ja', 'fil': 'en', '': 'en', undefined: 'en',
  };
  for (const [tag, expected] of Object.entries(cases)) {
    assert.equal(i18n.resolveLocale(tag === 'undefined' ? undefined : tag), expected, String(tag));
  }
});

test('translator interpolates, falls back to English and to the key', () => {
  const de = i18n.createTranslator('de-DE');
  assert.equal(de.locale, 'de');
  assert.equal(de.dir, 'ltr');
  assert.equal(de.t('seekTo', { time: '1:05', text: 'Hallo' }), 'Zu 1:05 springen: Hallo');
  assert.equal(de.t('seekTo'), 'Zu {time} springen: {text}');
  assert.equal(de.t('noSuchKey'), 'noSuchKey');
  assert.equal(i18n.createTranslator('xx').t('copy'), 'Copy');
  assert.equal(i18n.createTranslator('ar').dir, 'rtl');
});

test('German strings stay exactly as the UI and tests expect', () => {
  const { t } = i18n.createTranslator('de');
  assert.equal(t('title'), 'Transkript');
  assert.equal(t('noTranscript'), 'Für dieses Video gibt es kein Transkript.');
  assert.equal(t('copyFailed'), 'Kopieren fehlgeschlagen. Bitte erneut versuchen.');
});

test('i18n.js stays pure: no DOM or extension APIs', () => {
  for (const banned of [/\bdocument\./, /\bwindow\./, /\bchrome\.[a-z]/, /\bnavigator\./, /innerHTML/]) {
    assert.doesNotMatch(source, banned);
  }
});
