interface SimplifyResponse {
  simplified_text: string;
  model_used: string;
}

interface ExtensionSettings {
  backendUrl: string;
  model: string;
  apiKey: string;
}

const DEFAULT_SETTINGS: ExtensionSettings = {
  backendUrl: "http://localhost:8000",
  model: "huggingface-default",
  apiKey: "",
};

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
        });
      }
    );
  });
}

function displayResult(targetElement: Element, simplifiedText: string): void {
  const resultDiv = document.createElement("div");
  resultDiv.className = "simplified-result-box";

  const label = document.createElement("small");
  const bold = document.createElement("b");
  bold.textContent = "Einfache Sprache:";
  label.appendChild(bold);

  const paragraph = document.createElement("p");
  paragraph.textContent = simplifiedText;

  resultDiv.appendChild(label);
  resultDiv.appendChild(paragraph);
  targetElement.after(resultDiv);
}

function injectSimplifier(): void {
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
          model: settings.model,
        };
        if (settings.apiKey) {
          body.api_key = settings.apiKey;
        }

        const response = await fetch(`${settings.backendUrl}/simplify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.detail || response.statusText);
        }

        const data: SimplifyResponse = await response.json();
        displayResult(p, data.simplified_text);
        btn.textContent = "\u2705 Fertig";
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
