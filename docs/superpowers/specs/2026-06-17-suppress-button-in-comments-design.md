# Suppress "Text vereinfachen" Button in Comment Sections

**Date:** 2026-06-17
**Component:** `text-simplifier-plugin` (Chrome/Firefox extension, EinfachLesen)
**File touched:** `content.ts` only

## Problem

The content script injects "✨ Text vereinfachen" buttons into every `<p>`
matched by `document.querySelectorAll("article p, .article-content p")`
(`content.ts:98`). On **20min.ch** this selector also captures paragraphs in
the user **comment section**, so the button wrongly appears on reader comments.

Confirmed scope: leak occurs on **20min.ch only**. srf.ch comments load via JS
and are not affected.

## Constraints / Findings

- 20min.ch comment section sits under a heading whose text is
  **"Deine Meinung zählt"**, followed by a **"NN Kommentare"** count.
- 20min.ch is a TX Group stack; CSS class names are likely **hashed/obfuscated**
  (e.g. `.sc-a1b2c3`). A pure class-substring blocklist (`[class*="comment"]`)
  may therefore match nothing. The design must survive hashed classes.
- Repo has **no test or lint tooling** (per `CLAUDE.md`). Verification is manual.
- No bundler; `content.ts` compiles via `tsc`. Keep change self-contained.

## Approach — Blocklist, Hardened (chosen)

Modify only `injectSimplifier()`. Before injecting into each `<p>`, run two
independent guards; skip injection if **either** fires.

### Guard 1 — class / semantic blocklist
Catches readable container names and structural regions:

```
p.closest(
  '[class*="comment" i],[class*="kommentar" i],' +
  '[id*="comment" i],[id*="kommentar" i],' +
  'aside,[role="complementary"],footer'
)
```

### Guard 2 — comment-heading anchor (survives hashed classes)
1. Find the first element whose trimmed text matches
   `/^Deine Meinung zählt$/` or `/^\d+\s+Kommentare?$/`.
2. Treat it as the comment-section boundary.
3. Skip any `<p>` positioned at or after it, via
   `anchor.compareDocumentPosition(p) & Node.DOCUMENT_POSITION_FOLLOWING`.

The anchor is computed **once** per `injectSimplifier()` run, not per paragraph.

## Components

- `findCommentAnchor(): Element | null` — scans candidate heading elements
  (`h1,h2,h3,h4,strong,span,div` with short text) for the boundary text;
  returns the first match or `null`.
- `isInCommentZone(p: Element, anchor: Element | null): boolean` — returns
  `true` if Guard 1 matches OR (anchor exists AND `p` follows it).

## Data Flow

```
injectSimplifier()
  → anchor = findCommentAnchor()        // once
  → for each <p> in querySelectorAll(...)
       → if p.dataset.simplified: skip
       → if isInCommentZone(p, anchor): mark + skip   // no button
       → else: inject button (existing behaviour)
```

Article body untouched. Everything from "Deine Meinung zählt" downward stays
clean even when comment classes are obfuscated.

## Error Handling / Edge Cases

- No comment heading present (e.g. srf.ch, or article with comments disabled):
  `findCommentAnchor()` returns `null`; Guard 2 is a no-op; behaviour unchanged.
- Comment-zone `<p>` still gets `dataset.simplified = "true"` so it is not
  re-evaluated, but receives **no** button.
- Guards are pure DOM reads; no network, no new permissions, no new files.

## Testing (manual)

1. `npm run build`, load unpacked in `chrome://extensions`.
2. Open a 20min.ch article with comments → buttons appear in article body,
   **none** in the comment list under "Deine Meinung zählt".
3. Open a srf.ch article → behaviour unchanged (buttons in body).
4. Article body paragraph directly above the comment heading still gets a button.

## Out of Scope

- Per-site allowlist mapping (Approach B) — reserved as fallback if Guard 1+2
  ever leak.
- MutationObserver for late-loaded comments — current injection runs once at
  load; not changing that here.
