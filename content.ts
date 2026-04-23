interface SimplifyResponse {
  simplified_text: string;
  model_used: string;
}

interface ExtensionSettings {
  backendUrl: string;
  model: string;
  apiKey: string;
  authToken: string;
}

interface UserResponse {
  id: string;
  email: string;
  display_name: string | null;
  cefr_level: string;
  created_at: string;
}

const DEFAULT_SETTINGS: ExtensionSettings = {
  backendUrl: "http://localhost:8000",
  model: "huggingface-default",
  apiKey: "",
  authToken: "",
};

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

const CEFR_LEVELS = ["B2", "B1", "A2", "A1"];

function nextCefrLevel(current: string): string {
  const idx = CEFR_LEVELS.indexOf(current);
  if (idx === -1 || idx >= CEFR_LEVELS.length - 1) return "A1";
  return CEFR_LEVELS[idx + 1];
}

async function getSettings(): Promise<ExtensionSettings> {
  if (!chrome?.storage?.local) {
    throw new Error("Extension-Kontext ungültig. Bitte Seite neu laden.");
  }
  return new Promise((resolve) => {
    chrome.storage.local.get(
      { ...DEFAULT_SETTINGS } as { [key: string]: unknown },
      (items) => {
        resolve({
          backendUrl: items.backendUrl as string,
          model: items.model as string,
          apiKey: items.apiKey as string,
          authToken: items.authToken as string,
        });
      }
    );
  });
}

async function getUserCefrLevel(): Promise<string> {
  const settings = await getSettings();
  if (!settings.authToken) return "B2";

  const result = await callApi<UserResponse>({ method: "GET", path: "/auth/me" });
  if (!result.ok) return "B2";
  return result.data.cefr_level;
}

async function updateUserCefrLevel(level: string): Promise<void> {
  const settings = await getSettings();
  if (!settings.authToken) return;

  await callApi<UserResponse>({
    method: "PATCH",
    path: "/auth/me",
    body: { cefr_level: level },
  });
}

function displayResult(
  targetElement: Element,
  simplifiedText: string,
  originalText: string,
  currentLevel: string,
): void {
  // Remove existing result box if present
  const existing = targetElement.nextElementSibling;
  if (existing?.classList.contains("simplified-result-box")) {
    existing.remove();
  }

  const resultDiv = document.createElement("div");
  resultDiv.className = "simplified-result-box";

  const label = document.createElement("small");
  const bold = document.createElement("b");
  bold.textContent = `Einfache Sprache (${currentLevel}):`;
  label.appendChild(bold);

  const paragraph = document.createElement("p");
  paragraph.textContent = simplifiedText;

  const resimplifyBtn = document.createElement("button");
  resimplifyBtn.textContent = "Nochmals vereinfachen";
  resimplifyBtn.className = "simplify-btn resimplify-btn";

  let lastSimplified = simplifiedText;
  let level = currentLevel;

  resimplifyBtn.onclick = async () => {
    const newLevel = nextCefrLevel(level);
    resimplifyBtn.textContent = "\u23F3 Verarbeite...";
    resimplifyBtn.disabled = true;

    // Update stored level if it actually changed
    if (newLevel !== level) {
      await updateUserCefrLevel(newLevel);
    }
    level = newLevel;

    const settings = await getSettings();
    const body: Record<string, unknown> = {
      text: originalText,
      simplified_text: lastSimplified,
      target_level: level,
      model: settings.model,
    };
    if (settings.apiKey) {
      body.api_key = settings.apiKey;
    }

    const result = await callApi<SimplifyResponse>({
      method: "POST",
      path: "/simplify",
      body,
    });

    if (!result.ok) {
      console.error("EinfachLesen re-simplify error:", result);
      resimplifyBtn.textContent = `\u274C ${result.detail || "Fehler"}`;
      resimplifyBtn.disabled = false;
      return;
    }

    lastSimplified = result.data.simplified_text;
    paragraph.textContent = lastSimplified;
    bold.textContent = `Einfache Sprache (${level}):`;
    resimplifyBtn.textContent = "Nochmals vereinfachen";
    resimplifyBtn.disabled = false;
  };

  resultDiv.appendChild(label);
  resultDiv.appendChild(paragraph);
  resultDiv.appendChild(resimplifyBtn);
  targetElement.after(resultDiv);
}

async function injectSimplifier(): Promise<void> {
  const userLevel = await getUserCefrLevel();
  const paragraphs = document.querySelectorAll("article p, .article-content p");

  paragraphs.forEach((p) => {
    if ((p as HTMLElement).dataset.simplified) return;
    (p as HTMLElement).dataset.simplified = "true";

    const btn = document.createElement("button");
    btn.textContent = "\u2728 Text vereinfachen";
    btn.className = "simplify-btn";

    btn.onclick = async () => {
      const originalText = (p as HTMLElement).innerText;
      btn.textContent = "\u23F3 Verarbeite...";
      btn.disabled = true;

      const settings = await getSettings();
      const body: Record<string, unknown> = {
        text: originalText,
        target_level: userLevel,
        model: settings.model,
      };
      if (settings.apiKey) {
        body.api_key = settings.apiKey;
      }

      const result = await callApi<SimplifyResponse>({
        method: "POST",
        path: "/simplify",
        body,
      });

      if (!result.ok) {
        console.error("EinfachLesen error:", result);
        const msg =
          result.status === 401
            ? "Bitte melde dich an (Klicke auf das EinfachLesen-Symbol)"
            : result.detail || "Fehler";
        btn.textContent = `\u274C ${msg}`;
        btn.disabled = false;
        return;
      }

      btn.remove();
      displayResult(p, result.data.simplified_text, originalText, userLevel);
    };

    p.prepend(btn);
  });
}

injectSimplifier();
