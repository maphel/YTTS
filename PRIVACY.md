# Privacy policy

Effective: 9 November 2026 · Applies to the YTTS browser extension, version 0.1.0 and later.

YTTS has no backend, analytics, advertising, or telemetry. It does not send any data to its
developer or to third parties, and it does not sell or transfer data.

## What YTTS handles, and why

All processing happens locally in your browser, only on `https://www.youtube.com/*`, and only to
show the transcript card and copy the transcript.

| Data | What YTTS does with it | Stored? |
| --- | --- | --- |
| Transcript text of the video you are watching (website content) | On a watch page, YTTS opens YouTube's own transcript panel in the background, reads the transcript it renders, closes the panel again if YTTS opened it, and shows the text in the card. | Kept in the page's memory while the tab is open; never written to storage. |
| The current video's ID, read from the page URL | Used only to detect that you switched videos, so the card shows the right transcript. | Kept in memory for the current tab; not stored, not collected as a history. |
| Three display preferences | `expandedByDefault` (card starts expanded), `copyTimestamps` (copied text includes timestamps), `view` (`lines`, `sentences`, or `text`). | Saved with `chrome.storage.sync`. |

YTTS does not read other pages, your account, comments, cookies, form input, keystrokes, or your
existing clipboard contents.

## Clipboard

Only when you click **Copy** does YTTS write the transcript to your system clipboard. Your
operating system or other software may keep a clipboard history; YTTS has no control over that.

## Storage and sync

The three preferences use `chrome.storage.sync`. If you have turned on sync for extension
settings in your browser, the browser may synchronize them through your browser account. YTTS
stores no transcript text, video IDs, or watch history.

## YouTube

Opening YouTube's transcript panel makes YouTube load the transcript, as it would if you opened
the panel yourself. Your use of YouTube remains subject to YouTube's own terms and privacy
practices. YTTS is an independent project and is not affiliated with YouTube or Google.

## Chrome Web Store User Data Policy

The use of information received by YTTS adheres to the
[Chrome Web Store User Data Policy](https://developer.chrome.com/docs/webstore/program-policies/policies),
including the Limited Use requirements. In particular, YTTS uses data only to provide its single
purpose (showing and copying the transcript of the current YouTube video); does not transfer data
to third parties; does not use or transfer data for personalized advertising, for determining
creditworthiness, or for lending; and does not allow humans to read the data.

## Removing YTTS

Remove the extension on your browser's extensions page; all processing stops. Text you copied
earlier stays in your clipboard or clipboard history until it is replaced there.

## Changes and contact

Changes to this policy are recorded in this file's history and in [CHANGELOG.md](CHANGELOG.md).
Questions: open an issue at https://github.com/maphel/YTTS/issues, or for security matters see
[SECURITY.md](SECURITY.md).
