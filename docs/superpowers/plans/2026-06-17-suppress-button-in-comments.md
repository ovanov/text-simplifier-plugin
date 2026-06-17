# Suppress Simplify Button in Comments — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop the "✨ Text vereinfachen" button from appearing on reader comments (20min.ch), while keeping it on the article body.

**Architecture:** Add two skip-guards inside `injectSimplifier()` in `content.ts`: a class/semantic-region blocklist (`closest`) and a comment-heading anchor that excludes any `<p>` positioned after the "Deine Meinung zählt" / "NN Kommentare" boundary. Anchor computed once per run. No new files, no new permissions.

**Tech Stack:** TypeScript (strict, ES2020), compiled with `tsc` via `npm run build`. No test/lint tooling in repo — verification is the TypeScript compiler plus a manual browser check.

---

## File Structure

- **Modify:** `content.ts` — add `findCommentAnchor()`, `isInCommentZone()`, and wire both into `injectSimplifier()` (currently `content.ts:97-136`).

No other files change. Spec: `docs/superpowers/specs/2026-06-17-suppress-button-in-comments-design.md`.

---

### Task 1: Add `findCommentAnchor()` helper

**Files:**
- Modify: `content.ts` (insert above `injectSimplifier()`, before line 97)

- [ ] **Step 1: Add the helper function**

Insert immediately above `function injectSimplifier(): void {`:

```typescript
// Returns the element that begins the 20min comment section, or null.
// Matched by visible heading text so it survives hashed/obfuscated CSS classes.
function findCommentAnchor(): Element | null {
  const candidates = document.querySelectorAll("h1, h2, h3, h4, strong, span, div");
  for (const el of Array.from(candidates)) {
    const text = (el.textContent ?? "").trim();
    if (text.length > 40) continue; // headings are short; skip long body text
    if (/^Deine Meinung zählt$/.test(text) || /^\d+\s+Kommentare?$/.test(text)) {
      return el;
    }
  }
  return null;
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: build succeeds, no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add content.ts
git commit -m "feat: add findCommentAnchor helper to locate 20min comment section"
```

---

### Task 2: Add `isInCommentZone()` helper

**Files:**
- Modify: `content.ts` (insert directly below `findCommentAnchor()`)

- [ ] **Step 1: Add the helper function**

Insert directly below `findCommentAnchor()`:

```typescript
// True if the paragraph sits in a comment/aside region (Guard 1) or after the
// comment-section anchor (Guard 2). Either condition suppresses the button.
function isInCommentZone(p: Element, anchor: Element | null): boolean {
  const blocked = p.closest(
    '[class*="comment" i],[class*="kommentar" i],' +
      '[id*="comment" i],[id*="kommentar" i],' +
      "aside,[role=\"complementary\"],footer",
  );
  if (blocked) return true;

  if (anchor) {
    const rel = anchor.compareDocumentPosition(p);
    if (rel & Node.DOCUMENT_POSITION_FOLLOWING) return true;
  }
  return false;
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: build succeeds, no TypeScript errors. (`isInCommentZone` is unused until Task 3 — `tsc` with current config does not error on unused functions; if a `noUnusedLocals` error appears, proceed to Task 3 which consumes it.)

- [ ] **Step 3: Commit**

```bash
git add content.ts
git commit -m "feat: add isInCommentZone guard helper"
```

---

### Task 3: Wire guards into `injectSimplifier()`

**Files:**
- Modify: `content.ts` — `injectSimplifier()` body (current lines 97-101)

- [ ] **Step 1: Add anchor lookup and skip-guard**

Replace this current block:

```typescript
function injectSimplifier(): void {
  const paragraphs = document.querySelectorAll("article p, .article-content p");

  paragraphs.forEach((p) => {
    if ((p as HTMLElement).dataset.simplified) return;
    (p as HTMLElement).dataset.simplified = "true";
```

with:

```typescript
function injectSimplifier(): void {
  const paragraphs = document.querySelectorAll("article p, .article-content p");
  const commentAnchor = findCommentAnchor();

  paragraphs.forEach((p) => {
    if ((p as HTMLElement).dataset.simplified) return;
    (p as HTMLElement).dataset.simplified = "true";

    if (isInCommentZone(p, commentAnchor)) return; // no button in comments
```

Leave the rest of the `forEach` body (button creation, `p.prepend(btn)`) unchanged.

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: build succeeds, no TypeScript errors. Both helpers now referenced.

- [ ] **Step 3: Commit**

```bash
git add content.ts
git commit -m "feat: suppress simplify button in comment sections"
```

---

### Task 4: Manual browser verification

**Files:** none (verification only)

- [ ] **Step 1: Build and load**

Run: `npm run build`
Then load `build/chrome/` (or `text-simplifier-plugin/`) as unpacked extension in `chrome://extensions` (Developer mode on). Reload if already loaded.

- [ ] **Step 2: Verify 20min.ch — the fix**

Open a 20min.ch article that has comments (heading "Deine Meinung zählt", e.g. any `https://www.20min.ch/story/...`).
Expected:
- Buttons appear on article-body paragraphs.
- **No** button on any comment under "Deine Meinung zählt".
- The last article paragraph directly above the comment heading still gets a button.

- [ ] **Step 3: Verify srf.ch — no regression**

Open an srf.ch news article.
Expected: buttons appear on article-body paragraphs as before (no comment anchor present → Guard 2 inert).

- [ ] **Step 4: Record result**

If any comment still shows a button: open DevTools, inspect that comment's wrapper, note its `class`/`id`, and report back — Guard 1 selector or Guard 2 regex may need a 20min-specific addition.

---

## Self-Review

- **Spec coverage:** Guard 1 (class blocklist) → Task 2. Guard 2 (heading anchor) → Tasks 1+2. Compute-once + wiring → Task 3. Manual test (no tooling) → Task 4. srf.ch no-regression + edge cases → Task 4 steps 3-4. All spec sections covered.
- **Placeholders:** none — full code in every code step.
- **Type consistency:** `findCommentAnchor(): Element | null` defined Task 1, consumed Task 2/3 with matching `anchor: Element | null`. `isInCommentZone(p: Element, anchor: Element | null): boolean` defined Task 2, called in Task 3 as `isInCommentZone(p, commentAnchor)`. Consistent.
