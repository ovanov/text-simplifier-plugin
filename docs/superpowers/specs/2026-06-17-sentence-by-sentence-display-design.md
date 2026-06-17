# Sentence-by-Sentence Display — Design

**Date:** 2026-06-17
**Status:** Approved

## Goal

Render the simplified text one sentence per line instead of a single block.
Keep the existing result-box design unchanged; only add a line break after each
sentence.

## Scope

`content.ts` only. No backend change, no contract change, no new dependency, no
CSS change.

## Current Behavior

`displayResult()` writes the whole simplified text into a single `<p>` via
`paragraph.textContent`. Two write sites exist:

- Initial render (`content.ts:55`): `paragraph.textContent = simplifiedText`
- Resimplify update (`content.ts:86`): `paragraph.textContent = lastSimplified`

Both must use the new logic — otherwise resimplify wipes the per-sentence breaks.

## Approach

Split sentences with the browser built-in `Intl.Segmenter` (locale `de`,
`granularity: "sentence"`). Locale-aware segmentation handles German
abbreviations (`z.B.`, `Dr.`, `usw.`) and decimals correctly. Supported in
Chrome 87+ and Firefox 125+ — both within target range.

Render each sentence as a text node, separated by `<br>` elements, inside the
existing `<p>`. Using text nodes (not `innerHTML`) preserves current XSS safety.

## New Helper

```ts
function renderSentences(paragraph: HTMLParagraphElement, text: string): void {
  paragraph.replaceChildren(); // clear existing content
  const seg = new Intl.Segmenter("de", { granularity: "sentence" });
  const sentences = [...seg.segment(text)]
    .map((s) => s.segment.trim())
    .filter(Boolean);
  sentences.forEach((s, i) => {
    paragraph.appendChild(document.createTextNode(s));
    if (i < sentences.length - 1) {
      paragraph.appendChild(document.createElement("br"));
    }
  });
}
```

## Wiring

- `content.ts:55` `paragraph.textContent = simplifiedText`
  → `renderSentences(paragraph, simplifiedText)`
- `content.ts:86` `paragraph.textContent = lastSimplified`
  → `renderSentences(paragraph, lastSimplified)`

## Out of Scope (YAGNI)

- Per-sentence styling (hover, numbering, spacing). `<br>` gives the line break;
  no CSS change needed now.
- Backend returning pre-split sentences.

## Testing

Manual: load extension on 20min.ch / srf.ch, simplify a multi-sentence
paragraph, confirm each sentence on its own line. Confirm resimplify keeps the
per-sentence layout. Verify text with `z.B.` / decimals is not split mid-sentence.
