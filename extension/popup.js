// Defaults — keep in sync with content.js.
const DEFAULTS = { expandedByDefault: false, copyTimestamps: false, view: 'sentences' };

const inputs = document.querySelectorAll('input[data-key]');
const viewRadios = document.querySelectorAll('input[name="view"]');
const status = document.getElementById('save-status');
let saveSequence = 0;

async function init() {
  let settings = DEFAULTS;
  try {
    const saved = await chrome.storage.sync.get(DEFAULTS);
    settings = {
      expandedByDefault: typeof saved.expandedByDefault === 'boolean'
        ? saved.expandedByDefault : DEFAULTS.expandedByDefault,
      copyTimestamps: typeof saved.copyTimestamps === 'boolean'
        ? saved.copyTimestamps : DEFAULTS.copyTimestamps,
      view: ['lines', 'sentences', 'text'].includes(saved.view) ? saved.view : DEFAULTS.view,
    };
  } catch {
    status.textContent = 'Einstellungen konnten nicht geladen werden.';
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
        if (sequence === saveSequence) status.textContent = 'Einstellungen gespeichert.';
      } catch {
        input.checked = !value;
        if (sequence === saveSequence) {
          status.textContent = 'Speichern fehlgeschlagen. Bitte erneut versuchen.';
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
        if (sequence === saveSequence) status.textContent = 'Einstellungen gespeichert.';
      } catch {
        currentView = previous;
        for (const r of viewRadios) r.checked = r.value === previous;
        if (sequence === saveSequence) {
          status.textContent = 'Speichern fehlgeschlagen. Bitte erneut versuchen.';
        }
      } finally {
        for (const r of viewRadios) r.disabled = false;
        if (hadFocus && document.activeElement === document.body) radio.focus();
      }
    });
  }
}

init();
