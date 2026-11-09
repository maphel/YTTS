# Lessons Learned

## 2026-11-09 — Card invisible in narrow windows (#23)

**Symptom:** Below about 1000 px viewport width the card disappeared; found while rendering the
640 × 400 store screenshot.
**Root cause:** YouTube's single-column layout sets `#secondary` to `display: none` and moves
`#related` into `#primary #below`; the card stayed in the hidden `#secondary-inner`. Only the wide
classic and side-rail layouts had been checked.
**Fix:** When `#secondary` is not rendered, the card goes before the visible `#primary #related`
(like the side-rail layout) and back to the sidebar when the window widens; fixture test with
`setColumns(1|2)`.
**Prevention:** Check every placement change at a narrow width too (CONTRIBUTING.md manual pass).

## 2026-11-09 — Automated Chromium: `get_transcript` videos refused, `get_panel` videos work

**Symptom:** The screenshot script's long talk never loaded; YouTube's own panel stayed empty too.
**Root cause:** Per video, YouTube loads the transcript via `/youtubei/v1/get_panel` (view-model
panel) or the legacy `/youtubei/v1/get_transcript`. In automated Chromium many `get_transcript`
videos got HTTP 400 while `get_panel` videos loaded (4 of 4 vs. 2 of 2 measured).
**Fix:** The screenshot script uses a `get_panel` video (`rfscVS0vtbw`). The live canary keeps its
`get_transcript` chapters video (`zjkBMFhNj_g`): the measured `get_panel` videos had no chapter
headers, and a refused request already counts as inconclusive there.
**Prevention:** When a live run fails, check which endpoint the video uses before suspecting YTTS.
In a normal Chrome both kinds load (maintainer check, 2026-11-09): the refusal is specific to
automated browsers, not a problem for users.

## 2026-11-08 — YouTube sometimes does not load its own transcript panel

**Symptom:** Live canary: card stuck on "Loading", then "could not be loaded"; YouTube's native panel
also showed only a spinner, with and without the extension, in bundled Chromium and in Chrome.
**Root cause:** YouTube-side: after many automated runs from one IP (and in automated browsers) the
transcript request is throttled or refused. Not an extension bug.
**Fix:** When YTTS fails, the live canary checks independently of YTTS's selectors whether YouTube
delivered: button by accessible name (it is hidden in the collapsed description), data by network.
The view-model panel loads via `/youtubei/v1/get_panel`, the legacy one via `get_transcript` (400 when
refused). Skip only if neither returned transcript data; a mutation test (renamed segment selector)
confirmed the canary then fails instead of skipping.
**Prevention:** Never treat a live failure as a regression without that independent control, and
never build the control on the selectors under test.

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
