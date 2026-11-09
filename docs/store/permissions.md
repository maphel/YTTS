# Chrome Web Store permission explanations

These explanations match `extension/manifest.json`. Each section can be copied into the
corresponding Privacy practices field in the Developer Dashboard.

## storage

YTTS saves three display preferences in chrome.storage.sync: whether the transcript card starts
expanded, whether copied text includes timestamps, and the selected view (lines, sentences or
text). No transcript text, video IDs or browsing data are stored.

## Host permission (content script): https://www.youtube.com/*

The content script runs only on youtube.com, the single site the extension is for. On a watch
page it reads the current video ID from the URL to detect navigation, opens the site's own
transcript panel in the background, reads the rendered transcript, closes the panel again (unless
the user had already opened it for this video) and shows the text in a card on the page. It does
not run on any other site and sends nothing to the developer or third parties.

## Remote code

No remote executable code is used. All JavaScript is included in the extension package; there
are no runtime dependencies, CDN scripts or remote script evaluation.
