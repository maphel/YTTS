// Live canary: loads the real unpacked extension into Chromium and runs it against youtube.com.
// The fixture suite cannot notice YouTube DOM changes; this one can. Run with `npm run test:live`
// (nightly in .github/workflows/live.yml). Not part of `npm test`: it needs the network and
// depends on YouTube's availability.
import { test as base, expect, chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const extensionPath = fileURLToPath(new URL('../../extension/', import.meta.url));

// Stable public videos that are known to have transcripts. Replace one if that changes.
const VIDEOS = {
  short: 'jNQXAC9IVRw', // "Me at the zoo": 3 caption lines
  chapters: 'zjkBMFhNj_g', // 1 h talk with chapters
};

const NATIVE_TRANSCRIPT_EXPANDED = 'ytd-engagement-panel-section-list-renderer'
  + '[target-id="engagement-panel-searchable-transcript"][visibility="ENGAGEMENT_PANEL_VISIBILITY_EXPANDED"]';

const test = base.extend({
  // Extensions need a persistent context; Playwright's bundled Chromium runs them headless.
  // eslint-disable-next-line no-empty-pattern
  context: async ({}, use) => {
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
    const page = context.pages()[0] ?? await context.newPage();
    // Independent evidence of whether YouTube delivered transcript data at all, recorded from
    // the start: YouTube may serve a reopened panel from cache without a new request.
    // Measured 2026-11-08: the view-model panel loads via /youtubei/v1/get_panel, the legacy one
    // via /youtubei/v1/get_transcript (which YouTube answers with 400 when it refuses).
    page.transcriptResponses = [];
    page.on('response', (response) => {
      if (/\/youtubei\/v1\/(get_transcript|get_panel)\b/.test(response.url())) {
        page.transcriptResponses.push(response.text().then(
          (body) => ({ status: response.status(), transcript: body.length > 500 && /transcript/i.test(body) }),
          () => ({ status: response.status(), transcript: false }),
        ));
      }
    });
    await use(page);
  },
});

// YouTube may show an EU consent dialog or, from data-centre IPs, a bot check. The dialog is
// dismissed; a consent redirect or a bot check skips the run instead of reporting a breakage.
async function openWatchPage(page, videoId) {
  await page.goto(`https://www.youtube.com/watch?v=${videoId}`, { waitUntil: 'domcontentloaded' });
  test.skip(page.url().includes('consent.'), 'YouTube redirected to a consent page.');
  const consent = page.locator('ytd-consent-bump-v2-lightbox button, tp-yt-paper-dialog button')
    .filter({ hasText: /reject all|accept all/i });
  try {
    await consent.first().click({ timeout: 5_000 });
  } catch { /* no consent dialog */ }
  const botCheck = await page.getByText(/confirm you.re not a bot/i).count();
  test.skip(botCheck > 0, 'YouTube asked for a bot check from this IP; cannot judge the extension.');
  await page.evaluate(() => document.querySelector('video')?.pause());
}

// Did YouTube deliver transcript data? Decided without YTTS's selectors: the transcript button
// is found by its accessible name and delivery is judged from the network.
async function youtubeDeliveredTranscript(page) {
  // The button usually sits in the collapsed description, i.e. hidden: include hidden elements.
  const button = page.getByRole('button', { name: /show transcript/i, includeHidden: true });
  if (!(await button.count())) {
    throw new Error('No "Show transcript" button on a video known to have one: YouTube changed its UI.');
  }
  if (!(await page.locator(NATIVE_TRANSCRIPT_EXPANDED).count())) {
    await button.first().evaluate((node) => node.click());
  }
  await page.waitForTimeout(10_000);
  const responses = await Promise.all(page.transcriptResponses);
  return responses.some((r) => r.status === 200 && r.transcript);
}

// YouTube sometimes does not deliver transcripts at all (throttling of the transcript endpoint,
// attestation in automated browsers). Then YTTS cannot work either, and a failure says nothing
// about the extension: skip as inconclusive. If YouTube did deliver and YTTS did not: fail.
async function waitForTranscript(page) {
  await expect(page.locator('#ytts-panel')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('#ytts-panel .ytts-copy')).toBeDisabled();
  const toggle = page.locator('#ytts-panel .ytts-chevron');
  if ((await toggle.getAttribute('aria-expanded')) === 'false') await toggle.click();
  await page.locator('#ytts-panel .ytts-load').click();
  try {
    await expect(page.locator('#ytts-panel .ytts-copy')).toBeEnabled({ timeout: 30_000 });
  } catch (error) {
    await expect(page.locator('html')).not.toHaveClass(/ytts-busy/, { timeout: 20_000 });
    const delivered = await youtubeDeliveredTranscript(page);
    test.skip(!delivered, 'YouTube delivered no transcript data (throttled or refused); inconclusive.');
    throw error; // YouTube delivered data but YTTS did not show it: a real breakage.
  }
  await expect(page.locator('html')).not.toHaveClass(/ytts-busy/);
  // The native panel YTTS opened must be closed again.
  await expect(page.locator(NATIVE_TRANSCRIPT_EXPANDED)).toHaveCount(0);
}

// Same idea as segSignature() in content.js: count + first + last rendered row.
const cardSignature = (page) => page.evaluate(() => {
  const rows = document.querySelectorAll('#ytts-panel [data-sec]');
  return rows.length ? `${rows.length}|${rows[0].textContent}|${rows[rows.length - 1].textContent}` : '';
});

test('loads, renders and copies a transcript from the live site', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'https://www.youtube.com' });
  await openWatchPage(page, VIDEOS.short);
  await waitForTranscript(page);

  await expect(page.locator('#ytts-panel [data-sec]').first()).toBeVisible();

  await page.locator('#ytts-panel .ytts-copy').click();
  await expect(page.locator('#ytts-panel .ytts-announcement')).not.toBeEmpty();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toMatch(/elephants/i);
});

test('reads chapters and a long transcript, then follows SPA navigation', async ({ page }) => {
  await openWatchPage(page, VIDEOS.chapters);
  await waitForTranscript(page);
  // The expanded card takes its height from YouTube's own panel variable (#43). If YouTube drops
  // or renames it, the card silently falls back to a fixed size: notice that here.
  const panelHeight = await page.evaluate(() => getComputedStyle(document.querySelector('ytd-watch-flexy'))
    .getPropertyValue('--ytd-watch-flexy-panel-max-height').trim());
  expect(panelHeight).toMatch(/^\d+(\.\d+)?px$/);
  expect(parseFloat(panelHeight)).toBeGreaterThanOrEqual(240);
  expect((await page.locator('#ytts-panel').boundingBox()).height).toBeCloseTo(parseFloat(panelHeight), 0);
  expect(await page.locator('#ytts-panel .ytts-chapter').count()).toBeGreaterThan(5);
  expect(await page.locator('#ytts-panel [data-sec]').count()).toBeGreaterThan(100);
  const oldSignature = await cardSignature(page);

  // Navigate inside the single-page app like a user: click a visible recommended video. It may
  // or may not have a transcript; either way the previous video's text must never be shown.
  await page.locator(`#related a[href*="/watch?v="]:not([href*="${VIDEOS.chapters}"]), #secondary a[href*="/watch?v="]:not([href*="${VIDEOS.chapters}"])`)
    .filter({ visible: true }).first().click();
  await page.waitForURL((url) => url.searchParams.get('v') && url.searchParams.get('v') !== VIDEOS.chapters, { timeout: 15_000 });

  // Settled on the NEW video: its transcript (different signature) or a final error message.
  const copy = page.locator('#ytts-panel .ytts-copy');
  const status = page.locator('#ytts-panel .ytts-status');
  await expect.poll(async () => {
    if (await copy.isEnabled() && await cardSignature(page) !== oldSignature) return 'loaded';
    const text = (await status.count()) ? await status.textContent() : '';
    return text && !/loading/i.test(text) ? 'error' : 'pending';
  }, { timeout: 45_000 }).not.toBe('pending');

  // Re-check after a pause: a late re-render must not bring the old transcript back (#11).
  await page.waitForTimeout(3_000);
  expect(await cardSignature(page)).not.toBe(oldSignature);
  await expect(page.locator('html')).not.toHaveClass(/ytts-busy/, { timeout: 20_000 });
  await expect(page.locator(NATIVE_TRANSCRIPT_EXPANDED)).toHaveCount(0);
});
