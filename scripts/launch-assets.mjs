// Prepare launch gallery PNGs from the existing icon and real extension screenshots.
// Usage: node scripts/launch-assets.mjs (development dependencies with Playwright's Chromium).
import { chromium } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const destination = new URL('docs/launch/assets/', root);
await mkdir(destination, { recursive: true });
const svg = await readFile(new URL('extension/icons/icon.svg', root), 'utf8');
const dataUrl = async (path, mime) => `data:${mime};base64,${(await readFile(new URL(path, root))).toString('base64')}`;
const [light, dark, watch, popupLight, popupDark] = await Promise.all([
  dataUrl('website/assets/card-light.webp', 'image/webp'),
  dataUrl('website/assets/card-dark.webp', 'image/webp'),
  dataUrl('docs/store/screenshots/ytts-wide-dark.png', 'image/png'),
  dataUrl('docs/screenshots/popup-light.png', 'image/png'),
  dataUrl('docs/screenshots/popup-dark.png', 'image/png'),
]);

const css = `
  * { box-sizing: border-box; }
  html, body { margin: 0; width: 1270px; height: 760px; overflow: hidden; }
  body { font-family: Arial, sans-serif; color: #101828; background: #f5f7fb; }
  .brand { position: absolute; left: 58px; top: 40px; display: flex; gap: 9px; align-items: center; font-size: 25px; font-weight: 700; }
  .brand svg { width: 44px; height: 44px; }
  h1 { position: absolute; margin: 0; font-size: 57px; line-height: 1.08; letter-spacing: -2.4px; }
  p { margin: 0; font-size: 23px; line-height: 1.45; color: #475467; }
  .small { font-size: 16px; color: #667085; }
  .foot { position: absolute; left: 64px; bottom: 35px; right: 64px; display: flex; justify-content: space-between; align-items: center; }
  .pill { display: inline-block; border: 1px solid #d0d5dd; padding: 8px 14px; border-radius: 30px; font-size: 17px; }
  .card { position: absolute; top: 151px; width: 300px; border-radius: 14px; box-shadow: 0 18px 50px #15294c1a; }
  .mode { position: absolute; top: 119px; font-size: 16px; color: #667085; }
  .popup { position: absolute; top: 212px; width: 320px; height: 388px; border-radius: 12px; box-shadow: 0 18px 50px #15294c1a; }
`;
const brand = `<div class="brand">${svg}<span>YTTS</span></div>`;
const footer = `<div class="foot"><span class="pill">Free · Open source · No ads</span><span class="small">ytts.christophel.io · Independent of YouTube and Google</span></div>`;
const frame = content => `<!doctype html><html lang="en"><meta charset="utf-8"><style>${css}</style><body>${brand}${content}${footer}</body></html>`;

const gallery = [
  ['01-native-themes.png', frame(`
    <h1 style="left:64px;top:190px;width:420px">YouTube<br>transcripts.<br>That look<br>built-in.</h1>
    <p style="position:absolute;left:64px;top:481px;width:410px">Read, jump to a moment,<br>copy the whole transcript.</p>
    <span class="mode" style="left:565px">Light</span><span class="mode" style="left:900px">Dark</span>
    <img class="card" style="left:565px" src="${light}" alt="Real YTTS light transcript card">
    <img class="card" style="left:900px" src="${dark}" alt="Real YTTS dark transcript card">
  `)],
  ['02-watch-page.png', frame(`
    <h1 style="left:64px;top:180px;width:330px;font-size:49px;letter-spacing:-1.6px">Right on the<br>watch page.</h1>
    <p style="position:absolute;left:64px;top:315px;width:320px">The transcript stays<br>close to the video.</p>
    <img style="position:absolute;left:447px;top:140px;width:762px;height:476px;border-radius:14px;box-shadow:0 18px 50px #15294c26" src="${watch}" alt="Real YTTS card on YouTube in dark mode">
    <p style="position:absolute;left:64px;top:435px;width:330px">Copy everything.<br>Keep timestamps<br>when you want them.</p>
    <p class="small" style="position:absolute;left:447px;top:635px;width:762px">Actual extension screenshot. Unrelated video content is blurred.</p>
  `)],
  ['03-preferences.png', frame(`
    <h1 style="left:64px;top:145px;width:430px">Your transcript.<br>Your view.</h1>
    <p style="position:absolute;left:64px;top:310px;width:400px">Lines, sentences or text.<br>Optional copy timestamps.<br>21 interface locales.</p>
    <p class="small" style="position:absolute;left:64px;top:459px;width:360px">Uses the transcript YouTube provides.<br>No AI transcription or translation.</p>
    <span class="mode" style="left:535px;top:176px">Light</span><span class="mode" style="left:884px;top:176px">Dark</span>
    <img class="popup" style="left:535px" src="${popupLight}" alt="Real YTTS light settings popup">
    <img class="popup" style="left:884px" src="${popupDark}" alt="Real YTTS dark settings popup">
  `)],
];

const browser = await chromium.launch({ channel: 'chromium' });
try {
  for (const size of [512]) {
    const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    const source = svg.replace('width="128" height="128"', `width="${size}" height="${size}"`);
    await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block}</style>${source}`);
    await page.screenshot({ path: fileURLToPath(new URL(`icon-${size}.png`, destination)), omitBackground: true });
    await page.close();
    console.log(`docs/launch/assets/icon-${size}.png`);
  }
  for (const [name, html] of gallery) {
    const page = await browser.newPage({ viewport: { width: 1270, height: 760 }, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'load' });
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map(img => img.decode()));
    });
    await page.screenshot({ path: fileURLToPath(new URL(name, destination)) });
    await page.close();
    console.log(`docs/launch/assets/${name}`);
  }
} finally {
  await browser.close();
}
