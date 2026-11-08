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

  const ICON_COPY = 'M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z';
  const ICON_CHECK = 'M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z';
  const ICON_CHEVRON = 'M12 8l6 6-1.41 1.41L12 10.83l-4.59 4.58L6 14z';

  // Defaults — keep in sync with popup.js.
  // view: 'lines' (YouTube's raw segments) | 'sentences' (merged, from–to) | 'text' (paragraphs, no times)
  const DEFAULTS = { expandedByDefault: false, copyTimestamps: false, view: 'sentences' };
  const VIEWS = ['lines', 'sentences', 'text'];
  const settings = { ...DEFAULTS };

  // Sentence merging: auto-captions often have no punctuation at all, so a
  // "sentence" is also closed after this much time / text.
  const MAX_SENTENCE_SEC = 30;
  const MAX_SENTENCE_CHARS = 300;
  const SENTENCES_PER_PARAGRAPH = 4;
  const SENTENCE_END = /[.!?…]["'”’)\]]*$/;
  const state = {
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

  function currentVideoId() {
    if (location.pathname !== '/watch') return null;
    return new URLSearchParams(location.search).get('v');
  }

  function toSeconds(ts) {
    return ts.split(':').reduce((acc, n) => acc * 60 + Number(n), 0);
  }

  const isCollapsed = () => state.collapsed ?? !settings.expandedByDefault;

  // ---------- settings ----------

  const storage = globalThis.chrome?.storage?.sync;

  function validSetting(key, value) {
    if (key === 'view') return VIEWS.includes(value);
    return typeof value === 'boolean';
  }

  async function loadSettings() {
    try {
      const saved = await storage?.get(DEFAULTS);
      for (const key of Object.keys(DEFAULTS)) {
        if (validSetting(key, saved?.[key])) settings[key] = saved[key];
      }
    } catch { /* keep defaults */ }
  }

  globalThis.chrome?.storage?.onChanged?.addListener((changes, area) => {
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

  // Signature of the segments currently in the DOM, to tell a freshly loaded
  // transcript apart from a stale one left over from the previous video.
  function segSignature() {
    const segs = document.querySelectorAll(SEG_SEL);
    return segs.length
      ? `${segs.length}|${segs[0].textContent}|${segs[segs.length - 1].textContent}`
      : '';
  }

  async function scrapeTranscript(prevSignature, signal) {
    const btn = await waitFor(() => document.querySelector(OPEN_BTN_SEL), 8000, 200, signal);
    if (!btn) throw new Error('Für dieses Video gibt es kein Transkript.');
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
      if (!ok) throw new Error('Transkript konnte nicht geladen werden.');

      const panel = transcriptPanel();
      const items = parsePanel(panel);
      if (!items.some((i) => i.type === 'seg')) throw new Error('Transkript ist leer.');

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

  // ---------- grouping ----------

  function fmtTime(sec) {
    sec = Math.max(0, Math.floor(sec));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = String(sec % 60).padStart(2, '0');
    return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
  }

  // Merge YouTube's caption fragments into sentences: [{type:'sent', sec, end, text} | chapter].
  function toSentences(items) {
    const segStarts = items.filter((i) => i.type === 'seg').map((i) => i.sec);
    const duration = document.querySelector('video')?.duration;
    const out = [];
    let cur = null;
    let segIdx = -1;
    const close = () => {
      if (cur?.text) out.push(cur);
      cur = null;
    };

    for (const it of items) {
      if (it.type === 'chapter') {
        close();
        out.push(it);
        continue;
      }
      segIdx++;
      // During ads, the active media duration can be shorter than this transcript.
      const fallbackEnd = Number.isFinite(duration) && duration >= it.sec ? duration : it.sec + 5;
      const segEnd = Math.max(it.sec, segStarts[segIdx + 1] ?? fallbackEnd);
      const pieces = it.text.split(/(?<=[.!?…]["'”’)\]]*)\s+/).filter(Boolean);
      pieces.forEach((piece, k) => {
        if (!cur) cur = { type: 'sent', sec: it.sec, end: segEnd, text: '' };
        cur.text += (cur.text ? ' ' : '') + piece;
        cur.end = Math.max(cur.sec, segEnd);
        const isLastPiece = k === pieces.length - 1;
        if (SENTENCE_END.test(piece)) close();
        else if (isLastPiece && (cur.end - cur.sec >= MAX_SENTENCE_SEC
          || cur.text.length >= MAX_SENTENCE_CHARS)) close();
      });
    }
    close();
    return out;
  }

  // Group sentences into paragraphs: [{type:'para', sentences:[...]} | chapter].
  function toParagraphs(sentences) {
    const out = [];
    let para = null;
    for (const it of sentences) {
      if (it.type === 'chapter') {
        para = null;
        out.push(it);
        continue;
      }
      if (!para || para.sentences.length >= SENTENCES_PER_PARAGRAPH) {
        para = { type: 'para', sentences: [] };
        out.push(para);
      }
      para.sentences.push(it);
    }
    return out;
  }

  // ---------- formatting / copy ----------

  function formatTranscript(items) {
    const sentences = toSentences(items);
    const out = [];
    let lines = [];
    const flush = () => {
      if (lines.length) out.push(lines.join('\n'));
      lines = [];
    };

    if (!settings.copyTimestamps) {
      for (const it of toParagraphs(sentences)) {
        if (it.type === 'chapter') out.push(`## ${it.title}`);
        else out.push(it.sentences.map((s) => s.text).join(' '));
      }
    } else {
      // Timestamp granularity follows the current view.
      const source = settings.view === 'lines' ? items : sentences;
      for (const it of source) {
        if (it.type === 'chapter') {
          flush();
          out.push(`## ${it.title}`);
        } else if (it.type === 'seg') {
          lines.push(`[${it.ts}] ${it.text}`);
        } else {
          lines.push(`[${fmtTime(it.sec)}–${fmtTime(it.end)}] ${it.text}`);
        }
      }
      flush();
    }
    return out.join('\n\n') + '\n';
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
        if (!document.execCommand('copy')) throw new Error('Kopieren fehlgeschlagen.');
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
      copied ? 'Kopiert' : failed ? 'Kopierfehler' : 'Kopieren');
    btn.setAttribute('aria-label', copied ? 'Transkript kopiert'
      : failed ? 'Kopieren fehlgeschlagen. Erneut versuchen' : 'Transkript kopieren');
    btn.title = failed ? 'Kopieren fehlgeschlagen. Bitte erneut versuchen.' : 'Transkript kopieren';
  }

  function buildPanel() {
    const copyBtn = el('button', { className: 'ytts-copy', type: 'button', disabled: true });
    setCopyLabel(copyBtn);
    const chevron = el('button', {
      className: 'ytts-chevron', type: 'button',
    }, [icon(ICON_CHEVRON)]);
    chevron.setAttribute('aria-controls', 'ytts-body');
    const header = el('div', { className: 'ytts-header' }, [
      el('span', { id: 'ytts-title', className: 'ytts-title', textContent: 'Transkript' }),
      copyBtn,
      chevron,
    ]);
    const body = el('div', { id: 'ytts-body', className: 'ytts-body' });
    const announcement = el('div', { className: 'ytts-announcement' });
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    const panel = el('section', { id: PANEL_ID }, [header, body, announcement]);
    panel.setAttribute('aria-labelledby', 'ytts-title');

    // Whole header toggles, except the copy button.
    header.addEventListener('click', (e) => {
      if (e.target.closest('.ytts-copy')) return;
      state.collapsed = !isCollapsed();
      render();
    });

    copyBtn.addEventListener('click', async () => {
      if (!state.items || copyBtn._copying) return;
      const items = state.items;
      const token = state.loadToken;
      copyBtn._copying = true;
      clearTimeout(copyBtn._t);
      let result;
      try {
        await copyText(formatTranscript(items));
        result = 'copied';
      } catch {
        result = 'error';
      } finally {
        copyBtn._copying = false;
      }
      if (token !== state.loadToken || currentVideoId() !== state.videoId || !copyBtn.isConnected) return;
      setCopyLabel(copyBtn, result);
      announcement.textContent = result === 'copied'
        ? 'Transkript kopiert.' : 'Kopieren fehlgeschlagen. Bitte erneut versuchen.';
      copyBtn._t = setTimeout(() => {
        setCopyLabel(copyBtn);
        announcement.textContent = '';
      }, 2000);
    });

    body.addEventListener('click', (e) => {
      const seg = e.target.closest('[data-sec]');
      const video = document.querySelector('video.html5-main-video') || document.querySelector('video');
      if (seg && video) video.currentTime = Number(seg.dataset.sec);
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
    if (!currentVideoId()) {
      document.getElementById(PANEL_ID)?.remove();
      return;
    }
    let host;
    let related;
    const sideRail = document.querySelector('ytd-watch-flexy[side-rail-dismissible-panels]');
    if (sideRail) {
      // This layout reserves #secondary for temporary engagement panels and
      // hides it when they close. Its recommendations live below the player.
      related = Array.from(sideRail.querySelectorAll('#primary #related')).find((node) =>
        node.getClientRects().length && node.getBoundingClientRect().width > 0
        && getComputedStyle(node).visibility !== 'hidden');
      if (!related) return; // Wait for the active recommendations, not a skeleton.
    } else {
      host = document.querySelector('#secondary-inner') || document.querySelector('#secondary');
      if (!host) return;
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
    return el('h3', { className: 'ytts-chapter', textContent: it.title });
  }

  // Clickable row/sentence that seeks the video (a <button> for keyboard access).
  function seekButton(className, sec, label, children) {
    const b = el('button', { className, type: 'button' }, children);
    b.dataset.sec = sec;
    b.setAttribute('aria-label', `Zu ${fmtTime(sec)} springen: ${label}`);
    return b;
  }

  function renderLines(items) {
    return items.map((it) => (it.type === 'chapter' ? chapterEl(it)
      : seekButton('ytts-seg', it.sec, it.text, [
        el('span', { className: 'ytts-time', textContent: it.ts }),
        el('span', { className: 'ytts-text', textContent: it.text }),
      ])));
  }

  function renderSentences(items) {
    return toSentences(items).map((it) => (it.type === 'chapter' ? chapterEl(it)
      : seekButton('ytts-sent', it.sec, it.text, [
        el('span', { className: 'ytts-time', textContent: `${fmtTime(it.sec)} – ${fmtTime(it.end)}` }),
        el('span', { className: 'ytts-text', textContent: it.text }),
      ])));
  }

  function renderText(items) {
    return toParagraphs(toSentences(items)).map((it) => {
      if (it.type === 'chapter') return chapterEl(it);
      const p = el('p', { className: 'ytts-para' });
      it.sentences.forEach((s, i) => {
        if (i) p.append(' ');
        // A real <button> is always an atomic inline-block in Chrome and cannot wrap
        // mid-sentence, so inline sentences are spans with button semantics.
        const span = el('span', { className: 'ytts-s', tabIndex: 0, textContent: s.text });
        span.dataset.sec = s.sec;
        span.setAttribute('role', 'button');
        span.setAttribute('aria-label', `Zu ${fmtTime(s.sec)} springen: ${s.text}`);
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
    chevron.title = collapsed ? 'Transkript ausklappen' : 'Transkript einklappen';
    chevron.setAttribute('aria-label', chevron.title);
    const copyBtn = panel.querySelector('.ytts-copy');
    copyBtn.disabled = !state.items;
    if (copyBtn._items !== state.items) {
      clearTimeout(copyBtn._t);
      setCopyLabel(copyBtn);
      panel.querySelector('.ytts-announcement').textContent = '';
      copyBtn._items = state.items;
    }
    if (!state.items) copyBtn.title = state.error || 'Transkript wird geladen…';

    const body = panel.querySelector('.ytts-body');
    body.setAttribute('aria-busy', String(!state.items && !state.error));
    if (state.items && rendered.items === state.items && rendered.view === settings.view
      && body.childElementCount) return;
    rendered = { items: state.items, view: settings.view };

    body.replaceChildren();
    if (state.error || !state.items) {
      body.append(el('div', {
        className: 'ytts-status',
        textContent: state.error || 'Transkript wird geladen…',
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

    await sleep(600); // let YouTube swap in the new video's page data
    if (token !== state.loadToken || currentVideoId() !== videoId) return;
    try {
      const task = scrapeTask.catch(() => {}).then(async () => {
        signal.throwIfAborted();
        // Read this after the previous scrape's cleanup: a cancelled load may
        // have replaced the native segments even though its card never rendered.
        const prevSignature = lastVideoId === videoId ? '' : lastSignature;
        try {
          const result = await scrapeTranscript(prevSignature, signal);
          // Record the native result even if navigation cancelled its UI update.
          lastSignature = result.signature;
          lastVideoId = videoId;
          return result;
        } finally {
          if (signal.aborted) {
            const signature = segSignature();
            if (signature && signature !== lastSignature) {
              lastSignature = signature;
              lastVideoId = null; // Incomplete load; ownership is not established.
            }
          }
        }
      });
      scrapeTask = task;
      const { items } = await task;
      if (token !== state.loadToken || currentVideoId() !== videoId) return;
      state.items = items;
    } catch (e) {
      if (token !== state.loadToken || currentVideoId() !== videoId) return;
      state.error = e.message;
    }
    render();
  }

  function tick() {
    ensurePanel();
    const id = currentVideoId();
    if (id !== state.videoId) onVideoChange(id);
  }

  loadSettings().then(() => {
    document.addEventListener('yt-navigate-finish', tick);
    setInterval(tick, 1000);
    tick();
  });
})();
