// Generates extension/_locales/<code>/messages.json (manifest description and action title) from
// extension/i18n.js, the single source of UI strings.
//
//   npm run locales            write the files
//   node scripts/locales.mjs --check   exit 1 if the files on disk differ (used by check.mjs)
import fs from 'node:fs';
import path from 'node:path';
import { runInNewContext } from 'node:vm';

const root = path.join(import.meta.dirname, '..');
const localesDir = path.join(root, 'extension', '_locales');
const MANIFEST_KEYS = ['extDescription', 'actionTitle'];

// i18n.js locale → Chrome _locales folder names (Chrome has no plain "pt" or "zh").
const CHROME_CODES = { pt: ['pt_BR'], 'pt-PT': ['pt_PT'], 'zh-CN': ['zh_CN'], 'zh-TW': ['zh_TW'] };

export function loadI18n() {
  const sandbox = {};
  sandbox.globalThis = sandbox;
  runInNewContext(fs.readFileSync(path.join(root, 'extension', 'i18n.js'), 'utf8'), sandbox);
  return sandbox.YTTS_I18N;
}

// { 'de/messages.json': '<json>', ... }
export function expectedFiles() {
  const { MESSAGES } = loadI18n();
  const files = {};
  for (const [locale, table] of Object.entries(MESSAGES)) {
    const messages = Object.fromEntries(MANIFEST_KEYS.map((key) => [key, { message: table[key] }]));
    const json = JSON.stringify(messages, null, 2) + '\n';
    for (const code of CHROME_CODES[locale] || [locale]) files[`${code}/messages.json`] = json;
  }
  return files;
}

export function diffLocales() {
  const expected = expectedFiles();
  const problems = [];
  for (const [file, json] of Object.entries(expected)) {
    const target = path.join(localesDir, file);
    if (!fs.existsSync(target)) problems.push(`missing _locales/${file}`);
    else if (fs.readFileSync(target, 'utf8') !== json) problems.push(`outdated _locales/${file}`);
  }
  if (fs.existsSync(localesDir)) {
    for (const code of fs.readdirSync(localesDir)) {
      if (!Object.hasOwn(expected, `${code}/messages.json`)) problems.push(`unexpected _locales/${code}`);
    }
  }
  return problems;
}

if (process.argv[1] === import.meta.filename) {
  if (process.argv.includes('--check')) {
    const problems = diffLocales();
    if (problems.length) {
      console.error(`${problems.join('\n')}\nRun: npm run locales`);
      process.exit(1);
    }
  } else {
    fs.rmSync(localesDir, { recursive: true, force: true });
    for (const [file, json] of Object.entries(expectedFiles())) {
      fs.mkdirSync(path.dirname(path.join(localesDir, file)), { recursive: true });
      fs.writeFileSync(path.join(localesDir, file), json);
    }
    console.log(`Wrote ${Object.keys(expectedFiles()).length} locale files to extension/_locales/`);
  }
}
