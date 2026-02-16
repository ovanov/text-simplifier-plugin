"use strict";
const DEFAULT_SETTINGS = {
    backendUrl: "http://localhost:8000",
    model: "huggingface-default",
    apiKey: "",
};
async function getSettings() {
    if (!chrome?.storage?.local) {
        throw new Error("Extension-Kontext ungültig. Bitte Seite neu laden.");
    }
    return new Promise((resolve) => {
        chrome.storage.local.get({ ...DEFAULT_SETTINGS }, (items) => {
            resolve({
                backendUrl: items.backendUrl,
                model: items.model,
                apiKey: items.apiKey,
            });
        });
    });
}
function displayResult(targetElement, simplifiedText) {
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
function injectSimplifier() {
    const paragraphs = document.querySelectorAll("article p, .article-content p");
    paragraphs.forEach((p) => {
        if (p.dataset.simplified)
            return;
        p.dataset.simplified = "true";
        const btn = document.createElement("button");
        btn.textContent = "\u2728 Text vereinfachen";
        btn.className = "simplify-btn";
        btn.onclick = async () => {
            const originalText = p.innerText;
            btn.textContent = "\u23F3 Verarbeite...";
            btn.disabled = true;
            try {
                const settings = await getSettings();
                const body = {
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
                const data = await response.json();
                displayResult(p, data.simplified_text);
                btn.textContent = "\u2705 Fertig";
            }
            catch (error) {
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
