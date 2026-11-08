# Lessons Learned

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
