// Renders the README images into docs/screenshots/: the transcript card on a real YouTube watch
// page (youtube-light.png, youtube-dark.png) and the settings popup (popup-light.png,
// popup-dark.png). With --store, renders the Chrome Web Store sizes (1280 × 800 and 640 × 400,
// light and dark) into docs/store/screenshots/ instead. With --site, renders only the card for the
// product website (website/assets/card-light.webp, card-dark.webp: 352 × 511 CSS px at 2×).
//
// The card comes from the real unpacked extension in Playwright's Chromium against youtube.com
// (like tests/live/), so it needs the network and YouTube must deliver the transcript; YouTube
// throttles transcripts after many automated requests, so run this sparingly. The popup uses the
// test harness from tests/popup.spec.mjs (pages served from extension/, stubbed chrome API).
// Interface language: English. Usage: npm run screenshot [-- --store | --site]. Images are overwritten one by
// one; if a run fails halfway, restore the pair with `git checkout docs/ website/assets/`.
import { chromium } from '@playwright/test';
import { mkdirSync, statSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const extensionPath = join(root, 'extension');
const store = process.argv.includes('--store');
const site = process.argv.includes('--site');
if (site && store) throw new Error('Use either --store or --site.');
const output = join(root, site ? 'website/assets' : store ? 'docs/store/screenshots' : 'docs/screenshots');
// The website shows the card alone at a fixed size (build-website.mjs: width 704, height 1022).
const SITE_CARD = { width: 352, height: 511 };

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
  if (await page.getByText(/confirm you.re not a bot/i).count()) {
    throw new Error('YouTube asked for a bot check from this IP; retry later or from another network.');
  }
  // Ads would show in the player; wait them out, then pause at a fixed frame.
  await page.waitForFunction(() => !document.querySelector('.ad-showing'), null, { timeout: 120_000 });
  await page.evaluate(() => {
    const video = document.querySelector('video');
    if (video) { video.pause(); video.currentTime = 30; }
  });
  const copy = page.locator('#ytts-panel .ytts-copy');
  try {
    await copy.waitFor({ state: 'visible', timeout: 30_000 });
    const toggle = page.locator('#ytts-panel .ytts-chevron');
    if ((await toggle.getAttribute('aria-expanded')) === 'false') await toggle.click();
    await page.locator('#ytts-panel .ytts-load').click();
    await page.waitForFunction(() => !document.querySelector('#ytts-panel .ytts-copy')?.disabled, null, { timeout: 60_000 });
  } catch {
    throw new Error('The card did not load a transcript (YouTube may be throttling transcripts; retry later).');
  }
  await page.waitForFunction(() => !document.documentElement.classList.contains('ytts-busy'));
  await page.locator('#ytts-panel [data-sec]').first().waitFor();
}

async function cardScreenshots() {
  for (const scheme of ['light', 'dark']) {
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      locale: 'en-US',
      viewport: { width: SIZES[0].width, height: SIZES[0].height },
      deviceScaleFactor: site ? 2 : 1,
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
      if (store) {
        // Store assets must not show third-party content or suggest a YouTube product: blur the
        // video frame, thumbnails, avatars, titles, channel names, description and the YouTube logo
        // (Chrome Web Store policy, Impersonation and Intellectual Property).
        await page.addStyleTag({ content: `#movie_player video, ytd-thumbnail img, yt-thumbnail-view-model img,
          #related img, #owner img, #avatar img, yt-img-shadow img, .ytp-cued-thumbnail-overlay-image,
          .ytp-watermark, .iv-branding, .ytp-ce-element
          { filter: blur(24px) !important; }
          ytd-topbar-logo-renderer, ytd-watch-metadata #title, #owner #channel-name, #owner-sub-count,
          #description, ytd-text-inline-expander, #related #video-title, #related ytd-channel-name,
          #related #metadata-line, #related yt-lockup-metadata-view-model, .ytp-chapter-container
          { filter: blur(6px) !important; }` });
      }
      if (site) {
        await siteCard(page, scheme);
        continue;
      }
      for (const { name, width, height } of SIZES) {
        await page.setViewportSize({ width, height });
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.mouse.move(0, 0);
        await page.waitForTimeout(1_000); // relayout, lazy thumbnails
        const belowPlayer = await page.evaluate(() => !document.getElementById('ytts-panel').closest('#secondary'));
        if (belowPlayer) {
          // Single column: the card sits below the player. Put its header just under the masthead.
          await page.evaluate(() => {
            const top = document.getElementById('ytts-panel').getBoundingClientRect().top;
            window.scrollBy(0, top - 72);
          });
        }
        await shoot(page, `${name}${scheme === 'dark' ? '-dark' : '-light'}.png`);
      }
    } finally {
      await context.close();
    }
  }
}

// The card alone for the website: pinned to SITE_CARD (YouTube's sidebar and panel height vary
// with the window), captured at 2× and encoded as WebP by the browser, so no image tool is needed.
async function siteCard(page, scheme) {
  // The card is translucent like YouTube's panels: without this, the player's ambient glow
  // (dark theme) tints the standalone image.
  await page.addStyleTag({ content: '#cinematics, #cinematics-container { display: none !important; }' });
  await page.evaluate(({ width, height }) => {
    document.querySelector('ytd-watch-flexy').style.setProperty('--ytd-watch-flexy-panel-max-height', `${height}px`);
    document.getElementById('ytts-panel').style.width = `${width}px`;
    window.scrollTo(0, 0);
  }, SITE_CARD);
  await page.mouse.move(0, 0);
  await page.waitForTimeout(1_000);
  const card = page.locator('#ytts-panel');
  const box = await card.boundingBox();
  if (Math.round(box.width) !== SITE_CARD.width || Math.round(box.height) !== SITE_CARD.height) {
    throw new Error(`The card is ${box.width} × ${box.height}, expected ${SITE_CARD.width} × ${SITE_CARD.height}.`);
  }
  const png = await card.screenshot({ animations: 'disabled' });
  const encoder = await page.context().newPage();
  try {
    const webp = await encoder.evaluate(async (source) => {
      const image = new Image();
      image.src = source;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      canvas.getContext('2d').drawImage(image, 0, 0);
      return { width: canvas.width, height: canvas.height, data: canvas.toDataURL('image/webp', 0.9).split(',')[1] };
    }, `data:image/png;base64,${png.toString('base64')}`);
    // build-website.mjs states these pixel dimensions in the page.
    if (webp.width !== SITE_CARD.width * 2 || webp.height !== SITE_CARD.height * 2) {
      throw new Error(`The image is ${webp.width} × ${webp.height} px, expected ${SITE_CARD.width * 2} × ${SITE_CARD.height * 2}.`);
    }
    const out = join(output, `card-${scheme}.webp`);
    writeFileSync(out, Buffer.from(webp.data, 'base64'));
    console.log(`${relative(root, out)}  ${(statSync(out).size / 1024).toFixed(1)} KB`);
  } finally {
    await encoder.close();
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
        try {
          await route.fulfill({ contentType: mimeTypes[extname(path)], body: await readFile(join(extensionPath, path)) });
        } catch {
          await route.abort();
        }
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
if (!store && !site) await popupScreenshots();
