"use strict";
const DEFAULT_BACKEND_URL = "http://localhost:8000";
document.addEventListener("DOMContentLoaded", async () => {
    // Auth elements
    const authView = document.getElementById("auth-view");
    const settingsView = document.getElementById("settings-view");
    const tabLogin = document.getElementById("tab-login");
    const tabRegister = document.getElementById("tab-register");
    const authEmail = document.getElementById("auth-email");
    const authPassword = document.getElementById("auth-password");
    const displayNameGroup = document.getElementById("display-name-group");
    const authDisplayName = document.getElementById("auth-display-name");
    const authSubmitBtn = document.getElementById("auth-submit-btn");
    const authError = document.getElementById("auth-error");
    const authBackendUrl = document.getElementById("auth-backend-url");
    const userEmailEl = document.getElementById("user-email");
    const logoutBtn = document.getElementById("logout-btn");
    // Settings elements
    const modelSelect = document.getElementById("model-select");
    const apiKeyGroup = document.getElementById("api-key-group");
    const apiKeyInput = document.getElementById("api-key");
    const backendUrlInput = document.getElementById("backend-url");
    const saveBtn = document.getElementById("save-btn");
    const statusEl = document.getElementById("status");
    let isRegisterMode = false;
    function showAuthView() {
        authView.style.display = "block";
        settingsView.style.display = "none";
    }
    function showSettingsView(email) {
        authView.style.display = "none";
        settingsView.style.display = "block";
        userEmailEl.textContent = email;
    }
    // 3a: Startup — token check
    chrome.storage.local.get({ authToken: "", backendUrl: DEFAULT_BACKEND_URL, model: "huggingface-default", apiKey: "" }, async (items) => {
        const backendUrl = items.backendUrl;
        const token = items.authToken;
        backendUrlInput.value = backendUrl;
        authBackendUrl.value = backendUrl;
        apiKeyInput.value = items.apiKey;
        if (token) {
            try {
                const res = await fetch(`${backendUrl}/auth/me`, {
                    headers: { "Authorization": `Bearer ${token}` },
                });
                if (res.ok) {
                    const user = await res.json();
                    showSettingsView(user.email);
                    fetchModels(backendUrl, items.model);
                    return;
                }
            }
            catch {
                // Network error — fall through to auth view
            }
            // Token invalid or expired
            chrome.storage.local.remove("authToken");
        }
        showAuthView();
    });
    // 3e: Tab toggle
    tabLogin.addEventListener("click", () => {
        isRegisterMode = false;
        tabLogin.classList.add("active");
        tabRegister.classList.remove("active");
        displayNameGroup.style.display = "none";
        authSubmitBtn.textContent = "Anmelden";
        authError.textContent = "";
    });
    tabRegister.addEventListener("click", () => {
        isRegisterMode = true;
        tabRegister.classList.add("active");
        tabLogin.classList.remove("active");
        displayNameGroup.style.display = "block";
        authSubmitBtn.textContent = "Registrieren";
        authError.textContent = "";
    });
    // 3b: Login handler
    async function login(email, password) {
        const backendUrl = authBackendUrl.value || DEFAULT_BACKEND_URL;
        try {
            const res = await fetch(`${backendUrl}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`,
            });
            if (res.ok) {
                const data = await res.json();
                const token = data.access_token;
                // Fetch user info
                const meRes = await fetch(`${backendUrl}/auth/me`, {
                    headers: { "Authorization": `Bearer ${token}` },
                });
                const user = await meRes.json();
                chrome.storage.local.set({ authToken: token, backendUrl }, () => {
                    backendUrlInput.value = backendUrl;
                    showSettingsView(user.email);
                    fetchModels(backendUrl, "huggingface-default");
                });
                return true;
            }
            else if (res.status === 401) {
                authError.textContent = "E-Mail oder Passwort falsch";
            }
            else {
                const err = await res.json().catch(() => null);
                authError.textContent = err?.detail || "Anmeldung fehlgeschlagen";
            }
        }
        catch {
            authError.textContent = "Backend nicht erreichbar";
        }
        return false;
    }
    // 3c: Register handler
    async function register(email, password, displayName) {
        const backendUrl = authBackendUrl.value || DEFAULT_BACKEND_URL;
        try {
            const res = await fetch(`${backendUrl}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, display_name: displayName }),
            });
            if (res.status === 201 || res.ok) {
                // Auto-login after successful registration
                await login(email, password);
            }
            else if (res.status === 409) {
                authError.textContent = "E-Mail bereits registriert";
            }
            else {
                const err = await res.json().catch(() => null);
                authError.textContent = err?.detail || "Registrierung fehlgeschlagen";
            }
        }
        catch {
            authError.textContent = "Backend nicht erreichbar";
        }
    }
    // Auth submit
    authSubmitBtn.addEventListener("click", async () => {
        authError.textContent = "";
        const email = authEmail.value.trim();
        const password = authPassword.value;
        if (!email || !password) {
            authError.textContent = "Bitte E-Mail und Passwort eingeben";
            return;
        }
        authSubmitBtn.disabled = true;
        authSubmitBtn.textContent = "Bitte warten...";
        if (isRegisterMode) {
            const displayName = authDisplayName.value.trim();
            await register(email, password, displayName);
        }
        else {
            await login(email, password);
        }
        authSubmitBtn.disabled = false;
        authSubmitBtn.textContent = isRegisterMode ? "Registrieren" : "Anmelden";
    });
    // 3d: Logout handler
    logoutBtn.addEventListener("click", () => {
        chrome.storage.local.remove(["authToken"], () => {
            showAuthView();
        });
    });
    // Models fetching (existing logic)
    async function fetchModels(backendUrl, selectedModel) {
        try {
            const res = await fetch(`${backendUrl}/models`);
            const data = await res.json();
            modelSelect.innerHTML = "";
            for (const m of data.models) {
                const option = document.createElement("option");
                option.value = m.id;
                option.textContent = m.name;
                if (m.id === selectedModel)
                    option.selected = true;
                modelSelect.appendChild(option);
            }
            updateApiKeyVisibility(data.models);
            statusEl.textContent = "● Backend verbunden";
            statusEl.className = "status connected";
        }
        catch {
            statusEl.textContent = "○ Backend nicht erreichbar";
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
