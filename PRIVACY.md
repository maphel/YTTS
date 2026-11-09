# Privacy policy

Effective 9 November 2026. This policy applies from YTTS version 0.1.2.
[Earlier policy](https://github.com/maphel/YTTS/blob/v0.1.1/PRIVACY.md)

YTTS has no backend, analytics, advertising, or telemetry. The extension sends no transcript
or viewing data to its developer or to third parties and does not sell data.

## What YTTS handles, and why

All processing happens locally in your browser, only on `https://www.youtube.com/*`, and only to
show the transcript card and copy the transcript.

| Data | What YTTS does with it | Stored? |
| --- | --- | --- |
| Transcript text of the video you are watching (website content) | The card explains what YTTS reads. After you click **Allow transcripts**, YTTS reads the current video's transcript from YouTube's own panel and shows it in the card. It does the same on later watch pages. If YTTS opens the native panel, it does so in the background and closes it after loading. | The displayed transcript stays in tab memory until you leave the video, reload the page or close the tab. YTTS never writes it to storage. |
| The current video's ID, read from the page URL | Used to associate the requested transcript with the right video and clear the card when you navigate away. | Used in tab memory. YTTS does not save a watch history. |
| YouTube's interface language (`<html lang>`) and the video's length | Used to choose the card's language and to compute sentence end times. | Not stored. |
| Three display preferences | `expandedByDefault` (card starts expanded), `copyTimestamps` (copied text includes timestamps), `view` (`lines`, `sentences`, or `text`). | Saved with `chrome.storage.sync`. |
| Your choice to allow transcripts | Lets YTTS load transcripts after you reload or open another video tab. | Saved as a yes/no value with `chrome.storage.local` in this browser profile. |

YTTS reacts to clicks and Enter or Space on its own card. It does not read other pages, your
account, comments, cookies, form input, or your existing clipboard contents. It does not log
keystrokes or clicks.

## Clipboard

Only when you click **Copy** does YTTS write the transcript to your system clipboard. Your
operating system or other software may keep a clipboard history.

## Storage and sync

The three display preferences use `chrome.storage.sync`. If you have turned on sync for
extension settings in your browser, the browser may synchronize them through your browser
account. Your permission to read transcripts uses local storage for this installation and
does not sync. A fresh installation asks again. YTTS stores no transcript text, video IDs,
or watch history.

## YouTube

After you allow transcripts, opening the native panel can cause YouTube to load the transcript,
as it would if you opened the panel yourself. YouTube's own terms and privacy practices apply.
YTTS is an independent project and is not affiliated with YouTube or Google.

## Chrome Web Store User Data Policy

The use of information received by YTTS adheres to the
[Chrome Web Store User Data Policy](https://developer.chrome.com/docs/webstore/program-policies/policies#limited-use),
including the Limited Use requirements. In particular, YTTS uses data only to provide its single
purpose of showing and copying the transcript of the current video. YTTS does not transfer
transcript or viewing data to third parties, use it for personalized advertising or lending
decisions, or grant the developer access to it.

## Removing YTTS

Remove the extension on your browser's extensions page to stop processing. Text you copied
earlier stays in your clipboard or clipboard history until it is replaced there.

## Changes and contact

Changes to this policy are recorded in this file's history and in [CHANGELOG.md](CHANGELOG.md).
Questions: open an issue at https://github.com/maphel/YTTS/issues, or for security matters see
[SECURITY.md](SECURITY.md).
