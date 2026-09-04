const button = document.getElementById("open-file");
const input = document.getElementById("file-input");
const capabilityNote = document.getElementById("capability-note");
const privacyNote = document.getElementById("privacy-note");

const isLiteralLocalInspector =
  window.location.protocol === "http:" && window.location.hostname === "127.0.0.1";

function waitForController(timeoutMs = 5000) {
  if (navigator.serviceWorker.controller) return Promise.resolve(true);
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      resolve(value);
    };
    const onControllerChange = () => finish(Boolean(navigator.serviceWorker.controller));
    const timer = setTimeout(() => finish(Boolean(navigator.serviceWorker.controller)), timeoutMs);
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
  });
}

function showFallback() {
  button.disabled = false;
  button.textContent = "Run the local Inspector";
  button.addEventListener("click", () => {
    window.location.href =
      "https://github.com/risu-research/bounded-agent-closure/tree/main/inspector";
  });
  capabilityNote.textContent =
    "Browser-local evaluation is unavailable here. The local Inspector remains available from the canonical repository.";
  privacyNote.textContent = "Static mode · Canonical evidence only";
}

async function enableBrowserLocalEvaluation() {
  if (isLiteralLocalInspector) return;
  if (!("serviceWorker" in navigator)) {
    showFallback();
    return;
  }

  try {
    await navigator.serviceWorker.register(
      "/tools/agent-closure-inspector/evaluator-sw.js",
      { scope: "/tools/agent-closure-inspector/" },
    );
    await navigator.serviceWorker.ready;
    const controlled = await waitForController();
    if (!controlled) throw new Error("Browser-local evaluator did not take control.");

    button.disabled = false;
    button.addEventListener("click", () => input.click());
    capabilityNote.textContent =
      "Evaluated in this browser. No upload or account required.";
    privacyNote.textContent = "Browser-local · Evidence stays on this device";
  } catch {
    showFallback();
  }
}

await enableBrowserLocalEvaluation();
