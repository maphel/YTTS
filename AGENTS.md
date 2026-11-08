# AGENTS.md — YTTS

Chromium MV3 extension: YouTube transcript card in the watch-page sidebar + copy button.
User-facing UI text is German.

## File map

- `extension/manifest.json` — MV3 manifest (content script on youtube.com, popup, `storage`).
- `extension/content.js` — scraping, panel UI, copy, SPA navigation handling.
- `extension/content.css` — panel styles (values measured from YouTube's computed styles).
- `extension/popup.{html,css,js}` — settings popup (`chrome.storage.sync`).

## Hard rules

1. **Scope is deliberately minimal.** No summaries, AI integration, search, video
   title, line counters, or "follow playback" highlighting — user explicitly rejected them.
2. **Match YouTube's look ~1:1** in light and dark (`html[dark]`). Take sizes/colors from
   YouTube's computed styles, don't guess.
3. **No `innerHTML`** — youtube.com enforces Trusted Types. Build DOM with `createElement`.
4. **Transcript source = YouTube's native transcript panel (DOM scrape).** `timedtext`
   and `youtubei/v1/get_transcript` do not work for third parties (see LESSONS_LEARNED.md).
5. **While scraping, the native panel must stay on-screen** (opacity 0), never off-screen,
   or YouTube never loads the segments.
6. Support both segment DOM variants: `ytd-transcript-segment-renderer` and
   `transcript-segment-view-model`.
7. Settings defaults live in both `content.js` and `popup.js` — keep them in sync.

## Verification routine

Without loading the extension, via Playwright:
1. `page.addInitScript({ path: 'extension/content.js' })`, open a watch page, then
   `page.addStyleTag({ path: 'extension/content.css' })`.
2. Check: card in `#secondary-inner`, collapsed, copy button enabled within a few
   seconds, native panel back to `ENGAGEMENT_PANEL_VISIBILITY_HIDDEN`, `html.ytts-busy` removed.
   On `ytd-watch-flexy[side-rail-dismissible-panels]`, the card goes immediately
   before the visible `#primary #related` instead; verify it remains visible after
   YouTube closes its temporary side rail.
3. Click copy (stub `navigator.clipboard.writeText`) → full text captured.
4. Click a related video (SPA navigation) → new transcript, not the previous one.
5. Screenshot light, and dark (`document.documentElement.setAttribute('dark','')`).

Finally load unpacked in real Chrome and check the popup toggles.
