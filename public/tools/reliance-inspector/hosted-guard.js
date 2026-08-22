/* Hosted-only boundary guard.
   The frozen v0.4.0 app probes /api/evaluate to detect its local Python loopback server.
   RISU's public deployment is intentionally static and exposes no such API. Some static hosts
   may answer unsupported POSTs with 405 rather than 404, which the frozen detector could mistake
   for an available local API. Intercept only those local-only API paths on this hosted surface.
   Canonical case loading and all other fetches are passed through unchanged. */
(() => {
  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input, init = {}) => {
    const raw = typeof input === "string" ? input : input?.url;
    const url = raw ? new URL(raw, window.location.href) : null;
    const method = String(init.method || (typeof input !== "string" && input?.method) || "GET").toUpperCase();
    if (
      method !== "GET" &&
      url?.origin === window.location.origin &&
      (url.pathname === "/api/evaluate" || url.pathname === "/api/verify-evidence")
    ) {
      return Promise.resolve(new Response("", { status: 404, statusText: "Hosted local-only API disabled" }));
    }
    return nativeFetch(input, init);
  };
})();
