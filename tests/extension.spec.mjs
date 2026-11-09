import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const libPath = fileURLToPath(new URL('../extension/lib.js', import.meta.url));
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
      const row = document.createElement(chapter ? 'ytd-transcript-section-header-renderer'
        : state.variant === 'legacy' ? 'ytd-transcript-segment-renderer' : 'transcript-segment-view-model');
      if (chapter) {
        const heading = document.createElement('h2');
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
  await page.route('https://www.youtube.com/**', (route) => route.fulfill({ contentType: 'text/html', body: fixture }));
  await page.addInitScript((options) => {
    window.fixture = {
      variant: 'legacy', video: 'first', opens: 0, delay: 30, seek: 0,
      ...options,
    };
    const listeners = [];
    window.chrome = {
      storage: {
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
  await page.addInitScript({ path: contentPath });
  await page.goto('https://www.youtube.com/watch?v=first');
  await page.addStyleTag({ path: cssPath });
}

async function ready(page) {
  await expect(page.locator('#ytts-panel .ytts-copy')).toBeEnabled();
  await expect(page.locator('html')).not.toHaveClass(/ytts-busy/);
}

for (const variant of ['legacy', 'view-model']) {
  test(`scrapes ${variant} segments, chapters and the complete transcript`, async ({ page }) => {
    await setup(page, { variant });
    await ready(page);
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
  await ready(page);
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

test('copies line timestamps when enabled', async ({ page }) => {
  await setup(page, { settings: { copyTimestamps: true } });
  await ready(page);
  await page.locator('.ytts-copy').click();
  await expect.poll(() => page.evaluate(() => fixture.copied)).toBe(
    '## Kapitel eins\n\n[0:00] Hallo\n[0:04] Welt.\n[0:08] Noch ein Satz.\n\n## Kapitel zwei\n\n[0:15] Zum Schluss.\n',
  );
});

test('sentence and text views preserve words, chapter boundaries and seeking', async ({ page }) => {
  await setup(page, { settings: { view: 'sentences', expandedByDefault: true } });
  await ready(page);
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
  await ready(page);
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
  await ready(page);
  await expect(page.locator('.ytts-sent')).toHaveText('18:29 – 18:29Ein Satz mit vertauschten Zeitangaben.');
});

test('keyboard opens the transcript and seeks from a raw segment', async ({ page }) => {
  await setup(page);
  await ready(page);
  const toggle = page.locator('.ytts-chevron');
  await toggle.focus();
  await page.keyboard.press('Space');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('.ytts-body')).toBeVisible();
  await page.locator('.ytts-seg').nth(1).focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => fixture.seek)).toBe(4);
});

test('SPA navigation replaces stale transcript text', async ({ page }) => {
  await setup(page);
  await ready(page);
  await page.evaluate(() => fixture.navigate('second'));
  await expect(page.locator('.ytts-copy')).toBeDisabled();
  await ready(page);
  await page.locator('.ytts-copy').click();
  await expect.poll(() => page.evaluate(() => fixture.copied)).toBe('Ein anderes Video. Sein eigenes Transkript.\n');
  await expect(page.locator('.ytts-seg')).toHaveCount(2);
  await expect(page.locator(nativePanel)).toHaveAttribute('visibility', hidden);
});

test('rapid navigation cancels an in-flight scrape and cleans up', async ({ page }) => {
  await setup(page, { failLoad: true });
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
  await ready(page);
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
  await ready(page);
  const opensBefore = await page.evaluate(() => fixture.opens);
  await page.evaluate(() => fixture.navigate('second', { transcript: false }));
  await expect(page.locator('.ytts-status')).toHaveText('Für dieses Video gibt es kein Transkript.', { timeout: 12_000 });
  expect(await page.evaluate(() => fixture.opens)).toBe(opensBefore);
  await expect(page.locator('.ytts-copy')).toBeDisabled();
});

// #12: the poll keeps the card in place on watch pages and removes it after leaving them,
// even when YouTube fires no navigation event.
test('the poll re-inserts a card that YouTube re-rendered away', async ({ page }) => {
  await setup(page);
  await ready(page);
  await page.evaluate(() => document.getElementById('ytts-panel').remove());
  await expect(page.locator('#secondary-inner > :first-child')).toHaveId('ytts-panel', { timeout: 2_500 });
});

test('the poll removes the card after leaving the watch page without an event', async ({ page }) => {
  await setup(page);
  await ready(page);
  await page.evaluate(() => history.pushState({}, '', '/'));
  await expect(page.locator('#ytts-panel')).toHaveCount(0, { timeout: 2_500 });
});

test('missing transcripts show a clear error without enabling copy', async ({ page }) => {
  await setup(page, { noTranscript: true, settings: { expandedByDefault: true } });
  await expect(page.locator('.ytts-status')).toHaveText('Für dieses Video gibt es kein Transkript.', { timeout: 12_000 });
  await expect(page.locator('.ytts-copy')).toBeDisabled();
  await expect(page.locator('html')).not.toHaveClass(/ytts-busy/);
});

test('failed native loading closes the panel and removes the hidden state', async ({ page }) => {
  await setup(page, { failLoad: true, settings: { expandedByDefault: true } });
  await expect(page.locator('.ytts-status')).toHaveText('Transkript konnte nicht geladen werden.', { timeout: 20_000 });
  await expect(page.locator(nativePanel)).toHaveAttribute('visibility', hidden);
  await expect(page.locator('html')).not.toHaveClass(/ytts-busy/);
  await expect(page.locator('.ytts-copy')).toBeDisabled();
});

test('keeps a native transcript open when the user already opened it', async ({ page }) => {
  await setup(page, { alreadyOpen: true });
  await ready(page);
  await expect(page.locator(nativePanel)).toHaveAttribute('visibility', expanded);
  expect(await page.evaluate(() => fixture.opens)).toBe(0);
});

test('reports clipboard failure and restores keyboard focus', async ({ page }) => {
  await setup(page, { clipboardFailure: true });
  await ready(page);
  const copy = page.locator('.ytts-copy');
  await copy.focus();
  await page.keyboard.press('Enter');
  await expect(copy).toHaveText('Kopierfehler');
  await expect(page.locator('.ytts-announcement')).toHaveText('Kopieren fehlgeschlagen. Bitte erneut versuchen.');
  await expect(copy).toBeFocused();
  await expect(page.locator('textarea')).toHaveCount(0);
});
