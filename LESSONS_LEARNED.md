# Lessons Learned

## 2026-11-08 — YouTube sometimes does not load its own transcript panel

**Symptom:** Live canary: card stuck on "Loading", then "could not be loaded"; YouTube's native panel
also showed only a spinner, with and without the extension, in bundled Chromium and in Chrome.
**Root cause:** YouTube-side: after many automated runs from one IP (and in automated browsers) the
transcript request is throttled or refused. Not an extension bug.
**Fix:** The live canary opens the native panel by hand when YTTS fails and skips as inconclusive
when YouTube delivers no segments there either; it only fails when YouTube works and YTTS does not.
**Prevention:** Never treat a live failure as a regression without that native-panel control.

## 2026-11-08 — Stale transcript button after SPA navigation (#11)

**Symptom:** Navigating to a video without a transcript could reopen the previous video's transcript.
**Root cause:** Measured on youtube.com: the URL changes first; `ytd-watch-flexy[video-id]` and the
description (with its transcript button) follow ~0.8 s later, longer than the old 600 ms grace.
**Fix:** Wait (best effort, 3 s) for `video-id` to match the URL before using the button.
**Prevention:** Regression e2e test with a delayed `video-id` fixture; it fails without the fix.

## 2026-11-08 — Off-screen native panel never loads transcript segments

**Symptom:** "Transkript konnte nicht geladen werden." — native panel opened, 0 segments after 10 s.
**Root cause:** Panel was hidden via `position:fixed; left:-10000px`. YouTube lazy-loads the
segment list when it becomes visible (IntersectionObserver), so off-screen = never loads.
**Fix:** Hide with `opacity:0; pointer-events:none; z-index:-1` at `left:0; top:0` → 1162 segments in ~0.6 s.
**Prevention:** AGENTS.md hard rule 5.

## 2026-11-08 — Direct transcript APIs blocked for third parties

**Symptom:** `captionTracks[].baseUrl` (`/api/timedtext`, `fmt=json3`) → 200 with empty body;
`POST /youtubei/v1/get_transcript` → 400 "Precondition check failed" (even with page params + client headers).
**Root cause:** YouTube requires a PoToken (timedtext) / internal attestation (get_transcript).
**Fix:** Scrape YouTube's own transcript panel from the DOM instead.
**Prevention:** AGENTS.md hard rule 4. Re-test these APIs before trying to "simplify" back to them.

## 2026-11-08 — Trusted Types on youtube.com

**Symptom:** Injecting a script via `<script>` text failed: "This document requires 'TrustedScript' assignment".
**Root cause:** youtube.com enforces Trusted Types.
**Fix:** Build all UI with DOM APIs; inject test scripts with `page.addInitScript`.
**Prevention:** AGENTS.md hard rule 3.
