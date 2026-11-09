import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

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

// lib.js is the single source of DEFAULTS and must load before its consumers.
for (const entry of manifest.content_scripts) {
  if (entry.js.includes('content.js')) {
    assert.equal(entry.js[0], 'lib.js', 'lib.js must be the first script of every entry that loads content.js');
  }
}
const popupHtml = await readFile(resolve(extension, manifest.action.default_popup), 'utf8');
const popupScripts = [...popupHtml.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);
assert.ok(popupScripts.indexOf('lib.js') > -1 && popupScripts.indexOf('lib.js') < popupScripts.indexOf('popup.js'),
  'popup.html must load lib.js before popup.js');
for (const file of ['content.js', 'popup.js']) {
  const source = await readFile(resolve(extension, file), 'utf8');
  assert.doesNotMatch(source, /const DEFAULTS\s*=\s*\{/, `${file} must take DEFAULTS from lib.js`);
}
console.log('Extension syntax, manifest, icon dimensions, settings defaults and script order verified.');
