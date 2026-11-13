import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const libPath = fileURLToPath(new URL('../extension/lib.js', import.meta.url));
const i18nPath = fileURLToPath(new URL('../extension/i18n.js', import.meta.url));
const contentPath = fileURLToPath(new URL('../extension/content.js', import.meta.url));
const cssPath = fileURLToPath(new URL('../extension/content.css', import.meta.url));
const nativePanel = 'ytd-engagement-panel-section-list-renderer';
const expanded = 'ENGAGEMENT_PANEL_VISIBILITY_EXPANDED';
const hidden = 'ENGAGEMENT_PANEL_VISIBILITY_HIDDEN';
const plainText = '## Kapitel eins\n\nHallo Welt. Noch ein Satz.\n\n## Kapitel zwei\n\nZum Schluss.\n';

// A small native-panel stand-in: the production script still discovers, opens,
// scrapes and closes the rendered DOM without relying on the live YouTube site.
const fixture = `<!doctype html><html><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="require-trusted-types-for 'script'">
<style>body{margin:24px;font-family:Arial}#secondary-inner{width:400px}
[visibility="${hidden}"]{display:none}</style></head><body>
<video class="html5-main-video"></video><div id="secondary-inner"></div>
<ytd-video-description-transcript-section-renderer><button>Transkript anzeigen</button></ytd-video-description-transcript-section-renderer>
<ytd-engagement-panel-section-list-renderer target-id="engagement-panel-searchable-transcript" visibility="${hidden}">
<div id="visibility-button"><button>Schließen</button></div><div id="segments"></div>
</ytd-engagement-panel-section-list-renderer>
<script>
(() => {
  const state = window.fixture;
  const panel = document.querySelector('${nativePanel}');
  const segments = document.querySelector('#segments');
  const open = document.querySelector('ytd-video-description-transcript-section-renderer button');
  const video = document.querySelector('video');
  if (state.modernLayout) {
    const watch = document.createElement('ytd-watch-flexy');
    watch.setAttribute('side-rail-dismissible-panels', '');
    watch.style.display = 'block';
    const primary = document.createElement('div');
    primary.id = 'primary';
    for (const style of ['display:none', 'width:0;height:1px', 'width:400px;visibility:hidden;height:1px']) {
      const skeleton = document.createElement('div');
      skeleton.id = 'related';
      skeleton.style.cssText = style;
      primary.append(skeleton);
    }
    const below = document.createElement('div');
    below.id = 'below';
    const recommendations = document.createElement('div');
    recommendations.id = 'related';
    recommendations.dataset.active = 'true';
    recommendations.style.cssText = 'width:400px;height:100px';
    recommendations.textContent = 'Recommendations';
    below.append(recommendations);
    primary.append(below);
    const secondary = document.createElement('div');
    secondary.id = 'secondary';
    secondary.style.cssText = 'position:fixed;right:0;top:0;width:400px';
    const sidebar = document.querySelector('#secondary-inner');
    sidebar.before(watch);
    secondary.append(sidebar);
    sidebar.append(panel);
    const comments = document.createElement('ytd-engagement-panel-section-list-renderer');
    comments.setAttribute('target-id', 'engagement-panel-comments');
    comments.setAttribute('visibility', '${hidden}');
    comments.textContent = 'Comments';
    sidebar.append(comments);
    watch.append(primary, secondary);
    state.setRailOpen = (isOpen) => {
      secondary.style.visibility = isOpen ? 'visible' : 'hidden';
      secondary.style.transform = isOpen ? 'none' : 'translateX(100%)';
    };
    state.toggleComments = (isOpen) => {
      comments.setAttribute('visibility', isOpen ? '${expanded}' : '${hidden}');
      state.setRailOpen(isOpen);
      document.dispatchEvent(new Event('yt-navigate-finish'));
    };
    state.setRailOpen(false);
  }
  // Classic layout as on youtube.com: two columns, or one column below ~1000 px, where YouTube
  // hides #secondary and moves #related below the video into #primary #below (#23).
  if (state.classicLayout) {
    const watch = document.createElement('ytd-watch-flexy');
    watch.style.display = 'block';
    const primary = document.createElement('div');
    primary.id = 'primary';
    const below = document.createElement('div');
    below.id = 'below';
    const relatedSlot = document.createElement('div');
    below.append(relatedSlot);
    primary.append(below);
    const secondary = document.createElement('div');
    secondary.id = 'secondary';
    const sidebar = document.querySelector('#secondary-inner');
    sidebar.before(watch);
    secondary.append(sidebar);
    const related = document.createElement('div');
    related.id = 'related';
    related.style.cssText = 'width:400px;height:100px';
    related.textContent = 'Recommendations';
    sidebar.append(related);
    watch.append(primary, secondary);
    // YouTube reflows in two steps: #secondary hides first, #related moves afterwards.
    state.setColumns = (count, { moveRelated = true } = {}) => {
      secondary.style.display = count === 1 ? 'none' : '';
      if (moveRelated) (count === 1 ? relatedSlot : sidebar).append(related);
    };
  }
  Object.defineProperty(video, 'duration', { value: state.duration ?? 60 });
  Object.defineProperty(video, 'currentTime', { get: () => state.seek, set: (value) => { state.seek = value; } });
  const first = [
    ['chapter', 'Kapitel eins'], ['0:00', 'Hallo'], ['0:04', 'Welt.'],
    ['0:08', 'Noch ein Satz.'], ['chapter', 'Kapitel zwei'], ['0:15', 'Zum Schluss.'],
  ];
  const second = [['0:00', 'Ein anderes Video.'], ['0:09', 'Sein eigenes Transkript.']];
  const third = [['0:00', 'Das dritte Video.'], ['0:07', 'Ohne fremden Text.']];
  function populate() {
    segments.replaceChildren();
    const rows = state.rows || (state.video === 'first' ? first : state.video === 'second' ? second : third);
    for (const [time, text] of rows) {
      const chapter = time === 'chapter';
      // Measured on youtube.com (#45): the view-model panel renders a chapter as
      // timeline-chapter-view-model > h3, the legacy panel as a section header with an h2.
      const row = document.createElement(chapter
        ? (state.variant === 'legacy' ? 'ytd-transcript-section-header-renderer' : 'timeline-chapter-view-model')
        : state.variant === 'legacy' ? 'ytd-transcript-segment-renderer' : 'transcript-segment-view-model');
      if (chapter) {
        const heading = document.createElement(state.variant === 'legacy' ? 'h2' : 'h3');
        if (state.variant !== 'legacy') heading.className = 'ytwTimelineChapterViewModelTitle';
        heading.textContent = text;
        row.append(heading);
      } else {
        const timestamp = document.createElement('span');
        timestamp.className = state.variant === 'legacy' ? 'segment-timestamp' : 'ytwTranscriptSegmentViewModelTimestamp';
        timestamp.textContent = time;
        const content = document.createElement('span');
        content.className = state.variant === 'legacy' ? 'segment-text' : 'ytAttributedStringHost';
        content.textContent = text;
        row.append(timestamp, content);
      }
      segments.append(row);
    }
  }
  open.addEventListener('click', () => {
    state.opens++;
    panel.setAttribute('visibility', '${expanded}');
    state.setRailOpen?.(true);
    if (!state.failLoad) setTimeout(populate, state.delay);
  });
  panel.querySelector('button').addEventListener('click', () => {
    panel.setAttribute('visibility', '${hidden}');
    state.setRailOpen?.(false);
  });
  state.navigate = (video) => {
    state.video = video;
    history.pushState({}, '', video === 'home' ? '/' : '/watch?v=' + video);
    document.dispatchEvent(new Event('yt-navigate-finish'));
  };
  if (state.noTranscript) open.parentElement.remove();
  // Like youtube.com: on SPA navigation ytd-watch-flexy[video-id] follows the URL only after
  // flexyDelay ms, and until then the previous video's description (button included) stays.
  if (state.flexyDelay !== undefined) {
    const flexy = document.createElement('ytd-watch-flexy');
    flexy.setAttribute('video-id', state.video);
    document.body.prepend(flexy);
    const navigate = state.navigate;
    state.navigate = (video, { transcript = true } = {}) => {
      navigate(video);
      setTimeout(() => {
        flexy.setAttribute('video-id', video);
        if (!transcript) open.parentElement.remove();
      }, state.flexyDelay);
    };
  }
  if (state.alreadyOpen) { populate(); panel.setAttribute('visibility', '${expanded}'); }
  document.dispatchEvent(new Event('yt-navigate-finish'));
})();
</script></body></html>`;

async function setup(page, options = {}) {
  // YouTube sets <html lang> to its interface language; the card follows it (default: German).
  const lang = options.lang ?? 'de';
  const html = fixture.replace('<html>', `<html lang="${lang}"${lang === 'ar' ? ' dir="rtl"' : ''}>`);
  await page.route('https://www.youtube.com/**', (route) => route.fulfill({ contentType: 'text/html', body: html }));
  await page.addInitScript((options) => {
    window.fixture = {
      variant: 'legacy', video: 'first', opens: 0, delay: 30, seek: 0,
      ...options,
    };
    // Browser-profile storage shared between fixture documents. The real extension
    // uses chrome.storage.local, so a reload and a fresh tab must keep consent.
    const readLocal = () => JSON.parse(localStorage.getItem('fixture-ytts-local') || '{}');
    const listeners = [];
    window.chrome = {
      storage: {
        local: {
          get: async () => readLocal(),
          set: async (values) => {
            if (window.fixture.failConsentSave) throw new Error('Saving failed');
            localStorage.setItem('fixture-ytts-local', JSON.stringify({ ...readLocal(), ...values }));
          },
        },
        sync: { get: async (defaults) => ({ ...defaults, view: 'lines', ...options.settings }) },
        onChanged: { addListener: (listener) => listeners.push(listener) },
      },
    };
    window.fixture.updateSettings = (changes) => {
      const entries = Object.fromEntries(Object.entries(changes).map(([key, newValue]) => [key, { newValue }]));
      for (const listener of listeners) listener(entries, 'sync');
    };
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: async (text) => {
        if (options.clipboardFailure) throw new Error('Permission denied');
        window.fixture.copied = text;
      },
    } });
    document.execCommand = () => false;
  }, options);
  await page.addInitScript({ path: libPath });
  await page.addInitScript({ path: i18nPath });
  await page.addInitScript({ path: contentPath });
  await page.goto('https://www.youtube.com/watch?v=first');
  await page.addStyleTag({ path: cssPath });
}

async function ready(page) {
  await expect(page.locator('#ytts-panel .ytts-copy')).toBeEnabled();
  await expect(page.locator('html')).not.toHaveClass(/ytts-busy/);
}

async function activate(page) {
  const toggle = page.locator('.ytts-chevron');
  const collapsed = (await toggle.getAttribute('aria-expanded')) === 'false';
  if (collapsed) await toggle.click();
  await page.locator('.ytts-load').click();
  if (collapsed) await toggle.click();
}

async function activateAndWait(page) {
  await activate(page);
  await ready(page);
}

test('requires a real load click before reading transcripts and remembers consent', async ({ page, context }) => {
  await page.clock.install();
  await setup(page);
  await expect(page.locator('#ytts-panel')).toBeVisible();
  await page.clock.runFor(1200);
  expect(await page.evaluate(() => fixture.opens)).toBe(0);
  await page.locator('.ytts-chevron').click();
  const load = page.locator('.ytts-load');
  await expect(load).toBeVisible();
  await load.evaluate((button) => button.click());
  await page.clock.runFor(1200);
  expect(await page.evaluate(() => fixture.opens)).toBe(0);
  // A page can put a lookalike in the card's DOM but cannot bind consent to it.
  await load.evaluate((button) => {
    const lookalike = button.cloneNode(true);
    lookalike.textContent = 'Page button';
    button.after(lookalike);
  });
  const lookalike = page.getByText('Page button', { exact: true });
  await lookalike.click();
  await page.clock.runFor(1200);
  expect(await page.evaluate(() => fixture.opens)).toBe(0);
  await lookalike.evaluate((button) => button.remove());
  await expect(page.locator(nativePanel)).toHaveAttribute('visibility', hidden);
  await expect(page.locator('.ytts-copy')).toBeDisabled();
  expect(await page.evaluate(() => fixture.copied)).toBeUndefined();
  expect(await page.evaluate(() => globalThis.chrome.storage.local.get())).toEqual({});
  await load.click();
  await ready(page);
  expect(await page.evaluate(() => fixture.opens)).toBe(1);
  expect(await page.evaluate(() => globalThis.chrome.storage.local.get())).toEqual({ transcriptConsent: true });

  await page.reload();
  await page.addStyleTag({ path: cssPath });
  await ready(page);
  expect(await page.evaluate(() => fixture.opens)).toBe(1);

  const otherTab = await context.newPage();
  await setup(otherTab);
  await ready(otherTab);
  expect(await otherTab.evaluate(() => fixture.opens)).toBe(1);
});

test('does not read transcripts until saving consent succeeds', async ({ page }) => {
  await page.clock.install();
  await setup(page, { failConsentSave: true, settings: { expandedByDefault: true } });
  const load = page.locator('.ytts-load');
  await load.click();
  await expect(page.getByText('Speichern fehlgeschlagen. Bitte erneut versuchen.')).toBeVisible();
  await page.clock.runFor(1200);
  expect(await page.evaluate(() => fixture.opens)).toBe(0);
  await expect(page.locator('.ytts-copy')).toBeDisabled();
  expect(await page.evaluate(() => globalThis.chrome.storage.local.get())).toEqual({});

  await page.evaluate(() => { fixture.failConsentSave = false; });
  await load.click();
  await ready(page);
  expect(await page.evaluate(() => fixture.opens)).toBe(1);
});

for (const variant of ['legacy', 'view-model']) {
  test(`scrapes ${variant} segments, chapters and the complete transcript`, async ({ page }) => {
    await setup(page, { variant });
    await activateAndWait(page);
    await expect(page.locator('#secondary-inner > :first-child')).toHaveId('ytts-panel');
    await expect(page.locator('#ytts-panel')).toHaveClass(/ytts-collapsed/);
    await expect(page.locator(nativePanel)).toHaveAttribute('visibility', hidden);
    await expect(page.locator('.ytts-seg')).toHaveCount(4);
    await expect(page.locator('.ytts-chapter')).toHaveCount(2);
    await page.locator('.ytts-copy').click();
    await expect.poll(() => page.evaluate(() => fixture.copied)).toBe(plainText);
    await expect(page.locator('.ytts-announcement')).toHaveText('Transkript kopiert.');
  });
}

test('modern side rails keep the card visible beside active recommendations', async ({ page }) => {
  await setup(page, { modernLayout: true });
  await activateAndWait(page);
  const card = page.locator('#ytts-panel');
  const activeRelated = page.locator('#primary #related[data-active="true"]');
  const transcript = page.locator(`${nativePanel}[target-id="engagement-panel-searchable-transcript"]`);
  await expect(page.locator('#primary #related')).toHaveCount(4);
  await expect(card).toBeVisible();
  await expect(page.locator('#secondary')).toHaveCSS('visibility', 'hidden');
  await expect(transcript).toHaveAttribute('visibility', hidden);
  expect(await activeRelated.evaluate((node) => node.previousElementSibling?.id)).toBe('ytts-panel');
  expect(await page.locator('#secondary-inner #ytts-panel').count()).toBe(0);
  await card.locator('.ytts-copy').click();
  await expect.poll(() => page.evaluate(() => fixture.copied)).toBe(plainText);

  const position = await card.boundingBox();
  await page.evaluate(() => fixture.toggleComments(true));
  await expect(page.locator('#secondary')).toHaveCSS('visibility', 'visible');
  await expect(card).toBeVisible();
  expect(await activeRelated.evaluate((node) => node.previousElementSibling?.id)).toBe('ytts-panel');
  expect(await card.boundingBox()).toEqual(position);
  await page.evaluate(() => fixture.toggleComments(false));
  await expect(page.locator('#secondary')).toHaveCSS('visibility', 'hidden');
  await expect(card).toBeVisible();
  expect(await activeRelated.evaluate((node) => node.previousElementSibling?.id)).toBe('ytts-panel');
  expect(await card.boundingBox()).toEqual(position);
});

test('single-column layout keeps the card visible above the recommendations (#23)', async ({ page }) => {
  await setup(page, { classicLayout: true });
  await activateAndWait(page);
  const card = page.locator('#ytts-panel');
  const precedesRelated = () => page.locator('#related').evaluate((node) => node.previousElementSibling?.id);
  await expect(page.locator('#secondary-inner > :first-child')).toHaveId('ytts-panel');

  // Mid-reflow: #secondary hidden, recommendations not moved yet. The card waits, no error.
  const errors = [];
  page.on('pageerror', (error) => errors.push(error));
  await page.evaluate(() => fixture.setColumns(1, { moveRelated: false }));
  await page.waitForTimeout(1_500);
  expect(await page.locator('#secondary-inner #ytts-panel').count()).toBe(1);

  // Narrow window: YouTube hides #secondary and moves the recommendations below the video.
  await page.evaluate(() => fixture.setColumns(1));
  await expect(card).toBeVisible({ timeout: 3_000 });
  expect(await precedesRelated()).toBe('ytts-panel');
  expect(await page.locator('#primary #ytts-panel').count()).toBe(1);
  await card.locator('.ytts-copy').click();
  await expect.poll(() => page.evaluate(() => fixture.copied)).toBe(plainText);

  // Wide again: back to the top of the sidebar.
  await page.evaluate(() => fixture.setColumns(2));
  await expect(page.locator('#secondary-inner > :first-child')).toHaveId('ytts-panel', { timeout: 3_000 });
  await expect(card).toBeVisible();
  expect(errors).toEqual([]);
});

test('copies line timestamps when enabled', async ({ page }) => {
  await setup(page, { settings: { copyTimestamps: true } });
  await activateAndWait(page);
  await page.locator('.ytts-copy').click();
  await expect.poll(() => page.evaluate(() => fixture.copied)).toBe(
    '## Kapitel eins\n\n[0:00] Hallo\n[0:04] Welt.\n[0:08] Noch ein Satz.\n\n## Kapitel zwei\n\n[0:15] Zum Schluss.\n',
  );
});

test('sentence and text views preserve words, chapter boundaries and seeking', async ({ page }) => {
  await setup(page, { settings: { view: 'sentences', expandedByDefault: true } });
  await activateAndWait(page);
  await expect(page.locator('.ytts-sent')).toHaveCount(3);
  await expect(page.locator('.ytts-sent').first()).toHaveText('0:00 – 0:08Hallo Welt.');
  await page.evaluate(() => fixture.updateSettings({ view: 'text' }));
  await expect(page.locator('.ytts-para')).toHaveCount(2);
  await expect(page.locator('.ytts-s')).toHaveCount(3);
  await expect(page.locator('.ytts-time')).toHaveCount(0);
  await page.locator('.ytts-s').nth(1).focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => fixture.seek)).toBe(8);
  await page.locator('.ytts-copy').click();
  await expect.poll(() => page.evaluate(() => fixture.copied)).toBe(plainText);
});

test('an active ad duration cannot reverse the final sentence range', async ({ page }) => {
  await setup(page, {
    duration: 197,
    rows: [['18:20', 'Vorheriger Satz.'], ['18:29', 'Letzter Satz.']],
    settings: { view: 'sentences', expandedByDefault: true, copyTimestamps: true },
  });
  await activateAndWait(page);
  await expect(page.locator('.ytts-sent').last()).toHaveText('18:29 – 18:34Letzter Satz.');
  await page.locator('.ytts-copy').click();
  await expect.poll(() => page.evaluate(() => fixture.copied)).toBe(
    '[18:20–18:29] Vorheriger Satz.\n[18:29–18:34] Letzter Satz.\n',
  );
});

test('out-of-order source timestamps cannot reverse a merged sentence range', async ({ page }) => {
  await setup(page, {
    duration: 197,
    rows: [['18:29', 'Ein Satz'], ['18:20', 'mit vertauschten Zeitangaben.']],
    settings: { view: 'sentences', expandedByDefault: true },
  });
  await activateAndWait(page);
  await expect(page.locator('.ytts-sent')).toHaveText('18:29 – 18:29Ein Satz mit vertauschten Zeitangaben.');
});

test('keyboard loads and opens the transcript and seeks from a raw segment', async ({ page }) => {
  await setup(page);
  const toggle = page.locator('.ytts-chevron');
  await toggle.focus();
  await page.keyboard.press('Space');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.locator('.ytts-load').focus();
  await page.keyboard.press('Enter');
  await ready(page);
  await expect(page.locator('.ytts-body')).toBeVisible();
  await page.locator('.ytts-seg').nth(1).focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => fixture.seek)).toBe(4);
});

test('SPA navigation clears stale copy and loads the new transcript without asking again', async ({ page }) => {
  await setup(page);
  await activateAndWait(page);
  await page.evaluate(() => {
    const copy = document.querySelector('.ytts-copy');
    // Reproduce a URL change just before a trusted copy action. The extension's
    // click listener runs before YouTube's navigation event arrives.
    copy.addEventListener('click', () => history.pushState({}, '', '/watch?v=second'), { capture: true, once: true });
    copy.addEventListener('click', () => {
      fixture.navigate('second');
      fixture.afterNavigation = {
        opens: fixture.opens, copied: fixture.copied, rows: document.querySelectorAll('.ytts-seg').length,
      };
    }, { once: true });
  });
  await page.locator('.ytts-copy').click();
  expect(await page.evaluate(() => fixture.afterNavigation)).toEqual({ opens: 1, copied: undefined, rows: 0 });
  await ready(page);
  await page.locator('.ytts-copy').click();
  await expect.poll(() => page.evaluate(() => fixture.copied)).toBe('Ein anderes Video. Sein eigenes Transkript.\n');
  await expect(page.locator('.ytts-seg')).toHaveCount(2);
  await expect(page.locator(nativePanel)).toHaveAttribute('visibility', hidden);
});

test('rapid navigation cancels an in-flight scrape and cleans up', async ({ page }) => {
  await setup(page, { failLoad: true });
  await activate(page);
  await expect(page.locator('html')).toHaveClass(/ytts-busy/);
  await page.evaluate(() => {
    fixture.failLoad = false;
    fixture.navigate('second');
  });
  await ready(page);
  await page.locator('.ytts-copy').click();
  await expect.poll(() => page.evaluate(() => fixture.copied)).toBe('Ein anderes Video. Sein eigenes Transkript.\n');
  await expect(page.locator(nativePanel)).toHaveAttribute('visibility', hidden);
  await page.evaluate(() => fixture.navigate('home'));
  await expect(page.locator('#ytts-panel')).toHaveCount(0);
});

test('a cancelled scrape cannot supply its rendered segments to the next video', async ({ page }) => {
  await setup(page);
  await activateAndWait(page);
  await page.evaluate(() => fixture.navigate('second'));
  await expect(page.locator('#segments')).toContainText('Ein anderes Video.');
  // The second video's DOM exists, but the scraper has not yet observed enough
  // stable ticks to finish. Keep it in place while the third video starts.
  await page.evaluate(() => {
    fixture.delay = 1800;
    fixture.navigate('third');
  });
  await expect(page.locator('.ytts-copy')).toBeDisabled();
  await ready(page);
  await page.locator('.ytts-copy').click();
  await expect.poll(() => page.evaluate(() => fixture.copied)).toBe('Das dritte Video. Ohne fremden Text.\n');
});

// Regression for #11: the previous video's transcript button must not be clicked while
// YouTube still shows the old page data after the URL changed.
test('navigating to a video without transcript ignores the previous video\'s button', async ({ page }) => {
  await setup(page, { flexyDelay: 900, settings: { expandedByDefault: true } });
  await activateAndWait(page);
  const opensBefore = await page.evaluate(() => fixture.opens);
  await page.evaluate(() => fixture.navigate('second', { transcript: false }));
  await expect(page.locator('.ytts-status')).toHaveText('Für dieses Video gibt es kein Transkript.', { timeout: 12_000 });
  expect(await page.evaluate(() => fixture.opens)).toBe(opensBefore);
  await expect(page.locator('.ytts-copy')).toBeDisabled();
});

// #10: the card follows YouTube's interface language from <html lang>.
for (const [lang, title, copy, seekPrefix] of [
  ['en', 'Transcript', 'Copy', 'Jump to 0:00: '],
  ['ja', '文字起こし', 'コピー', '0:00 に移動: '],
  ['ar', 'نص الفيديو', 'نسخ', 'الانتقال إلى 0:00: '],
  ['xx-unknown', 'Transcript', 'Copy', 'Jump to 0:00: '],
]) {
  test(`card follows YouTube's interface language: ${lang}`, async ({ page }) => {
    await setup(page, { lang, settings: { expandedByDefault: true } });
    await activateAndWait(page);
    await expect(page.locator('.ytts-title')).toHaveText(title);
    await expect(page.locator('.ytts-copy')).toHaveText(copy);
    await expect(page.locator('.ytts-seg').first()).toHaveAttribute('aria-label', new RegExp(`^${seekPrefix}`));
  });
}

test('errors are shown in YouTube\'s interface language', async ({ page }) => {
  await setup(page, { lang: 'en', noTranscript: true, settings: { expandedByDefault: true } });
  await activate(page);
  await expect(page.locator('.ytts-status')).toHaveText('This video has no transcript.', { timeout: 12_000 });
});

test('the card mirrors in right-to-left YouTube', async ({ page }) => {
  await setup(page, { lang: 'ar', settings: { expandedByDefault: true } });
  await activateAndWait(page);
  const [titleX, copyX] = await page.evaluate(() => [
    document.querySelector('.ytts-title').getBoundingClientRect().left,
    document.querySelector('.ytts-copy').getBoundingClientRect().left,
  ]);
  expect(titleX).toBeGreaterThan(copyX);
  // Logical padding: the title sits 16px from the right edge in RTL, like YouTube's own panels.
  const gap = await page.evaluate(() => document.getElementById('ytts-panel').getBoundingClientRect().right
    - document.querySelector('.ytts-title').getBoundingClientRect().right);
  expect(Math.round(gap)).toBe(17); // 1px border + 16px padding
  // Transcript text keeps its own direction; time chips stay left-to-right.
  await expect(page.locator('.ytts-seg .ytts-text').first()).toHaveAttribute('dir', 'auto');
  await expect(page.locator('.ytts-seg .ytts-time').first()).toHaveAttribute('dir', 'ltr');
});

// #12: the poll keeps the card in place on watch pages and removes it after leaving them,
// even when YouTube fires no navigation event.
test('the poll re-inserts a card that YouTube re-rendered away', async ({ page }) => {
  await setup(page);
  await activateAndWait(page);
  await page.evaluate(() => document.getElementById('ytts-panel').remove());
  await expect(page.locator('#secondary-inner > :first-child')).toHaveId('ytts-panel', { timeout: 2_500 });
});

test('the poll removes the card after leaving the watch page without an event', async ({ page }) => {
  await setup(page);
  await activateAndWait(page);
  await page.evaluate(() => history.pushState({}, '', '/'));
  await expect(page.locator('#ytts-panel')).toHaveCount(0, { timeout: 2_500 });
});

test('missing transcripts show a clear error without enabling copy', async ({ page }) => {
  await setup(page, { noTranscript: true, settings: { expandedByDefault: true } });
  await expect(page.locator('.ytts-copy')).toBeDisabled();
  await activate(page);
  await expect(page.locator('.ytts-status')).toHaveText('Für dieses Video gibt es kein Transkript.', { timeout: 12_000 });
  await expect(page.locator('.ytts-copy')).toBeDisabled();
  await expect(page.locator('html')).not.toHaveClass(/ytts-busy/);
});

test('failed native loading closes the panel and removes the hidden state', async ({ page }) => {
  await setup(page, { failLoad: true, settings: { expandedByDefault: true } });
  await activate(page);
  await expect(page.locator('.ytts-status')).toHaveText('Transkript konnte nicht geladen werden.', { timeout: 20_000 });
  await expect(page.locator(nativePanel)).toHaveAttribute('visibility', hidden);
  await expect(page.locator('html')).not.toHaveClass(/ytts-busy/);
  await expect(page.locator('.ytts-copy')).toBeDisabled();
});

test('keeps a native transcript open when the user already opened it', async ({ page }) => {
  await setup(page, { alreadyOpen: true });
  await expect(page.locator('.ytts-copy')).toBeDisabled();
  await activateAndWait(page);
  await expect(page.locator(nativePanel)).toHaveAttribute('visibility', expanded);
  expect(await page.evaluate(() => fixture.opens)).toBe(0);
});

test('reports clipboard failure and restores keyboard focus', async ({ page }) => {
  await setup(page, { clipboardFailure: true });
  await activateAndWait(page);
  const copy = page.locator('.ytts-copy');
  await copy.focus();
  await page.keyboard.press('Enter');
  await expect(copy).toHaveText('Kopierfehler');
  await expect(page.locator('.ytts-announcement')).toHaveText('Kopieren fehlgeschlagen. Bitte erneut versuchen.');
  await expect(copy).toBeFocused();
  await expect(page.locator('textarea')).toHaveCount(0);
});
