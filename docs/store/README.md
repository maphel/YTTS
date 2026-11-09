# Chrome Web Store submission

This folder prepares the first manual submission of YTTS ([#21](https://github.com/maphel/YTTS/issues/21)),
checked against the Chrome Web Store program policies, User Data FAQ, Privacy practices docs,
image guidelines and review-process docs on 9 November 2026 ([#29](https://github.com/maphel/YTTS/issues/29)).
It does not publish an item or automate uploads. Keep the listing, the privacy policy and the
dashboard declarations aligned with the code: contradictions between them are a removal reason
("If the information listed in your privacy fields contradicts…", Listing requirements 3).

## Dashboard, tab by tab

### Package
Upload `ytts-<version>.zip` from the [GitHub release](https://github.com/maphel/YTTS/releases)
(built by `release.yml`; contains only the git-tracked files of `extension/`). Never upload the
repository or the screenshots.

### Store listing
| Field | Value |
| --- | --- |
| Description | [long-description.txt](long-description.txt) (plain text) |
| Category | Tools (alternatives in the current list: Accessibility, Education) |
| Language | English. The summary comes from the manifest (`__MSG_extDescription__`, 21 locales); localized descriptions per locale are optional and can be added later |
| Store icon | `extension/icons/icon128.png` (see [Open items](#open-items)) |
| Screenshots | `screenshots/ytts-wide-light.png`, `screenshots/ytts-wide-dark.png`, `screenshots/ytts-compact-light.png` (1280 × 800 / 640 × 400, full bleed, square corners). At least one is required, up to five allowed |
| Promo tiles | Optional (440 × 280 small, 1400 × 560 marquee). Without a small tile the item ranks after items that have one; not needed for review |
| Official URL / Homepage | Homepage URL: https://github.com/maphel/YTTS (Official URL only lists Search-Console-verified sites; leave empty) |
| Support URL | https://github.com/maphel/YTTS/issues |
| Mature content | Off |

The summary shown in the store is the manifest description: "Read YouTube transcripts next to
the video and copy them with one click." (72 characters, limit 132). The screenshots are
generated with `npm run screenshot -- --store`: the real extension on a public video, with the
video frame, thumbnails, avatars and channel watermark blurred so the store assets show no
third-party content beyond YouTube's page chrome.

### Privacy (Privacy practices tab)
| Field | Value |
| --- | --- |
| Single purpose | [single-purpose.txt](single-purpose.txt) |
| Permission justification: `storage` | First section of [permissions.md](permissions.md) |
| Host permission justification (content script on `https://www.youtube.com/*`) | Second section of [permissions.md](permissions.md) |
| Remote code | "No, I am not using remote code" |
| Data usage: collected categories | **Website content** only (see below) |
| Data usage: certifications | Tick all three after reading them; they match [PRIVACY.md](../../PRIVACY.md) (no sale/transfer to third parties, no use unrelated to the single purpose, no creditworthiness/lending use) |
| Privacy policy URL | https://github.com/maphel/YTTS/blob/main/PRIVACY.md (open it signed out first) |

Why these categories: "handle" includes local processing ("Extensions are required to disclose
how they handle user data, even when data is processed or stored locally", User Data FAQ 3), and
"Clipping or scraping content from a website that the user visits" is listed as handling (FAQ 2).
YTTS reads the transcript text of the page → **Website content**. It reads only the current
video's ID from the URL to notice video changes, keeps no list of pages, titles or visit times
and stores nothing → not **Web history**. It observes no clicks, scrolling or keystrokes outside
its own card → not **User activity**. Nothing else (personally identifiable, health, financial,
authentication, personal communications, location) is accessed. The dashboard's own definitions
are only visible signed in: compare them before ticking, and if a definition reads broader than
described here, tick it and keep PRIVACY.md consistent. Over-disclosure is harmless, under-
disclosure is a rejection reason (Purple Lithium / Purple Nickel).

The Limited Use affirmative statement required on the homepage or one click away is in
PRIVACY.md, linked from README.md.

### Test instructions
[test-instructions.txt](test-instructions.txt) (417 characters, field limit 500). It names a
short video whose transcript loads reliably.

### Distribution
Free, all regions. Visibility: Public (Unlisted goes through the same review). Leave "publish
automatically after review" on, or defer it to check the approved item first (a staged item must
be published within 30 days).

## Review-risk check

| Risk (policy / violation ID) | Status |
| --- | --- |
| Impersonation, trademark (Impersonation 1 and 5; Red Nickel/Red Silicon) | Listing and PRIVACY.md say "not affiliated with YouTube or Google". Name "YTTS" is descriptive. **Icon: open item.** |
| Misleading or unexpected behaviour (Misleading 3; Red Nickel "actions not mentioned in the metadata") | The description's "How it works" discloses that YouTube's transcript panel is opened in the background and closed again |
| Unauthorized download of copyrighted content (Prohibited products) | No media download; only the transcript YouTube itself shows, copied on a user click. Avoid "download", "save video" or "scrape" in any listing text |
| Keyword spam (Listing 4; Yellow Argon) | No keyword lists; languages mentioned once as a count |
| Missing or insufficient metadata (Yellow Zinc) | Description, icon, screenshots, category present |
| Functionality not working (Yellow Magnesium) | Test instructions point to a video that works; see open items for older-panel videos |
| Excessive permissions (Purple Potassium) | `storage` + one site; no `tabs`, `scripting`, `host_permissions` or broad patterns |
| User data disclosure (Purple Lithium, Purple Nickel) | Privacy policy with Limited Use statement; Website content declared |
| Remote code, obfuscation (Blue Argon, Red Titanium) | None; plain, unminified source |
| Slow review | Single-site content script and no sensitive permissions keep it out of the broad-host-permission path; new developers and new items get closer review regardless ("a few days, up to a few weeks") |

## Open items

- **Store icon.** The art is 112 × 112 with 8 px padding; the guideline is 96 × 96 art with 16 px
  transparent padding. Its red rounded square with a white play triangle resembles YouTube's
  logo (#3), the most likely impersonation/trademark finding. Maintainer decision.
- **Older transcript panel.** In automated Chromium, videos whose transcript YouTube loads via
  `get_transcript` were refused (HTTP 400, YouTube's own panel too). Confirm in a normal browser
  that YTTS loads such a video (e.g. `arj7oStGLkU`) before submitting.

## Manual checklist

- [ ] Developer Dashboard: publisher registration, developer agreement, trader/non-trader
  declaration, verified contact email.
- [ ] Package tab: upload the release ZIP; check name and version 0.1.0.
- [ ] Store listing tab as above; upload icon and screenshots.
- [ ] Privacy tab as above; open the privacy URL signed out.
- [ ] Test instructions and distribution as above.
- [ ] Resolve all dashboard validation messages, then "Submit for review".
- [ ] Record item ID, store URL and the outcome in #21; add the store link to README.md.

Do not add upload credentials to the repository.

## Policy references

- [Program policies](https://developer.chrome.com/docs/webstore/program-policies/policies)
  (single page: impersonation, listing requirements, Limited Use, permissions, MV3).
- [User data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq).
- [Privacy practices tab](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy).
- [Images](https://developer.chrome.com/docs/webstore/images) ·
  [Store listing tab](https://developer.chrome.com/docs/webstore/cws-dashboard-listing) ·
  [Review process](https://developer.chrome.com/docs/webstore/review-process) ·
  [Violation reference IDs](https://developer.chrome.com/docs/webstore/troubleshooting).
- [Trader disclosure](https://developer.chrome.com/docs/webstore/program-policies/trader-disclosure).
