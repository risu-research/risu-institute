const button = document.getElementById("open-file");
const input = document.getElementById("file-input");
const capabilityNote = document.getElementById("capability-note");
const privacyNote = document.getElementById("privacy-note");
const nativeFetch = window.fetch.bind(window);

const isLiteralLocalInspector =
  window.location.protocol === "http:" && window.location.hostname === "127.0.0.1";

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

async function enableBrowserLocalEvaluation() {
  if (isLiteralLocalInspector) return;
  if (!("Worker" in window)) {
    showFallback();
    return;
  }

  let worker;
  try {
    worker = new Worker(
      "/tools/agent-closure-inspector/evaluator-worker.js",
      { name: "risu-agent-closure-evaluator" },
    );
  } catch {
    showFallback();
    return;
  }

  let sequence = 0;
  let ready = false;
  const pending = new Map();

  const failPending = (code, explanation) => {
    for (const { resolve, timer } of pending.values()) {
      clearTimeout(timer);
      resolve({ status: 500, body: workerFailureBody(code, explanation) });
    }
    pending.clear();
  };

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
      failPending(
        "BROWSER_EVALUATOR_UNAVAILABLE",
        "The browser-local evaluator stopped before it could issue a verdict.",
      );
    });
  });

  const evaluateInWorker = (request) =>
    new Promise((resolve) => {
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
      worker.postMessage({ type: "evaluate", id, request });
    });

  try {
    await readyPromise;
  } catch {
    worker.terminate();
    showFallback();
    return;
  }

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

  button.disabled = false;
  button.addEventListener("click", () => input.click());
  capabilityNote.textContent =
    "Evaluated in this browser. No upload or account required.";
  privacyNote.textContent = "Browser-local · Evidence stays on this device";
}

await enableBrowserLocalEvaluation();
