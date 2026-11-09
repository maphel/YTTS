// YTTS — pure transcript helpers shared by content.js, popup.js and the unit tests.
//
// Rules: no DOM, no chrome.* APIs, no module syntax. This file is a classic script listed
// before content.js (same isolated world) and before popup.js; it publishes globalThis.YTTS.
// Unit tests load it with node:vm (tests/unit/lib.test.mjs).
(function (root) {
  'use strict';

  // view: 'lines' (YouTube's raw segments) | 'sentences' (merged, from–to) | 'text' (paragraphs, no times)
  const DEFAULTS = Object.freeze({ expandedByDefault: false, copyTimestamps: false, view: 'sentences' });
  const VIEWS = Object.freeze(['lines', 'sentences', 'text']);

  // Sentence merging: auto-captions often have no punctuation at all, so a
  // "sentence" is also closed after this much time / text.
  const MAX_SENTENCE_SEC = 30;
  const MAX_SENTENCE_CHARS = 300;
  const SENTENCES_PER_PARAGRAPH = 4;
  // Closing quotes/brackets that may follow the punctuation: ASCII, English “” ‘’, German „…“ ‚…‘
  // (closing “ ‘), French/Swiss « » in both directions.
  const SENTENCE_END = /[.!?…]["'“”‘’«»)\]]*$/;
  const SENTENCE_SPLIT = /(?<=[.!?…]["'“”‘’«»)\]]*)\s+/;

  function validSetting(key, value) {
    if (key === 'view') return VIEWS.includes(value);
    return Object.hasOwn(DEFAULTS, key) && typeof value === 'boolean';
  }

  // Returns a complete settings object; invalid or missing values fall back to DEFAULTS.
  function normalizeSettings(saved) {
    const out = { ...DEFAULTS };
    for (const key of Object.keys(DEFAULTS)) {
      if (validSetting(key, saved?.[key])) out[key] = saved[key];
    }
    return out;
  }

  // "1:02:03" → 3723. Returns NaN for anything that is not a timestamp.
  function toSeconds(ts) {
    if (!/^\d+(:\d{1,2}){0,2}$/.test(String(ts).trim())) return NaN;
    return String(ts).trim().split(':').reduce((acc, n) => acc * 60 + Number(n), 0);
  }

  function fmtTime(sec) {
    sec = Math.max(0, Math.floor(Number(sec) || 0));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = String(sec % 60).padStart(2, '0');
    return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
  }

  // Merge YouTube's caption fragments into sentences.
  // items: [{type:'seg', ts, sec, text} | {type:'chapter', title}]
  // duration: media duration in seconds (end of the last sentence), optional.
  // Returns [{type:'sent', sec, end, text} | chapter].
  function toSentences(items, duration) {
    const segStarts = items.filter((i) => i.type === 'seg').map((i) => i.sec);
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
      const pieces = it.text.split(SENTENCE_SPLIT).filter(Boolean);
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

  // Clipboard text. Without timestamps: paragraphs in every view. With timestamps:
  // per caption line in the "lines" view, per sentence range otherwise.
  function formatTranscript(items, { copyTimestamps = false, view = DEFAULTS.view, duration } = {}) {
    const sentences = toSentences(items, duration);
    const out = [];
    let lines = [];
    const flush = () => {
      if (lines.length) out.push(lines.join('\n'));
      lines = [];
    };

    if (!copyTimestamps) {
      for (const it of toParagraphs(sentences)) {
        if (it.type === 'chapter') out.push(`## ${it.title}`);
        else out.push(it.sentences.map((s) => s.text).join(' '));
      }
    } else {
      const source = view === 'lines' ? items : sentences;
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

  root.YTTS = Object.freeze({
    DEFAULTS,
    VIEWS,
    validSetting,
    normalizeSettings,
    toSeconds,
    fmtTime,
    toSentences,
    toParagraphs,
    formatTranscript,
  });
})(globalThis);
