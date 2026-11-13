# Microsoft Edge Add-ons preparation

Prepared 13 November 2026. **Local preparation only. No Edge dashboard draft or
submission has been saved.** The developer account setup is not finished.

## Package

Use the ZIP of the latest release; at the time of writing that is the
[v0.2.0 release ZIP](https://github.com/maphel/YTTS/releases/download/v0.2.0/ytts-0.2.0.zip)
(41,526 bytes). Download it again before uploading and compare the digest. For a later
release, use that release's ZIP and digest instead.

```text
SHA-256 f8c1cf0962f8f3282b5aec208e8b5749670dd980f52dd31fae6ddcae9d04daee
```

Checked against GitHub's published release asset on 13 November 2026: `manifest.json`
(version 0.2.0) is at the archive root, with 21 `_locales` directories and 36 files in
total. Permissions and storage behavior are the same as in v0.1.2.
Static inspection found no obvious Edge-only blocker: MV3, `chrome.storage` and
`chrome.i18n` are used; no `update_url` or Chrome-specific service integration is
present. **A real Microsoft Edge sideload check remains necessary.** Do not label
the extension as Edge-tested before that check.

## Dashboard fields

Open the [official Edge developer dashboard](https://partner.microsoft.com/dashboard/microsoftedge/public/login).
Registration is free. If enrollment is needed, the account holder supplies the
legal account type, country/region, publisher and contact details and accepts the
developer agreement. Country and account type cannot be changed after enrollment.

| Field | Prepared value |
| --- | --- |
| Name | YTTS (from package) |
| Short description | Localized `extDescription` from the package; English: Read YouTube transcripts next to the video and copy them with one click. |
| Category | Productivity, if offered by the current dropdown |
| Website | https://ytts.christophel.io/ |
| Support URL | https://github.com/maphel/YTTS/issues |
| Support email, if required | Account holder supplies the desired public support address |
| Source code | https://github.com/maphel/YTTS |
| Privacy policy | Publish [PRIVACY.md](PRIVACY.md) first; target URL below |
| Distribution | Free; all supported regions |
| Search terms (optional) | YouTube transcript; copy transcript; video captions; transcript reader; open source |
| YouTube video URL (optional) | Leave blank: the existing MP4 is on the product site, not hosted on YouTube |
| Certification notes | [reviewer-notes.txt](reviewer-notes.txt) |

The five proposed search terms total 10 words; every term is below 30 characters.
Do not paste the Chrome Web Store installation link into the Edge listing's
primary website or installation fields.

## Listing languages

Each text in [descriptions/](descriptions/) is a complete 250–10,000-character
description, matching the 21 interface locales in the package:

`ar`, `de`, `en`, `es`, `fr`, `hi`, `id`, `it`, `ja`, `ko`, `nl`, `pl`, `pt_BR`,
`pt_PT`, `ru`, `sv`, `tr`, `uk`, `vi`, `zh_CN`, `zh_TW`.

Microsoft detects languages from the ZIP's localized manifest metadata. Confirm
the language rows actually imported by Partner Center and match the Portuguese
and Chinese variants to the corresponding files. Microsoft does not provide an
exhaustive current Edge listing-locale matrix in the cited documentation. Do not
assume a browser-language list is a store-language list, or remove package locales
just to bypass a listing requirement. Description and logo are required for each
listed language. The same product images can be reused across languages; their
interface text is English.

The 21 locales describe the **interface**, not transcript translation. Existing
video captions are required. These texts promise no AI transcription, translation
or summaries.

## Images

| Field | File | Size |
| --- | --- | --- |
| Logo for each listing language | [icon-512.png](../../launch/assets/icon-512.png) | 512 × 512 PNG |
| Screenshot: light | [ytts-wide-light.png](../screenshots/ytts-wide-light.png) | 1280 × 800 PNG |
| Screenshot: dark | [ytts-wide-dark.png](../screenshots/ytts-wide-dark.png) | 1280 × 800 PNG |
| Small promotional tile | [small-tile.png](assets/small-tile.png) | 440 × 280 PNG |

Do not use the compact 640 × 400 Chrome screenshots or 1270 × 760 launch gallery
images for Edge's fixed screenshot fields. The promotional tile is generated
from the existing vector icon and text, with its [SVG source](assets/small-tile.svg).
Regenerate with `node scripts/edge-assets.mjs`. Microsoft's overview and detailed
field table disagree about whether the small tile is required; including one
handles either form requirement. The large promotional tile and YouTube video
are optional and are not prepared.

## Privacy and permissions

Use [PRIVACY.md](PRIVACY.md), which explicitly describes Microsoft Edge. It must be
publicly accessible before submission. Once this documentation is reviewed and
merged, use:

```text
https://github.com/maphel/YTTS/blob/main/docs/store/edge/PRIVACY.md
```

This URL is a target, not a claim that the file already exists on `main`. Verify
it signed out after merge. The existing browser-neutral policy remains at
<https://github.com/maphel/YTTS/blob/main/PRIVACY.md>.

- Single purpose: display and copy the current YouTube video's existing transcript.
- `storage`: saves three display preferences and one local consent flag. Use the
  [existing permission explanation](../permissions.md#storage).
- Site access: `https://www.youtube.com/*` is the content script target. Use the
  [existing site explanation](../permissions.md#host-permission-content-script-httpswwwyoutubecom).
- Remote code: none; all executable JavaScript is packaged.
- Website content: transcript text is accessed locally after consent. If the
  dashboard uses the documented data-category questionnaire, declare **Website
  content**. No transcript or viewing data is sent to the developer or third
  parties. This category is a conservative interpretation of local access; check
  the current form's wording rather than claiming local processing is no access.
- No watch history, keystroke logging, account credentials, payment information,
  analytics or telemetry is collected. The current video ID is transient tab
  state used to avoid showing the wrong transcript.
- Read the dashboard's certifications before selecting them. The facts are: no
  data sale or transfer, no unrelated use, no credit or lending use.

## Finish the draft

1. Complete the account's security confirmation and any enrollment or verification.
2. Sideload the release ZIP in real Microsoft Edge. Check first-use consent,
   reload/another-tab consent, three views, copy/timestamps, seeking, videos with
   and without transcripts, light/dark and Arabic. Record the browser version and
   outcome. Do not invent a successful test.
3. Create the extension, upload the **inner extension ZIP**, and complete listing,
   availability and privacy fields. Use all language rows created by the portal.
4. Save as **In draft**. Record validation messages and the dashboard link here.
5. Before any future submission, merge the reviewed policy and confirm its public
   URL. Then check all required fields and the final certification screen.

The final **Publish** action submits for review and publication follows successful
certification. There is no assumed second manual go-live gate.

## Open items

- **Descriptions:** `descriptions/en.txt` is the source text; the other 20 files follow it
  sentence by sentence. They were aligned by an agent and not checked by native speakers.
- **Edge sideload check** (see above) and the saved dashboard draft.
- **Privacy policy URL:** after this file is on `main`, open its public URL before using it in
  the listing.

## Official references

- [Developer account registration](https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/create-dev-account)
- [Port a Chrome extension to Edge](https://learn.microsoft.com/en-us/microsoft-edge/extensions/developer-guide/port-chrome-extension)
- [Publish: fields, images, languages and privacy](https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/publish-extension)
- [Submission states](https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/submission-states)
- [Personal information policy, including Edge privacy-policy wording](https://learn.microsoft.com/en-us/legal/microsoft-edge/extensions/developer-policies#15-personal-information)
