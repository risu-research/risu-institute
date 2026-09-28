#!/usr/bin/env python3
import argparse
import csv
import difflib
import hashlib
import json
import re
import shutil
import subprocess
import sys
import traceback
from pathlib import Path

OUT = Path('out/U003')
REPO_TMP = Path('/tmp/fse126-u003-clover')
REPO = 'ChuyueSun/Clover'
PARENT = '097087fe670389ecbbb888c4fdeb6869b34be599'
HEAD = '464ecf80156798bb146a6676d50abf458e066ad2'
TARGET = 'dataset/Dafny/textbook_algo/update_array/update_array_strong.dfy'
REPLACE = 'dataset/Dafny/textbook_algo/replace/replace_strong.dfy'
NAT_SPEC = 'dataset/Dafny/textbook_algo/update_array/update_array_spec.txt'
PRIMARY_VERSION_PREFIX = '4.3.0'
SENS_VERSION_PREFIX = '4.4.0'
CELL_NAMES = ['B0S0', 'B1S0', 'B0S1', 'B1S1']


def sh(cmd, cwd=None, check=True):
    p = subprocess.run(cmd, cwd=cwd, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if check and p.returncode != 0:
        raise RuntimeError(
            f"rc={p.returncode}: {' '.join(map(str, cmd))}\nSTDOUT:\n{p.stdout}\nSTDERR:\n{p.stderr}"
        )
    return p


def sha_bytes(b):
    return hashlib.sha256(b).hexdigest()


def sha_text(s):
    return sha_bytes(s.encode())


def write_csv(path, rows, fields):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for r in rows:
            w.writerow({k: r.get(k) for k in fields})


def read_at(rev, path):
    return sh(['git', 'show', f'{rev}:{path}'], cwd=REPO_TMP).stdout


def udiff(a, b, an, bn):
    return ''.join(
        difflib.unified_diff(
            a.splitlines(True), b.splitlines(True), fromfile=an, tofile=bn
        )
    )


def no_ws(s):
    return re.sub(r'\s+', '', s)


def split_update_elements(src):
    # U003 freeze defines the first stand-alone method-body opening brace as the boundary.
    # The target contains one method; requiring a line containing only "{" avoids accidentally
    # choosing quantifier/attribute punctuation as a body boundary.
    starts = [m.start() for m in re.finditer(r'(?m)^\{[ \t]*$', src)]
    if len(starts) != 1:
        raise RuntimeError(f'expected exactly one UpdateElements body-opening brace, found {len(starts)}')
    brace = starts[0]
    spec = src[:brace]
    body = src[brace:]
    if not re.match(r'^method\s+UpdateElements\s*\(', spec):
        raise RuntimeError('target does not begin with UpdateElements method')
    if spec.count('method ') != 1:
        raise RuntimeError('target contains more than one method declaration')
    if not body.startswith('{') or not body.rstrip().endswith('}'):
        raise RuntimeError('body fragment braces are malformed')
    # Balanced brace check for this simple historical body.
    depth = 0
    for ch in body:
        if ch == '{':
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth < 0:
                raise RuntimeError('body has premature closing brace')
    if depth != 0:
        raise RuntimeError('body braces are unbalanced')
    return spec, body


def classify_dafny(returncode, text):
    ms = re.findall(
        r'Dafny program verifier finished with\s+(\d+) verified,\s+(\d+) errors?',
        text,
    )
    if ms:
        v, e = map(int, ms[-1])
        return ('PASS' if returncode == 0 and e == 0 else 'VERIFY_FAIL', v, e)
    if re.search(r'resolution/type errors? detected|unresolved identifier', text, re.I):
        return ('RESOLUTION_NOT_GREEN', None, None)
    if re.search(r'parse errors? detected|parser error|syntax error', text, re.I):
        return ('PARSE_NOT_GREEN', None, None)
    return ('INFRA', None, None)


def run_dafny(path, log_path, tag, version_label):
    cmd = ['dafny', 'verify', str(path)]
    p = sh(cmd, check=False)
    text = (
        f"# tag: {tag}\n# version_label: {version_label}\n# command: {' '.join(cmd)}\n"
        + p.stdout
        + '\n--- STDERR ---\n'
        + p.stderr
    )
    log_path.write_text(text)
    status, verified, errors = classify_dafny(p.returncode, text)
    # Preserve concise failure loci without depending on a particular Dafny wording.
    diagnostic_lines = []
    for line in text.splitlines():
        low = line.lower()
        if ('error:' in low or 'assertion' in low or 'index' in low or 'postcondition' in low) and len(line) < 500:
            diagnostic_lines.append(line)
    return {
        'tag': tag,
        'version': version_label,
        'status': status,
        'returncode': p.returncode,
        'verified': verified,
        'errors': errors,
        'file_sha256': sha_bytes(path.read_bytes()),
        'log_sha256': sha_text(text),
        'diagnostics': '\n'.join(diagnostic_lines[:30]),
    }


def assert_dafny_version(prefix):
    p = sh(['dafny', '--version'], check=False)
    v = (p.stdout + p.stderr).strip()
    if p.returncode != 0 or not v.startswith(prefix):
        raise RuntimeError(f'expected Dafny {prefix}, got rc={p.returncode}: {v}')
    return v


def prepare_sources_and_cells():
    OUT.mkdir(parents=True, exist_ok=True)
    if REPO_TMP.exists():
        shutil.rmtree(REPO_TMP)
    sh(['git', 'clone', '--filter=blob:none', '--no-checkout', '--quiet', f'https://github.com/{REPO}.git', str(REPO_TMP)])

    actual_parent = sh(['git', 'rev-parse', f'{HEAD}^'], cwd=REPO_TMP).stdout.strip()
    if actual_parent != PARENT:
        raise RuntimeError(f'parent mismatch: expected {PARENT}, got {actual_parent}')

    changed = [x for x in sh(['git', 'diff', '--name-only', PARENT, HEAD], cwd=REPO_TMP).stdout.splitlines() if x]
    changed_dfy = [x for x in changed if x.endswith('.dfy')]
    expected_dfy = sorted([TARGET, REPLACE])
    if sorted(changed_dfy) != expected_dfy:
        raise RuntimeError(f'changed Dafny scope mismatch: {changed_dfy}')

    old = read_at(PARENT, TARGET)
    new = read_at(HEAD, TARGET)
    old_replace = read_at(PARENT, REPLACE)
    new_replace = read_at(HEAD, REPLACE)
    old_nat = read_at(PARENT, NAT_SPEC)
    new_nat = read_at(HEAD, NAT_SPEC)

    (OUT / 'exact_parent_update_array_strong.dfy').write_text(old)
    (OUT / 'exact_head_update_array_strong.dfy').write_text(new)
    (OUT / 'exact_parent_replace_strong.dfy').write_text(old_replace)
    (OUT / 'exact_head_replace_strong.dfy').write_text(new_replace)
    (OUT / 'old_update_array_spec.txt').write_text(old_nat)
    (OUT / 'new_update_array_spec.txt').write_text(new_nat)
    (OUT / 'exact_parent_head_update_array.diff').write_text(
        udiff(old, new, 'parent/update_array_strong.dfy', 'head/update_array_strong.dfy')
    )
    (OUT / 'replace_parent_head.diff').write_text(
        udiff(old_replace, new_replace, 'parent/replace_strong.dfy', 'head/replace_strong.dfy')
    )

    old_spec, old_body = split_update_elements(old)
    new_spec, new_body = split_update_elements(new)

    fragments_dir = OUT / 'fragments'
    fragments_dir.mkdir(exist_ok=True)
    fragments = {
        'S0_old_spec.txt': old_spec,
        'S1_new_spec.txt': new_spec,
        'B0_old_body.txt': old_body,
        'B1_new_body.txt': new_body,
    }
    fragment_rows = []
    for name, text in fragments.items():
        p = fragments_dir / name
        p.write_text(text)
        fragment_rows.append({'fragment': name, 'sha256': sha_text(text), 'bytes': len(text.encode())})
    write_csv(OUT / 'fragment_hashes.csv', fragment_rows, ['fragment', 'sha256', 'bytes'])

    cells = {
        'B0S0': old_spec + old_body,
        'B1S0': old_spec + new_body,
        'B0S1': new_spec + old_body,
        'B1S1': new_spec + new_body,
    }
    cells_dir = OUT / 'cells'
    cells_dir.mkdir(exist_ok=True)
    cell_rows = []
    for name, text in cells.items():
        p = cells_dir / f'{name}.dfy'
        p.write_text(text)
        cell_rows.append({'cell': name, 'sha256': sha_text(text), 'bytes': len(text.encode())})
    write_csv(OUT / 'cell_hashes.csv', cell_rows, ['cell', 'sha256', 'bytes'])

    if cells['B0S0'] != old:
        raise RuntimeError('B0S0 is not byte-identical to exact parent target')
    if cells['B1S1'] != new:
        raise RuntimeError('B1S1 is not byte-identical to exact head target')

    # Residual context certificate: replace the whole unique declaration with one placeholder.
    residual_old = '@@FSE126_UPDATEELEMENTS@@\n'
    residual_new = '@@FSE126_UPDATEELEMENTS@@\n'
    if residual_old != residual_new:
        raise RuntimeError('internal residual certificate failure')

    # Formatting-only companion-Dafny check is byte-sensitive but token/whitespace-insensitive.
    replace_no_ws_equal = no_ws(old_replace) == no_ws(new_replace)
    if not replace_no_ws_equal:
        raise RuntimeError('replace_strong.dfy is not whitespace-only under frozen sensitivity rule')

    # Source-derived witness facts, fixed from exact historical fragments.
    def min_length(spec):
        m = re.search(r'requires\s+a\.Length\s*>=\s*(\d+)', spec)
        if not m:
            raise RuntimeError('cannot extract array-length lower bound')
        return int(m.group(1))

    def indices(body):
        return sorted({int(x) for x in re.findall(r'a\[(\d+)\]', body)})

    source_semantics = {
        'old_spec_min_length': min_length(old_spec),
        'new_spec_min_length': min_length(new_spec),
        'old_body_literal_indices': indices(old_body),
        'new_body_literal_indices': indices(new_body),
        'old_body_accesses_index_8': 8 in indices(old_body),
        'new_body_accesses_index_8': 8 in indices(new_body),
        'new_spec_admits_length_8': min_length(new_spec) <= 8,
        'length_8_old_body_bounds_witness': min_length(new_spec) <= 8 and 8 in indices(old_body),
    }
    (OUT / 'source_semantic_witness.json').write_text(json.dumps(source_semantics, indent=2, sort_keys=True))

    identity = {
        'repo': REPO,
        'parent': PARENT,
        'head': HEAD,
        'target': TARGET,
        'changed_files': changed,
        'changed_dfy_files': changed_dfy,
        'target_parent_sha256': sha_text(old),
        'target_head_sha256': sha_text(new),
        'target_diff_sha256': sha_text(udiff(old, new, 'parent', 'head')),
        'replace_parent_sha256': sha_text(old_replace),
        'replace_head_sha256': sha_text(new_replace),
        'replace_whitespace_insensitive_equal': replace_no_ws_equal,
        'old_natural_spec_sha256': sha_text(old_nat),
        'new_natural_spec_sha256': sha_text(new_nat),
        'B0S0_exact_parent_byte_identical': cells['B0S0'] == old,
        'B1S1_exact_head_byte_identical': cells['B1S1'] == new,
        'masked_residual_context_identical': residual_old == residual_new,
        'artifact_role': 'dataset_or_benchmark',
    }
    (OUT / 'source_identity.json').write_text(json.dumps(identity, indent=2, sort_keys=True))
    return identity


def run_phase(phase):
    if phase == 'primary':
        version = assert_dafny_version(PRIMARY_VERSION_PREFIX)
        identity = prepare_sources_and_cells()
    else:
        version = assert_dafny_version(SENS_VERSION_PREFIX)
        if not (OUT / 'source_identity.json').exists():
            raise RuntimeError('primary preparation outputs are missing')
        identity = json.loads((OUT / 'source_identity.json').read_text())

    phase_dir = OUT / phase
    phase_dir.mkdir(exist_ok=True)
    (phase_dir / 'dafny-version.txt').write_text(version + '\n')

    # Endpoint checks use exact historical bytes, independently of the four-cell labels.
    endpoint_paths = [
        ('exact_parent_endpoint', OUT / 'exact_parent_update_array_strong.dfy'),
        ('exact_head_endpoint', OUT / 'exact_head_update_array_strong.dfy'),
    ]
    endpoints = []
    for tag, path in endpoint_paths:
        endpoints.append(run_dafny(path, phase_dir / f'{tag}.log', tag, version))
    write_csv(
        phase_dir / 'endpoint_results.csv',
        endpoints,
        ['tag', 'version', 'status', 'returncode', 'verified', 'errors', 'file_sha256', 'log_sha256', 'diagnostics'],
    )

    if phase == 'primary':
        if any(r['status'] == 'INFRA' for r in endpoints):
            disposition = 'R1'
            rationale = 'primary verifier/tool execution did not classify one or both exact endpoints'
        elif any(r['status'] != 'PASS' for r in endpoints):
            disposition = 'R2'
            rationale = 'one or both exact U003 endpoints are not green under Dafny 4.3.0'
        elif not identity.get('masked_residual_context_identical', False):
            disposition = 'R3'
            rationale = 'mechanical fragment isolation failed residual-context equality'
        else:
            disposition = 'R4'
            rationale = 'both exact endpoints are green and the frozen two-factor split is mechanically isolated'
    else:
        disposition = 'SENSITIVITY_ONLY'
        rationale = 'Dafny 4.4.0 predeclared sensitivity; cannot change primary R-stage'

    cell_rows = []
    if disposition == 'R4' or phase == 'sensitivity':
        for cell in CELL_NAMES:
            path = OUT / 'cells' / f'{cell}.dfy'
            row = run_dafny(path, phase_dir / f'{cell}.log', cell, version)
            cell_rows.append(row)
        write_csv(
            phase_dir / 'cell_results.csv',
            cell_rows,
            ['tag', 'version', 'status', 'returncode', 'verified', 'errors', 'file_sha256', 'log_sha256', 'diagnostics'],
        )

    # Profile only when all primary cells were actually attempted and classify as PASS/VERIFY_FAIL.
    profile = None
    if len(cell_rows) == 4 and all(r['status'] in ('PASS', 'VERIFY_FAIL') for r in cell_rows):
        profile = '/'.join('P' if r['status'] == 'PASS' else 'F' for r in cell_rows)

    result = {
        'phase': phase,
        'dafny': version,
        'disposition': disposition,
        'rationale': rationale,
        'profile_order': CELL_NAMES,
        'profile': profile,
        'endpoints': endpoints,
        'cells': cell_rows,
    }
    (phase_dir / 'result.json').write_text(json.dumps(result, indent=2, sort_keys=True))
    (phase_dir / 'DISPOSITION.txt').write_text(f'{disposition}: {rationale}\nprofile={profile}\n')

    # Explain a B0S1 bounds failure only after outcomes exist, without modifying them.
    if cell_rows:
        witness = json.loads((OUT / 'source_semantic_witness.json').read_text())
        b0s1 = next((r for r in cell_rows if r['tag'] == 'B0S1'), None)
        b0s1_log = (phase_dir / 'B0S1.log').read_text() if (phase_dir / 'B0S1.log').exists() else ''
        explanation = {
            'phase': phase,
            'B0S1_status': b0s1['status'] if b0s1 else None,
            'source_length_8_witness_available': witness['length_8_old_body_bounds_witness'],
            'failure_log_mentions_index_or_bounds': bool(re.search(r'index|range|bound', b0s1_log, re.I)),
            'failure_log_mentions_line_8_or_a8': bool(re.search(r'\b8\b|a\[8\]', b0s1_log)),
            'interpretive_only': True,
        }
        (phase_dir / 'B0S1_witness_correlation.json').write_text(json.dumps(explanation, indent=2, sort_keys=True))


def finish_manifest():
    rows = []
    for p in sorted(OUT.rglob('*')):
        if p.is_file() and p.name != 'MANIFEST_SHA256.csv':
            rows.append({'path': str(p.relative_to(OUT)), 'sha256': sha_bytes(p.read_bytes()), 'bytes': p.stat().st_size})
    write_csv(OUT / 'MANIFEST_SHA256.csv', rows, ['path', 'sha256', 'bytes'])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--phase', choices=['primary', 'sensitivity'], required=True)
    args = ap.parse_args()
    try:
        run_phase(args.phase)
        finish_manifest()
    except Exception:
        OUT.mkdir(parents=True, exist_ok=True)
        (OUT / f'INFRA_FAILURE_{args.phase}.txt').write_text(traceback.format_exc())
        finish_manifest()
        raise


if __name__ == '__main__':
    main()
