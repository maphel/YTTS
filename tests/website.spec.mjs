import { test, expect } from '@playwright/test';
import { createServer } from 'node:http';
import { execFile } from 'node:child_process';
import { readFile, readdir, stat } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const project = fileURLToPath(new URL('../', import.meta.url));
const output = join(project, 'website/dist');
const production = 'https://ytts.christophel.io';
const store = 'https://chromewebstore.google.com/detail/ytts/ipkipmmdaicpfijcddghjpfjpacgdphe';
const locales = [
  ['en', 'en', '/'], ['de', 'de', '/de/'], ['es', 'es', '/es/'],
  ['fr', 'fr', '/fr/'], ['it', 'it', '/it/'], ['pt', 'pt-BR', '/pt-br/'],
  ['pt-PT', 'pt-PT', '/pt-pt/'], ['nl', 'nl', '/nl/'], ['pl', 'pl', '/pl/'],
  ['tr', 'tr', '/tr/'], ['ru', 'ru', '/ru/'], ['uk', 'uk', '/uk/'],
  ['ja', 'ja', '/ja/'], ['ko', 'ko', '/ko/'], ['zh-CN', 'zh-CN', '/zh-cn/'],
  ['zh-TW', 'zh-TW', '/zh-tw/'], ['hi', 'hi', '/hi/'], ['id', 'id', '/id/'],
  ['vi', 'vi', '/vi/'], ['ar', 'ar', '/ar/'], ['sv', 'sv', '/sv/'],
];
const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp',
  '.mp4': 'video/mp4', '.jpg': 'image/jpeg', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
};

let server;
let address;
const copy = {};

test.describe('published YTTS website', () => {
  // All locales share one generated output and one server. Building once avoids
  // parallel workers reading partially written files while another worker builds.
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    await promisify(execFile)(process.execPath, ['scripts/build-website.mjs'], { cwd: project });
    for (const file of await readdir(join(project, 'website/copy'))) {
      if (file.endsWith('.json')) Object.assign(copy, JSON.parse(await readFile(join(project, 'website/copy', file), 'utf8')));
    }
    const headerSource = await readFile(join(output, '_headers'), 'utf8');
    const headers = {};
    for (const line of headerSource.split('\n').slice(1)) {
      if (!line.startsWith('  ')) break;
      const separator = line.indexOf(':');
      if (separator > 0) headers[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
    }

    server = createServer(async (request, response) => {
      try {
        const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
        let file = resolve(output, `.${path}`);
        if (file !== output && !file.startsWith(`${output}${sep}`)) {
          response.writeHead(403).end();
          return;
        }
        if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
        const body = await readFile(file);
        const type = mime[extname(file)] || 'application/octet-stream';
        const common = { ...headers, 'Content-Type': type, 'Accept-Ranges': 'bytes' };
        const range = request.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
        if (range) {
          const start = Number(range[1]);
          const end = Math.min(range[2] ? Number(range[2]) : body.length - 1, body.length - 1);
          if (start > end || start >= body.length) {
            response.writeHead(416, { ...common, 'Content-Range': `bytes */${body.length}` }).end();
            return;
          }
          response.writeHead(206, {
            ...common, 'Content-Range': `bytes ${start}-${end}/${body.length}`,
            'Content-Length': end - start + 1,
          });
          response.end(request.method === 'HEAD' ? undefined : body.subarray(start, end + 1));
        } else {
          response.writeHead(200, { ...common, 'Content-Length': body.length });
          response.end(request.method === 'HEAD' ? undefined : body);
        }
      } catch {
        response.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
      }
    });
    await new Promise((resolveListen, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolveListen);
    });
    address = `http://127.0.0.1:${server.address().port}`;
  });

  test.afterAll(async () => {
    if (server) {
      server.closeAllConnections();
      await new Promise((resolveClose) => server.close(resolveClose));
    }
  });

  test('all 21 localized pages have complete metadata, working assets and usable mobile layouts', async ({ page }) => {
    test.setTimeout(90_000);
    const expectedAlternates = locales.map(([, language, path]) => [language, `${production}${path}`]);
    expectedAlternates.push(['x-default', `${production}/`]);
    const titles = new Set();
    const descriptions = new Set();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));

    for (const [code, language, path] of locales) {
      await page.setViewportSize({ width: 1440, height: 1000 });
      const response = await page.goto(`${address}${path}`);
      expect(response.status(), code).toBe(200);
      expect(response.headers()['content-security-policy'], code).toContain("default-src 'self'");
      await expect(page.locator('html')).toHaveAttribute('lang', language);
      await expect(page.locator('html')).toHaveAttribute('dir', code === 'ar' ? 'rtl' : 'ltr');
      await expect(page).toHaveTitle(copy[code].pageTitle);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', copy[code].description);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${production}${path}`);
      const alternates = await page.locator('link[rel="alternate"][hreflang]').evaluateAll((nodes) => nodes.map((node) => [node.hreflang, node.href]));
      expect(alternates, code).toEqual(expectedAlternates);
      await expect(page.locator('#language option')).toHaveCount(21);
      await expect(page.locator('#language')).toHaveValue(path);
      await expect(page.locator('h1')).toBeVisible();
      titles.add(await page.title());
      descriptions.add(await page.locator('meta[name="description"]').getAttribute('content'));

      const installs = page.locator('a.button');
      await expect(installs).toHaveCount(3);
      for (const install of await installs.all()) await expect(install).toHaveAttribute('href', store);

      // Decode lazy and currently hidden theme images too, so a missing dark
      // screenshot cannot remain unnoticed behind the default light theme.
      const images = await page.locator('img').evaluateAll(async (nodes) => {
        await Promise.all(nodes.map(async (image) => {
          image.loading = 'eager';
          await image.decode();
        }));
        return nodes.map((image) => ({ source: new URL(image.src).pathname, width: image.naturalWidth }));
      });
      expect(images.every((image) => image.source.startsWith('/assets/') && image.width > 0), code).toBe(true);

      for (const width of [1440, 320]) {
        await page.setViewportSize({ width, height: 1000 });
        const dimensions = await page.evaluate(() => ({
          available: document.documentElement.clientWidth,
          content: document.documentElement.scrollWidth,
        }));
        expect(dimensions.content, `${code}: overflow at ${width}px`).toBeLessThanOrEqual(dimensions.available + 1);
      }
    }
    expect(titles.size).toBe(21);
    expect(descriptions.size).toBe(21);
    expect(errors).toEqual([]);
  });

  test('the header keeps its brand and controls separate at 320px in every language', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    for (const [code, , path] of locales) {
      await page.goto(`${address}${path}`);
      const header = await page.locator('.topbar .wrap').evaluate((node) => {
        const bounds = node.getBoundingClientRect();
        return {
          left: bounds.left,
          right: bounds.right,
          items: Array.from(node.children).map((item) => {
            const rect = item.getBoundingClientRect();
            return {
              name: item.className,
              left: rect.left,
              right: rect.right,
              width: item.clientWidth,
              contentWidth: item.scrollWidth,
            };
          }),
        };
      });
      for (const item of header.items) {
        expect(item.width, `${code}: ${item.name} must not squeeze its content into another control`).toBeGreaterThanOrEqual(item.contentWidth - 1);
        expect(item.left, `${code}: ${item.name} must stay inside the header`).toBeGreaterThanOrEqual(header.left - 1);
        expect(item.right, `${code}: ${item.name} must stay inside the header`).toBeLessThanOrEqual(header.right + 1);
      }
      const ordered = [...header.items].sort((a, b) => a.left - b.left);
      for (let index = 1; index < ordered.length; index++) {
        expect(ordered[index - 1].right, `${code}: header elements must not overlap`).toBeLessThanOrEqual(ordered[index].left + 1);
      }
    }
  });

  test('language selection navigates to translated Arabic and German pages', async ({ page }) => {
    await page.goto(address);
    await page.locator('#language').selectOption('/ar/');
    await expect(page).toHaveURL(`${address}/ar/`);
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('h1')).toContainText(copy.ar.title1);
    await page.locator('#language').selectOption('/de/');
    await expect(page).toHaveURL(`${address}/de/`);
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(page.locator('h1')).toContainText(copy.de.title1);
  });

  test('themes follow the system and the toggle switches both page and product card', async ({ page }) => {
    const background = () => page.locator('body').evaluate((node) => getComputedStyle(node).backgroundColor);
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto(address);
    await expect(page.locator('html')).not.toHaveAttribute('data-theme');
    await expect(page.locator('.card-dark')).toBeVisible();
    await expect(page.locator('.card-light')).toBeHidden();
    const darkBackground = await background();

    await page.emulateMedia({ colorScheme: 'light' });
    await expect(page.locator('.card-light')).toBeVisible();
    expect(await background()).not.toBe(darkBackground);
    await page.locator('[data-toggle-theme]').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('.card-dark')).toBeVisible();
    await expect(page.locator('.card-light')).toBeHidden();
    expect(await background()).toBe(darkBackground);

    // A deliberate choice takes precedence over subsequent system changes.
    await page.locator('[data-toggle-theme]').click();
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('.card-light')).toBeVisible();
  });

  test('the demo is a plain link that plays in place, landscape on desktop and portrait on phones', async ({ page }) => {
    for (const [width, height, videoWidth, videoHeight] of [[1440, 1000, 1920, 1080], [390, 844, 1080, 1350]]) {
      await page.setViewportSize({ width, height });
      await page.goto(address);
      const poster = page.locator('[data-demo]');
      await expect(poster).toHaveAttribute('href', /^\/assets\/demo\.mp4\?v=/);
      await expect(page.locator('video')).toHaveCount(0);
      const posterRatio = await poster.evaluate((node) => node.getBoundingClientRect().width / node.getBoundingClientRect().height);
      expect(posterRatio).toBeCloseTo(videoWidth / videoHeight, 1);
      await poster.click();
      await page.waitForFunction(() => {
        const video = document.getElementById('demo-video');
        return video && !video.paused && video.currentTime > 0.1;
      });
      const media = await page.locator('#demo-video').evaluate((node) => ({
        width: node.videoWidth, height: node.videoHeight, duration: node.duration,
        displayedRatio: node.getBoundingClientRect().width / node.getBoundingClientRect().height,
      }));
      expect(media.width).toBe(videoWidth);
      expect(media.height).toBe(videoHeight);
      expect(media.duration).toBeCloseTo(19, 0);
      expect(media.displayedRatio).toBeCloseTo(videoWidth / videoHeight, 1);
      await expect(poster).toHaveCount(0);
    }
  });

  test('native FAQs work by keyboard', async ({ page }) => {
    await page.goto(address);
    const first = page.locator('#faq details').first();
    await first.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(first).toHaveAttribute('open', '');
    await expect(first.locator('p')).toBeVisible();
    await page.keyboard.press('Space');
    await expect(first).not.toHaveAttribute('open');
    await expect(first.locator('p')).toBeHidden();
  });
});
