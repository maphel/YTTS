# Security

## What YTTS does with your data

- YTTS has no backend, analytics or telemetry. It makes no network requests of its own.
  Opening YouTube's native transcript panel can cause YouTube itself to load transcript data.
- The content script runs only on `https://www.youtube.com/*`. It reads the transcript that
  YouTube's own transcript panel renders and keeps it in the page's memory.
- The only permission is `storage`, used for three display preferences
  (`chrome.storage.sync`). Transcript text, video IDs and history are never stored.
- Copying writes to the system clipboard only when you click **Copy**; YTTS never reads
  the clipboard.
- All UI is built with DOM APIs and `textContent`; the extension never uses `innerHTML`
  or evaluates remote code.

See [PRIVACY.md](PRIVACY.md) for details.

## Reporting a vulnerability

Please report security issues privately through
[GitHub's private vulnerability reporting](https://github.com/maphel/YTTS/security/advisories/new)
rather than a public issue. Include steps to reproduce and the affected version. You will get
a response within a week.
