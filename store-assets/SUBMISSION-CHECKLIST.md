# Submission checklist — Chrome Web Store & Firefox AMO

All submission is done in the stores' web dashboards. This maps each form field to the
asset in this repo. Build artifacts come from
`BACKEND_URL=https://pub.cl.uzh.ch/projects/einfach-lesen npm run package:{chrome,firefox}`.

## Shared assets

| Asset | Source |
|---|---|
| Extension package (Chrome) | `releases/einfachlesen-chrome-v1.0.0.zip` |
| Extension package (Firefox) | `releases/einfachlesen-firefox-v1.0.0.zip` (rename to `.xpi` if uploading directly) |
| Store icon (128×128) | `icons/store-128.png` |
| Description (EN + DE) | `store-assets/description-en.md` |
| Screenshots (1280×800) | `store-assets/screenshots/01–04*.png` — see that folder's README |
| Privacy policy URL | `https://ovanov.github.io/text-simplifier-plugin/PRIVACY` — **must be live** |

---

## Chrome Web Store

Dashboard: <https://chrome.google.com/webstore/devconsole> (one-time $5 developer fee).

| Form field | Value / source |
|---|---|
| Package | Upload `releases/einfachlesen-chrome-v1.0.0.zip` |
| Store icon | `icons/store-128.png` |
| Screenshots | Upload `screenshots/01–04*.png` (≥1 required, 1280×800, no alpha) |
| Description | Body of `description-en.md` (and DE section) |
| Category | Productivity (or Education) |
| Language | German |
| **Single purpose** | `store-assets/single-purpose.md` |
| **Permission justifications** | `store-assets/permissions-justifications.md` — one entry per permission: `storage`, `https://*.srf.ch/*`, `https://*.20min.ch/*`, `https://pub.cl.uzh.ch/projects/einfach-lesen/*` |
| Privacy policy URL | the URL above |
| **Data usage / privacy practices** | Fill the form from `PRIVACY.md`: collects the auth token + paragraph text the user explicitly submits; **not** sold; **not** used for tracking/ads/credit/unrelated purposes |
| Visibility | **Unlisted** (per `description-en.md` — study participants only). Note: unlisted Chrome items still need the full listing + ≥1 screenshot to pass review. |

---

## Firefox AMO

Dashboard: <https://addons.mozilla.org/developers/> (free account).

Pick the distribution channel first — it changes what's required:

- **Self-distribution / "On your own"** (recommended for a participants-only study):
  upload `releases/einfachlesen-firefox-v1.0.0.zip` to get it **signed**, then distribute
  the signed `.xpi` to participants. **No public listing, no screenshots needed.**
- **Listed on AMO** (publicly discoverable): requires the description + screenshots, same
  as Chrome.

Either way, because the add-on is built from TypeScript, AMO review needs reproducible
build steps + source:

| Item | Source |
|---|---|
| Package / XPI | `releases/einfachlesen-firefox-v1.0.0.zip` |
| **Source code + build instructions** | Upload a source tarball + `store-assets/BUILD-INSTRUCTIONS.md` |
| Add-on ID | `einfachlesen@uzh.ch` (already in `manifest.firefox.json`) |
| Min Firefox version | 115.0 (already in manifest) |
| Privacy policy | the URL above |
| Description / screenshots | only if **listed** — reuse the Chrome assets |

---

## Pre-submit verification

- [ ] Backend reachable at `https://pub.cl.uzh.ch/projects/einfach-lesen/{simplify,auth/me}`
- [ ] Privacy-policy URL loads in a browser
- [ ] Unpacked `build/chrome/` + `build/firefox/` smoke-tested on srf.ch / 20min.ch
- [ ] Screenshots captured at 1280×800, no real participant data
- [ ] `releases/*.zip` rebuilt with the prod `BACKEND_URL` (no trailing slash)
