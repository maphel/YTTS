# Chrome Web Store submission

This folder prepares the first manual submission of YTTS ([#21](https://github.com/maphel/YTTS/issues/21)).
It does not publish an item or automate uploads. Keep the listing, the privacy policy and the
dashboard declarations aligned with the code.

## Files to upload or copy

| Dashboard field | Source |
| --- | --- |
| Package | `dist/ytts-<version>.zip` from the GitHub release, or `npm run pack`; must include the single-column fix (#24) |
| Name | YTTS |
| Summary | [short-description.txt](short-description.txt), identical to the manifest's English `extDescription` |
| Detailed description | [long-description.txt](long-description.txt) |
| Single purpose | [single-purpose.txt](single-purpose.txt) |
| Permission explanations and remote code | [permissions.md](permissions.md) |
| Test instructions (500-character field) | [test-instructions.txt](test-instructions.txt) |
| Additional reviewer context (optional; only if the form offers a notes field, not inside the 500-character test instructions) | [reviewer-notes.txt](reviewer-notes.txt) |
| Store icon | [`extension/icons/icon128.png`](../../extension/icons/icon128.png), 128 × 128 |
| Screenshots | [`screenshots/`](screenshots/), 1280 × 800 and 640 × 400, light and dark |
| Privacy policy | https://github.com/maphel/YTTS/blob/main/PRIVACY.md (current wording after this PR is merged) |
| Homepage | https://github.com/maphel/YTTS |
| Support URL | https://github.com/maphel/YTTS/issues |

Suggested listing language: English (the package ships 21 locales, i.e. 20 languages with
Brazilian and European Portuguese; the dashboard can add
localized listings later). Suggested category: Tools (verify the current choices; "Education" also
fits). The summary is 72 characters (limit 132).

The screenshots are captured from the real extension on youtube.com with `npm run screenshot --
--store` (see `scripts/screenshot.mjs`). They show a public video page, including YouTube's
interface and third-party thumbnails; replace them if the review objects.

## Recommended data-use declarations

YTTS reads, locally, the transcript text that youtube.com renders and the current video ID from
the URL. Nothing is transmitted to the developer or third parties, and nothing but three display
preferences is stored.

- **Website content:** recommended. The extension reads page content (the transcript) to provide
  its single purpose, even though the processing stays local.
- **Web history:** recommended not to select. Only the current tab's video ID is read to detect
  navigation; YTTS keeps no list of visited pages and stores no video IDs.
- **All other categories** (personally identifiable, health, financial, authentication, personal
  communications, location, user activity): not accessed.

This mapping is the project's reading of the dashboard definitions (see the User data FAQ below on
local processing). The maintainer confirms it against the current form before submitting.
Review the three data-use certifications separately against the privacy policy.

## Manual checklist

- [ ] Sign in to the Chrome Web Store Developer Dashboard with the intended publisher account and
  complete registration, the developer agreement and the trader/non-trader declaration.
- [ ] Download `ytts-<version>.zip` from the GitHub release (or run `npm run pack`), inspect it and
  check the version.
- [ ] Create a new item and upload that ZIP; never the repository or the screenshots.
- [ ] Copy the listing texts, choose language and category, upload the icon and screenshots.
- [ ] Enter the privacy policy URL, single purpose, permission explanations and test instructions;
  open the policy URL without signing in first.
- [ ] Select the data-use categories and certifications after reviewing them (see above).
- [ ] Declare no remote code.
- [ ] Choose visibility (Unlisted for a first test, or Public) and review all validation messages.
- [ ] Submit for review. Record the item ID, store URL and review outcome in #21, and add the store
  link to README.md afterwards.

Do not add upload credentials to the repository. Automated uploads are a later step, if ever.

## Policy references

- [Prepare images](https://developer.chrome.com/docs/webstore/images): icon and screenshot sizes.
- [Create a great listing](https://developer.chrome.com/docs/webstore/best-listing).
- [Trader disclosure](https://developer.chrome.com/docs/webstore/program-policies/trader-disclosure).
- [User data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq):
  local processing and disclosure.
