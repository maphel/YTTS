# Chrome Web Store permission explanations

These explanations match `extension/manifest.json`. Each section can be copied into the
corresponding Privacy practices field in the Developer Dashboard.

## storage

YTTS saves three display preferences in chrome.storage.sync: whether the transcript card starts
expanded, whether copied text includes timestamps, and the selected view (lines, sentences or
text). A single value in chrome.storage.local records consent for this installation, including
across reloads and tabs. The transcript and video ID stay in tab memory.

## Host permission (content script): https://www.youtube.com/*

The content script runs on www.youtube.com to display the transcript card on watch pages.
After the user clicks Allow transcripts, YTTS reads the current video ID to detect video
changes. It opens the site's own transcript panel when needed, reads the rendered text and
closes the panel if YTTS opened it. The script remembers permission locally for this installation.
It keeps the transcript in tab memory and sends no transcript or viewing data to the developer
or third parties.

## Remote code

No remote executable code is used. All JavaScript is included in the extension package; there
are no runtime dependencies, CDN scripts or remote script evaluation.
