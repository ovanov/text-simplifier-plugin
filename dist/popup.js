"use strict";
const DEFAULT_BACKEND_URL = "http://localhost:8000";
document.addEventListener("DOMContentLoaded", async () => {
    const modelSelect = document.getElementById("model-select");
    const apiKeyGroup = document.getElementById("api-key-group");
    const apiKeyInput = document.getElementById("api-key");
    const backendUrlInput = document.getElementById("backend-url");
    const saveBtn = document.getElementById("save-btn");
    const statusEl = document.getElementById("status");
    // Load saved settings
    chrome.storage.local.get({ backendUrl: DEFAULT_BACKEND_URL, model: "huggingface-default", apiKey: "" }, (items) => {
        backendUrlInput.value = items.backendUrl;
        apiKeyInput.value = items.apiKey;
        fetchModels(items.backendUrl, items.model);
    });
    async function fetchModels(backendUrl, selectedModel) {
        try {
            const res = await fetch(`${backendUrl}/models`);
            const data = await res.json();
            modelSelect.innerHTML = "";
            data.models.forEach((m) => {
                const option = document.createElement("option");
                option.value = m.id;
                option.textContent = m.name;
                if (m.id === selectedModel)
                    option.selected = true;
                modelSelect.appendChild(option);
            });
            updateApiKeyVisibility(data.models);
            statusEl.textContent = "\u25CF Backend verbunden";
            statusEl.className = "status connected";
        }
        catch {
            statusEl.textContent = "\u25CB Backend nicht erreichbar";
            statusEl.className = "status disconnected";
        }
    }
    function updateApiKeyVisibility(models) {
        const selected = models.find((m) => m.id === modelSelect.value);
        apiKeyGroup.style.display = selected?.requires_api_key ? "block" : "none";
    }
    modelSelect.addEventListener("change", () => {
        fetchModels(backendUrlInput.value, modelSelect.value);
    });
    saveBtn.addEventListener("click", () => {
        chrome.storage.local.set({
            backendUrl: backendUrlInput.value,
            model: modelSelect.value,
            apiKey: apiKeyInput.value,
        }, () => {
            saveBtn.textContent = "Gespeichert!";
            setTimeout(() => {
                saveBtn.textContent = "Speichern";
            }, 1500);
        });
    });
});
