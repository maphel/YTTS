# YTTS privacy policy for Microsoft Edge

Effective 13 November 2026. This policy applies from YTTS version 0.1.2 on Microsoft Edge.

YTTS is a free, independent extension for reading and copying transcripts on
YouTube in Microsoft Edge. It has no backend, analytics, advertising or telemetry.
It sends no transcript or viewing data to its developer or to third parties and
does not sell data.

## What YTTS handles

Processing happens locally in Microsoft Edge, only on `https://www.youtube.com/*`
and only to show and copy the current video's transcript.

| Data | Use and storage |
| --- | --- |
| Transcript text | The card explains what YTTS reads. After you select **Allow transcripts**, YTTS reads text from YouTube's own transcript panel and displays it. After that, YTTS does the same on later watch pages. If YTTS opens the panel, it does so in the background and closes it after loading. Text stays in tab memory until you leave the video, reload or close the tab. It is never saved in extension storage. |
| Current video ID | Read from the page URL to associate the transcript with the current video and clear it on navigation. Used in tab memory; no watch history is stored. |
| YouTube's interface language and the video's length | Used to choose the interface language and compute sentence end times. Not stored. |
| Three display preferences | The default expanded state, timestamps when copying, and selected view (lines, sentences or text) are saved using `chrome.storage.sync`, the Chromium extension API available in Microsoft Edge. Edge may synchronize these preferences through your browser account if extension settings sync is enabled. |
| Permission to read transcripts | One yes/no flag is saved using `chrome.storage.local` in this Edge profile, so the installation remembers consent across tabs and reloads. It does not sync. A fresh installation asks again. |

YTTS responds to clicks and Enter or Space on its own card. It does not read other
sites, your account, comments, cookies, form inputs or existing clipboard contents.
It does not log keystrokes or clicks. No transcript, video ID or watch history is
saved to storage or synchronized.

## Clipboard

Only selecting **Copy** writes the transcript to your system clipboard. Your
operating system or other software may keep a clipboard history. Removing YTTS
does not remove previously copied text from that history.

## YouTube

After you allow transcripts, opening YouTube's native panel may cause YouTube to
load its transcript, as if you opened the panel yourself. YouTube's own terms and
privacy practices apply. YTTS is not affiliated with YouTube, Google or Microsoft.

## Removing the extension

Remove YTTS through Microsoft Edge's extensions page (`edge://extensions`) to stop
the extension from processing data. Transcripts exist only in their current tab
and system clipboard; YTTS has no server-side account or stored transcript to
delete.

## Changes and contact

Policy changes are recorded in this file's GitHub history. Questions can be raised
at <https://github.com/maphel/YTTS/issues>. For a private security report, use
[GitHub's security reporting](https://github.com/maphel/YTTS/security/advisories/new).
