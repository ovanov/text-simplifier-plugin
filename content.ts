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
  try {
    const settings = await getSettings();
    if (!settings.authToken) return "B2";

    const response = await fetch(`${settings.backendUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${settings.authToken}` },
    });
    if (!response.ok) return "B2";

    const user: UserResponse = await response.json();
    return user.cefr_level;
  } catch {
    return "B2";
  }
}

async function updateUserCefrLevel(level: string): Promise<void> {
  try {
    const settings = await getSettings();
    if (!settings.authToken) return;

    await fetch(`${settings.backendUrl}/auth/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.authToken}`,
      },
      body: JSON.stringify({ cefr_level: level }),
    });
  } catch {
    // Silently fail — level update is best-effort
  }
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

    try {
      // Update stored level if it actually changed
      if (newLevel !== level) {
        await updateUserCefrLevel(newLevel);
      }
      level = newLevel;

      const settings = await getSettings();
      const body: Record<string, string> = {
        text: originalText,
        simplified_text: lastSimplified,
        target_level: level,
        model: settings.model,
      };
      if (settings.apiKey) {
        body.api_key = settings.apiKey;
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (settings.authToken) {
        headers["Authorization"] = `Bearer ${settings.authToken}`;
      }

      const response = await fetch(`${settings.backendUrl}/simplify`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || response.statusText);
      }

      const data: SimplifyResponse = await response.json();
      lastSimplified = data.simplified_text;
      paragraph.textContent = lastSimplified;
      bold.textContent = `Einfache Sprache (${level}):`;
      resimplifyBtn.textContent = "Nochmals vereinfachen";
      resimplifyBtn.disabled = false;
    } catch (error) {
      console.error("EinfachLesen re-simplify error:", error);
      const msg = error instanceof Error ? error.message : "Fehler";
      resimplifyBtn.textContent = `\u274C ${msg}`;
      resimplifyBtn.disabled = false;
    }
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

      try {
        const settings = await getSettings();
        const body: Record<string, string> = {
          text: originalText,
          target_level: userLevel,
          model: settings.model,
        };
        if (settings.apiKey) {
          body.api_key = settings.apiKey;
        }

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (settings.authToken) {
          headers["Authorization"] = `Bearer ${settings.authToken}`;
        }

        const response = await fetch(`${settings.backendUrl}/simplify`, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });

        if (response.status === 401) {
          throw new Error("Bitte melde dich an (Klicke auf das EinfachLesen-Symbol)");
        }

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.detail || response.statusText);
        }

        const data: SimplifyResponse = await response.json();
        btn.remove();
        displayResult(p, data.simplified_text, originalText, userLevel);
      } catch (error) {
        console.error("EinfachLesen error:", error);
        const msg = error instanceof Error ? error.message : "Server an?";
        btn.textContent = `\u274C ${msg}`;
        btn.disabled = false;
      }
    };

    p.prepend(btn);
  });
}

injectSimplifier();
