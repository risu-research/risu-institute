from pathlib import Path

path = Path('public/tools/consequence-closure/current/app.js')
text = path.read_text(encoding='utf-8')

replacements = []

replacements.append((
"""      const requested = new URLSearchParams(location.search).get('case');
      if (requested && REFERENCE_META[requested]) loadSample(requested);""",
"""      const params = new URLSearchParams(location.search);
      const requestedCompare = params.get('compare');
      const requestedCase = params.get('case');
      const requestedView = params.get('view');
      if (requestedCompare && ['linux', 'oauth'].includes(requestedCompare)) loadComparePreset(requestedCompare);
      else if (requestedCase && REFERENCE_META[requestedCase]) loadSample(requestedCase, requestedView);
      else if (requestedView === 'compare') showMode('compare');"""
))

replacements.append((
"""function showMode(mode) {
  state.activeMode = mode;
  $$('.mode').forEach((button) => button.classList.toggle('active', button.dataset.mode === mode));
  $$('.view').forEach((view) => view.classList.toggle('active', view.dataset.view === mode));
  if (mode === 'compare') renderCompare();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}""",
"""function showMode(mode) {
  state.activeMode = mode;
  $$('.mode').forEach((button) => button.classList.toggle('active', button.dataset.mode === mode));
  $$('.view').forEach((view) => view.classList.toggle('active', view.dataset.view === mode));
  if (mode === 'compare') renderCompare();
  const url = new URL(location.href);
  if (mode === 'decision') url.searchParams.delete('view');
  else url.searchParams.set('view', mode);
  history.replaceState(null, '', url);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}"""
))

replacements.append((
"""    ['Specified consequences', result.analysis.closure.status === 'OPEN' ? result.analysis.closure.consequences.length : 1],""",
"""    ['Specified consequences', result.analysis.closure.status === 'IMPOSSIBLE' ? 0 : result.analysis.closure.consequences.length],"""
))

replacements.append((
"""      title: ok ? 'The exported inspection record is byte-value self-consistent.' : 'The exported record digest does not match its content.',""",
"""      title: ok ? 'The exported inspection record matches its declared canonical record digest.' : 'The exported record digest does not match its canonical content.',"""
))

replacements.append((
"""  return `<section class=\"record-integrity\"><span class=\"status-chip ${integrity.verified ? 'verified' : 'unsafe'}\">${integrity.verified ? 'INTEGRITY VERIFIED' : 'DIGEST MISMATCH'}</span><h1>Inspection record integrity</h1><p>The current hosted surface recomputed the deterministic record digest using the frozen engine hashing rules. This verifies the record's own byte-value content, not the external truth or full semantic source behind it.</p><div class=\"kv\"><div class=\"kv-row\"><span>Claimed digest</span><b class=\"identity-value\">${esc(integrity.claimed || 'missing')}</b></div><div class=\"kv-row\"><span>Computed digest</span><b class=\"identity-value\">${esc(integrity.computed || 'missing')}</b></div><div class=\"kv-row\"><span>Original source digest</span><b class=\"identity-value\">${esc(result.source?.sourceDigest || 'not carried')}</b></div></div></section>`;""",
"""  return `<section class=\"record-integrity\"><span class=\"status-chip ${integrity.verified ? 'verified' : 'unsafe'}\">${integrity.verified ? 'INTEGRITY VERIFIED' : 'DIGEST MISMATCH'}</span><h1>Inspection record integrity</h1><p>The current hosted surface recomputed the deterministic record digest using the frozen engine's canonical hashing rules. This verifies the carried record content against its declared digest. It is not a file-byte hash, external-origin check, or semantic replay of the original source.</p><div class=\"kv\"><div class=\"kv-row\"><span>Claimed digest</span><b class=\"identity-value\">${esc(integrity.claimed || 'missing')}</b></div><div class=\"kv-row\"><span>Computed digest</span><b class=\"identity-value\">${esc(integrity.computed || 'missing')}</b></div><div class=\"kv-row\"><span>Original source digest</span><b class=\"identity-value\">${esc(result.source?.sourceDigest || 'not carried')}</b></div></div></section>`;"""
))

replacements.append((
"""  if (!comparison && state.primary?.result?.profile && state.baselineResult) comparison = { left: state.baselineResult, right: state.primary.result, leftTitle: 'Baseline cut', rightTitle: 'Current cut', label: 'Baseline and current hypothetical evidence' };""",
"""  if (!comparison && state.primary?.result?.profile && state.baselineResult) comparison = { left: state.baselineResult, right: state.primary.result, leftTitle: 'Baseline cut', rightTitle: 'Current cut', label: 'Baseline and current hypothetical evidence', qualification: 'Same loaded semantic profile and finite boundary. Only the current evidence assignment changes between the two analyses.' };"""
))

replacements.append((
"""  target.innerHTML = `${presets}<div class=\"compare-layout\">${compactResult(comparison.left, comparison.leftTitle || 'Left analysis')}${compactResult(comparison.right, comparison.rightTitle || 'Right analysis')}<section class=\"compare-diff\"><div class=\"panel-head\"><div><span class=\"mini-label\">Transition ledger</span><h2>${esc(comparison.label || 'Independent analysis comparison')}</h2></div></div>${rows.map(([label, left, right]) => `<div class=\"compare-diff-row\"><span>${esc(label)}</span><b class=\"identity-value\">${esc(left)}</b><span class=\"compare-arrow\">→</span><b class=\"identity-value\">${esc(right)}</b></div>`).join('')}</section></div>`;""",
"""  target.innerHTML = `${presets}<div class=\"compare-layout\">${compactResult(comparison.left, comparison.leftTitle || 'Left analysis')}${compactResult(comparison.right, comparison.rightTitle || 'Right analysis')}<section class=\"compare-diff\"><div class=\"panel-head\"><div><span class=\"mini-label\">Comparison ledger</span><h2>${esc(comparison.label || 'Independent analysis comparison')}</h2></div></div>${rows.map(([label, left, right]) => `<div class=\"compare-diff-row\"><span>${esc(label)}</span><b class=\"identity-value\">${esc(left)}</b><span class=\"compare-arrow\">→</span><b class=\"identity-value\">${esc(right)}</b></div>`).join('')}<div class=\"notice space-top\"><strong>Comparison qualification.</strong> ${esc(comparison.qualification || 'The two sides are independent analyses. Juxtaposition does not establish semantic identity, causation, or a source-system transition.')}</div></section></div>`;"""
))

replacements.append((
"""    state.compare = { left: state.baselineResult, right: state.primary.result, leftTitle: 'Baseline cut', rightTitle: 'Current cut', label: 'Baseline and current hypothetical evidence' };""",
"""    state.compare = { left: state.baselineResult, right: state.primary.result, leftTitle: 'Baseline cut', rightTitle: 'Current cut', label: 'Baseline and current hypothetical evidence', qualification: 'Same loaded semantic profile and finite boundary. Only the current evidence assignment changes between the two analyses.' };"""
))

replacements.append((
"""      label: pair === 'linux' ? 'Administrative declaration and operative enforcement' : 'Qualified live path and authority-resource split state',
    };
    showMode('compare');""",
"""      label: pair === 'linux' ? 'Administrative declaration and operative enforcement' : 'Qualified live path and authority-resource split state',
      qualification: pair === 'linux' ? 'Recorded operating-system contrast. Each side is evaluated under its own frozen finite boundary; presentation order does not by itself prove a source-system transition.' : 'Recorded OAuth commissioning contrast. Each side is independently classified at its measured action path and cut; presentation order is not a causal claim.',
    };
    showMode('compare');
    const url = new URL(location.href);
    url.searchParams.delete('case');
    url.searchParams.set('compare', pair);
    url.searchParams.set('view', 'compare');
    history.replaceState(null, '', url);"""
))

replacements.append((
"""      state.compare = { left: state.primary.result, right: response.result, leftTitle: recordTitle(state.primary.result, state.primary.sampleId), rightTitle: file.name, label: 'Primary record and local comparison artifact' };""",
"""      state.compare = { left: state.primary.result, right: response.result, leftTitle: recordTitle(state.primary.result, state.primary.sampleId), rightTitle: file.name, label: 'Primary record and local comparison artifact', qualification: 'Independent analyses. No semantic identity, causation, or source-system transition is inferred from loading the two artifacts side by side.' };"""
))

replacements.append((
"""async function loadSample(sampleId) {""",
"""async function loadSample(sampleId, requestedView = null) {"""
))

replacements.append((
"""    url.searchParams.set('case', sampleId);
    history.replaceState(null, '', url);""",
"""    url.searchParams.set('case', sampleId);
    url.searchParams.delete('compare');
    const allowedView = ['decision', 'challenge', 'route', 'boundary', 'source'].includes(requestedView) ? requestedView : null;
    if (allowedView && allowedView !== 'decision') url.searchParams.set('view', allowedView);
    else url.searchParams.delete('view');
    history.replaceState(null, '', url);
    if (allowedView && allowedView !== 'decision') showMode(allowedView);"""
))

replacements.append((
"""    url.searchParams.delete('case');
    history.replaceState(null, '', url);""",
"""    url.searchParams.delete('case');
    url.searchParams.delete('compare');
    url.searchParams.delete('view');
    history.replaceState(null, '', url);"""
))

for old, new in replacements:
    if old not in text:
        raise SystemExit(f'Expected app.js fragment not found:\n{old[:180]}')
    text = text.replace(old, new, 1)

path.write_text(text, encoding='utf-8')
print('patched app.js')
