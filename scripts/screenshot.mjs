// Renders the README images into docs/screenshots/: the transcript card on a real YouTube watch
// page (youtube-light.png, youtube-dark.png) and the settings popup (popup-light.png,
// popup-dark.png). With --store, renders the Chrome Web Store sizes (1280 × 800 and 640 × 400,
// light and dark) into docs/store/screenshots/ instead.
//
// The card comes from the real unpacked extension in Playwright's Chromium against youtube.com
// (like tests/live/), so it needs the network and YouTube must deliver the transcript; YouTube
// throttles transcripts after many automated requests, so run this sparingly. The popup uses the
// test harness from tests/popup.spec.mjs (pages served from extension/, stubbed chrome API).
// Interface language: English. Usage: npm run screenshot [-- --store]
import { chromium } from '@playwright/test';
import { mkdirSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const extensionPath = join(root, 'extension');
const store = process.argv.includes('--store');
const output = join(root, store ? 'docs/store/screenshots' : 'docs/screenshots');

// A public course with English captions and chapters. Measured 2026-11-09: in automated Chromium,
// videos whose transcript YouTube loads via /youtubei/v1/get_panel work, while many that use the
// legacy /youtubei/v1/get_transcript get HTTP 400 from YouTube (its own panel stays empty too).
const VIDEO = 'rfscVS0vtbw';
const SIZES = store
  ? [{ name: 'ytts-wide', width: 1280, height: 800 }, { name: 'ytts-compact', width: 640, height: 400 }]
  : [{ name: 'youtube', width: 1280, height: 800 }];

async function shoot(target, file, options = {}) {
  const out = join(output, file);
  await target.screenshot({ path: out, animations: 'disabled', ...options });
  console.log(`${relative(root, out)}  ${(statSync(out).size / 1024).toFixed(1)} KB`);
}

// --- Transcript card on youtube.com ------------------------------------------------------------

async function openWatchPage(page) {
  await page.goto(`https://www.youtube.com/watch?v=${VIDEO}`, { waitUntil: 'domcontentloaded' });
  if (page.url().includes('consent.')) throw new Error('YouTube redirected to a consent page.');
  const consent = page.locator('ytd-consent-bump-v2-lightbox button, tp-yt-paper-dialog button')
    .filter({ hasText: /reject all/i });
  try {
    await consent.first().click({ timeout: 5_000 });
  } catch { /* no consent dialog */ }
  // Ads would show in the player; wait them out, then pause at a fixed frame.
  await page.waitForFunction(() => !document.querySelector('.ad-showing'), null, { timeout: 120_000 });
  await page.evaluate(() => {
    const video = document.querySelector('video');
    if (video) { video.pause(); video.currentTime = 30; }
  });
  const copy = page.locator('#ytts-panel .ytts-copy');
  try {
    await copy.waitFor({ state: 'visible', timeout: 30_000 });
    await page.waitForFunction(() => !document.querySelector('#ytts-panel .ytts-copy')?.disabled, null, { timeout: 60_000 });
  } catch {
    throw new Error('The card did not load a transcript (YouTube may be throttling transcripts; retry later).');
  }
  await page.waitForFunction(() => !document.documentElement.classList.contains('ytts-busy'));
  await page.locator('#ytts-panel .ytts-title').click();
  await page.locator('#ytts-panel [data-sec]').first().waitFor();
}

async function cardScreenshots() {
  for (const scheme of ['light', 'dark']) {
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      locale: 'en-US',
      viewport: { width: SIZES[0].width, height: SIZES[0].height },
      deviceScaleFactor: 1,
      args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    });
    try {
      // YouTube's own preference cookie: f6=400 is the dark theme; hl/gl fix language and region.
      await context.addCookies([{
        name: 'PREF', value: `hl=en&gl=US${scheme === 'dark' ? '&f6=400' : ''}`,
        domain: '.youtube.com', path: '/', secure: true,
      }]);
      const page = context.pages()[0] ?? await context.newPage();
      await openWatchPage(page);
      for (const { name, width, height } of SIZES) {
        await page.setViewportSize({ width, height });
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.mouse.move(0, 0);
        await page.waitForTimeout(1_000); // relayout, lazy thumbnails
        if (width < 1000) {
          // Too narrow for the sidebar: YouTube moves the card below the player. Show the card.
          await page.locator('#ytts-panel').scrollIntoViewIfNeeded();
          await page.evaluate(() => window.scrollBy(0, -16));
        }
        await shoot(page, `${name}${scheme === 'dark' ? '-dark' : '-light'}.png`);
      }
    } finally {
      await context.close();
    }
  }
}

// --- Settings popup (harness from tests/popup.spec.mjs) ----------------------------------------

const mimeTypes = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png' };

async function popupScreenshots() {
  const browser = await chromium.launch({ channel: 'chromium' });
  try {
    for (const scheme of ['light', 'dark']) {
      const page = await browser.newPage({ colorScheme: scheme, viewport: { width: 320, height: 100 }, deviceScaleFactor: 1 });
      await page.route('https://ytts.test/**', async (route) => {
        const path = new URL(route.request().url()).pathname.slice(1);
        await route.fulfill({ contentType: mimeTypes[extname(path)], body: await readFile(join(extensionPath, path)) });
      });
      await page.addInitScript(() => {
        window.chrome = { i18n: { getUILanguage: () => 'en-US' }, storage: { sync: {
          get: async (defaults) => ({ ...defaults }),
          set: async () => {},
        } } };
      });
      await page.goto('https://ytts.test/popup.html');
      await page.locator('[data-key="copyTimestamps"]:enabled').waitFor();
      await shoot(page, `popup-${scheme}.png`, { fullPage: true });
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

mkdirSync(output, { recursive: true });
await cardScreenshots();
if (!store) await popupScreenshots();
