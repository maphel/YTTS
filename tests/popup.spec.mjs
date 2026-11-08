import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';

const extension = new URL('../extension/', import.meta.url);
const mimeTypes = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png' };

async function setup(page, options = {}) {
  await page.route('https://ytts.test/**', async (route) => {
    const path = new URL(route.request().url()).pathname.slice(1);
    await route.fulfill({
      contentType: mimeTypes[extname(path)],
      body: await readFile(new URL(path, extension)),
    });
  });
  await page.addInitScript((options) => {
    window.savedSettings = { ...options.settings };
    window.storageWrites = [];
    window.chrome = { storage: { sync: {
      get: async (defaults) => {
        await new Promise((resolve) => setTimeout(resolve, options.readDelay ?? 20));
        return { ...defaults, ...window.savedSettings };
      },
      set: async (values) => {
        window.storageWrites.push(values);
        await new Promise((resolve) => setTimeout(resolve, 40));
        if (options.failWrites) throw new Error('Storage write failed');
        Object.assign(window.savedSettings, values);
      },
    } } };
  }, options);
  await page.goto('https://ytts.test/popup.html');
}

test('loads saved native checkbox and radio states before allowing edits', async ({ page }) => {
  await setup(page, {
    readDelay: 300,
    settings: { expandedByDefault: true, copyTimestamps: false, view: 'text' },
  });
  const expanded = page.locator('[data-key="expandedByDefault"]');
  await expect(expanded).toBeDisabled();
  await expect(expanded).toBeEnabled();
  await expect(expanded).toBeChecked();
  await expect(page.locator('[data-key="copyTimestamps"]')).not.toBeChecked();
  await expect(page.getByRole('radio', { name: 'Text', exact: true })).toBeChecked();
  expect(await page.evaluate(() => storageWrites)).toEqual([]);
});

test('invalid stored values fall back to the declared defaults', async ({ page }) => {
  await setup(page, { settings: { expandedByDefault: 'true', copyTimestamps: 1, view: 'unknown' } });
  await expect(page.locator('[data-key="expandedByDefault"]')).toBeEnabled();
  await expect(page.locator('[data-key="expandedByDefault"]')).not.toBeChecked();
  await expect(page.locator('[data-key="copyTimestamps"]')).not.toBeChecked();
  await expect(page.getByRole('radio', { name: 'Sätze', exact: true })).toBeChecked();
});

test('keyboard toggle saves and keeps focus after the asynchronous write', async ({ page }) => {
  await setup(page);
  const timestamps = page.locator('[data-key="copyTimestamps"]');
  await expect(timestamps).toBeEnabled();
  await timestamps.focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('status')).toHaveText('Einstellungen gespeichert.');
  await expect(timestamps).toBeChecked();
  await expect(timestamps).toBeFocused();
  expect(await page.evaluate(() => savedSettings.copyTimestamps)).toBe(true);
  expect(await page.evaluate(() => storageWrites)).toEqual([{ copyTimestamps: true }]);
});

test('changing the view by keyboard persists the selected radio', async ({ page }) => {
  await setup(page);
  const text = page.getByRole('radio', { name: 'Text', exact: true });
  await expect(text).toBeEnabled();
  await text.focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('status')).toHaveText('Einstellungen gespeichert.');
  await expect(text).toBeChecked();
  await expect(text).toBeFocused();
  expect(await page.evaluate(() => savedSettings.view)).toBe('text');
  expect(await page.evaluate(() => storageWrites)).toEqual([{ view: 'text' }]);
});

test('write failures restore checkbox and radio states with German feedback', async ({ page }) => {
  await setup(page, { failWrites: true });
  const expanded = page.locator('[data-key="expandedByDefault"]');
  await expect(expanded).toBeEnabled();
  await expanded.focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('status')).toHaveText('Speichern fehlgeschlagen. Bitte erneut versuchen.');
  await expect(expanded).toBeEnabled();
  await expect(expanded).not.toBeChecked();
  await expect(expanded).toBeFocused();

  const text = page.getByRole('radio', { name: 'Text', exact: true });
  await text.focus();
  await page.keyboard.press('Space');
  await expect(text).toBeEnabled();
  await expect(text).not.toBeChecked();
  await expect(page.getByRole('radio', { name: 'Sätze', exact: true })).toBeChecked();
  await expect(text).toBeFocused();
  await expect(page.getByRole('status')).toHaveText('Speichern fehlgeschlagen. Bitte erneut versuchen.');
  expect(await page.evaluate(() => savedSettings)).toEqual({});
});
