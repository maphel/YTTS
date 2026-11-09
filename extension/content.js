// YTTS — content script.
//
// How the transcript is obtained: YouTube's own "Show transcript" panel is opened
// programmatically (made invisible via CSS), its rendered segments are read from
// the DOM, and the panel is closed again. Direct API routes (timedtext,
// get_transcript) are blocked for third-party callers — see LESSONS_LEARNED.md.
(() => {
  'use strict';

  const PANEL_ID = 'ytts-panel';
  // Two DOM variants exist in the wild (YouTube A/B tests both).
  const SEG_SEL = 'transcript-segment-view-model, ytd-transcript-segment-renderer';
  const CHAPTER_SEL = 'ytd-transcript-section-header-renderer';
  const OPEN_BTN_SEL = 'ytd-video-description-transcript-section-renderer button';
  const NATIVE_PANEL_SEL = 'ytd-engagement-panel-section-list-renderer';
  const EXPANDED = 'ENGAGEMENT_PANEL_VISIBILITY_EXPANDED';
  const CONSENT_KEY = 'transcriptConsent';

  const ICON_COPY = 'M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z';
  const ICON_CHECK = 'M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z';
  const ICON_CHEVRON = 'M12 8l6 6-1.41 1.41L12 10.83l-4.59 4.58L6 14z';

  // Pure helpers from lib.js (loaded first by the manifest, same isolated world).
  const {
    DEFAULTS, validSetting, normalizeSettings, toSeconds, fmtTime,
    toSentences, toParagraphs, formatTranscript,
  } = globalThis.YTTS;
  const settings = { ...DEFAULTS };

  // UI language follows YouTube's interface language (<html lang>), see i18n.js.
  let translator = null;
  function currentTranslator() {
    const lang = document.documentElement.lang || navigator.language;
    if (translator?.tag !== lang) translator = { tag: lang, ...globalThis.YTTS_I18N.createTranslator(lang) };
    return translator;
  }
  const t = (key, vars) => currentTranslator().t(key, vars);
  // The card's lang is the language actually shown (e.g. "en" for an unsupported YouTube
  // language), so screen readers pick the right voice for fallback text.
  const uiLocale = () => currentTranslator().locale;
  // Errors travel as message keys and are translated when rendered.
  const ERROR_KEYS = new Set(['noTranscript', 'loadFailed', 'empty']);

  const state = {
    consent: false,
    consentSaving: false,
    consentError: false,
    videoId: null,
    items: null,
    error: null,
    loadToken: 0,
    collapsed: null, // per-tab override; null = use settings.expandedByDefault
  };

  // ---------- helpers ----------

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function waitFor(fn, timeout = 10000, interval = 200, signal) {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      signal?.throwIfAborted();
      const v = fn();
      if (v) return v;
      await sleep(interval);
    }
    return null;
  }

  const onWatchPage = () => location.pathname === '/watch';

  function currentVideoId() {
    if (!onWatchPage()) return null;
    return new URLSearchParams(location.search).get('v');
  }

  const isCollapsed = () => state.collapsed ?? !settings.expandedByDefault;

  // ---------- settings ----------

  const storage = globalThis.chrome?.storage?.sync;
  const consentStorage = globalThis.chrome?.storage?.local;
  let consentRevision = 0;
  let ready = false;

  async function loadSettings() {
    try {
      Object.assign(settings, normalizeSettings(await storage?.get(DEFAULTS)));
    } catch { /* keep defaults */ }
  }

  async function loadConsent() {
    try {
      const values = await consentStorage.get(CONSENT_KEY);
      if (consentRevision === 0) state.consent = values[CONSENT_KEY] === true;
    } catch { /* an unreadable choice does not grant consent */ }
  }

  function setConsent(allowed) {
    if (state.consent === allowed) return;
    state.consent = allowed;
    if (!allowed) {
      lastSignature = '';
      lastVideoId = null;
    }
    if (ready) {
      tick();
      render();
    }
  }

  async function grantConsent() {
    if (state.consent || state.consentSaving) return;
    state.consentSaving = true;
    state.consentError = false;
    const revision = consentRevision;
    render();
    try {
      await consentStorage.set({ [CONSENT_KEY]: true });
      if (revision === consentRevision) setConsent(true);
    } catch {
      state.consentError = true;
    } finally {
      state.consentSaving = false;
      render();
    }
  }

  globalThis.chrome?.storage?.onChanged?.addListener((changes, area) => {
    if (area === 'local' && Object.hasOwn(changes, CONSENT_KEY)) {
      consentRevision++;
      setConsent(changes[CONSENT_KEY].newValue === true);
    }
    if (area !== 'sync') return;
    for (const [k, { newValue }] of Object.entries(changes)) {
      if (Object.hasOwn(DEFAULTS, k)) {
        settings[k] = validSetting(k, newValue) ? newValue : DEFAULTS[k];
      }
    }
    render();
  });

  // ---------- scraping YouTube's native transcript panel ----------

  function transcriptPanel() {
    const seg = document.querySelector(SEG_SEL);
    return seg?.closest(NATIVE_PANEL_SEL)
      || document.querySelector(`${NATIVE_PANEL_SEL}[target-id="engagement-panel-searchable-transcript"]`)
      || document.querySelector(`${NATIVE_PANEL_SEL}[identifier="engagement-panel-searchable-transcript"]`);
  }

  function parsePanel(panel) {
    const items = [];
    for (const el of panel.querySelectorAll(`${SEG_SEL}, ${CHAPTER_SEL}`)) {
      if (el.matches(CHAPTER_SEL)) {
        const title = (el.querySelector('h2')?.textContent
          || el.querySelector('[aria-label]')?.getAttribute('aria-label') || '').trim();
        if (title) items.push({ type: 'chapter', title });
        continue;
      }
      const ts = el.querySelector(
        '.segment-timestamp, [class*="SegmentViewModelTimestamp"]:not([class*="A11y"])'
      )?.textContent.trim();
      const text = el.querySelector('.segment-text, .ytAttributedStringHost, yt-formatted-string')
        ?.textContent.replace(/\s+/g, ' ').trim();
      if (ts && text) items.push({ type: 'seg', ts, sec: toSeconds(ts), text });
    }
    return items;
  }

  // A short fingerprint distinguishes stale native segments without retaining their text.
  function segSignature() {
    const segs = document.querySelectorAll(SEG_SEL);
    if (!segs.length) return '';
    let hash = 2166136261;
    for (const edge of [segs[0], segs[segs.length - 1]]) {
      const text = edge.textContent;
      hash = Math.imul(hash ^ text.length, 16777619);
      for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
    }
    return `${segs.length}|${hash >>> 0}`;
  }

  // On SPA navigation the URL changes first; ytd-watch-flexy[video-id] follows ~0.8 s later.
  // Until then the previous video's description, including its transcript button, is still
  // in the DOM (measured on youtube.com, see #11). Layouts without the attribute pass.
  function pageShowsVideo(videoId) {
    const flexy = document.querySelector('ytd-watch-flexy');
    return !flexy?.hasAttribute('video-id') || flexy.getAttribute('video-id') === videoId;
  }

  function mediaDuration() {
    return document.querySelector('video.html5-main-video')?.duration
      ?? document.querySelector('video')?.duration;
  }

  async function scrapeTranscript(prevSignature, signal, videoId) {
    if (document.querySelector('ytd-watch-flexy[video-id]')) {
      // Best effort: if YouTube ever leaves video-id stale, a stale button still only reopens the
      // previous transcript, which the prevSignature check below rejects.
      await waitFor(() => pageShowsVideo(videoId), 3000, 100, signal);
    } else {
      await sleep(300); // layouts without the attribute keep the former 600 ms total grace
    }
    signal.throwIfAborted();
    const btn = await waitFor(() => document.querySelector(OPEN_BTN_SEL), 8000, 200, signal);
    if (!btn) throw new Error('noTranscript');
    signal.throwIfAborted();

    const existing = transcriptPanel();
    const wasOpen = existing?.getAttribute('visibility') === EXPANDED
      && segSignature() !== prevSignature;

    if (!wasOpen) document.documentElement.classList.add('ytts-busy');
    try {
      if (!wasOpen) btn.click();

      // Wait until segments exist, differ from the previous video's, and stop growing.
      let last = '';
      let stableTicks = 0;
      const ok = await waitFor(() => {
        const sig = segSignature();
        if (!sig || sig === prevSignature) { stableTicks = 0; return false; }
        stableTicks = sig === last ? stableTicks + 1 : 0;
        last = sig;
        return stableTicks >= 2;
      }, 15000, 200, signal);
      if (!ok) throw new Error('loadFailed');

      const panel = transcriptPanel();
      const items = parsePanel(panel);
      if (!items.some((i) => i.type === 'seg')) throw new Error('empty');

      return { items, signature: segSignature() };
    } finally {
      // Close our panel on errors and cancelled navigations as well. Scrapes are
      // serialized so this cleanup cannot close a newer video's panel.
      if (!wasOpen) {
        try {
          const panel = transcriptPanel();
          if (panel?.getAttribute('visibility') === EXPANDED) {
            const close = panel.querySelector('#visibility-button button');
            if (close) close.click();
            else panel.setAttribute('visibility', 'ENGAGEMENT_PANEL_VISIBILITY_HIDDEN');
          }
          // Let YouTube finish its close animation before un-hiding.
          await sleep(300);
        } finally {
          document.documentElement.classList.remove('ytts-busy');
        }
      }
    }
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const active = document.activeElement;
      const selection = document.getSelection();
      const ranges = selection
        ? Array.from({ length: selection.rangeCount }, (_, i) => selection.getRangeAt(i).cloneRange())
        : [];
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.readOnly = true;
      ta.style.cssText = 'position:fixed;left:-9999px';
      document.body.appendChild(ta);
      try {
        ta.select();
        if (!document.execCommand('copy')) throw new Error('execCommand copy failed');
      } finally {
        ta.remove();
        if (active instanceof HTMLElement && active.isConnected) active.focus({ preventScroll: true });
        if (selection) {
          selection.removeAllRanges();
          for (const range of ranges) selection.addRange(range);
        }
      }
    }
  }

  // ---------- UI (DOM APIs only: youtube.com enforces Trusted Types) ----------
  // Transcript text carries dir="auto": its language is independent of YouTube's UI language
  // (an English transcript inside Arabic YouTube must not mirror). Time chips are always LTR.

  function el(tag, props = {}, children = []) {
    const n = Object.assign(document.createElement(tag), props);
    for (const c of children) n.append(c);
    return n;
  }

  function icon(d) {
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', d);
    svg.append(path);
    return svg;
  }

  function setCopyLabel(btn, result = '') {
    const copied = result === 'copied';
    const failed = result === 'error';
    btn.replaceChildren(icon(copied ? ICON_CHECK : ICON_COPY),
      t(copied ? 'copied' : failed ? 'copyError' : 'copy'));
    btn.setAttribute('aria-label', t(copied ? 'copiedAnnounce' : failed ? 'copyFailed' : 'copyAria'));
    btn.title = t(failed ? 'copyFailed' : 'copyAria');
  }

  function buildPanel() {
    const copyBtn = el('button', { className: 'ytts-copy', type: 'button', disabled: true });
    setCopyLabel(copyBtn);
    const chevron = el('button', {
      className: 'ytts-chevron', type: 'button',
    }, [icon(ICON_CHEVRON)]);
    chevron.setAttribute('aria-controls', 'ytts-body');
    const header = el('div', { className: 'ytts-header' }, [
      el('span', { id: 'ytts-title', className: 'ytts-title', dir: 'auto', textContent: t('title') }),
      copyBtn,
      chevron,
    ]);
    const body = el('div', { id: 'ytts-body', className: 'ytts-body' });
    const announcement = el('div', { className: 'ytts-announcement' });
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    const panel = el('section', { id: PANEL_ID, lang: uiLocale() }, [header, body, announcement]);
    panel.setAttribute('aria-labelledby', 'ytts-title');

    // Whole header toggles, except the copy button.
    header.addEventListener('click', (e) => {
      if (e.target.closest('.ytts-copy')) return;
      state.collapsed = !isCollapsed();
      render();
    });

    copyBtn.addEventListener('click', async (e) => {
      if (!e.isTrusted || !state.items || copyBtn._copying || currentVideoId() !== state.videoId) return;
      const items = state.items;
      const token = state.loadToken;
      copyBtn._copying = true;
      clearTimeout(copyBtn._t);
      let result;
      try {
        await copyText(formatTranscript(items, { ...settings, duration: mediaDuration() }));
        result = 'copied';
      } catch {
        result = 'error';
      } finally {
        copyBtn._copying = false;
      }
      if (token !== state.loadToken || currentVideoId() !== state.videoId || !copyBtn.isConnected) return;
      setCopyLabel(copyBtn, result);
      announcement.textContent = t(result === 'copied' ? 'copiedAnnounce' : 'copyFailed');
      copyBtn._t = setTimeout(() => {
        setCopyLabel(copyBtn);
        announcement.textContent = '';
      }, 2000);
    });

    body.addEventListener('click', (e) => {
      const seg = e.target.closest('[data-sec]');
      if (!seg || !state.items || currentVideoId() !== state.videoId) return;
      const video = document.querySelector('video.html5-main-video') || document.querySelector('video');
      if (video) video.currentTime = Number(seg.dataset.sec);
    });

    // Keyboard activation for the span-based sentences of the "Text" view.
    body.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('span[data-sec]')) {
        e.preventDefault();
        e.target.click();
      }
    });

    return panel;
  }

  function ensurePanel() {
    if (!onWatchPage() || (state.consent && !state.videoId)) {
      document.getElementById(PANEL_ID)?.remove();
      rendered = { items: null, view: null };
      return;
    }
    let host = document.querySelector('#secondary-inner') || document.querySelector('#secondary');
    let related;
    const flexy = document.querySelector('ytd-watch-flexy');
    const sideRail = flexy?.hasAttribute('side-rail-dismissible-panels');
    // The side-rail layout reserves #secondary for temporary engagement panels and hides it when
    // they close; the single-column layout (narrow windows) does not render #secondary at all
    // (#23). In both, the recommendations live below the player: sit right above them.
    const singleColumn = flexy && host && !host.getClientRects().length;
    if (sideRail || singleColumn) {
      related = Array.from(flexy.querySelectorAll('#primary #related')).find((node) =>
        node.getClientRects().length && node.getBoundingClientRect().width > 0
        && getComputedStyle(node).visibility !== 'hidden');
      if (!related) return; // Wait for the active recommendations, not a skeleton.
      host = null;
    } else if (!host) {
      return;
    }
    let panel = document.getElementById(PANEL_ID);
    if (!panel) {
      panel = buildPanel();
      render(panel);
    }
    if (related) {
      if (panel.nextElementSibling !== related) related.before(panel);
    } else if (host.firstElementChild !== panel) host.prepend(panel);
  }

  let rendered = { items: null, view: null };

  function chapterEl(it) {
    return el('h3', { className: 'ytts-chapter', dir: 'auto', textContent: it.title });
  }

  // Clickable row/sentence that seeks the video (a <button> for keyboard access).
  function seekButton(className, sec, label, children) {
    const b = el('button', { className, type: 'button' }, children);
    b.dataset.sec = sec;
    b.setAttribute('aria-label', t('seekTo', { time: fmtTime(sec), text: label }));
    return b;
  }

  function renderLines(items) {
    return items.map((it) => (it.type === 'chapter' ? chapterEl(it)
      : seekButton('ytts-seg', it.sec, it.text, [
        el('span', { className: 'ytts-time', dir: 'ltr', textContent: it.ts }),
        el('span', { className: 'ytts-text', dir: 'auto', textContent: it.text }),
      ])));
  }

  function renderSentences(items) {
    return toSentences(items, mediaDuration()).map((it) => (it.type === 'chapter' ? chapterEl(it)
      : seekButton('ytts-sent', it.sec, it.text, [
        el('span', { className: 'ytts-time', dir: 'ltr', textContent: `${fmtTime(it.sec)} – ${fmtTime(it.end)}` }),
        el('span', { className: 'ytts-text', dir: 'auto', textContent: it.text }),
      ])));
  }

  function renderText(items) {
    return toParagraphs(toSentences(items, mediaDuration())).map((it) => {
      if (it.type === 'chapter') return chapterEl(it);
      const p = el('p', { className: 'ytts-para', dir: 'auto' });
      it.sentences.forEach((s, i) => {
        if (i) p.append(' ');
        // A real <button> is always an atomic inline-block in Chrome and cannot wrap
        // mid-sentence, so inline sentences are spans with button semantics.
        const span = el('span', { className: 'ytts-s', tabIndex: 0, textContent: s.text });
        span.dataset.sec = s.sec;
        span.setAttribute('role', 'button');
        span.setAttribute('aria-label', t('seekTo', { time: fmtTime(s.sec), text: s.text }));
        p.append(span);
      });
      return p;
    });
  }

  const RENDERERS = { lines: renderLines, sentences: renderSentences, text: renderText };

  function render(panel = document.getElementById(PANEL_ID)) {
    if (!panel) return;
    const collapsed = isCollapsed();
    panel.classList.toggle('ytts-collapsed', collapsed);
    const chevron = panel.querySelector('.ytts-chevron');
    chevron.setAttribute('aria-expanded', String(!collapsed));
    chevron.title = t(collapsed ? 'expand' : 'collapse');
    chevron.setAttribute('aria-label', chevron.title);
    const copyBtn = panel.querySelector('.ytts-copy');
    copyBtn.disabled = !state.items;
    if (copyBtn._items !== state.items) {
      clearTimeout(copyBtn._t);
      setCopyLabel(copyBtn);
      panel.querySelector('.ytts-announcement').textContent = '';
      copyBtn._items = state.items;
    }
    if (!state.items) copyBtn.title = t(state.consent ? state.error || 'loading' : 'copyAria');

    const body = panel.querySelector('.ytts-body');
    body.setAttribute('aria-busy', String(state.consentSaving || (state.consent && !state.items && !state.error)));
    if (state.items && rendered.items === state.items && rendered.view === settings.view
      && body.childElementCount) return;
    rendered = { items: state.items, view: settings.view };

    body.replaceChildren();
    if (!state.consent) {
      const load = el('button', {
        className: 'ytts-load', type: 'button', textContent: t('loadTranscript'), disabled: state.consentSaving,
      });
      load.setAttribute('aria-describedby', 'ytts-disclosure');
      load.addEventListener('click', (e) => { if (e.isTrusted) grantConsent(); });
      const disclosure = el('div', { className: 'ytts-consent', dir: 'auto' }, [
        el('p', { id: 'ytts-disclosure', textContent: t('transcriptDisclosure') }),
        load,
      ]);
      if (state.consentError) {
        const error = el('p', { textContent: t('saveFailed') });
        error.setAttribute('role', 'alert');
        disclosure.append(error);
      }
      body.append(disclosure);
      return;
    }
    if (state.error || !state.items) {
      body.append(el('div', {
        className: 'ytts-status',
        dir: 'auto', // English fallback text inside RTL YouTube (he, fa, ur) must not mirror
        textContent: t(state.error || 'loading'),
      }));
      return;
    }
    body.append(...(RENDERERS[settings.view] || renderSentences)(state.items));
    body.scrollTop = 0;
  }

  // ---------- lifecycle ----------

  let lastSignature = '';
  let lastVideoId = null;
  let loadController;
  let scrapeTask = Promise.resolve();

  async function onVideoChange(videoId) {
    state.videoId = videoId;
    state.items = null;
    state.error = null;
    const token = ++state.loadToken;
    loadController?.abort();
    loadController = new AbortController();
    const { signal } = loadController;
    render();
    if (!videoId) return;

    await sleep(300); // debounce; scrapeTranscript waits for the new page data itself
    if (token !== state.loadToken || currentVideoId() !== videoId) return;
    try {
      const task = scrapeTask.then(async () => {
        signal.throwIfAborted();
        // Read this after the previous scrape's cleanup: a cancelled load may
        // have replaced the native segments even though its card never rendered.
        const prevSignature = lastVideoId === videoId ? '' : lastSignature;
        try {
          const result = await scrapeTranscript(prevSignature, signal, videoId);
          // Keep stale detection across navigation, but not after consent is revoked.
          if (state.consent) {
            lastSignature = result.signature;
            lastVideoId = videoId;
          }
          return result;
        } finally {
          if (signal.aborted && state.consent) {
            const signature = segSignature();
            if (signature && signature !== lastSignature) {
              lastSignature = signature;
              lastVideoId = null; // Incomplete load; ownership is not established.
            }
          }
        }
      });
      // The queue keeps only completion, not the transcript returned by the last task.
      scrapeTask = task.then(() => undefined, () => undefined);
      const { items } = await task;
      if (token !== state.loadToken || currentVideoId() !== videoId) return;
      state.items = items;
    } catch (e) {
      if (token !== state.loadToken || currentVideoId() !== videoId) return;
      state.error = ERROR_KEYS.has(e.message) ? e.message : 'loadFailed';
    }
    render();
  }

  function tick() {
    const id = state.consent ? currentVideoId() : null;
    if (id !== state.videoId) onVideoChange(id);
    ensurePanel();
  }

  Promise.all([loadSettings(), loadConsent()]).then(() => {
    ready = true;
    document.addEventListener('yt-navigate-finish', tick);
    // Late sidebar re-renders need a poll, but only while a watch page is (or was) active.
    setInterval(() => { if (onWatchPage() || state.videoId) tick(); }, 1000);
    tick();
  });
})();
