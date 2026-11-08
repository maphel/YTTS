import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { diffLocales } from './locales.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const extension = resolve(root, 'extension');
const manifest = JSON.parse(await readFile(resolve(extension, 'manifest.json'), 'utf8'));
const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
assert.equal(manifest.version, pkg.version, 'extension/manifest.json and package.json versions differ');
const lock = JSON.parse(await readFile(resolve(root, 'package-lock.json'), 'utf8'));
assert.equal(lock.version, pkg.version, 'package-lock.json and package.json versions differ');
assert.equal(lock.packages?.['']?.version, pkg.version, 'package-lock.json root package version differs');
assert.equal(manifest.manifest_version, 3);
assert.equal(manifest.name, 'YTTS');
assert.deepEqual(manifest.permissions, ['storage']);

const scripts = manifest.content_scripts.flatMap((entry) => entry.js);
scripts.push('popup.js');
for (const script of scripts) {
  const result = spawnSync(process.execPath, ['--check', resolve(extension, script)], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
}

const assets = new Set([
  manifest.action.default_popup,
  ...manifest.content_scripts.flatMap((entry) => [...entry.js, ...entry.css]),
  ...Object.values(manifest.icons || {}),
  ...Object.values(manifest.action.default_icon || {}),
]);
for (const asset of assets) await access(resolve(extension, asset));

for (const size of [16, 32, 48, 128]) {
  assert.ok(manifest.icons?.[size], `Missing ${size}px manifest icon`);
  const png = await readFile(resolve(extension, manifest.icons[size]));
  assert.equal(png.subarray(1, 4).toString(), 'PNG');
  assert.equal(png.readUInt32BE(16), size);
  assert.equal(png.readUInt32BE(20), size);
}

// lib.js (DEFAULTS, helpers) and i18n.js (strings) must load before their consumers, in this order.
const expectedOrder = (consumer) => ['lib.js', 'i18n.js', consumer];
for (const entry of manifest.content_scripts) {
  if (entry.js.includes('content.js')) {
    assert.deepEqual(entry.js.slice(0, 3), expectedOrder('content.js'), 'content scripts must load lib.js, i18n.js, content.js');
  }
}
const popupHtml = await readFile(resolve(extension, manifest.action.default_popup), 'utf8');
const popupScripts = [...popupHtml.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);
assert.deepEqual(popupScripts, expectedOrder('popup.js'), 'popup.html must load lib.js, i18n.js, popup.js');

// Manifest strings come from _locales, which are generated from i18n.js (npm run locales).
assert.equal(manifest.default_locale, 'en');
assert.equal(manifest.description, '__MSG_extDescription__');
assert.equal(manifest.action.default_title, '__MSG_actionTitle__');
const localeProblems = diffLocales();
assert.deepEqual(localeProblems, [], `extension/_locales is out of sync with i18n.js: run npm run locales`);
for (const file of ['content.js', 'popup.js']) {
  const source = await readFile(resolve(extension, file), 'utf8');
  assert.doesNotMatch(source, /const DEFAULTS\s*=\s*\{/, `${file} must take DEFAULTS from lib.js`);
}
console.log('Extension syntax, manifest, icon dimensions, settings defaults, script order and locales verified.');
