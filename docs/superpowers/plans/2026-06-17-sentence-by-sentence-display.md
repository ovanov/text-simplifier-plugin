# Sentence-by-Sentence Display Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render simplified text one sentence per line (`<br>` after each sentence) inside the existing result box.

**Architecture:** Add a `renderSentences()` helper in `content.ts` that splits text with the browser built-in `Intl.Segmenter` (locale `de`) and fills the `<p>` with text nodes separated by `<br>`. Replace both `paragraph.textContent = …` write sites with calls to it.

**Tech Stack:** TypeScript (strict, ES2020 target), no bundler, `Intl.Segmenter` (browser built-in). No new dependency.

## Global Constraints

- All user-facing text in German.
- Strict TypeScript (`strict: true`, target ES2020, module ESNext).
- No bundler — `npm run build` runs `tsc`. No production dependencies.
- No automated test tooling configured — verification is `tsc` build + manual browser check.
- Use text nodes / `createTextNode` (never `innerHTML`) — preserve current XSS safety.

---

### Task 1: Render simplified text sentence-by-sentence

**Files:**
- Modify: `content.ts` — add `renderSentences()` helper near `displayResult()`; replace writes at `content.ts:55` and `content.ts:86`.

**Interfaces:**
- Produces: `function renderSentences(paragraph: HTMLParagraphElement, text: string): void` — clears `paragraph`, appends one text node per sentence separated by `<br>`.

- [ ] **Step 1: Add the `renderSentences` helper**

Add above `displayResult` in `content.ts`:

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

- [ ] **Step 2: Replace the initial render write**

In `displayResult`, change `content.ts:55` from:

```ts
const paragraph = document.createElement("p");
paragraph.textContent = simplifiedText;
```

to:

```ts
const paragraph = document.createElement("p");
renderSentences(paragraph, simplifiedText);
```

- [ ] **Step 3: Replace the resimplify update write**

In the `resimplifyBtn.onclick` handler, change `content.ts:86` from:

```ts
lastSimplified = result.data.simplified_text;
paragraph.textContent = lastSimplified;
```

to:

```ts
lastSimplified = result.data.simplified_text;
renderSentences(paragraph, lastSimplified);
```

- [ ] **Step 4: Build and verify TypeScript compiles**

Run: `npm run build`
Expected: tsc completes with no errors; `dist/content.js` regenerated.

If `Intl.Segmenter` triggers a TS lib error (e.g. "Property 'Segmenter' does not exist on type 'typeof Intl'"), confirm `tsconfig.json` `lib` includes `ES2020.Intl` or add it. Re-run `npm run build` until clean.

- [ ] **Step 5: Manual browser check**

Load unpacked extension (`chrome://extensions`, Developer mode). On 20min.ch or srf.ch:
1. Simplify a multi-sentence paragraph → confirm each sentence on its own line.
2. Click "Nochmals vereinfachen" → confirm result still renders one sentence per line (breaks not wiped).
3. Find/simplify text containing `z.B.` or a decimal (e.g. `3.5`) → confirm not split mid-sentence.

- [ ] **Step 6: Commit**

```bash
git add content.ts
git commit -m "feat: render simplified text one sentence per line"
```

---

## Self-Review

- **Spec coverage:** split method (`Intl.Segmenter`, Step 1) ✓; `<br>` render (Step 1) ✓; both write sites (Steps 2–3) ✓; no backend/CSS change ✓; manual testing incl. abbreviation/decimal case (Step 5) ✓.
- **Placeholder scan:** none.
- **Type consistency:** `renderSentences(paragraph: HTMLParagraphElement, text: string)` used identically in Steps 2–3.
