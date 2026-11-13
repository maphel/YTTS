# Show HN — facts for Marcel's own post

Not yet submitted. **These are working notes, not a publishable post.**
Hacker News requires self-written texts and prohibits AI-generated or AI-edited
posts and automated posting. So do not take over either a finished title or a
comment from the other drafts here.

## Place and format

- [Submit it yourself](https://news.ycombinator.com/submit), personal account required.
- Start the title with `Show HN:` and word it yourself.
- The [public repository](https://github.com/maphel/YTTS) is a good choice of target:
  installation, source code and features are directly accessible there. The finished extension
  can already be installed from the store; do not submit a mere announcement.
- In his own comment, Marcel can link the [demo](https://ytts.christophel.io/) and the
  [store](https://chromewebstore.google.com/detail/ytts/ipkipmmdaicpfijcddghjpfjpacgdphe).

## Verifiable key facts

| Topic | Fact / talking point |
| --- | --- |
| Personal starting point | Often reading transcripts instead of watching the whole video; existing tools did not match the desired plain YouTube integration |
| Priority 1 | Look as much like a part of YouTube as possible; keep the light and dark design through future changes too |
| Priority 2 | Completely free, no ads, no account requirement |
| Features | Read and copy the existing transcript; Lines, Sentences, Text; optional timestamps when copying; jump to timestamps |
| Language | 21 interface locales, including RTL; no transcript translation |
| Technology | Chromium Manifest V3, vanilla JavaScript, no runtime dependencies; native YouTube transcript view as the source |
| Privacy | No backend service of its own, no analytics; transcripts stay in the page's memory and are copied to the clipboard on request |
| License | MIT; public repository |
| Limits | YouTube must provide a transcript; no audio transcription, AI summary or translation; YouTube changes can make adjustments necessary |

## Answer yourself

- Why was integration into the existing design more important than further features?
- What was technically surprising about the YouTube integration?
- What feedback from real transcript users would help with further development?

Do not invent reach or user numbers. Be available for technical questions after
submitting. Do not ask friends for upvotes or comments. A post first appears under
Show New; placement on Show HN or the front page is not guaranteed.

Sources: [Show HN rules](https://news.ycombinator.com/showhn.html),
[HN guidelines](https://news.ycombinator.com/newsguidelines.html).
