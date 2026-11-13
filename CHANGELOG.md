# Changelog

All notable changes to YTTS are listed here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [SemVer](https://semver.org/).

## Unreleased

<!-- Entries go under ### Added / ### Changed / ### Fixed / ### Removed; add only the subsections you need. -->

### Added
- Chrome Web Store installation link in the README, with manual installation kept as an alternative.
- A lightweight website at ytts.christophel.io with the product demo, light/dark previews and all 21 supported interface languages.

### Changed
- The expanded card is as tall as YouTube's own side panels instead of always 511 px: about level with the player on wide screens, 460 px (smaller than before) in narrow windows and theater mode. Short transcripts still shrink it.
- On devices whose main input is touch, a tapped line no longer stays highlighted.

### Fixed
- Chapter headings now appear, in the card and in copied text, on videos where YouTube shows its newer transcript panel.

## 0.1.2 — 2026-11-09

### Changed
- The transcript card explains what it reads and waits for **Allow transcripts** before loading transcripts. YTTS remembers that choice locally for this installation.

## 0.1.1 — 2026-11-09

### Changed
- Blue icon instead of red, with the Chrome Web Store icon geometry (96 × 96 artwork, 16 px padding).
- Privacy policy: lists each kind of data handled, adds the Chrome Web Store Limited Use statement, an effective date and contact.

## 0.1.0 — 2026-11-09

### Added
- Transcript card at the top of the watch-page sidebar, styled like YouTube in light and dark themes.
- One-click copy of the full transcript; chapters become `##` headings.
- Three views: *Lines* (YouTube's caption lines), *Sentences* (merged sentences with from–to times) and *Text* (paragraphs).
- Click any line or sentence to jump to that point in the video.
- Settings popup: expand by default, timestamps when copying, view.
- Interface in 20 languages: the card follows YouTube's language, the popup the browser's; English fallback and right-to-left support for Arabic.

### Fixed
- Switching to a video without a transcript no longer reopens the previous video's transcript or shows a misleading loading error.
- Sentences ending in German or French closing quotes (“ ‘ « ») are split correctly in the *Sentences* and *Text* views.
- In narrow windows (YouTube's single-column layout) the card moves above the recommendations below the video instead of disappearing.
