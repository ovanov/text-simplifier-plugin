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
  paragraph.textContent = simplifiedText;

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
    paragraph.textContent = lastSimplified;
    resimplifyBtn.textContent = "Nochmals vereinfachen";
    resimplifyBtn.disabled = false;
  };

  resultDiv.appendChild(label);
  resultDiv.appendChild(paragraph);
  resultDiv.appendChild(resimplifyBtn);
  targetElement.after(resultDiv);
}

function injectSimplifier(): void {
  const paragraphs = document.querySelectorAll("article p, .article-content p");

  paragraphs.forEach((p) => {
    if ((p as HTMLElement).dataset.simplified) return;
    (p as HTMLElement).dataset.simplified = "true";

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
