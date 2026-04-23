"use strict";
const DEFAULT_SETTINGS = {
    backendUrl: "http://localhost:8000",
    model: "huggingface-default",
    apiKey: "",
    authToken: "",
};
async function callApi(req) {
    try {
        const result = await chrome.runtime.sendMessage({
            type: "API_CALL",
            ...req,
        });
        if (!result) {
            return { ok: false, status: 0, detail: "Keine Antwort vom Hintergrund-Skript" };
        }
        return result;
    }
    catch (error) {
        const detail = error instanceof Error ? error.message : "Erweiterungsfehler";
        return { ok: false, status: 0, detail };
    }
}
const CEFR_LEVELS = ["B2", "B1", "A2", "A1"];
function nextCefrLevel(current) {
    const idx = CEFR_LEVELS.indexOf(current);
    if (idx === -1 || idx >= CEFR_LEVELS.length - 1)
        return "A1";
    return CEFR_LEVELS[idx + 1];
}
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
                authToken: items.authToken,
            });
        });
    });
}
async function getUserCefrLevel() {
    const settings = await getSettings();
    if (!settings.authToken)
        return "B2";
    const result = await callApi({ method: "GET", path: "/auth/me" });
    if (!result.ok)
        return "B2";
    return result.data.cefr_level;
}
async function updateUserCefrLevel(level) {
    const settings = await getSettings();
    if (!settings.authToken)
        return;
    await callApi({
        method: "PATCH",
        path: "/auth/me",
        body: { cefr_level: level },
    });
}
function displayResult(targetElement, simplifiedText, originalText, currentLevel) {
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
        const body = {
            text: originalText,
            simplified_text: lastSimplified,
            target_level: level,
            model: settings.model,
        };
        if (settings.apiKey) {
            body.api_key = settings.apiKey;
        }
        const result = await callApi({
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
async function injectSimplifier() {
    const userLevel = await getUserCefrLevel();
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
            const settings = await getSettings();
            const body = {
                text: originalText,
                target_level: userLevel,
                model: settings.model,
            };
            if (settings.apiKey) {
                body.api_key = settings.apiKey;
            }
            const result = await callApi({
                method: "POST",
                path: "/simplify",
                body,
            });
            if (!result.ok) {
                console.error("EinfachLesen error:", result);
                const msg = result.status === 401
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
