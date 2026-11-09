# Privacy

YTTS has no backend, analytics, advertising, or telemetry. The extension does not
send transcripts or browsing history to its author or an external service.

## Transcript data

The content script runs on `https://www.youtube.com/*`. On a watch page, it reads
the current video's ID from the URL and reads the transcript rendered by
YouTube's native transcript panel. Transcript text is kept in the page's memory
to display the card and handle copying. It is not written to extension storage.

Clicking **Copy** writes the transcript to your system clipboard. YTTS does
not read the existing clipboard contents. Your operating system or other
software may manage clipboard history separately.

Opening YouTube's native panel can cause YouTube itself to load transcript data.
Your normal use of YouTube remains subject to YouTube's own privacy practices.

## Settings

The `storage` permission is used to save three preferences:

- `expandedByDefault`: whether the transcript card starts expanded.
- `copyTimestamps`: whether copied text includes timestamps.
- `view`: the selected display mode (`lines`, `sentences`, or `text`).

These values use `chrome.storage.sync`. If extension-settings synchronization is
enabled in your browser, the browser may synchronize them through your browser
account. YTTS does not store transcript text, video IDs, or watch history there.

## Removing YTTS

You can remove the extension from your browser's extensions page. Removing it
does not clear text you previously copied to the system clipboard or any
clipboard history managed by other software.
