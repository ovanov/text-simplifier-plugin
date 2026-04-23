"use strict";
const DEFAULTS = {
    backendUrl: "http://localhost:8000",
    authToken: "",
};
async function getBackgroundSettings() {
    return new Promise((resolve) => {
        chrome.storage.local.get({ ...DEFAULTS }, (items) => {
            resolve({
                backendUrl: items.backendUrl || DEFAULTS.backendUrl,
                authToken: items.authToken || "",
            });
        });
    });
}
async function performApiCall(req) {
    const { backendUrl, authToken } = await getBackgroundSettings();
    const headers = {};
    if (req.body !== undefined) {
        headers["Content-Type"] = "application/json";
    }
    if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
    }
    try {
        const response = await fetch(`${backendUrl}${req.path}`, {
            method: req.method,
            headers,
            body: req.body === undefined ? undefined : JSON.stringify(req.body),
        });
        if (!response.ok) {
            let detail = response.statusText || `HTTP ${response.status}`;
            try {
                const err = await response.json();
                if (err && typeof err.detail === "string")
                    detail = err.detail;
            }
            catch {
                // Response body wasn't JSON — keep statusText.
            }
            return { ok: false, status: response.status, detail };
        }
        const data = await response.json();
        return { ok: true, status: response.status, data };
    }
    catch (error) {
        const detail = error instanceof Error ? error.message : "Netzwerkfehler (Server an?)";
        return { ok: false, status: 0, detail };
    }
}
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || message.type !== "API_CALL")
        return false;
    performApiCall(message).then(sendResponse).catch((error) => {
        sendResponse({
            ok: false,
            status: 0,
            detail: error instanceof Error ? error.message : "Unbekannter Fehler",
        });
    });
    return true;
});
