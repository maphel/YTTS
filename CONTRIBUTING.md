# Contributing to YTTS

Small fixes, compatibility reports, accessibility improvements, and translations
of the documentation are welcome. YTTS deliberately keeps its feature set small:
a transcript card, copying, and display preferences. Discuss larger changes in
an issue before implementing them.

## Local development

Load `extension/` as an unpacked Chromium extension using the instructions in
[README.md](README.md). The extension has no build step or runtime dependencies.
After editing files, reload the extension and refresh the YouTube tab.

- `extension/content.js`: transcript scraping, card, copying, and SPA navigation.
- `extension/content.css`: YouTube-matched light and dark styles.
- `extension/popup.*`: settings popup.
- `extension/manifest.json`: extension metadata and permissions.

Use DOM creation methods rather than `innerHTML`; YouTube enforces Trusted Types.
Keep the settings defaults in `content.js` and `popup.js` synchronized. The
native transcript panel must stay within the viewport while it is being scraped,
even though it is transparent. Support both native segment variants. Read
[AGENTS.md](AGENTS.md) and [LESSONS_LEARNED.md](LESSONS_LEARNED.md) for context.

## Verification

For automated checks, use Node.js 24 or newer and an installed Google Chrome.
Install the optional development tools and run:

```sh
npm ci
npm run lint
npm run check
npm test
```

Local tests use Google Chrome; CI installs and uses Playwright's bundled
Chromium. Installing development tools is not required to load the extension
itself.

Test in a real browser before opening a pull request:

1. Open a video with a transcript. The card starts collapsed and copying becomes
   available after the transcript loads. YouTube's native panel should close
   again, with no visible flash or lingering hidden overlay. On the classic
   layout, the card belongs at the top of `#secondary-inner`. On the newer
   `ytd-watch-flexy[side-rail-dismissible-panels]` layout, it belongs immediately
   before `#primary #related`, below the video. Confirm it remains visible after
   the native panel closes.
2. Check all three views: **Zeilen**, **Sätze**, and **Text**. Copy and inspect the
   full text, chapter headings, and optional timestamps. Line view uses original
   segment timestamps; the other views use heuristic sentence ranges. Without
   timestamps, copying produces paragraphs in every view. Check the clipboard
   fallback if you change that code.
3. Expand and collapse using mouse and keyboard. Activate a transcript segment
   and confirm playback seeks to its timestamp.
4. Click a related video without reloading the page. Verify the new transcript
   replaces the previous one. Also check a video without a transcript.
5. Check light and dark themes and all popup settings. Reload the popup to
   confirm settings persist.

For browser automation, follow the Playwright injection routine in
[AGENTS.md](AGENTS.md); test the unpacked extension separately to cover extension
storage and popup behavior. Include a short description of the checks you ran
and screenshots for visual changes.

## Reporting problems

Use the bug report template. Include browser and extension versions, steps to
reproduce, expected behavior, and a public video URL when relevant. Do not attach
private transcripts, browser profiles, credentials, or unrelated console logs.

Contributions are made under the project's [MIT license](LICENSE).
