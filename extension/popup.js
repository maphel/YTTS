// Defaults and validation come from lib.js, strings from i18n.js (both loaded before this script).
const { DEFAULTS, normalizeSettings } = globalThis.YTTS;

// The popup follows the browser UI language (the card follows YouTube's, see content.js).
const { locale, dir, t } = globalThis.YTTS_I18N.createTranslator(
  globalThis.chrome?.i18n?.getUILanguage?.() || navigator.language,
);
document.documentElement.lang = locale;
document.documentElement.dir = dir;
document.title = `YTTS – ${t('settings')}`;
for (const node of document.querySelectorAll('[data-i18n]')) node.textContent = t(node.dataset.i18n);
for (const node of document.querySelectorAll('[data-i18n-aria-label]')) {
  node.setAttribute('aria-label', t(node.dataset.i18nAriaLabel));
}

const inputs = document.querySelectorAll('input[data-key]');
const viewRadios = document.querySelectorAll('input[name="view"]');
const statusEl = document.getElementById('save-status');
let saveSequence = 0;

async function init() {
  let settings = DEFAULTS;
  try {
    settings = normalizeSettings(await chrome.storage.sync.get(DEFAULTS));
  } catch {
    statusEl.textContent = t('settingsLoadFailed');
  }

  for (const input of inputs) {
    input.checked = Boolean(settings[input.dataset.key]);
    input.disabled = false;
    input.addEventListener('change', async () => {
      const sequence = ++saveSequence;
      const value = input.checked;
      const hadFocus = document.activeElement === input;
      input.disabled = true;
      try {
        await chrome.storage.sync.set({ [input.dataset.key]: value });
        if (sequence === saveSequence) statusEl.textContent = t('saved');
      } catch {
        input.checked = !value;
        if (sequence === saveSequence) {
          statusEl.textContent = t('saveFailed');
        }
      } finally {
        input.disabled = false;
        if (hadFocus && document.activeElement === document.body) input.focus();
      }
    });
  }

  let currentView = settings.view;
  for (const radio of viewRadios) {
    radio.checked = radio.value === currentView;
    radio.disabled = false;
    radio.addEventListener('change', async () => {
      if (!radio.checked) return;
      const sequence = ++saveSequence;
      const previous = currentView;
      const hadFocus = document.activeElement === radio;
      for (const r of viewRadios) r.disabled = true;
      try {
        await chrome.storage.sync.set({ view: radio.value });
        currentView = radio.value;
        if (sequence === saveSequence) statusEl.textContent = t('saved');
      } catch {
        currentView = previous;
        for (const r of viewRadios) r.checked = r.value === previous;
        if (sequence === saveSequence) {
          statusEl.textContent = t('saveFailed');
        }
      } finally {
        for (const r of viewRadios) r.disabled = false;
        if (hadFocus && document.activeElement === document.body) radio.focus();
      }
    });
  }
}

init();
