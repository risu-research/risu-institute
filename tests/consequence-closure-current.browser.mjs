import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, extname, resolve, sep } from 'node:path';
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

function dumpDom(chrome, url) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(chrome, [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--hide-scrollbars',
      '--enable-logging=stderr',
      '--log-level=0',
      '--virtual-time-budget=8000',
      '--dump-dom',
      url,
    ], { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`Chrome timed out for ${url}\n${stderr}`));
    }, 30000);
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.once('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.once('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(`Chrome exited ${code} for ${url}\n${stderr}`));
        return;
      }
      resolveRun({ dom: stdout, logs: stderr });
    });
  });
}

function assertRuntime(run, url) {
  assert.match(run.dom, /data-cc-app="started"/u, `app did not start at ${url}\n${run.logs}`);
  assert.match(run.dom, /data-cc-engine="ready"/u, `worker did not become ready at ${url}\n${run.logs}`);
}

const chrome = await chromeBinary();
const { server, origin } = await startServer();

try {
  const decisionUrl = `${origin}/tools/consequence-closure/current/?case=authority-open`;
  const decision = await dumpDom(chrome, decisionUrl);
  assertRuntime(decision, decisionUrl);
  assert.match(decision.dom, /The current evidence still permits different specified consequences\./u);
  assert.match(decision.dom, /Inspector 0\.5\.0 · Core 0\.1\.0/u);

  const challengeUrl = `${origin}/tools/consequence-closure/current/?case=authority-open&view=challenge`;
  const challenge = await dumpDom(chrome, challengeUrl);
  assertRuntime(challenge, challengeUrl);
  assert.match(challenge.dom, /Replayable certificate/u);
  assert.match(challenge.dom, />SUFFICIENT</u);
  assert.match(challenge.dom, />INCLUSION MINIMAL</u);
  assert.match(challenge.dom, /Remove it and/u);

  const linuxUrl = `${origin}/tools/consequence-closure/current/?compare=linux&view=compare`;
  const linux = await dumpDom(chrome, linuxUrl);
  assertRuntime(linux, linuxUrl);
  assert.match(linux.dom, /Administrative declaration and operative enforcement/u);
  assert.match(linux.dom, /CLOSED · UNSAFE/u);
  assert.match(linux.dom, /CLOSED · SAFE/u);
  assert.match(linux.dom, /Recorded operating-system contrast\./u);

  const oauthUrl = `${origin}/tools/consequence-closure/current/?compare=oauth&view=compare`;
  const oauth = await dumpDom(chrome, oauthUrl);
  assertRuntime(oauth, oauthUrl);
  assert.match(oauth.dom, /Qualified live path and authority-resource split state/u);
  assert.match(oauth.dom, /SAFE AT CUT/u);
  assert.match(oauth.dom, /AUTHORITY_RESOURCE_SPLIT_BRAIN/u);
  assert.match(oauth.dom, /Recorded OAuth commissioning contrast\./u);

  console.log('Consequence Closure Chromium gate: PASS');
} finally {
  await new Promise((resolveClose) => server.close(resolveClose));
}
