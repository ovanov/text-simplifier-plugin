interface SimplifyResponse {
  simplified_text: string;
}

type ApiResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; detail: string };

interface ApiRequest {
  type: "API_CALL";
  method: "GET" | "POST" | "PATCH";
  path: string;
  body?: Record<string, unknown>;
}

async function callApi<T>(req: Omit<ApiRequest, "type">): Promise<ApiResult<T>> {
  try {
    const result = await chrome.runtime.sendMessage<ApiRequest, ApiResult<T>>({
      type: "API_CALL",
      ...req,
    });
    if (!result) {
      return { ok: false, status: 0, detail: "Keine Antwort vom Hintergrund-Skript" };
    }
    return result;
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Erweiterungsfehler";
    return { ok: false, status: 0, detail };
  }
}

function authPromptMessage(): string {
  return "Bitte erneut anmelden (Klicke auf das EinfachLesen-Symbol)";
}

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

function displayResult(
  targetElement: Element,
  simplifiedText: string,
  originalText: string,
): void {
  const existing = targetElement.nextElementSibling;
  if (existing?.classList.contains("simplified-result-box")) {
    existing.remove();
  }

  const resultDiv = document.createElement("div");
  resultDiv.className = "simplified-result-box";

  const label = document.createElement("small");
  const bold = document.createElement("b");
  bold.textContent = "Vereinfachter Text";
  label.appendChild(bold);

  const paragraph = document.createElement("p");
  renderSentences(paragraph, simplifiedText);

  const resimplifyBtn = document.createElement("button");
  resimplifyBtn.textContent = "Nochmals vereinfachen";
  resimplifyBtn.className = "simplify-btn resimplify-btn";

  let lastSimplified = simplifiedText;

  resimplifyBtn.onclick = async () => {
    resimplifyBtn.textContent = "⏳ Verarbeite...";
    resimplifyBtn.disabled = true;

    const result = await callApi<SimplifyResponse>({
      method: "POST",
      path: "/simplify",
      body: {
        text: originalText,
        simplified_text: lastSimplified,
        source_url: window.location.href,
      },
    });

    if (!result.ok) {
      const msg =
        result.status === 401 ? authPromptMessage() : result.detail || "Fehler";
      resimplifyBtn.textContent = `❌ ${msg}`;
      resimplifyBtn.disabled = false;
      return;
    }

    lastSimplified = result.data.simplified_text;
    renderSentences(paragraph, lastSimplified);
    resimplifyBtn.textContent = "Nochmals vereinfachen";
    resimplifyBtn.disabled = false;
  };

  resultDiv.appendChild(label);
  resultDiv.appendChild(paragraph);
  resultDiv.appendChild(resimplifyBtn);
  targetElement.after(resultDiv);
}

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

function injectSimplifier(): void {
  const paragraphs = document.querySelectorAll("article p, .article-content p");
  const commentAnchor = findCommentAnchor();

  paragraphs.forEach((p) => {
    if ((p as HTMLElement).dataset.simplified) return;
    (p as HTMLElement).dataset.simplified = "true";

    if (isInCommentZone(p, commentAnchor)) return; // no button in comments

    const btn = document.createElement("button");
    btn.textContent = "✨ Text vereinfachen";
    btn.className = "simplify-btn";

    btn.onclick = async () => {
      const originalText = (p as HTMLElement).innerText;
      btn.textContent = "⏳ Verarbeite...";
      btn.disabled = true;

      const result = await callApi<SimplifyResponse>({
        method: "POST",
        path: "/simplify",
        body: {
          text: originalText,
          source_url: window.location.href,
        },
      });

      if (!result.ok) {
        const msg =
          result.status === 401 ? authPromptMessage() : result.detail || "Fehler";
        btn.textContent = `❌ ${msg}`;
        btn.disabled = false;
        return;
      }

      btn.remove();
      displayResult(p, result.data.simplified_text, originalText);
    };

    p.prepend(btn);
  });
}

injectSimplifier();
