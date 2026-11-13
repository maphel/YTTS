# Chrome Web Store submission

For a separate Microsoft Edge listing, use the [Edge Add-ons preparation](edge/README.md).

Use this checklist for the first manual YTTS submission. Keep the listing, privacy policy and
dashboard declarations aligned with the submitted package. The November 2026 audit covered the
program policies, User Data FAQ, Privacy practices tab, image guidelines and review process.
See [#21](https://github.com/maphel/YTTS/issues/21), [#29](https://github.com/maphel/YTTS/issues/29)
and [#33](https://github.com/maphel/YTTS/issues/33).

## Dashboard, tab by tab

### Package
Upload `ytts-<version>.zip` from the [GitHub release](https://github.com/maphel/YTTS/releases).
The release workflow packages the git-tracked files from `extension/`. Verify the asset digest
and the manifest version before uploading.

### Store listing
| Field | Value |
| --- | --- |
| Summary | Comes from the manifest; English text in [short-description.txt](short-description.txt) |
| Description | [long-description.txt](long-description.txt) (plain text, including the transcript permission and how the native panel is used) |
| Category | Tools (alternatives in the current list: Accessibility, Education) |
| Language | English. The summary comes from the manifest (`__MSG_extDescription__`, 21 locales); localized descriptions per locale are optional and can be added later |
| Store icon | `extension/icons/icon128.png`: 128 × 128 PNG, 96 × 96 artwork with 16 px transparent padding, blue (not YouTube red) |
| Screenshots | `screenshots/ytts-wide-light.png`, `screenshots/ytts-wide-dark.png`, `screenshots/ytts-compact-light.png` (1280 × 800 / 640 × 400, full bleed, square corners). At least one is required, up to five allowed |
| Promo tiles | Optional (440 × 280 small, 1400 × 560 marquee). Without a small tile the item ranks after items that have one; not needed for review |
| Official URL / Homepage | Homepage URL: https://github.com/maphel/YTTS (Official URL only lists Search-Console-verified sites; leave empty) |
| Support URL | https://github.com/maphel/YTTS/issues |
| Mature content | Off |

The summary shown in the store is the manifest description: "Read YouTube transcripts next to
the video and copy them with one click." (72 characters, limit 132). The screenshots are
generated with `npm run screenshot -- --store`: the real extension on a public video, with the
video frame, thumbnails, avatars, channel watermark, titles, channel names, description and the
YouTube logo blurred. Only the YTTS card stays sharp; its lines are short excerpts of the video's
captions. Replacing the video with one you own or one under CC BY removes that remaining
third-party text.

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

The [User Data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq)
includes local processing and reading content from the active website in its definition of data
handling. The transcript is **Website content**. YTTS uses the current video ID in memory to
keep the transcript aligned with navigation and records no browsing history. The extension
responds to controls on its own card. Compare the dashboard's category definitions with this
data flow when filling in the form.

The card provides the disclosure before the user clicks **Allow transcripts**. One local flag
remembers permission for this installation across tabs and reloads. The [privacy policy](../../PRIVACY.md)
contains the Limited Use statement and is linked from the project homepage.

### Test instructions
Use [test-instructions.txt](test-instructions.txt) in the 500-character field. It gives the
reviewer a public video, the consent and copy steps, and a check that reload remembers consent.
If the form offers a separate notes field, use [reviewer-notes.txt](reviewer-notes.txt) there.

### Distribution
Free, all regions. Visibility: Public (Unlisted goes through the same review). Leave "publish
automatically after review" on, or defer it to check the approved item first (a staged item must
be published within 30 days).

## Review-risk check

| Risk (policy / violation ID) | Status |
| --- | --- |
| Impersonation, trademark (Impersonation 1 and 5; Red Nickel/Red Silicon) | Listing and PRIVACY.md say "not affiliated with YouTube or Google". Name "YTTS" is descriptive. Icon is blue, not YouTube's red; it keeps a play triangle with text lines (residual risk accepted by the maintainer) |
| Misleading or unexpected behaviour (Misleading 3; Red Nickel) | The listing explains that after permission YTTS opens the native transcript panel in the background when needed and closes it if YTTS opened it |
| Unauthorized download of copyrighted content (Prohibited products) | No media download; only the transcript YouTube itself shows, copied on a user click. Avoid "download", "save video" or "scrape" in any listing text |
| Keyword spam (Listing 4; Yellow Argon) | The description explains the product in plain prose |
| Missing or insufficient metadata (Yellow Zinc) | Description, icon, screenshots, category present |
| Functionality not working (Yellow Magnesium) | Reviewer steps include a public video. See the normal browser check below for older-panel videos |
| Excessive permissions (Purple Potassium) | `storage` + one site; no `tabs`, `scripting`, `host_permissions` or broad patterns |
| User data disclosure (Purple Lithium, Purple Nickel) | In-card disclosure and affirmative consent, public policy with Limited Use statement, and Website content declaration |
| Remote code, obfuscation (Blue Argon, Red Titanium) | None; plain, unminified source |
| Slow review | Single-site content script and no sensitive permissions keep it out of the broad-host-permission path; new developers and new items get closer review regardless ("a few days, up to a few weeks") |

## Open items

- **Older transcript panel.** The maintainer verified `arj7oStGLkU` and `zjkBMFhNj_g` with
  YTTS 0.1.1 in normal Chrome on 9 November 2026. YouTube returned HTTP 400 for those panels
  in automated Chromium. Repeat the normal Chrome check on the candidate ZIP after allowing
  transcripts. [Browser check notes](https://github.com/maphel/YTTS/pull/32)
- **Privacy contact.** PRIVACY.md points to GitHub issues (needs an account). Optionally add the
  dashboard's verified contact email there.
- **Sentence time ranges** (#27): several sentences inside one caption segment show the same
  range, visible in the screenshots. Not a policy issue; fix or switch the store shots to Lines.

## Manual checklist

- [ ] Developer Dashboard: publisher registration, developer agreement, trader/non-trader
  declaration, verified contact email.
- [ ] Package tab. Upload the verified release ZIP and confirm YTTS and the submitted version.
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
