// Builds dist/ytts-<version>.zip: the contents of extension/ with manifest.json at the zip root,
// ready for "Load unpacked" after extracting or for a Chrome Web Store upload.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.join(import.meta.dirname, '..');
const extension = path.join(root, 'extension');
const manifest = JSON.parse(fs.readFileSync(path.join(extension, 'manifest.json'), 'utf8'));
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
if (manifest.version !== pkg.version) {
  console.error(`Version mismatch: extension/manifest.json ${manifest.version} vs package.json ${pkg.version}`);
  process.exit(1);
}

const dist = path.join(root, 'dist');
fs.mkdirSync(dist, { recursive: true });
const out = path.join(dist, `ytts-${manifest.version}.zip`);
fs.rmSync(out, { force: true });

// zip(1) is available on macOS, Linux and GitHub's runners; -X drops OS metadata.
execFileSync('zip', ['-r', '-X', '-q', out, '.', '-x', '*.DS_Store'], { cwd: extension, stdio: 'inherit' });
const size = fs.statSync(out).size;
console.log(`${path.relative(root, out)} (${(size / 1024).toFixed(0)} KB)`);
