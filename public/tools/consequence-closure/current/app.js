'use strict';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const MAX_INPUT_BYTES = 16 * 1024 * 1024;
const REFERENCE_META = {
  'authority-open': { title: 'Authority revocation', kicker: 'Authority and revocation' },
  'linux-admin': { title: 'Linux administrative', kicker: 'Recorded operating system case' },
  'linux-operative': { title: 'Linux operative seal', kicker: 'Recorded operating system case' },
  'oauth-live': { title: 'OAuth paired control', kicker: 'Independent OAuth commissioning' },
  'oauth-stale': { title: 'OAuth split state', kicker: 'Controlled negative control' },
  keycloak: { title: 'Keycloak 26.7.2', kicker: 'Pinned runtime commissioning' },
};

const state = {
  worker: null,
  workerReady: false,
  pending: new Map(),
  requestSeq: 0,
  primary: null,
  baselineResult: null,
  baselineEvidence: null,
  selectedBasis: null,
  selectedCertificate: null,
  activeMode: 'decision',
  basisLimit: 60,
  worldLimit: 60,
  compare: null,
  dropDepth: 0,
};

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  })[char]);
}

function valueText(value) {
  if (value === true) return 'True';
  if (value === false) return 'False';
  if (value === null) return 'None';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function canonicalValue(value) {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalValue(value[key])]));
  }
  return value;
}

function sameJson(a, b) {
  return JSON.stringify(canonicalValue(a ?? {})) === JSON.stringify(canonicalValue(b ?? {}));
}

function referenceInput(sampleId) {
  const source = window.CCISamples?.[sampleId];
  if (!source) throw new Error(`Unknown reference record: ${sampleId}`);
  return JSON.parse(JSON.stringify(source));
}

function toast(message) {
  const node = $('#toast');
  node.textContent = message;
  node.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove('show'), 2200);
}

function busy(on, label = 'Running exact analysis') {
  $('#busyLabel').textContent = label;
  $('#busy').hidden = !on;
}

function workerRequest(type, payload = {}, transfer = []) {
  if (!state.workerReady && type !== 'ping') return Promise.reject(new Error('The frozen engine is still starting.'));
  return new Promise((resolve, reject) => {
    const id = `request-${++state.requestSeq}`;
    const timer = setTimeout(() => {
      state.pending.delete(id);
      reject(new Error('The browser-local analysis timed out.'));
    }, 45000);
    state.pending.set(id, { resolve, reject, timer });
    state.worker.postMessage({ type, id, ...payload }, transfer);
  });
}

function startWorker() {
  try {
    state.worker = new Worker('worker.js', { name: 'risu-consequence-closure-current' });
  } catch (error) {
    $('#engineState').textContent = 'Worker unavailable';
    toast('This browser could not start the local analysis worker.');
    return;
  }
  state.worker.addEventListener('message', (event) => {
    const message = event.data || {};
    if (message.type === 'ready') {
      state.workerReady = true;
      $('#engineState').textContent = `Inspector ${message.inspectorVersion} · Core ${message.coreVersion}`;
      $('#openBtn').disabled = false;
      $('#welcomeOpenBtn').disabled = false;
      const requested = new URLSearchParams(location.search).get('case');
      if (requested && REFERENCE_META[requested]) loadSample(requested);
      return;
    }
    if (message.type !== 'result') return;
    const item = state.pending.get(message.id);
    if (!item) return;
    state.pending.delete(message.id);
    clearTimeout(item.timer);
    if (message.ok) item.resolve(message);
    else item.reject(new Error(message.error || 'Analysis failed.'));
  });
  state.worker.addEventListener('error', () => {
    state.workerReady = false;
    $('#engineState').textContent = 'Worker stopped';
    for (const item of state.pending.values()) {
      clearTimeout(item.timer);
      item.reject(new Error('The browser-local analysis worker stopped.'));
    }
    state.pending.clear();
    toast('The browser-local analysis worker stopped. Reload the page to restart it.');
  });
}

function sourceFormat(result) {
  return result?.source?.format || result?.evidence?.format || result?.source?.provider?.name || 'inspection record';
}

function recordTitle(result, sampleId = null) {
  if (sampleId && REFERENCE_META[sampleId]) return REFERENCE_META[sampleId].title;
  if (result.kind === 'inspection-record') return result.source?.sourceFileName || 'Exported inspection record';
  return result.source?.title || result.profile?.title || result.evidence?.title || result.source?.provider?.name || 'Consequence Closure';
}

function resultSummary(result) {
  if (!result) return { tone: 'neutral', label: 'NO RESULT', title: 'No result loaded', summary: '' };
  if (result.kind === 'inspection-record') {
    const ok = result.recordIntegrity?.verified === true;
    return {
      tone: ok ? 'verified' : 'unsafe',
      label: ok ? 'RECORD DIGEST VERIFIED' : 'RECORD DIGEST MISMATCH',
      title: ok ? 'The exported inspection record is byte-value self-consistent.' : 'The exported record digest does not match its content.',
      summary: 'This checks inspection-record integrity only. It does not replay the semantic source unless the original source artifact is opened separately.',
    };
  }
  if (result.kind === 'oauth') {
    if (result.verdict === 'SAFE_AT_CUT') return { tone: 'safe', label: 'SAFE AT CUT', title: 'The measured HTTP path satisfies the paired-control evidence profile.', summary: result.reasons?.[0] || 'The bounded operational gates are satisfied at this cut.' };
    if (result.verdict === 'UNSAFE') return { tone: 'unsafe', label: result.subtype ? `UNSAFE · ${result.subtype}` : 'UNSAFE', title: result.subtype === 'AUTHORITY_RESOURCE_SPLIT_BRAIN' ? 'Authority state and resource behavior diverge.' : 'The protected action path remains adverse.', summary: (result.reasons || []).join(' ') };
    return { tone: 'open', label: 'OPEN', title: 'The operational profile remains unresolved at this cut.', summary: (result.reasons || []).join(' ') || 'Additional machine evidence is required.' };
  }
  if (result.kind === 'commissioning-summary') {
    const matched = result.source?.status === 'PASS' && result.referenceDigestMatch === true;
    return { tone: matched ? 'verified' : 'open', label: matched ? 'FROZEN GATE PASS' : 'REPORTED COMMISSIONING', title: matched ? 'The pinned Keycloak runtime gate matches the bundled frozen record.' : 'The imported commissioning summary is not promoted to the bundled frozen gate.', summary: result.source?.qualification || 'Runtime commissioning evidence.' };
  }
  const closure = result.analysis?.closure;
  if (!closure) return { tone: 'neutral', label: 'NO CORE STATUS', title: 'No Core closure status', summary: '' };
  if (closure.status === 'IMPOSSIBLE') return { tone: 'unsafe', label: 'IMPOSSIBLE', title: 'No admissible realization remains compatible with the evidence.', summary: 'The current evidence conflicts with the declared finite boundary.' };
  if (closure.status === 'OPEN') {
    const family = result.analysis.inclusionMinimalAdditionalBases || [];
    if (result.analysis.obligationStatus === 'UNRESOLVABLE_UNDER_DECLARED_EVIDENCE_SURFACE') return { tone: 'open', label: 'OPEN · UNRESOLVABLE', title: 'The consequence varies, but the declared Proposition surface cannot resolve it.', summary: `${result.analysis.compatibleWorlds.length} compatible realizations still produce different consequences, and no declared candidate subset distinguishes every material pair.` };
    return { tone: 'open', label: 'OPEN', title: 'The current evidence still permits different specified consequences.', summary: `${result.analysis.compatibleWorlds.length} compatible realizations produce ${closure.consequences.length} consequences. ${family.length} exact inclusion-minimal obligation set${family.length === 1 ? '' : 's'} remain.` };
  }
  const value = valueText(closure.consequence);
  const safe = /^(SAFE|ALLOW|OK|SUCCESS)$/i.test(value);
  const adverse = /^(UNSAFE|DENY|ERROR|ADVERSE|BLOCK)$/i.test(value);
  return { tone: safe ? 'safe' : adverse ? 'unsafe' : 'verified', label: `CLOSED · ${value}`, title: 'No compatible realization changes the specified consequence.', summary: `Every admissible realization compatible with the current evidence yields ${value}. Closure means determinacy, not permission or desirability.` };
}

function setLoadedControls() {
  const loaded = Boolean(state.primary);
  $('#resetBtn').disabled = !(loaded && state.primary.sessionId && state.primary.result?.profile && !sameJson(state.primary.result.evidence, state.baselineEvidence));
  $('#exportBtn').disabled = !(loaded && state.primary.sessionId);
  $$('.mode').forEach((button) => {
    if (button.dataset.mode === 'compare') return;
    button.disabled = !loaded;
  });
}

function updateIdentity() {
  if (!state.primary) {
    $('#recordIdentity').innerHTML = '<span>No record loaded</span>';
    return;
  }
  const result = state.primary.result;
  const digest = result.sourceFileDigest || result.sourceDigest || result.recordIntegrity?.computed || '';
  $('#recordIdentity').innerHTML = `<span><strong>${esc(recordTitle(result, state.primary.sampleId))}</strong> · ${esc(sourceFormat(result))}${digest ? ` · <code>${esc(digest.slice(0, 34))}${digest.length > 34 ? '…' : ''}</code>` : ''}</span>`;
}

function showLoaded() {
  $('#welcomeView').classList.remove('active');
  showMode(state.activeMode === 'compare' ? 'decision' : state.activeMode);
}

function showMode(mode) {
  state.activeMode = mode;
  $$('.mode').forEach((button) => button.classList.toggle('active', button.dataset.mode === mode));
  $$('.view').forEach((view) => view.classList.toggle('active', view.dataset.view === mode));
  if (mode === 'compare') renderCompare();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function profileCandidateMap(result) {
  return Object.fromEntries((result.profile?.candidates || []).map((candidate) => [candidate.id, candidate]));
}

function profileMetrics(result) {
  return [
    ['Compatible realizations', result.analysis.compatibleWorlds.length],
    ['Specified consequences', result.analysis.closure.status === 'OPEN' ? result.analysis.closure.consequences.length : 1],
    ['Minimal obligation sets', result.analysis.closure.status === 'OPEN' ? (result.analysis.inclusionMinimalAdditionalBases || []).length : 0],
  ];
}

function otherMetrics(result) {
  if (result.kind === 'oauth') return [
    ['Paired control', result.controls?.pairedControlPresent ? 'yes' : 'no'],
    ['Same action path', result.controls?.sameActionPath ? 'yes' : 'no'],
    ['Subtype', result.subtype || 'n/a'],
  ];
  if (result.kind === 'commissioning-summary') return [
    ['Semantic repair', result.source?.semanticRepair ?? 'n/a'],
    ['Provider branches', result.source?.providerSpecificBranchesInSemanticChecker ?? 'n/a'],
    ['Reference match', result.referenceDigestMatch ? 'yes' : 'no'],
  ];
  if (result.kind === 'inspection-record') return [
    ['Integrity', result.recordIntegrity?.verified ? 'verified' : 'mismatch'],
    ['Source kind', result.source?.kind || 'n/a'],
    ['Core version', result.source?.coreVersion || 'n/a'],
  ];
  return [];
}

function witnessHtml(result, witness = null) {
  if (!result?.profile || !result?.analysis) return '<div class="empty">No Core materiality witness is available for this input surface.</div>';
  const activeWitness = witness || result.currentWitnessRecord || result.analysis.witness;
  if (!activeWitness) return '<div class="empty">No consequence-divergent materiality witness remains at this evidence cut.</div>';
  const worldA = activeWitness.worldA?.id ? activeWitness.worldA : result.analysis.compatibleWorlds.find((world) => world.id === activeWitness.worldA);
  const worldB = activeWitness.worldB?.id ? activeWitness.worldB : result.analysis.compatibleWorlds.find((world) => world.id === activeWitness.worldB);
  if (!worldA || !worldB) return '<div class="empty">The witness worlds are not present in the current compatible realization set.</div>';
  const consequenceA = Object.prototype.hasOwnProperty.call(activeWitness, 'consequenceA') ? activeWitness.consequenceA : worldConsequenceFromResult(result, worldA);
  const consequenceB = Object.prototype.hasOwnProperty.call(activeWitness, 'consequenceB') ? activeWitness.consequenceB : worldConsequenceFromResult(result, worldB);
  const map = profileCandidateMap(result);
  const differences = (activeWitness.differences || result.analysis.witnessDifferences || []).map((item) => ({
    label: item.label || map[item.id]?.label || item.id,
    a: Object.prototype.hasOwnProperty.call(item, 'a') ? item.a : item.aValue,
    b: Object.prototype.hasOwnProperty.call(item, 'b') ? item.b : item.bValue,
  }));
  return `<div class="witness-pair"><article class="world"><header><span>${esc(worldA.id)}</span><span>world A</span></header><strong>${esc(valueText(consequenceA))}</strong><small>specified consequence</small></article><div class="versus">VS</div><article class="world"><header><span>${esc(worldB.id)}</span><span>world B</span></header><strong>${esc(valueText(consequenceB))}</strong><small>specified consequence</small></article></div>${differences.length ? `<div class="diff-table">${differences.map((difference) => `<div class="diff-row"><b>${esc(difference.label)}</b><span class="code-value">${esc(valueText(difference.a))}</span><span class="code-value">${esc(valueText(difference.b))}</span></div>`).join('')}</div>` : ''}`;
}

function worldConsequenceFromResult(result, world) {
  if (result.outcomesByWorldId && Object.prototype.hasOwnProperty.call(result.outcomesByWorldId, world.id)) return result.outcomesByWorldId[world.id];
  if (Object.prototype.hasOwnProperty.call(world, 'consequence')) return world.consequence;
  const matching = result.analysis?.closure?.consequences || [];
  if (matching.length === 1) return matching[0];
  return 'derived';
}

function renderNext(result) {
  if (!result.profile || !result.analysis) {
    if (result.kind === 'oauth') return `<div class="next-step"><strong>Read the operativity contrast</strong><p>The classification is grounded in authority state, the protected action path, and paired controls at the measured cut.</p></div>`;
    if (result.kind === 'commissioning-summary') return `<div class="next-step"><strong>Check frozen identity before relying on the gate</strong><p>An imported self-reported PASS does not inherit the bundled Keycloak status unless the normalized record digest matches.</p></div>`;
    if (result.kind === 'inspection-record') return `<div class="next-step"><strong>Open the original semantic source for full replay</strong><p>The inspection record carries a digest and certificate summary, but it is not itself a substitute for the source model or evidence record.</p></div>`;
    return '';
  }
  if (result.analysis.closure.status === 'CLOSED') return '<div class="next-step"><strong>No further establishment is required for determinacy at this cut.</strong><p>Any decision to execute, suppress, remediate, or escalate remains outside the closure result.</p></div>';
  if (result.analysis.closure.status === 'IMPOSSIBLE') return '<div class="next-step"><strong>Repair the evidence or boundary declaration.</strong><p>No admissible realization remains compatible, so the current record cannot support a consequence result.</p></div>';
  if (result.analysis.obligationStatus === 'UNRESOLVABLE_UNDER_DECLARED_EVIDENCE_SURFACE') return '<div class="next-step"><strong>Expand the declared Proposition vocabulary in a new analysis.</strong><p>Do not invent a result-shaped fact after seeing the outcome. The current surface cannot distinguish every material pair.</p></div>';
  const map = profileCandidateMap(result);
  const selected = result.analysis.selectedObligationSet || [];
  const root = result.route?.status === 'ROUTE_FOUND' ? result.route.nodes?.[result.route.root] : null;
  if (root?.type === 'action') return `<div class="next-step"><strong>${esc(root.label || root.actionId)}</strong><p>First declared Establishment on the least worst-case-cost valid model route. The selected obligation set is ${selected.map((id) => esc(map[id]?.label || id)).join('; ') || 'empty'}.</p><span class="kind-tag">${esc(root.kind === 'epistemic_observation' ? 'observe information' : 'change operative state')}</span></div>`;
  return selected.length ? selected.map((id) => `<div class="next-step"><strong>${esc(map[id]?.label || id)}</strong><p>Member of the deterministic selected inclusion-minimal sufficient set. No successful declared closure route is available from this cut.</p></div>`).join('') : '<div class="empty">No selected obligation set is available.</div>';
}

function renderDecision() {
  const result = state.primary?.result;
  if (!result) return;
  const summary = resultSummary(result);
  const metrics = result.profile ? profileMetrics(result) : otherMetrics(result);
  const title = recordTitle(result, state.primary.sampleId);
  const fileDigest = result.sourceFileDigest || result.sourceDigest || result.recordIntegrity?.computed || '';
  let secondary = '';
  if (result.profile) secondary = `<div class="two-up"><section class="panel"><div class="panel-head"><div><span class="mini-label">What can close the gap</span><h2>Next semantic move</h2></div><button class="quiet-button inline-jump" data-jump="route" type="button">Route</button></div>${renderNext(result)}</section><section class="panel"><div class="panel-head"><div><span class="mini-label">Materiality witness</span><h2>Why the result changes</h2></div><button class="quiet-button inline-jump" data-jump="challenge" type="button">Challenge</button></div>${witnessHtml(result)}</section></div>`;
  else if (result.kind === 'oauth') secondary = `<div class="two-up"><section class="panel"><div class="panel-head"><div><span class="mini-label">Operativity</span><h2>Authority and effect</h2></div></div>${renderOauthContrast(result)}</section><section class="panel"><div class="panel-head"><div><span class="mini-label">Qualification</span><h2>Paired-control gates</h2></div></div>${renderOauthControls(result)}</section></div>`;
  else if (result.kind === 'inspection-record') secondary = renderRecordIntegrity(result);
  else secondary = `<div class="two-up"><section class="panel"><div class="panel-head"><div><span class="mini-label">Commissioning contrast</span><h2>Live and controlled stale paths</h2></div></div>${renderCommissionContrast(result)}</section><section class="panel"><div class="panel-head"><div><span class="mini-label">Identity</span><h2>Frozen runtime gate</h2></div></div>${renderNext(result)}</section></div>`;
  $('#decisionView').innerHTML = `<section class="decision-hero"><div class="decision-main"><div class="status-line"><span class="status-chip ${summary.tone}">${esc(summary.label)}</span><span class="status-chip neutral">${esc(sourceFormat(result))}</span></div><h1>${esc(summary.title)}</h1><p>${esc(summary.summary)}</p><div class="decision-question"><strong>${esc(title)}</strong>${fileDigest ? ` · <span class="identity-value">${esc(fileDigest)}</span>` : ''}</div></div><aside class="decision-side">${metrics.map(([label, value]) => `<div class="metric"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('')}</aside></section>${secondary}`;
  $$('.inline-jump').forEach((button) => button.addEventListener('click', () => showMode(button.dataset.jump)));
}

function renderOauthContrast(result) {
  const active = result.evidence?.target?.introspection?.body?.active;
  const post = result.evidence?.target?.postProbe?.httpStatus;
  return `<div class="witness-pair"><article class="world"><header><span>authority</span><span>recorded</span></header><strong>${esc(active === false ? 'inactive' : 'revocation state')}</strong><small>authority side</small></article><div class="versus">VS</div><article class="world"><header><span>resource</span><span>observed</span></header><strong>${esc(post ?? 'missing')}</strong><small>protected action HTTP status</small></article></div>`;
}

function renderOauthControls(result) {
  const controls = result.controls || {};
  const entries = Object.entries(controls);
  return entries.length ? `<div class="diff-table">${entries.map(([key, value]) => `<div class="diff-row"><b>${esc(humanize(key))}</b><span class="code-value ${value ? 'good-text' : 'bad-text'}">${value ? 'satisfied' : 'open'}</span><span></span></div>`).join('')}</div>` : '<div class="empty">No qualification controls were supplied.</div>';
}

function renderCommissionContrast(result) {
  const source = result.source || {};
  const live = source.runs?.live || {};
  const stale = source.runs?.staleCacheNegativeControl || {};
  return `<div class="witness-pair"><article class="world"><header><span>live</span><span>${esc(live.subtype || '')}</span></header><strong>${esc(live.verdict || 'n/a')}</strong><small>frozen live run</small></article><div class="versus">VS</div><article class="world"><header><span>stale control</span><span>${esc(stale.subtype || '')}</span></header><strong>${esc(stale.verdict || 'n/a')}</strong><small>controlled negative path</small></article></div>`;
}

function renderRecordIntegrity(result) {
  const integrity = result.recordIntegrity || {};
  return `<section class="record-integrity"><span class="status-chip ${integrity.verified ? 'verified' : 'unsafe'}">${integrity.verified ? 'INTEGRITY VERIFIED' : 'DIGEST MISMATCH'}</span><h1>Inspection record integrity</h1><p>The current hosted surface recomputed the deterministic record digest using the frozen engine hashing rules. This verifies the record's own byte-value content, not the external truth or full semantic source behind it.</p><div class="kv"><div class="kv-row"><span>Claimed digest</span><b class="identity-value">${esc(integrity.claimed || 'missing')}</b></div><div class="kv-row"><span>Computed digest</span><b class="identity-value">${esc(integrity.computed || 'missing')}</b></div><div class="kv-row"><span>Original source digest</span><b class="identity-value">${esc(result.source?.sourceDigest || 'not carried')}</b></div></div></section>`;
}

function familyLabel(result, basis) {
  const map = profileCandidateMap(result);
  if (!basis.length) return 'No additional propositions required';
  return basis.map((id) => map[id]?.label || id).join(' + ');
}

function certificateHtml(result, certificate) {
  if (!certificate) return '<div class="empty">Select an inclusion-minimal set to replay its certificate.</div>';
  const map = profileCandidateMap(result);
  const good = certificate.sufficiencyVerified && certificate.inclusionMinimalVerified;
  return `<div class="certificate-status"><span class="status-chip ${certificate.sufficiencyVerified ? 'safe' : 'unsafe'}">${certificate.sufficiencyVerified ? 'SUFFICIENT' : 'NOT SUFFICIENT'}</span><span class="status-chip ${certificate.inclusionMinimalVerified ? 'verified' : 'unsafe'}">${certificate.inclusionMinimalVerified ? 'INCLUSION MINIMAL' : 'MINIMALITY FAILED'}</span></div><p class="evidence-note">The full set must distinguish every consequence-divergent compatible pair. Each removal row below supplies a concrete counterexample after one Proposition is removed.</p>${(certificate.removalWitnesses || []).map((item) => `<div class="certificate-row"><strong>${esc(map[item.propositionId]?.label || item.propositionId)}</strong>${item.witness ? `<p>Remove it and ${esc(item.witness.worldA)} / ${esc(item.witness.worldB)} still agree on the remaining selected obligations while yielding <span class="code-value">${esc(valueText(item.witness.consequenceA))}</span> vs <span class="code-value">${esc(valueText(item.witness.consequenceB))}</span>.</p>` : '<p class="bad-text">No removal witness was found.</p>'}</div>`).join('')}${good ? '' : '<div class="error">This certificate did not satisfy the expected exact checks.</div>'}`;
}

function evidenceControlsHtml(result) {
  const evidence = result.evidence || {};
  const candidates = result.profile?.candidates || [];
  return candidates.length ? `<div class="evidence-controls">${candidates.map((candidate) => {
    const values = [];
    const seen = new Set();
    for (const world of result.profile.boundary.worlds) {
      const raw = JSON.stringify(world.facts[candidate.id]);
      if (!seen.has(raw)) { seen.add(raw); values.push(world.facts[candidate.id]); }
    }
    const known = Object.prototype.hasOwnProperty.call(evidence, candidate.id);
    return `<div class="evidence-control"><label for="evidence-${esc(candidate.id)}">${esc(candidate.label || candidate.id)}</label><select class="evidence-select" id="evidence-${esc(candidate.id)}" data-id="${esc(candidate.id)}"><option value="__unknown" ${known ? '' : 'selected'}>Unknown</option>${values.map((value) => `<option value="${esc(JSON.stringify(value))}" ${known && JSON.stringify(evidence[candidate.id]) === JSON.stringify(value) ? 'selected' : ''}>${esc(valueText(value))}</option>`).join('')}</select></div>`;
  }).join('')}</div><p class="evidence-note">Changing a value recomputes the exact compatible realization set, closure status, obligation family, and route in the Web Worker. It does not modify the source file.</p>` : '<div class="empty">This profile declares no candidate Propositions.</div>';
}

async function selectBasis(basis) {
  if (!state.primary?.sessionId) return;
  busy(true, 'Replaying obligation certificate');
  try {
    const response = await workerRequest('certificate', { sessionId: state.primary.sessionId, basis });
    state.selectedBasis = [...basis];
    state.selectedCertificate = response.certificate;
    renderChallenge();
  } catch (error) {
    toast(error.message);
  } finally {
    busy(false);
  }
}

function renderChallenge() {
  const result = state.primary?.result;
  if (!result) return;
  if (result.kind === 'oauth') {
    $('#challengeView').innerHTML = `<div class="two-up"><section class="panel"><div class="panel-head"><div><span class="mini-label">Operativity witness</span><h2>Authority is not the effect</h2></div></div>${renderOauthContrast(result)}</section><section class="panel"><div class="panel-head"><div><span class="mini-label">Qualification controls</span><h2>What SAFE AT CUT requires</h2></div></div>${renderOauthControls(result)}<p class="evidence-note">These controls qualify the measured path and cut. They do not uniquely identify revocation as the cause of a blocked request.</p></section></div>`;
    return;
  }
  if (result.kind === 'commissioning-summary') {
    $('#challengeView').innerHTML = `<div class="two-up"><section class="panel">${renderCommissionContrast(result)}</section><section class="panel"><div class="panel-head"><div><span class="mini-label">Identity challenge</span><h2>Do not promote a look-alike PASS</h2></div></div><div class="kv"><div class="kv-row"><span>Loaded digest</span><b class="identity-value">${esc(result.sourceDigest)}</b></div><div class="kv-row"><span>Bundled reference match</span><b>${result.referenceDigestMatch ? 'yes' : 'no'}</b></div></div></section></div>`;
    return;
  }
  if (result.kind === 'inspection-record') {
    $('#challengeView').innerHTML = renderRecordIntegrity(result);
    return;
  }
  const analysis = result.analysis;
  const families = analysis.inclusionMinimalAdditionalBases || [];
  if (analysis.closure.status !== 'OPEN') {
    $('#challengeView').innerHTML = `<div class="panel"><div class="panel-head"><div><span class="mini-label">Current cut</span><h2>No materiality challenge remains</h2></div></div>${witnessHtml(result)}${evidenceControlsHtml(result)}</div>`;
    bindEvidenceControls();
    return;
  }
  if (analysis.obligationStatus === 'UNRESOLVABLE_UNDER_DECLARED_EVIDENCE_SURFACE') {
    $('#challengeView').innerHTML = `<div class="error"><strong>UNRESOLVABLE UNDER DECLARED EVIDENCE SURFACE</strong><br>No subset of the declared candidate Propositions distinguishes every current consequence-divergent pair. The declaration must be expanded in a new analysis instance.</div><div class="panel space-top"><div class="panel-head"><div><span class="mini-label">Materiality witness</span><h2>The unresolved consequence difference</h2></div></div>${witnessHtml(result)}${evidenceControlsHtml(result)}</div>`;
    bindEvidenceControls();
    return;
  }
  const selected = state.selectedBasis || analysis.selectedObligationSet || families[0] || [];
  const cert = state.selectedCertificate || analysis.selectedBasisCertificate;
  const visible = families.slice(0, state.basisLimit);
  $('#challengeView').innerHTML = `<div class="challenge-layout"><div class="challenge-stack"><section class="panel"><div class="panel-head"><div><span class="mini-label">Materiality witness</span><h2>The concrete reason the cut is still open</h2></div><span>${analysis.compatibleWorlds.length} compatible worlds</span></div>${witnessHtml(result)}</section><section class="panel"><div class="panel-head"><div><span class="mini-label">Exact obligation family</span><h2>${families.length} inclusion-minimal set${families.length === 1 ? '' : 's'}</h2></div><span>${visible.length} shown</span></div><div class="basis-family">${visible.map((basis, index) => `<button class="basis-button ${sameJson(basis, selected) ? 'active' : ''}" data-basis-index="${index}" type="button"><span>Exact set ${index + 1}</span><strong>${esc(familyLabel(result, basis))}</strong></button>`).join('')}</div>${families.length > visible.length ? `<button class="quiet-button more-button" id="showMoreBases" type="button">Show ${Math.min(60, families.length - visible.length)} more exact sets</button>` : ''}</section></div><div class="challenge-stack"><section class="panel"><div class="panel-head"><div><span class="mini-label">Replayable certificate</span><h2>${esc(familyLabel(result, selected))}</h2></div></div><div id="certificateBody">${certificateHtml(result, cert)}</div></section><section class="panel"><div class="panel-head"><div><span class="mini-label">Counterfactual cut</span><h2>Change the evidence and recompute</h2></div><button class="quiet-button" id="challengeReset" type="button" ${sameJson(result.evidence, state.baselineEvidence) ? 'disabled' : ''}>Reset</button></div>${evidenceControlsHtml(result)}</section></div></div>`;
  $$('.basis-button').forEach((button) => button.addEventListener('click', () => selectBasis(visible[Number(button.dataset.basisIndex)])));
  $('#showMoreBases')?.addEventListener('click', () => { state.basisLimit += 60; renderChallenge(); });
  $('#challengeReset')?.addEventListener('click', resetEvidence);
  bindEvidenceControls();
}

function bindEvidenceControls() {
  $$('.evidence-select').forEach((select) => select.addEventListener('change', async () => {
    if (!state.primary?.sessionId) return;
    const evidence = { ...(state.primary.result.evidence || {}) };
    if (select.value === '__unknown') delete evidence[select.dataset.id];
    else evidence[select.dataset.id] = JSON.parse(select.value);
    await recomputeEvidence(evidence);
  }));
}

async function recomputeEvidence(evidence) {
  busy(true, 'Recomputing the exact cut');
  try {
    const response = await workerRequest('recompute', { sessionId: state.primary.sessionId, evidence });
    state.primary.result = response.result;
    state.selectedBasis = response.result.analysis?.selectedObligationSet || null;
    state.selectedCertificate = response.result.analysis?.selectedBasisCertificate || null;
    state.basisLimit = 60;
    state.worldLimit = 60;
    renderAll();
    toast('Exact analysis recomputed');
  } catch (error) {
    toast(error.message);
  } finally {
    busy(false);
  }
}

async function resetEvidence() {
  if (!state.primary?.sessionId || !state.baselineEvidence) return;
  await recomputeEvidence(state.baselineEvidence);
}

function routeNodeHtml(route, id) {
  const node = route?.nodes?.[id];
  if (!node) return '';
  if (node.type === 'terminal') return `<div class="route-node"><div class="route-node-card"><strong>${esc(node.closure.status)}${node.closure.consequence !== null ? ` · ${esc(valueText(node.closure.consequence))}` : ''}</strong><span>${esc(node.count)} compatible realization${node.count === 1 ? '' : 's'}</span></div></div>`;
  return `<div class="route-node"><div class="route-node-card"><strong>${esc(node.label || node.actionId)}</strong><span>${esc(humanize(node.kind || 'establishment'))} · declared cost ${esc(node.cost)}</span></div>${(node.branches || []).map((branch) => `<div class="route-branch">Outcome ${esc(valueText(branch.outcome))} · ${esc(branch.count)} realization${branch.count === 1 ? '' : 's'}</div>${routeNodeHtml(route, branch.nodeId)}`).join('')}</div>`;
}

function renderRoute() {
  const result = state.primary?.result;
  if (!result) return;
  if (result.profile) {
    if (result.analysis.closure.status === 'CLOSED') { $('#routeView').innerHTML = '<div class="empty">The current evidence is already consequence closed. No additional model route is required.</div>'; return; }
    if (result.route?.status !== 'ROUTE_FOUND') { $('#routeView').innerHTML = '<div class="error">No successful model-relative closure route exists under the declared Establishments at this cut.</div>'; return; }
    const root = result.route.nodes?.[result.route.root];
    $('#routeView').innerHTML = `<section class="route-summary"><div><strong>${esc(root?.label || 'Declared closure route')}</strong><p>Every reachable leaf is consequence closed before cost is considered. Source-system transfer requires applicable P2 enabledness and successor-preservation evidence.</p></div><div class="route-cost"><span>Least worst-case cost</span><b>${esc(result.route.totalCost)}</b></div></section><div class="route-tree">${routeNodeHtml(result.route, result.route.root)}</div><div class="notice space-top"><strong>Model-relative only.</strong> The Inspector does not infer P2 or source-system route validity from a successful Core route.</div>`;
    return;
  }
  if (result.kind === 'oauth') {
    const steps = ['Issue target and control tokens','Establish both prerevocation baselines','Revoke only the target token','Record authority state when available','Probe control before target','Probe target after revocation','Probe control after target','Compile the qualified profile record'];
    $('#routeView').innerHTML = `<section class="route-summary"><div><strong>Paired-control evidence route</strong><p>The OAuth commissioner follows a fixed measurement path that brackets the target postrevocation probe with healthy controls.</p></div><div class="route-cost"><span>Classification</span><b>${esc(result.verdict)}</b></div></section><div class="panel space-top">${steps.map((step, index) => `<div class="next-step"><strong>${index + 1}. ${esc(step)}</strong></div>`).join('')}</div>`;
    return;
  }
  $('#routeView').innerHTML = '<div class="empty">This input surface records a completed artifact or gate rather than a synthesized Core closure route.</div>';
}

function assuranceRows(result) {
  if (result.kind === 'inspection-record') {
    const record = result.source || {};
    return [
      ['Record integrity', result.recordIntegrity?.verified ? 'ESTABLISHED' : 'FAILED', result.recordIntegrity?.verified ? 'The deterministic inspection-record digest matches the loaded content.' : 'The deterministic record digest does not match.'],
      ['Core result', 'CARRIED', `The export carries ${record.closure?.status || record.classification?.verdict || 'a recorded'} result. Semantic replay requires the original source.`],
      ['Source preservation', 'CARRIED QUALIFICATION', record.route?.sourceTransferClaim || 'No source-transfer claim was carried.'],
      ['Cut adequacy', record.cutAdequacy?.status || 'UNASSESSED', record.cutAdequacy?.note || 'No explicit cut-adequacy note was carried.'],
    ];
  }
  if (result.profile) {
    const qualification = result.profile.boundary?.qualification || 'No Boundary qualification supplied.';
    const cut = result.profile.boundary?.cutAdequacy;
    return [
      ['Core exactness', 'ESTABLISHED', `Exact finite analysis over ${result.analysis.compatibleWorlds.length} compatible realization${result.analysis.compatibleWorlds.length === 1 ? '' : 's'} at the current cut.`],
      ['Source derivation', result.kind === 'trace' ? 'DERIVED' : 'TRUSTED INPUT', result.kind === 'trace' ? 'The constrained authority trace was compiled through the frozen derivation path. Derivation alone does not establish source preservation.' : 'The loaded file is already a semantic profile. Source-to-Core conformance is outside the profile unless separately certified.'],
      ['P0 status preservation', 'NOT ESTABLISHED', 'The current hosted layer does not infer source/Core status preservation from a loaded profile or derivation alone.'],
      ['P1 obligation preservation', 'NOT ESTABLISHED', 'The current hosted layer does not transfer Core obligation families to a source without separate P1 evidence.'],
      ['P2 route preservation', 'NOT ESTABLISHED', 'A successful model route is not a source-system route unless enabledness and labeled successor structure are separately preserved.'],
      ['Cut adequacy', cut?.status || 'UNASSESSED', cut?.note || cut?.qualification || 'No explicit cut-adequacy record was supplied. Later action-effect claims remain qualified to the declared boundary.'],
      ['Boundary qualification', 'DECLARED', qualification],
    ];
  }
  if (result.kind === 'oauth') return [
    ['Operational classification', 'ESTABLISHED AT CUT', `The loaded evidence classifies the measured action path as ${result.verdict}${result.subtype ? ` · ${result.subtype}` : ''}.`],
    ['Core closure alias', 'NOT CLAIMED', 'SAFE AT CUT and UNSAFE are operational profile classifications, not aliases for Core CLOSED or OPEN.'],
    ['Causal attribution', 'QUALIFIED', 'Paired controls constrain specified alternatives but do not uniquely identify revocation as the cause of a blocked request.'],
    ['Action cut', result.auditCut ? 'RECORDED' : 'UNASSESSED', result.auditCut || 'No audit cut supplied.'],
  ];
  return [
    ['Commissioning identity', result.referenceDigestMatch ? 'FROZEN MATCH' : 'UNPROMOTED', result.referenceDigestMatch ? 'The normalized summary digest matches the bundled Keycloak reference record.' : 'An imported PASS is not promoted to the bundled reference status.'],
    ['Semantic repair', String(result.source?.semanticRepair ?? 'unknown'), 'The frozen checker was commissioned without changing the semantic checker for the pinned run when this value is zero.'],
    ['Provider-specific branches', String(result.source?.providerSpecificBranchesInSemanticChecker ?? 'unknown'), 'This is a commissioning property, not a general carrier-neutrality proof.'],
    ['P1/P2 transfer', 'NOT CLAIMED', 'The Keycloak commissioning summary is not a general P1 or P2 certificate for Keycloak.'],
  ];
}

function worldCard(result, world) {
  const candidates = result.profile?.candidates || [];
  const consequence = worldConsequenceFromResult(result, world);
  return `<article class="world-card"><header><strong>${esc(world.id)}</strong><span>${esc(valueText(consequence))}</span></header>${candidates.map((candidate) => `<div class="world-fact"><span>${esc(candidate.label || candidate.id)}</span><code>${esc(valueText(world.facts[candidate.id]))}</code></div>`).join('')}</article>`;
}

function renderBoundary() {
  const result = state.primary?.result;
  if (!result) return;
  const rows = assuranceRows(result);
  let worlds = '';
  if (result.profile && result.analysis) {
    const compatible = result.analysis.compatibleWorlds || [];
    const visible = compatible.slice(0, state.worldLimit);
    worlds = `<section class="panel space-top"><div class="panel-head"><div><span class="mini-label">Compatible realizations</span><h2>Current finite boundary</h2></div><span>${visible.length} of ${compatible.length} shown</span></div><div class="world-grid">${visible.map((world) => worldCard(result, world)).join('')}</div>${compatible.length > visible.length ? `<button class="quiet-button more-button" id="showMoreWorlds" type="button">Show ${Math.min(60, compatible.length - visible.length)} more worlds</button>` : ''}<p class="evidence-note">Display pagination does not change the exact analysis. All compatible worlds are used by the frozen engine.</p></section>`;
  }
  $('#boundaryView').innerHTML = `<section class="assurance-ladder">${rows.map(([layer, status, explanation]) => `<div class="assurance-row"><span>${esc(layer)}</span><b class="${/ESTABLISHED|FROZEN MATCH|RECORDED|DECLARED/.test(status) ? 'established' : /QUALIFIED|UNASSESSED|TRUSTED|DERIVED|CARRIED/.test(status) ? 'qualified' : 'not-established'}">${esc(status)}</b><p>${esc(explanation)}</p></div>`).join('')}</section>${worlds}`;
  $('#showMoreWorlds')?.addEventListener('click', () => { state.worldLimit += 60; renderBoundary(); });
}

function compactResult(result, title) {
  const summary = resultSummary(result);
  const metrics = result.profile ? profileMetrics(result) : otherMetrics(result);
  return `<article class="compare-card"><span class="status-chip ${summary.tone}">${esc(summary.label)}</span><h2>${esc(title)}</h2><p>${esc(summary.title)}</p>${metrics.map(([label, value]) => `<div class="metric"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('')}</article>`;
}

function compareRows(left, right) {
  const l = resultSummary(left), r = resultSummary(right);
  const rows = [['Status', l.label, r.label]];
  if (left.profile && right.profile) {
    rows.push(['Compatible realizations', left.analysis.compatibleWorlds.length, right.analysis.compatibleWorlds.length]);
    rows.push(['Minimal obligation sets', (left.analysis.inclusionMinimalAdditionalBases || []).length, (right.analysis.inclusionMinimalAdditionalBases || []).length]);
    rows.push(['Selected obligations', (left.analysis.selectedObligationSet || []).join(', ') || 'none', (right.analysis.selectedObligationSet || []).join(', ') || 'none']);
    rows.push(['Route', left.route?.status || 'none', right.route?.status || 'none']);
  } else if (left.kind === 'oauth' && right.kind === 'oauth') {
    rows.push(['Subtype', left.subtype || 'n/a', right.subtype || 'n/a']);
    rows.push(['Paired control', left.controls?.pairedControlPresent ? 'yes' : 'no', right.controls?.pairedControlPresent ? 'yes' : 'no']);
    rows.push(['Same action path', left.controls?.sameActionPath ? 'yes' : 'no', right.controls?.sameActionPath ? 'yes' : 'no']);
  }
  rows.push(['Source digest', left.sourceDigest || 'n/a', right.sourceDigest || 'n/a']);
  return rows;
}

function renderCompare() {
  const target = $('#compareView');
  const presets = `<div class="compare-toolbar"><button class="quiet-button compare-preset" data-pair="linux" type="button">Linux administrative → operative</button><button class="quiet-button compare-preset" data-pair="oauth" type="button">OAuth live → split state</button><button class="quiet-button" id="compareFileBtn" type="button" ${state.primary ? '' : 'disabled'}>Compare with local file</button><button class="quiet-button" id="compareBaselineBtn" type="button" ${state.primary?.result?.profile ? '' : 'disabled'}>Baseline → current cut</button></div>`;
  let comparison = state.compare;
  if (!comparison && state.primary?.result?.profile && state.baselineResult) comparison = { left: state.baselineResult, right: state.primary.result, leftTitle: 'Baseline cut', rightTitle: 'Current cut', label: 'Baseline and current hypothetical evidence' };
  if (!comparison) {
    target.innerHTML = `${presets}<div class="empty">Choose a recorded contrast, or load a primary record and compare it with a second local artifact. The two sides remain separate analyses.</div>`;
    bindCompareControls();
    return;
  }
  const rows = compareRows(comparison.left, comparison.right);
  target.innerHTML = `${presets}<div class="compare-layout">${compactResult(comparison.left, comparison.leftTitle || 'Left analysis')}${compactResult(comparison.right, comparison.rightTitle || 'Right analysis')}<section class="compare-diff"><div class="panel-head"><div><span class="mini-label">Transition ledger</span><h2>${esc(comparison.label || 'Independent analysis comparison')}</h2></div></div>${rows.map(([label, left, right]) => `<div class="compare-diff-row"><span>${esc(label)}</span><b class="identity-value">${esc(left)}</b><span class="compare-arrow">→</span><b class="identity-value">${esc(right)}</b></div>`).join('')}</section></div>`;
  bindCompareControls();
}

function bindCompareControls() {
  $$('.compare-preset').forEach((button) => button.addEventListener('click', () => loadComparePreset(button.dataset.pair)));
  $('#compareFileBtn')?.addEventListener('click', openCompareFile);
  $('#compareBaselineBtn')?.addEventListener('click', () => {
    if (!state.primary?.result?.profile || !state.baselineResult) return;
    state.compare = { left: state.baselineResult, right: state.primary.result, leftTitle: 'Baseline cut', rightTitle: 'Current cut', label: 'Baseline and current hypothetical evidence' };
    renderCompare();
  });
}

async function loadComparePreset(pair) {
  const ids = pair === 'linux' ? ['linux-admin', 'linux-operative'] : ['oauth-live', 'oauth-stale'];
  busy(true, 'Analyzing recorded contrast');
  try {
    const [left, right] = await Promise.all(ids.map((sampleId) => workerRequest('inspect-input', { input: referenceInput(sampleId) })));
    state.compare = {
      left: left.result,
      right: right.result,
      leftTitle: REFERENCE_META[ids[0]].title,
      rightTitle: REFERENCE_META[ids[1]].title,
      label: pair === 'linux' ? 'Administrative declaration and operative enforcement' : 'Qualified live path and authority-resource split state',
    };
    showMode('compare');
  } catch (error) {
    toast(error.message);
  } finally {
    busy(false);
  }
}

function openCompareFile() {
  if (!state.primary) return;
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json,.json';
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (!file) return;
    busy(true, 'Analyzing comparison artifact');
    try {
      const buffer = await file.arrayBuffer();
      if (buffer.byteLength > MAX_INPUT_BYTES) throw new Error('Comparison input exceeds the 16 MB current hosted limit.');
      const response = await workerRequest('inspect-bytes', { bytes: buffer, fileName: file.name }, [buffer]);
      state.compare = { left: state.primary.result, right: response.result, leftTitle: recordTitle(state.primary.result, state.primary.sampleId), rightTitle: file.name, label: 'Primary record and local comparison artifact' };
      showMode('compare');
    } catch (error) {
      toast(error.message);
    } finally {
      busy(false);
    }
  }, { once: true });
  input.click();
}

function sourceKv(result) {
  const rows = [
    ['Input surface', sourceFormat(result)],
    ['Normalized source digest', result.sourceDigest || result.source?.sourceDigest || 'n/a'],
  ];
  if (result.sourceFileName) rows.push(['Loaded file', result.sourceFileName]);
  if (result.sourceFileDigest) rows.push(['Exact file-byte digest', result.sourceFileDigest]);
  if (Number.isInteger(result.sourceFileBytes)) rows.push(['File bytes', result.sourceFileBytes]);
  if (result.profile) rows.push(['Inspector semantics', 'Frozen v0.5.0 · Core v0.1.0']);
  if (result.kind === 'inspection-record') rows.push(['Record digest', result.recordIntegrity?.computed || 'n/a']);
  return rows;
}

function rawSource(result) {
  return result.kind === 'oauth' ? result.evidence : result.source;
}

function renderSource() {
  const result = state.primary?.result;
  if (!result) return;
  $('#sourceView').innerHTML = `<div class="source-grid"><section><div class="kv">${sourceKv(result).map(([label, value]) => `<div class="kv-row"><span>${esc(label)}</span><b class="${String(value).startsWith('sha256:') ? 'identity-value' : ''}">${esc(value)}</b></div>`).join('')}</div><div class="notice space-top"><strong>Current hosted layer.</strong> Semantic evaluation is delegated to the exact frozen v0.5.0 engine in an ephemeral Web Worker. The presentation layer adds comparison, challenge navigation, progressive rendering, and inspection-record integrity checking without changing the Core algorithms.</div><div class="panel space-top"><div class="panel-head"><div><span class="mini-label">Research record</span><h2>Reproducibility anchors</h2></div></div><div class="next-step"><strong><a href="/tools/consequence-closure/inspector/" target="_blank" rel="noopener">Frozen v0.5.0 hosted copy</a></strong><p>Exact five-file browser release.</p></div><div class="next-step"><strong><a href="https://doi.org/10.5281/zenodo.22095595">Software DOI 10.5281/zenodo.22095595</a></strong><p>Archival software record.</p></div><div class="next-step"><strong><a href="/tools/consequence-closure/current/provenance.json">Current host provenance</a></strong><p>Binds this interaction layer to the frozen browser hashes.</p></div></div></section><section><pre class="raw">${esc(JSON.stringify(rawSource(result), null, 2))}</pre></section></div>`;
}

function renderAll() {
  updateIdentity();
  setLoadedControls();
  renderDecision();
  renderChallenge();
  renderRoute();
  renderBoundary();
  renderSource();
  if (state.activeMode === 'compare') renderCompare();
}

async function acceptLoaded(response, sampleId = null) {
  state.primary = { sessionId: response.sessionId || null, result: response.result, sampleId };
  state.baselineResult = response.result?.profile ? JSON.parse(JSON.stringify(response.result)) : null;
  state.baselineEvidence = response.result?.profile ? JSON.parse(JSON.stringify(response.result.evidence || {})) : null;
  state.selectedBasis = response.result?.analysis?.selectedObligationSet || null;
  state.selectedCertificate = response.result?.analysis?.selectedBasisCertificate || null;
  state.basisLimit = 60;
  state.worldLimit = 60;
  state.compare = null;
  state.activeMode = 'decision';
  renderAll();
  showLoaded();
}

async function loadSample(sampleId) {
  if (!state.workerReady) return;
  busy(true, 'Opening reference record');
  try {
    const response = await workerRequest('inspect-input', { input: referenceInput(sampleId) });
    await acceptLoaded(response, sampleId);
    const url = new URL(location.href);
    url.searchParams.set('case', sampleId);
    history.replaceState(null, '', url);
  } catch (error) {
    toast(error.message);
  } finally {
    busy(false);
  }
}

async function loadFile(file) {
  if (!file || !state.workerReady) return;
  busy(true, 'Reading and analyzing local evidence');
  try {
    if (file.size > MAX_INPUT_BYTES) throw new Error('Input exceeds the 16 MB current hosted limit.');
    const buffer = await file.arrayBuffer();
    const response = await workerRequest('inspect-bytes', { bytes: buffer, fileName: file.name }, [buffer]);
    await acceptLoaded(response, null);
    const url = new URL(location.href);
    url.searchParams.delete('case');
    history.replaceState(null, '', url);
  } catch (error) {
    toast(error.message);
  } finally {
    busy(false);
  }
}

async function exportRecord() {
  if (!state.primary?.sessionId) return;
  busy(true, 'Building deterministic inspection record');
  try {
    const response = await workerRequest('export', { sessionId: state.primary.sessionId });
    const blob = new Blob([`${JSON.stringify(response.record, null, 2)}\n`], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'consequence-closure-evaluation.json';
    anchor.click();
    URL.revokeObjectURL(url);
    toast('Deterministic inspection record exported');
  } catch (error) {
    toast(error.message);
  } finally {
    busy(false);
  }
}

function humanize(value) {
  return String(value || '').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function bindStatic() {
  $('#openBtn').addEventListener('click', () => $('#fileInput').click());
  $('#welcomeOpenBtn').addEventListener('click', () => $('#fileInput').click());
  $('#fileInput').addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) await loadFile(file);
  });
  $('#resetBtn').addEventListener('click', resetEvidence);
  $('#exportBtn').addEventListener('click', exportRecord);
  $$('.reference-card').forEach((button) => button.addEventListener('click', () => loadSample(button.dataset.sample)));
  $$('.mode').forEach((button) => button.addEventListener('click', () => {
    if (button.disabled) return;
    showMode(button.dataset.mode);
  }));

  const zone = $('#dropZone');
  for (const eventName of ['dragenter', 'dragover']) zone.addEventListener(eventName, (event) => {
    event.preventDefault();
    state.dropDepth += eventName === 'dragenter' ? 1 : 0;
    if (state.workerReady) $('#dropOverlay').classList.add('active');
  });
  zone.addEventListener('dragleave', (event) => {
    event.preventDefault();
    state.dropDepth = Math.max(0, state.dropDepth - 1);
    if (!state.dropDepth) $('#dropOverlay').classList.remove('active');
  });
  zone.addEventListener('drop', async (event) => {
    event.preventDefault();
    state.dropDepth = 0;
    $('#dropOverlay').classList.remove('active');
    const file = event.dataTransfer?.files?.[0];
    if (file) await loadFile(file);
  });
}

bindStatic();
renderCompare();
startWorker();
