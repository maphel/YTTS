// Defaults and validation come from lib.js (loaded before this script by popup.html).
const { DEFAULTS, normalizeSettings } = globalThis.YTTS;

const inputs = document.querySelectorAll('input[data-key]');
const viewRadios = document.querySelectorAll('input[name="view"]');
const statusEl = document.getElementById('save-status');
let saveSequence = 0;

async function init() {
  let settings = DEFAULTS;
  try {
    settings = normalizeSettings(await chrome.storage.sync.get(DEFAULTS));
  } catch {
    statusEl.textContent = 'Einstellungen konnten nicht geladen werden.';
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
        if (sequence === saveSequence) statusEl.textContent = 'Einstellungen gespeichert.';
      } catch {
        input.checked = !value;
        if (sequence === saveSequence) {
          statusEl.textContent = 'Speichern fehlgeschlagen. Bitte erneut versuchen.';
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
        if (sequence === saveSequence) statusEl.textContent = 'Einstellungen gespeichert.';
      } catch {
        currentView = previous;
        for (const r of viewRadios) r.checked = r.value === previous;
        if (sequence === saveSequence) {
          statusEl.textContent = 'Speichern fehlgeschlagen. Bitte erneut versuchen.';
        }
      } finally {
        for (const r of viewRadios) r.disabled = false;
        if (hadFocus && document.activeElement === document.body) radio.focus();
      }
    });
  }
}

init();
