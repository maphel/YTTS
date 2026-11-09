# Contributing to YTTS

Small fixes, compatibility reports, accessibility improvements, and translations
of the documentation are welcome. YTTS deliberately keeps its feature set small:
a transcript card, copying, and display preferences. Discuss larger changes in
an issue before implementing them.

## Local development

Load `extension/` as an unpacked Chromium extension using the instructions in
[README.md](README.md). The extension has no build step or runtime dependencies.
After editing files, reload the extension and refresh the YouTube tab.

- `extension/lib.js`: pure helpers and settings defaults (no DOM, unit-tested).
- `extension/i18n.js`: all UI strings; `extension/_locales/` is generated from it.
- `extension/content.js`: transcript scraping, card, copying, and SPA navigation.
- `extension/content.css`: YouTube-matched light and dark styles.
- `extension/popup.*`: settings popup.
- `extension/manifest.json`: extension metadata and permissions.

The full file map is in [AGENTS.md](AGENTS.md). Use DOM creation methods rather
than `innerHTML`; YouTube enforces Trusted Types. Settings defaults live only in
`extension/lib.js`. The native transcript panel must stay within the viewport while
it is being scraped, even though it is transparent. Support both native segment
variants. Read [AGENTS.md](AGENTS.md) and [LESSONS_LEARNED.md](LESSONS_LEARNED.md)
for context.

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
   before `#primary #related`, below the video; the same applies to a narrow
   window (under about 1000 px), where YouTube shows a single column. Confirm it
   remains visible after the native panel closes and when resizing the window.
2. Check all three views: **Lines**, **Sentences**, and **Text**. Copy and inspect the
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

`npm test` covers most of these against a YouTube-like fixture, but not the visual
light/dark check or settings persisting across a real popup reload, so the manual
pass above is still expected. `npm run test:live` loads
the real unpacked extension against youtube.com (it skips, rather than fails, when
YouTube itself does not deliver a transcript). Include a short description of the
checks you ran and screenshots for visual changes (light and dark).

## Translations

All UI strings live in `extension/i18n.js` (one row per language, values in `KEYS` order).
To add or fix a language, edit that file, run `npm run locales` to regenerate
`extension/_locales/` (manifest description and button title), then `npm test`. The unit
tests require every language to translate every key and keep the `{time}` and `{text}`
placeholders; `npm run check` fails when `_locales` is out of date. Use the terms
YouTube itself uses in that language for "transcript" where possible.

## Branches, commits and pull requests

`main` is always releasable and changes land only through pull requests that pass
the CI `check` workflow; PRs are squash-merged. Branch from `main` as
`<type>/<topic>` (types: `feat`, `fix`, `docs`, `test`, `chore`, `refactor`, `ci`,
`release`). Open an issue first for anything beyond a bug fix or a docs change.

Commits and PR titles follow [Conventional Commits](https://www.conventionalcommits.org/)
(`type(scope)?: summary`, imperative). The squash commit takes the PR title, so the
PR description carries the why.

### Definition of done

- Bugs: a regression test first (it fails), then the fix. Features: a test on the right level.
- `npm run lint`, `npm run check` and `npm test` are green; CI runs the same.
- Docs follow the change: `README.md` for user-visible behavior, `AGENTS.md` for structure.
- A line under `## Unreleased` in `CHANGELOG.md` for anything a user would notice.
- No self-merge: every PR is reviewed by someone or something other than its author.

The pull request template repeats this list as a checklist.

## Versioning and releases

SemVer, currently 0.x: a minor version for new user-visible features, a patch version
for fixes. `extension/manifest.json`, `package.json` and `package-lock.json` always carry
the same version; `npm run check` refuses a mismatch between all three and `npm run pack`
between the manifest and `package.json`.

Release after merged `feat` or `fix` PRs once CI on `main` is green:

```sh
npm run release 0.2.0     # on a clean, up-to-date main: bumps versions, dates the
                          # changelog section, commits on release/v0.2.0
git push -u origin release/v0.2.0 && gh pr create --title "release: v0.2.0" --body "Release 0.2.0; see CHANGELOG.md."
# after the PR is squash-merged, before any other PR lands:
git switch main && git pull
npm run release tag       # creates the annotated tag v0.2.0
git push origin v0.2.0    # triggers .github/workflows/release.yml
```

The first release ships the version already in the files (`npm run release 0.1.0`); this is
allowed only while no `v0.1.0` tag exists. Tags must point at `main`.

The release workflow checks the tag against the version, runs all checks, builds
`dist/ytts-<version>.zip` (`npm run pack`, the git-tracked files of `extension/` only) and publishes
a GitHub release with the matching `CHANGELOG.md` section as notes.

## Reporting problems

Use the bug report template. Include browser and extension versions, steps to
reproduce, expected behavior, and a public video URL when relevant. Do not attach
private transcripts, browser profiles, credentials, or unrelated console logs.

Contributions are made under the project's [MIT license](LICENSE).
