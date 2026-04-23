interface BgApiRequest {
  type: "API_CALL";
  method: "GET" | "POST" | "PATCH";
  path: string;
  body?: Record<string, unknown>;
}

type BgApiResult =
  | { ok: true; status: number; data: unknown }
  | { ok: false; status: number; detail: string };

interface BackgroundSettings {
  backendUrl: string;
  authToken: string;
}

const DEFAULTS: BackgroundSettings = {
  backendUrl: "http://localhost:8000",
  authToken: "",
};

async function getBackgroundSettings(): Promise<BackgroundSettings> {
  return new Promise((resolve) => {
    chrome.storage.local.get(
      { ...DEFAULTS } as { [key: string]: unknown },
      (items) => {
        resolve({
          backendUrl: (items.backendUrl as string) || DEFAULTS.backendUrl,
          authToken: (items.authToken as string) || "",
        });
      },
    );
  });
}

async function performApiCall(req: BgApiRequest): Promise<BgApiResult> {
  const { backendUrl, authToken } = await getBackgroundSettings();

  const headers: Record<string, string> = {};
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
        if (err && typeof err.detail === "string") detail = err.detail;
      } catch {
        // Response body wasn't JSON — keep statusText.
      }
      return { ok: false, status: response.status, detail };
    }

    const data = await response.json();
    return { ok: true, status: response.status, data };
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Netzwerkfehler (Server an?)";
    return { ok: false, status: 0, detail };
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || message.type !== "API_CALL") return false;

  performApiCall(message as BgApiRequest).then(sendResponse).catch((error) => {
    sendResponse({
      ok: false,
      status: 0,
      detail: error instanceof Error ? error.message : "Unbekannter Fehler",
    } as BgApiResult);
  });

  return true;
});
