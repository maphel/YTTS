// Renders extension/icons/icon{16,32,48,128}.png from extension/icons/icon.svg with Playwright's
// Chromium (transparent background). icon128.png keeps the Chrome Web Store geometry (96 × 96
// artwork, 16 px padding); the toolbar sizes crop that padding to the original 1/16 margin so the
// icon stays legible at 16 px. Usage: npm run icons
import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('../extension/icons/', import.meta.url));
const svg = await readFile(`${dir}icon.svg`, 'utf8');
// Artwork spans 16..112; the toolbar sizes show it with a margin of 1/16 of the image per side.
const margin = 96 / 14;
const cropped = svg.replace('viewBox="0 0 128 128"', `viewBox="${16 - margin} ${16 - margin} ${96 + 2 * margin} ${96 + 2 * margin}"`);

const browser = await chromium.launch({ channel: 'chromium' });
try {
  for (const size of [16, 32, 48, 128]) {
    const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    const source = (size === 128 ? svg : cropped).replace(/width="128" height="128"/, `width="${size}" height="${size}"`);
    await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block}</style>${source}`);
    await page.screenshot({ path: `${dir}icon${size}.png`, omitBackground: true });
    await page.close();
    console.log(`extension/icons/icon${size}.png`);
  }
} finally {
  await browser.close();
}
