interface ModelInfo {
  id: string;
  name: string;
  requires_api_key: boolean;
}

interface ModelsResponse {
  models: ModelInfo[];
}

const DEFAULT_BACKEND_URL = "http://localhost:8000";

document.addEventListener("DOMContentLoaded", async () => {
  const modelSelect = document.getElementById("model-select") as HTMLSelectElement;
  const apiKeyGroup = document.getElementById("api-key-group") as HTMLDivElement;
  const apiKeyInput = document.getElementById("api-key") as HTMLInputElement;
  const backendUrlInput = document.getElementById("backend-url") as HTMLInputElement;
  const saveBtn = document.getElementById("save-btn") as HTMLButtonElement;
  const statusEl = document.getElementById("status") as HTMLDivElement;

  // Load saved settings
  chrome.storage.local.get(
    { backendUrl: DEFAULT_BACKEND_URL, model: "huggingface-default", apiKey: "" },
    (items) => {
      backendUrlInput.value = items.backendUrl as string;
      apiKeyInput.value = items.apiKey as string;
      fetchModels(items.backendUrl as string, items.model as string);
    }
  );

  async function fetchModels(backendUrl: string, selectedModel: string): Promise<void> {
    try {
      const res = await fetch(`${backendUrl}/models`);
      const data: ModelsResponse = await res.json();

      modelSelect.innerHTML = "";
      data.models.forEach((m) => {
        const option = document.createElement("option");
        option.value = m.id;
        option.textContent = m.name;
        if (m.id === selectedModel) option.selected = true;
        modelSelect.appendChild(option);
      });

      updateApiKeyVisibility(data.models);
      statusEl.textContent = "\u25CF Backend verbunden";
      statusEl.className = "status connected";
    } catch {
      statusEl.textContent = "\u25CB Backend nicht erreichbar";
      statusEl.className = "status disconnected";
    }
  }

  function updateApiKeyVisibility(models: ModelInfo[]): void {
    const selected = models.find((m) => m.id === modelSelect.value);
    apiKeyGroup.style.display = selected?.requires_api_key ? "block" : "none";
  }

  modelSelect.addEventListener("change", () => {
    fetchModels(backendUrlInput.value, modelSelect.value);
  });

  saveBtn.addEventListener("click", () => {
    chrome.storage.local.set(
      {
        backendUrl: backendUrlInput.value,
        model: modelSelect.value,
        apiKey: apiKeyInput.value,
      },
      () => {
        saveBtn.textContent = "Gespeichert!";
        setTimeout(() => {
          saveBtn.textContent = "Speichern";
        }, 1500);
      }
    );
  });
});
