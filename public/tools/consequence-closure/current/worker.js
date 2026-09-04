'use strict';

importScripts('/tools/consequence-closure/inspector/engine.js');

const E = self.CCIEngine;
const MAX_INPUT_BYTES = 16 * 1024 * 1024;
const INSPECTION_RECORD_FORMAT = 'risu-consequence-closure-inspection/v2';
const sessions = new Map();
let nextSession = 0;

const clone = (value) => JSON.parse(JSON.stringify(value));

function sessionId() {
  nextSession += 1;
  return `cc-session-${nextSession}`;
}

function withFileMeta(result, fileMeta) {
  if (!fileMeta) return result;
  return {
    ...result,
    sourceFileDigest: fileMeta.fileDigest || null,
    sourceFileName: fileMeta.fileName || null,
    sourceFileBytes: Number.isInteger(fileMeta.byteLength) ? fileMeta.byteLength : null,
  };
}

async function verifyInspectionRecord(input, fileMeta = null) {
  if (!input || input.format !== INSPECTION_RECORD_FORMAT) {
    throw new Error('Not a Consequence Closure inspection record.');
  }
  const body = clone(input);
  const claimed = body.recordDigest || null;
  delete body.recordDigest;
  const computed = `sha256:${await E.sha256(body)}`;
  return {
    kind: 'inspection-record',
    source: input,
    sourceDigest: input.sourceDigest || null,
    recordIntegrity: {
      claimed,
      computed,
      verified: typeof claimed === 'string' && claimed === computed,
    },
    sourceFileDigest: fileMeta?.fileDigest || null,
    sourceFileName: fileMeta?.fileName || null,
    sourceFileBytes: Number.isInteger(fileMeta?.byteLength) ? fileMeta.byteLength : null,
  };
}

function decorate(result) {
  if (!result?.profile || !result?.analysis) return result;
  const outcomesByWorldId = Object.fromEntries(
    (result.analysis.compatibleWorlds || []).map((world) => [world.id, E.worldConsequence(result.profile, world)]),
  );
  const witness = result.analysis.witness;
  const currentWitnessRecord = witness ? {
    worldA: witness.worldA.id,
    worldB: witness.worldB.id,
    consequenceA: E.worldConsequence(result.profile, witness.worldA),
    consequenceB: E.worldConsequence(result.profile, witness.worldB),
    differences: clone(result.analysis.witnessDifferences || []),
  } : null;
  return { ...result, outcomesByWorldId, currentWitnessRecord };
}

async function inspectInput(input, fileMeta = null) {
  if (input?.format === INSPECTION_RECORD_FORMAT) {
    return { sessionId: null, result: await verifyInspectionRecord(input, fileMeta) };
  }
  const base = decorate(withFileMeta(await E.inspect(input), fileMeta));
  const id = sessionId();
  sessions.set(id, {
    base: clone(base),
    baselineEvidence: clone(base.evidence || base.profile?.initialEvidence || {}),
    current: clone(base),
  });
  return { sessionId: id, result: base };
}

async function inspectBytes(buffer, fileName) {
  const bytes = new Uint8Array(buffer);
  if (bytes.byteLength > MAX_INPUT_BYTES) {
    throw new Error(`Input exceeds the ${MAX_INPUT_BYTES / (1024 * 1024)} MB current hosted limit.`);
  }
  const fileMeta = {
    fileName: fileName || 'evidence.json',
    byteLength: bytes.byteLength,
    fileDigest: `sha256:${await E.sha256Bytes(bytes)}`,
  };
  let text;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error('Input must be valid UTF-8 JSON.');
  }
  let input;
  try {
    input = JSON.parse(text);
  } catch (error) {
    throw new Error(`Invalid JSON: ${error.message}`);
  }
  return inspectInput(input, fileMeta);
}

function recompute(id, evidence) {
  const session = sessions.get(id);
  if (!session || !session.base?.profile) throw new Error('No semantic analysis session is available.');
  const normalized = clone(evidence || {});
  const result = decorate({
    ...clone(session.base),
    evidence: normalized,
    analysis: E.analyze(session.base.profile, normalized),
    route: E.synthesizeRoute(session.base.profile, normalized, 'worst_case'),
  });
  session.current = clone(result);
  return { result, baselineEvidence: clone(session.baselineEvidence) };
}

function basisCertificate(id, basis) {
  const session = sessions.get(id);
  const result = session?.current;
  if (!result?.profile || !result?.analysis) throw new Error('No current semantic analysis is available.');
  return E.basisCertificateForWorlds(result.profile, result.analysis.compatibleWorlds, basis);
}

async function exportRecord(id) {
  const session = sessions.get(id);
  if (!session?.current) throw new Error('No semantic analysis session is available.');
  return E.evaluationRecord(session.current);
}

async function handle(message) {
  switch (message.type) {
    case 'inspect-bytes':
      return inspectBytes(message.bytes, message.fileName);
    case 'inspect-input':
      return inspectInput(message.input, message.fileMeta || null);
    case 'recompute':
      return recompute(message.sessionId, message.evidence);
    case 'certificate':
      return { certificate: basisCertificate(message.sessionId, message.basis) };
    case 'export':
      return { record: await exportRecord(message.sessionId) };
    default:
      throw new Error(`Unsupported worker request: ${message.type || 'missing'}`);
  }
}

self.addEventListener('message', async (event) => {
  const message = event.data || {};
  const id = message.id;
  try {
    const payload = await handle(message);
    self.postMessage({ type: 'result', id, ok: true, ...payload });
  } catch (error) {
    self.postMessage({
      type: 'result',
      id,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

self.postMessage({
  type: 'ready',
  inspectorVersion: E.INSPECTOR_VERSION,
  coreVersion: E.CORE_VERSION,
  limits: E.PORTABLE_LIMITS,
});
