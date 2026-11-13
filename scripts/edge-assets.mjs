// Render the optional Microsoft Edge Add-ons tile from YTTS's existing vector icon.
// Usage: node scripts/edge-assets.mjs (development dependencies + Google Chrome).
import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const destination = new URL('docs/store/edge/assets/', root);
await mkdir(destination, { recursive: true });
const icon = (await readFile(new URL('extension/icons/icon.svg', root), 'utf8'))
  .replace('width="128" height="128"', 'x="14" y="12" width="88" height="88"');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="440" height="280" viewBox="0 0 440 280">
  <title>YTTS — read and copy YouTube transcripts</title>
  <rect width="440" height="280" fill="#f5f7fb"/>
  ${icon}
  <g font-family="Arial, sans-serif" fill="#101828">
    <text x="106" y="69" font-size="34" font-weight="700">YTTS</text>
    <text x="32" y="140" font-size="26" font-weight="700">Read YouTube transcripts.</text>
    <text x="32" y="176" font-size="26" font-weight="700">Copy them in one click.</text>
    <text x="32" y="236" font-size="16" fill="#475467">Free · Open source · No ads</text>
  </g>
</svg>`;
await writeFile(new URL('small-tile.svg', destination), `${svg}\n`);
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage({ viewport: { width: 440, height: 280 }, deviceScaleFactor: 1 });
  await page.setContent(`<style>html,body{margin:0}svg{display:block}</style>${svg}`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: fileURLToPath(new URL('small-tile.png', destination)) });
  console.log('docs/store/edge/assets/small-tile.png (440 × 280)');
} finally {
  await browser.close();
}
