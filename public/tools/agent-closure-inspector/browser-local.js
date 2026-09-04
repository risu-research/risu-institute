const button = document.getElementById("open-file");
const input = document.getElementById("file-input");
const capabilityNote = document.getElementById("capability-note");
const privacyNote = document.getElementById("privacy-note");
const nativeFetch = window.fetch.bind(window);
const MAX_EVIDENCE_BYTES = 1024 * 1024;
const LOCAL_INSPECTOR_URL =
  "https://github.com/risu-research/bounded-agent-closure/tree/main/inspector";

const isLiteralLocalInspector =
  window.location.protocol === "http:" && window.location.hostname === "127.0.0.1";

let mode = "preparing";
let worker = null;
let sequence = 0;
let ready = false;
const pending = new Map();

function browserReadyCopy() {
  capabilityNote.textContent =
    "Evaluated in this browser. No upload or account required.";
  privacyNote.textContent = "Browser-local · Evidence stays on this device";
}

function setBrowserReady() {
  mode = "browser-local";
  button.disabled = false;
  button.textContent = "Open local evidence";
  browserReadyCopy();
}

function setFallback() {
  mode = "fallback";
  button.disabled = false;
  button.textContent = "Run the local Inspector";
  capabilityNote.textContent =
    "Browser-local evaluation is unavailable here. The local Inspector remains available from the canonical repository.";
  privacyNote.textContent = "Static mode · Canonical evidence only";
}

function isEvaluationRequest(input) {
  const rawUrl = input instanceof Request ? input.url : String(input);
  const url = new URL(rawUrl, window.location.href);
  return url.origin === window.location.origin && url.pathname === "/api/evaluate";
}

function workerFailureBody(code, explanation) {
  return {
    runner_state: "REQUEST_ERROR",
    presentation: {
      runner_state: "REQUEST_ERROR",
      title: "Evidence could not be evaluated",
      notice: "No verdict issued.",
      errors: [{ code, explanation, facts: { code } }],
    },
  };
}

function failPending(code, explanation) {
  for (const { resolve, timer } of pending.values()) {
    clearTimeout(timer);
    resolve({ status: 500, body: workerFailureBody(code, explanation) });
  }
  pending.clear();
}

function retireWorker(code, explanation) {
  if (worker) worker.terminate();
  worker = null;
  ready = false;
  failPending(code, explanation);
  if (!isLiteralLocalInspector) setFallback();
}

function unavailableResult() {
  return {
    status: 503,
    body: workerFailureBody(
      "BROWSER_EVALUATOR_UNAVAILABLE",
      "The browser-local evaluator is unavailable. No evidence was sent to the site.",
    ),
  };
}

function evaluateInWorker(request) {
  if (!worker || !ready || mode !== "browser-local") {
    return Promise.resolve(unavailableResult());
  }

  return new Promise((resolve) => {
    const id = `evaluation-${++sequence}`;
    const timer = setTimeout(() => {
      pending.delete(id);
      resolve({
        status: 504,
        body: workerFailureBody(
          "BROWSER_EVALUATION_TIMEOUT",
          "The browser-local evaluation did not finish within 30 seconds.",
        ),
      });
    }, 30000);
    pending.set(id, { resolve, timer });

    try {
      worker.postMessage({ type: "evaluate", id, request });
    } catch {
      pending.delete(id);
      clearTimeout(timer);
      resolve(unavailableResult());
      retireWorker(
        "BROWSER_EVALUATOR_UNAVAILABLE",
        "The browser-local evaluator stopped before it could issue a verdict.",
      );
    }
  });
}

function installEvaluationBoundary() {
  window.fetch = async (input, init) => {
    if (!isEvaluationRequest(input)) return nativeFetch(input, init);

    const request =
      input instanceof Request
        ? new Request(input, init)
        : new Request(new URL(String(input), window.location.href), init);
    const result = await evaluateInWorker({
      method: request.method,
      contentType: request.headers.get("content-type") ?? "",
      raw: await request.text(),
    });
    return new Response(JSON.stringify(result.body), {
      status: result.status,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  };
}

async function enableBrowserLocalEvaluation() {
  if (isLiteralLocalInspector) return;
  if (!("Worker" in window)) {
    setFallback();
    return;
  }

  try {
    worker = new Worker(
      "/tools/agent-closure-inspector/evaluator-worker.js",
      { name: "risu-agent-closure-evaluator" },
    );
  } catch {
    setFallback();
    return;
  }

  const readyPromise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Evaluator startup timed out.")), 5000);

    worker.addEventListener("message", (event) => {
      const message = event.data ?? {};
      if (message.type === "ready" && !ready) {
        ready = true;
        clearTimeout(timer);
        resolve();
        return;
      }
      if (message.type !== "result" || typeof message.id !== "string") return;
      const item = pending.get(message.id);
      if (!item) return;
      pending.delete(message.id);
      clearTimeout(item.timer);
      item.resolve({ status: message.status, body: message.body });
    });

    worker.addEventListener("error", () => {
      clearTimeout(timer);
      if (!ready) reject(new Error("Evaluator startup failed."));
      retireWorker(
        "BROWSER_EVALUATOR_UNAVAILABLE",
        "The browser-local evaluator stopped before it could issue a verdict.",
      );
    });

    worker.addEventListener("messageerror", () => {
      clearTimeout(timer);
      if (!ready) reject(new Error("Evaluator startup message could not be decoded."));
      retireWorker(
        "BROWSER_EVALUATOR_MESSAGE_ERROR",
        "The browser could not decode an evaluator message, so no verdict was issued.",
      );
    });
  });

  try {
    await readyPromise;
  } catch {
    retireWorker(
      "BROWSER_EVALUATOR_UNAVAILABLE",
      "The browser-local evaluator could not start.",
    );
    return;
  }

  installEvaluationBoundary();
  setBrowserReady();
}

if (!isLiteralLocalInspector) {
  button.addEventListener("click", () => {
    if (mode === "browser-local") {
      browserReadyCopy();
      input.click();
    } else if (mode === "fallback") {
      window.location.href = LOCAL_INSPECTOR_URL;
    }
  });

  input.addEventListener(
    "change",
    (event) => {
      if (mode !== "browser-local") return;
      const [file] = input.files;
      if (!file || file.size <= MAX_EVIDENCE_BYTES) return;

      event.stopImmediatePropagation();
      input.value = "";
      capabilityNote.textContent =
        "Evidence bundle exceeds the 1 MiB browser-local limit. Choose a smaller JSON file.";
      privacyNote.textContent =
        "Not evaluated · The oversized file was not uploaded or read into the evaluator";
    },
    { capture: true },
  );
}

await enableBrowserLocalEvaluation();
