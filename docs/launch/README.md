# YTTS launch kit

As of 13 November 2026. **For publication status, see the table.**
The texts are in English so that they fit the international platforms.
Before submitting, read them briefly yourself and adjust them if needed.

## Order and status

| Platform | Material | Status | Public entry |
| --- | --- | --- | --- |
| Show HN | [Key facts for your own text](show-hn-notes.md) | Facts prepared; post to be written by Marcel | — |
| AlternativeTo | [Product entry and matching alternatives](alternativeto.md) | Submitted on 12 November with two matching alternatives to the free review queue; not yet public | — |
| Reddit r/SideProject | [Post with demo](https://www.reddit.com/r/SideProject/comments/1xut1in/i_wanted_a_youtube_transcript_tool_that_actually/) | Submitted on 13 November with the approved text and English demo; removed by Reddit filters; manual approval requested from the moderators | Not yet regularly visible |
| Microsoft Edge Add-ons | [Package, 21 descriptions, images and privacy](../store/edge/README.md) | Prepared locally; developer account setup and a real Edge test still open. No dashboard draft saved, not submitted | — |

Each status was checked in the browser UI after publication or submission, respectively.
AlternativeTo showed **Your submission is waiting to be reviewed** on submission and pointed out
that currently only the submitter can see the app. Check the status under
[My submissions](https://alternativeto.net/my-submissions/); share the app link only after
approval. A timely review is not guaranteed. No paid review was booked.

## Shared details

| Field | Value |
| --- | --- |
| Name | YTTS |
| Developer | Marcel Christophel |
| Website and demo | https://ytts.christophel.io/ |
| Chrome Web Store | https://chromewebstore.google.com/detail/ytts/ipkipmmdaicpfijcddghjpfjpacgdphe |
| Source code | https://github.com/maphel/YTTS |
| Support | https://github.com/maphel/YTTS/issues |
| Privacy of the extension | https://github.com/maphel/YTTS/blob/main/PRIVACY.md |
| Price | Free; no ads, no subscription, no required account |
| License | MIT; open source |
| Platform | Desktop: Chrome and compatible Chromium browsers |

The positioning stays the same: a transcript card that blends into YouTube's design,
in light and dark, completely free. Do not promise summaries or AI features.
The **21 locales concern the interface**, not the translation of transcripts.
A video needs a transcript that is already available on YouTube. YTTS is independent of Google.

## Upload files

| File | Use |
| --- | --- |
| [icon-512.png](assets/icon-512.png) | Larger icon for directories, 512 × 512 |
| [01-native-themes.png](assets/01-native-themes.png) | Main image: real card in light and dark, 1270 × 760 |
| [02-watch-page.png](assets/02-watch-page.png) | Real card on the YouTube page, 1270 × 760 |
| [03-preferences.png](assets/03-preferences.png) | Real settings in light and dark, 1270 × 760 |
| [Existing desktop demo](../../website/assets/demo.mp4) | 1920 × 1080, about 19 seconds, English |
| [Existing mobile demo](../../website/assets/demo-portrait.mp4) | 1080 × 1350, English |

The PNGs are rendered from the existing SVG icon and the existing real screenshots.
Other video content in the overview shot has already been made unrecognizable. The images
show the English interface. Videos are not re-translated in this step or uploaded to
another service. For an optional video field, first check which
video hosts the platform in question accepts; the website already offers the demo directly.

For directories with little space, the icon and main image are enough.

## Before submitting

1. Open the website and store link, play the demo.
2. Sign in with your own personal account. Read the text once and confirm it.
3. Use the prepared texts and images. Select **Free**, not Freemium.
4. Write the Show HN post yourself and submit it yourself; human-written texts and no
   automated publishing are the rule there.
5. Afterwards, enter the public link here and respond to questions.

No paid placements or faster reviews are planned. These entries
are mainly ways to gain users and feedback. A published link
does not guarantee a ranking gain.
Do not create 21 separate entries for the language versions: use the English main page.

## Regenerating media

With the existing development dependencies (Playwright's Chromium):

```sh
node scripts/launch-assets.mjs
```

The source files stay under `extension/icons/`, `website/assets/` and `docs/screenshots/`.
The generator only creates the PNGs in this kit. The website and the extension are
not changed in the process.

## Platform rules checked

- [Show HN](https://news.ycombinator.com/showhn.html) and
  [HN guidelines](https://news.ycombinator.com/newsguidelines.html).
- [AlternativeTo: submitting and queue](https://alternativeto.net/faq/),
  [terms](https://alternativeto.net/about/terms/).

Fields and rules can change; the respective forms are authoritative at the time of submission.
