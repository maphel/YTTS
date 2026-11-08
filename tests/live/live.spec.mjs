// Live canary: loads the real unpacked extension into Chromium and runs it against youtube.com.
// The fixture suite cannot notice YouTube DOM changes; this one can. Run with `npm run test:live`
// (nightly in .github/workflows/live.yml). Not part of `npm test`: it needs the network and
// depends on YouTube's availability.
import { test as base, expect, chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const extensionPath = fileURLToPath(new URL('../../extension/', import.meta.url));

// Stable public videos. Replace one if it disappears or loses its transcript.
const VIDEOS = {
  short: 'jNQXAC9IVRw', // "Me at the zoo": 3 caption lines
  chapters: 'zjkBMFhNj_g', // 1 h talk with chapters
};

const test = base.extend({
  // Extensions need a persistent context; Playwright's bundled Chromium runs them headless.
  context: async ({ browserName: _ }, use) => {
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      locale: 'en-US',
      viewport: { width: 1400, height: 1000 },
      args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    });
    await use(context);
    await context.close();
  },
  page: async ({ context }, use) => {
    await use(context.pages()[0] ?? await context.newPage());
  },
});

// YouTube may show an EU consent dialog or, from data-centre IPs, a bot check. The consent
// dialog is dismissed; a bot check skips the run instead of reporting a false breakage.
async function openWatchPage(page, videoId) {
  await page.goto(`https://www.youtube.com/watch?v=${videoId}`, { waitUntil: 'domcontentloaded' });
  const consent = page.locator('ytd-consent-bump-v2-lightbox button, tp-yt-paper-dialog button')
    .filter({ hasText: /reject all|accept all/i });
  try {
    await consent.first().click({ timeout: 5_000 });
  } catch { /* no consent dialog */ }
  const botCheck = await page.getByText(/confirm you.re not a bot/i).count();
  test.skip(botCheck > 0, 'YouTube asked for a bot check from this IP; cannot judge the extension.');
  await page.evaluate(() => document.querySelector('video')?.pause());
}

// YouTube sometimes does not load its *own* transcript panel at all (rate limiting of the
// transcript endpoint, attestation in automated browsers). Then YTTS cannot work either, and a
// failure says nothing about the extension. So when YTTS does not finish, open the native panel
// by hand: if YouTube loads segments there, YTTS is broken (fail); if not, skip as inconclusive.
async function waitForTranscript(page) {
  await expect(page.locator('#ytts-panel')).toBeVisible({ timeout: 20_000 });
  const copy = page.locator('#ytts-panel .ytts-copy');
  try {
    await expect(copy).toBeEnabled({ timeout: 30_000 });
  } catch (error) {
    await expect(page.locator('html')).not.toHaveClass(/ytts-busy/, { timeout: 20_000 });
    await page.evaluate(() => document.querySelector('ytd-video-description-transcript-section-renderer button')?.click());
    const nativeSegments = await page.waitForFunction(
      () => document.querySelectorAll('transcript-segment-view-model, ytd-transcript-segment-renderer').length,
      null, { timeout: 15_000 },
    ).then(() => true, () => false);
    test.skip(!nativeSegments, 'YouTube did not load its own transcript panel either; inconclusive.');
    throw error; // YouTube delivers segments but YTTS did not: a real breakage.
  }
  await expect(page.locator('html')).not.toHaveClass(/ytts-busy/);
}

test('loads, renders and copies a transcript from the live site', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'https://www.youtube.com' });
  await openWatchPage(page, VIDEOS.short);
  await waitForTranscript(page);

  // The native panel YTTS opened must be closed again.
  const nativeOpen = await page.locator('ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"][visibility="ENGAGEMENT_PANEL_VISIBILITY_EXPANDED"]').count();
  expect(nativeOpen).toBe(0);

  await page.locator('#ytts-panel .ytts-title').click();
  await expect(page.locator('#ytts-panel [data-sec]').first()).toBeVisible();

  await page.locator('#ytts-panel .ytts-copy').click();
  await expect(page.locator('#ytts-panel .ytts-announcement')).not.toBeEmpty();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toMatch(/elephants/i);
});

test('reads chapters and a long transcript, then follows SPA navigation', async ({ page }) => {
  await openWatchPage(page, VIDEOS.chapters);
  await waitForTranscript(page);
  await page.locator('#ytts-panel .ytts-title').click();
  expect(await page.locator('#ytts-panel .ytts-chapter').count()).toBeGreaterThan(5);
  expect(await page.locator('#ytts-panel [data-sec]').count()).toBeGreaterThan(100);
  const firstText = await page.locator('#ytts-panel [data-sec]').first().textContent();

  // Navigate inside the single-page app like a user: click a recommended video. It may or may
  // not have a transcript; either way the previous video's text must never be shown.
  const related = page.locator(`#related a[href*="/watch?v="]:not([href*="${VIDEOS.chapters}"]), #secondary a[href*="/watch?v="]:not([href*="${VIDEOS.chapters}"])`);
  await related.first().click();
  await page.waitForURL((url) => url.searchParams.get('v') && url.searchParams.get('v') !== VIDEOS.chapters, { timeout: 15_000 });
  const copy = page.locator('#ytts-panel .ytts-copy');
  const status = page.locator('#ytts-panel .ytts-status');
  // Settled = transcript loaded (copy enabled) or a final error message instead of "Loading…".
  await expect.poll(async () => {
    if (await copy.isEnabled()) return 'loaded';
    const text = (await status.count()) ? await status.textContent() : '';
    return text && !/loading/i.test(text) ? 'error' : 'pending';
  }, { timeout: 40_000 }).not.toBe('pending');
  if (await copy.isEnabled()) {
    await expect(page.locator('#ytts-panel [data-sec]').first()).not.toHaveText(firstText ?? '');
  }
  await expect(page.locator('html')).not.toHaveClass(/ytts-busy/, { timeout: 20_000 });
});
