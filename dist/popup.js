"use strict";
const DEFAULT_BACKEND_URL = "http://localhost:8000";
const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
document.addEventListener("DOMContentLoaded", async () => {
    const enrollView = document.getElementById("enroll-view");
    const loggedInView = document.getElementById("logged-in-view");
    const userIdEl = document.getElementById("user-id");
    const cefrEl = document.getElementById("cefr-level");
    const backendUrlEl = document.getElementById("backend-url");
    const enrollBtn = document.getElementById("enroll-btn");
    const statusEl = document.getElementById("enroll-status");
    const participantNameEl = document.getElementById("participant-name");
    const logoutBtn = document.getElementById("logout-btn");
    function showEnroll() {
        enrollView.style.display = "block";
        loggedInView.style.display = "none";
    }
    function showLoggedIn(user) {
        enrollView.style.display = "none";
        loggedInView.style.display = "block";
        participantNameEl.textContent = `Teilnehmer ${user.id.slice(0, 8)}`;
    }
    function setError(msg) {
        statusEl.textContent = msg;
        statusEl.className = "status error";
    }
    function clearStatus() {
        statusEl.textContent = "";
        statusEl.className = "status";
    }
    // Boot: try existing token
    chrome.storage.local.get({ authToken: "", backendUrl: DEFAULT_BACKEND_URL }, async (items) => {
        backendUrlEl.value = items.backendUrl || DEFAULT_BACKEND_URL;
        const token = items.authToken;
        if (!token) {
            showEnroll();
            return;
        }
        try {
            const res = await fetch(`${backendUrlEl.value}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const user = (await res.json());
                showLoggedIn(user);
                return;
            }
        }
        catch {
            // Fall through to enroll.
        }
        chrome.storage.local.remove("authToken");
        showEnroll();
    });
    enrollBtn.addEventListener("click", async () => {
        clearStatus();
        const userId = userIdEl.value.trim().toLowerCase();
        const selfCefr = cefrEl.value;
        const backendUrl = backendUrlEl.value.trim() || DEFAULT_BACKEND_URL;
        if (!UUID_V4_RE.test(userId)) {
            setError("Ungültige User Id. Bitte aus der Bestätigungs-E-Mail kopieren.");
            return;
        }
        enrollBtn.disabled = true;
        enrollBtn.textContent = "Bitte warten...";
        try {
            const res = await fetch(`${backendUrl}/auth/study-enroll`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: userId,
                    self_reported_cefr: selfCefr,
                }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => null);
                setError(err?.detail || "Anmeldung fehlgeschlagen");
                return;
            }
            const body = (await res.json());
            await new Promise((resolve) => chrome.storage.local.set({ authToken: body.access_token, backendUrl }, () => resolve()));
            showLoggedIn(body.user);
        }
        catch {
            setError("Backend nicht erreichbar.");
        }
        finally {
            enrollBtn.disabled = false;
            enrollBtn.textContent = "Teilnehmen";
        }
    });
    logoutBtn.addEventListener("click", () => {
        chrome.storage.local.remove(["authToken"], () => {
            showEnroll();
        });
    });
});
