import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';

const root = fileURLToPath(new URL('../', import.meta.url));
const extension = resolve(root, 'extension');
const manifest = JSON.parse(await readFile(resolve(extension, 'manifest.json'), 'utf8'));
const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
assert.equal(manifest.version, pkg.version, 'extension/manifest.json and package.json versions differ');
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

const defaults = [];
for (const file of ['content.js', 'popup.js']) {
  const source = await readFile(resolve(extension, file), 'utf8');
  const literal = source.match(/const DEFAULTS\s*=\s*(\{[^}]+\})/);
  assert.ok(literal, `${file} must declare DEFAULTS`);
  defaults.push(JSON.parse(JSON.stringify(runInNewContext(`(${literal[1]})`))));
}
assert.deepEqual(defaults[0], defaults[1], 'Content and popup defaults differ');
console.log('Extension syntax, manifest, icon dimensions and settings defaults verified.');
