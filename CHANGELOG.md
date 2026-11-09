# Changelog

All notable changes to YTTS are listed here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [SemVer](https://semver.org/).

## Unreleased

<!-- Entries go under ### Added / ### Changed / ### Fixed / ### Removed; add only the subsections you need. -->

### Added
- Transcript card at the top of the watch-page sidebar, styled like YouTube in light and dark themes.
- One-click copy of the full transcript; chapters become `##` headings.
- Three views: *Zeilen* (YouTube's caption lines), *Sätze* (merged sentences with from–to times) and *Text* (paragraphs).
- Click any line or sentence to jump to that point in the video.
- Settings popup: expand by default, timestamps when copying, view.

### Fixed
- Switching to a video without a transcript no longer reopens the previous video's transcript or shows a misleading loading error.
- Sentences ending in German or French closing quotes (“ ‘ « ») are split correctly in the *Sätze* and *Text* views.
