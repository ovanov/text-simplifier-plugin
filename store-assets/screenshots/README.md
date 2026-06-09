# Screenshots

Put your store screenshots in this folder. They are **not** bundled into the extension
zip — you upload them by hand in the Chrome Web Store Developer Dashboard and on Firefox
AMO. This folder just keeps the source images organized and version-controlled.

## Specs

| Store | Required? | Dimensions | Format |
|---|---|---|---|
| Chrome Web Store | Yes (1–5) | **1280×800** (or 640×400) | PNG/JPEG, 24-bit, **no alpha/transparency** |
| Firefox AMO | Optional (recommended) | ~1280×800 | PNG/JPEG/GIF |

Capture at **1280×800** and the same files work for both stores.

## What each shot should contain (capture in this order)

| File | Content |
|---|---|
| `01-enrollment-popup.png` | The popup **enrollment view** — User-ID field + CEFR dropdown + "Teilnehmen" button. Use a **sample/fake UUID**, never a real participant ID. |
| `02-article-button.png` | An **srf.ch or 20min.ch** article paragraph with the injected "✨ Text vereinfachen" button visible. |
| `03-simplified-result.png` | The same paragraph after clicking — the "Vereinfachter Text" result box with simplified German text and the "Nochmals vereinfachen" button. **The most important shot.** |
| `04-logged-in-popup.png` | *(Optional)* The logged-in popup view ("Teilnehmer …" + Abmelden/logout). |

## Rules (both stores reject violations)

- **No real personal data / participant IDs** — placeholders only.
- **Use srf.ch / 20min.ch**, not tagesschau.de/spiegel.de — screenshots must match the
  declared host permissions.
- German UI is expected (German listing + audience).
- Chrome: exact 1280×800 or 640×400, no transparency. Don't upload arbitrary sizes.

## Need resizing?

If your raw captures aren't exactly 1280×800, drop them in a `raw/` subfolder and ask —
a small `sips`-based (macOS built-in) or `pngjs` script can pad/crop them to spec and
strip the alpha channel.
