import assert from 'node:assert/strict';
import { access, mkdtemp, readFile, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const publicRoot = resolve(root, 'public');

const currentCsp = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'none'",
  "font-src 'none'",
  "connect-src 'none'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
  "manifest-src 'none'",
].join('; ');

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

async function chromeBinary() {
  const candidates = [
    process.env.CHROME_BIN,
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean);
  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {}
  }
  throw new Error(`Chrome/Chromium not found. Checked: ${candidates.join(', ')}`);
}

function startServer() {
  const server = createServer(async (req, res) => {
    try {
      const requestUrl = new URL(req.url || '/', 'http://127.0.0.1');
      let pathname = decodeURIComponent(requestUrl.pathname);
      if (pathname.endsWith('/')) pathname += 'index.html';
      const filePath = resolve(publicRoot, `.${pathname}`);
      if (filePath !== publicRoot && !filePath.startsWith(`${publicRoot}${sep}`)) {
        res.writeHead(403).end('forbidden');
        return;
      }
      const body = await readFile(filePath);
      res.statusCode = 200;
      res.setHeader('Content-Type', types[extname(filePath)] || 'application/octet-stream');
      res.setHeader('Cache-Control', 'no-store');
      if (pathname.startsWith('/tools/consequence-closure/current/')) {
        res.setHeader('Content-Security-Policy', currentCsp);
        res.setHeader('Referrer-Policy', 'no-referrer');
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
        res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
      }
      res.end(body);
    } catch (error) {
      res.statusCode = error?.code === 'ENOENT' ? 404 : 500;
      res.end(String(error?.message || error));
    }
  });
  return new Promise((resolveStart, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolveStart({ server, origin: `http://127.0.0.1:${address.port}` });
    });
  });
}

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

async function startChrome(chrome) {
  assert.equal(typeof WebSocket, 'function', 'Node 22 WebSocket support is required for the CDP browser gate');
  const profile = await mkdtemp(join(tmpdir(), 'risu-cc-chrome-'));
  const child = spawn(chrome, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--hide-scrollbars',
    '--remote-debugging-address=127.0.0.1',
    '--remote-debugging-port=0',
    `--user-data-dir=${profile}`,
    'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  child.stderr.setEncoding('utf8');
  let stderr = '';
  const websocketUrl = await new Promise((resolveWs, reject) => {
    const timer = setTimeout(() => reject(new Error(`Chrome DevTools endpoint did not start.\n${stderr}`)), 15000);
    child.once('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
      const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/u);
      if (match) {
        clearTimeout(timer);
        resolveWs(match[1]);
      }
    });
    child.once('close', (code) => {
      clearTimeout(timer);
      reject(new Error(`Chrome exited before DevTools became available (${code}).\n${stderr}`));
    });
  });
  const parsed = new URL(websocketUrl);
  return {
    child,
    profile,
    httpOrigin: `http://${parsed.host}`,
    stderr: () => stderr,
  };
}

async function stopChrome(chromeState) {
  const { child, profile } = chromeState;
  if (child.exitCode === null && child.signalCode === null) {
    let exited = false;
    const exit = new Promise((resolveExit) => child.once('exit', () => {
      exited = true;
      resolveExit();
    }));
    child.kill('SIGTERM');
    await Promise.race([exit, sleep(3000)]);
    if (!exited && child.exitCode === null && child.signalCode === null) {
      const killed = new Promise((resolveExit) => child.once('exit', resolveExit));
      child.kill('SIGKILL');
      await killed;
    }
  }
  await rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
}

class CdpClient {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.seq = 0;
    this.pending = new Map();
    this.events = [];
  }

  async open() {
    this.ws = new WebSocket(this.url);
    await new Promise((resolveOpen, reject) => {
      const timer = setTimeout(() => reject(new Error(`CDP WebSocket open timed out: ${this.url}`)), 10000);
      this.ws.addEventListener('open', () => {
        clearTimeout(timer);
        resolveOpen();
      }, { once: true });
      this.ws.addEventListener('error', () => {
        clearTimeout(timer);
        reject(new Error(`CDP WebSocket failed: ${this.url}`));
      }, { once: true });
    });
    this.ws.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data));
      if (message.id) {
        const item = this.pending.get(message.id);
        if (!item) return;
        this.pending.delete(message.id);
        if (message.error) item.reject(new Error(`${item.method}: ${message.error.message}`));
        else item.resolve(message.result || {});
        return;
      }
      this.events.push(message);
    });
  }

  send(method, params = {}) {
    return new Promise((resolveSend, reject) => {
      const id = ++this.seq;
      this.pending.set(id, { resolve: resolveSend, reject, method });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.close();
  }
}

async function openPage(chromeState, url) {
  const response = await fetch(`${chromeState.httpOrigin}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
  if (!response.ok) throw new Error(`Unable to create Chrome target for ${url}: ${response.status} ${await response.text()}`);
  const target = await response.json();
  const client = new CdpClient(target.webSocketDebuggerUrl);
  await client.open();
  await client.send('Runtime.enable');
  await client.send('Page.enable');
  await client.send('Log.enable');
  return { client, target };
}

async function snapshot(client) {
  const expression = `({
    app: document.documentElement?.dataset?.ccApp || null,
    engine: document.documentElement?.dataset?.ccEngine || null,
    text: document.body?.innerText || '',
    html: document.documentElement?.outerHTML || ''
  })`;
  const result = await client.send('Runtime.evaluate', { expression, returnByValue: true });
  return result.result?.value || { app: null, engine: null, text: '', html: '' };
}

async function waitForPage(chromeState, url, expectedText, timeoutMs = 15000) {
  const { client, target } = await openPage(chromeState, url);
  const deadline = Date.now() + timeoutMs;
  let last = null;
  try {
    while (Date.now() < deadline) {
      last = await snapshot(client);
      if (last.app === 'started' && last.engine === 'ready' && last.text.includes(expectedText)) return { ...last, events: client.events };
      if (last.engine === 'error') break;
      await sleep(100);
    }
    const runtimeErrors = client.events.filter((event) => event.method === 'Runtime.exceptionThrown' || event.method === 'Log.entryAdded');
    throw new Error([
      `Chrome page did not reach the expected state for ${url}`,
      `Expected text: ${expectedText}`,
      `Lifecycle: app=${last?.app || 'missing'} engine=${last?.engine || 'missing'}`,
      `Runtime events: ${JSON.stringify(runtimeErrors, null, 2)}`,
      `Chrome stderr: ${chromeState.stderr()}`,
      `DOM: ${last?.html || 'unavailable'}`,
    ].join('\n'));
  } finally {
    client.close();
    if (target?.id) await fetch(`${chromeState.httpOrigin}/json/close/${encodeURIComponent(target.id)}`).catch(() => {});
  }
}

const chrome = await chromeBinary();
const { server, origin } = await startServer();
const chromeState = await startChrome(chrome);

try {
  const decision = await waitForPage(
    chromeState,
    `${origin}/tools/consequence-closure/current/?case=authority-open`,
    'The current evidence still permits different specified consequences.',
  );
  assert.equal(decision.app, 'started');
  assert.equal(decision.engine, 'ready');
  assert.match(decision.text, /2 compatible realizations produce 2 consequences/u);
  assert.match(decision.text, /Probe legacy capability cap-session-17/u);

  const challenge = await waitForPage(
    chromeState,
    `${origin}/tools/consequence-closure/current/?case=authority-open&view=challenge`,
    'The concrete reason the cut is still open',
  );
  assert.match(challenge.html, /Replayable certificate/u);
  assert.match(challenge.text, /SUFFICIENT/u);
  assert.match(challenge.text, /INCLUSION MINIMAL/u);
  assert.match(challenge.text, /Remove it and/u);

  const linux = await waitForPage(
    chromeState,
    `${origin}/tools/consequence-closure/current/?compare=linux&view=compare`,
    'Administrative declaration and operative enforcement',
  );
  assert.match(linux.text, /CLOSED · UNSAFE/u);
  assert.match(linux.text, /CLOSED · SAFE/u);
  assert.match(linux.text, /Recorded operating-system contrast\./u);

  const oauth = await waitForPage(
    chromeState,
    `${origin}/tools/consequence-closure/current/?compare=oauth&view=compare`,
    'Qualified live path and authority-resource split state',
  );
  assert.match(oauth.text, /SAFE AT CUT/u);
  assert.match(oauth.text, /AUTHORITY_RESOURCE_SPLIT_BRAIN/u);
  assert.match(oauth.text, /Recorded OAuth commissioning contrast\./u);

  console.log('Consequence Closure Chromium gate: PASS');
} finally {
  await stopChrome(chromeState);
  await new Promise((resolveClose) => server.close(resolveClose));
}
