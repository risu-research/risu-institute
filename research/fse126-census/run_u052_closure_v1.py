#!/usr/bin/env python3
import csv, difflib, hashlib, json, re, shutil, subprocess, traceback
from pathlib import Path

OUT = Path('out/U052-v1')
OUT.mkdir(parents=True, exist_ok=True)
TMP = Path('/tmp/fse126-u052-repo-v1')
REPO = 'franck44/evm-dis'
HEAD = 'ac962f72645d3d4a6c2d996b6ea19435ad630d2c'
PARENT = 'c194f56d15152c3e09f3bd8fa9c73875e1854592'
TARGET = 'src/dafny/utils/Automata.dfy'
VERIFY_CMD = ['dafny', '/dafnyVerify:1', '/compile:0', '/timeLimit:20', '/vcsCores:12', TARGET]

BOUNDARY_MASK = ['AddState', 'AddStates', 'AddEdge', 'AddEdges']
EXPANDED_MASK = BOUNDARY_MASK + ['AddEdgeInTRandTrNatPreservesValid']
AUDIT_DECLS = [
    'AddState', 'AddStates', 'AddEdge', 'AddEdgeInTRandTrNatPreservesValid', 'AddEdges',
    'AddKeyVal', 'AddKeyVal2', 'foo303', 'foo', 'foo404',
    'PredNat', 'revTransitionsIsBounded',
    'IsValid', 'IsReversemapValid', 'IsReverseMapValid', 'IsReversemapValid2',
    'IsReversemap', 'IsReversemap2'
]


def sh(cmd, cwd=None, check=True):
    p = subprocess.run(cmd, cwd=cwd, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if check and p.returncode:
        raise RuntimeError(f"rc={p.returncode}: {' '.join(cmd)}\nSTDOUT:\n{p.stdout}\nSTDERR:\n{p.stderr}")
    return p


def sha_bytes(b):
    return hashlib.sha256(b).hexdigest()


def sha_text(s):
    return hashlib.sha256(s.encode()).hexdigest()


def read_at(rev, path):
    return sh(['git', 'show', f'{rev}:{path}'], cwd=TMP).stdout


def line_of(src, offset):
    return src.count('\n', 0, offset) + 1


def find_decl_span(src, name):
    # Match a Dafny declaration line that owns a brace-delimited body. We intentionally
    # accept function/lemma/predicate/method variants with modifiers/attributes.
    pat = re.compile(
        rf'(?m)^[ \t]*(?:(?:static|ghost|opaque)\s+|\{{:[^\n]*\}}\s+)*'
        rf'(?:function|lemma|predicate|method)\b[^\n]*\b{re.escape(name)}\s*\('
    )
    matches = list(pat.finditer(src))
    if not matches:
        return None
    if len(matches) != 1:
        raise RuntimeError(f'{name}: expected exactly one declaration, found {len(matches)}')
    m = matches[0]
    # Find declaration body's opening brace. Attributes use braces but occur before the
    # matched keyword and therefore are outside this search window.
    brace = src.find('{', m.end())
    if brace < 0:
        raise RuntimeError(f'{name}: body opening brace not found')
    depth = 0
    end = None
    in_string = False
    esc = False
    for i in range(brace, len(src)):
        ch = src[i]
        if in_string:
            if esc:
                esc = False
            elif ch == '\\':
                esc = True
            elif ch == '"':
                in_string = False
            continue
        if ch == '"':
            in_string = True
        elif ch == '{':
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0:
                end = i + 1
                if end < len(src) and src[end] == '\n':
                    end += 1
                break
    if end is None:
        raise RuntimeError(f'{name}: closing brace not found')
    return (m.start(), end)


def decl_record(src, name):
    span = find_decl_span(src, name)
    if span is None:
        return {'name': name, 'present': False, 'start_line': None, 'end_line': None, 'sha256': None, 'bytes': 0}
    a, b = span
    text = src[a:b]
    return {
        'name': name,
        'present': True,
        'start_line': line_of(src, a),
        'end_line': line_of(src, b),
        'sha256': sha_text(text),
        'bytes': len(text.encode()),
    }


def mask_decls(src, names):
    spans = []
    for name in names:
        span = find_decl_span(src, name)
        if span is None:
            raise RuntimeError(f'mask declaration absent: {name}')
        spans.append((span[0], span[1], name))
    out = src
    for a, b, name in sorted(spans, reverse=True):
        out = out[:a] + f'@@FSE126_DECL_{name}@@\n' + out[b:]
    return out


def strip_comments_and_ws(src):
    # Semantic-normalization check only; raw residual diffs are preserved separately.
    # Dafny source here has no string literals containing comment delimiters in the
    # changed region, but we still protect quoted strings before comment removal.
    pieces = []
    i = 0
    in_str = False
    while i < len(src):
        if in_str:
            ch = src[i]
            pieces.append(ch)
            if ch == '\\' and i + 1 < len(src):
                pieces.append(src[i+1]); i += 2; continue
            if ch == '"': in_str = False
            i += 1; continue
        if src.startswith('//', i):
            j = src.find('\n', i)
            if j < 0: break
            pieces.append('\n'); i = j + 1; continue
        if src.startswith('/*', i):
            j = src.find('*/', i + 2)
            if j < 0: raise RuntimeError('unterminated block comment')
            i = j + 2; continue
        ch = src[i]
        pieces.append(ch)
        if ch == '"': in_str = True
        i += 1
    return re.sub(r'\s+', '', ''.join(pieces))


def diff_text(a, b, aname, bname):
    return ''.join(difflib.unified_diff(a.splitlines(True), b.splitlines(True), fromfile=aname, tofile=bname))


def verify_revision(rev, tag):
    sh(['git', 'checkout', '--quiet', '--detach', rev], cwd=TMP)
    p = sh(VERIFY_CMD, cwd=TMP, check=False)
    text = p.stdout + '\n--- STDERR ---\n' + p.stderr
    (OUT / f'{tag}.log').write_text(text)
    ms = re.findall(r'Dafny program verifier finished with\s+(\d+) verified,\s+(\d+) errors?', text)
    verified = errors = None
    if ms:
        verified, errors = map(int, ms[-1])
    if p.returncode == 0 and errors == 0:
        status = 'PASS'
    elif errors is not None and errors > 0:
        status = 'FAIL'
    else:
        status = 'INFRA'
    return {
        'stage': tag, 'revision': rev, 'status': status, 'returncode': p.returncode,
        'verified': verified, 'errors': errors, 'log_sha256': sha_text(text)
    }


def write_csv(path, rows, fields):
    with Path(path).open('w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for r in rows:
            w.writerow({k: r.get(k) for k in fields})


def finalize_hashes():
    rows = []
    for p in sorted(OUT.rglob('*')):
        if p.is_file() and p.name != 'MANIFEST_SHA256.csv':
            rows.append({'path': str(p.relative_to(OUT)), 'sha256': sha_bytes(p.read_bytes()), 'bytes': p.stat().st_size})
    write_csv(OUT / 'MANIFEST_SHA256.csv', rows, ['path', 'sha256', 'bytes'])


def main():
    if TMP.exists(): shutil.rmtree(TMP)
    sh(['git', 'clone', '--filter=blob:none', '--no-checkout', '--quiet', f'https://github.com/{REPO}.git', str(TMP)])

    actual_parent = sh(['git', 'rev-parse', f'{HEAD}^'], cwd=TMP).stdout.strip()
    if actual_parent != PARENT:
        raise RuntimeError(f'parent mismatch: expected {PARENT}, got {actual_parent}')
    changed = [x for x in sh(['git', 'diff', '--name-only', PARENT, HEAD], cwd=TMP).stdout.splitlines() if x]
    if changed != [TARGET]:
        raise RuntimeError(f'unexpected changed-file scope: {changed}')
    numstat = sh(['git', 'diff', '--numstat', PARENT, HEAD, '--', TARGET], cwd=TMP).stdout.strip()

    old = read_at(PARENT, TARGET)
    new = read_at(HEAD, TARGET)
    (OUT / 'old_Automata.dfy').write_text(old)
    (OUT / 'new_Automata.dfy').write_text(new)
    rawdiff = diff_text(old, new, 'parent/Automata.dfy', 'head/Automata.dfy')
    (OUT / 'exact_parent_head.diff').write_text(rawdiff)

    source_identity = {
        'repo': REPO, 'parent': PARENT, 'head': HEAD, 'target': TARGET,
        'changed_files': changed, 'numstat': numstat,
        'old_sha256': sha_text(old), 'new_sha256': sha_text(new),
        'raw_diff_sha256': sha_text(rawdiff)
    }
    (OUT / 'source_identity.json').write_text(json.dumps(source_identity, indent=2, sort_keys=True))

    decl_rows = []
    for name in AUDIT_DECLS:
        o = decl_record(old, name); n = decl_record(new, name)
        decl_rows.append({
            'name': name,
            'old_present': o['present'], 'new_present': n['present'],
            'old_start': o['start_line'], 'old_end': o['end_line'],
            'new_start': n['start_line'], 'new_end': n['end_line'],
            'old_sha256': o['sha256'], 'new_sha256': n['sha256'],
            'same_when_present': bool(o['present'] and n['present'] and o['sha256'] == n['sha256'])
        })
    write_csv(OUT / 'declaration_inventory.csv', decl_rows,
              ['name','old_present','new_present','old_start','old_end','new_start','new_end','old_sha256','new_sha256','same_when_present'])

    boundary_old = mask_decls(old, BOUNDARY_MASK)
    boundary_new = mask_decls(new, BOUNDARY_MASK)
    expanded_old = mask_decls(old, EXPANDED_MASK)
    expanded_new = mask_decls(new, EXPANDED_MASK)
    boundary_diff = diff_text(boundary_old, boundary_new, 'parent-boundary-masked', 'head-boundary-masked')
    expanded_diff = diff_text(expanded_old, expanded_new, 'parent-expanded-masked', 'head-expanded-masked')
    (OUT / 'boundary_mask_residual.diff').write_text(boundary_diff)
    (OUT / 'expanded_pair_mask_residual.diff').write_text(expanded_diff)

    boundary_sem_old = strip_comments_and_ws(boundary_old)
    boundary_sem_new = strip_comments_and_ws(boundary_new)
    expanded_sem_old = strip_comments_and_ws(expanded_old)
    expanded_sem_new = strip_comments_and_ws(expanded_new)

    # Frozen R3 materiality checks. These are source facts, not verifier outcomes.
    by_name = {r['name']: r for r in decl_rows}
    material = {
        'boundary_mask_raw_context_identical': boundary_old == boundary_new,
        'boundary_mask_semantic_context_identical': boundary_sem_old == boundary_sem_new,
        'expanded_mask_raw_context_identical': expanded_old == expanded_new,
        'expanded_mask_semantic_context_identical': expanded_sem_old == expanded_sem_new,
        'IsValid_changed': by_name['IsValid']['old_present'] and by_name['IsValid']['new_present'] and not by_name['IsValid']['same_when_present'],
        'old_IsReversemapValid_deleted': by_name['IsReversemapValid']['old_present'] and not by_name['IsReversemapValid']['new_present'],
        'new_IsReverseMapValid_added': (not by_name['IsReverseMapValid']['old_present']) and by_name['IsReverseMapValid']['new_present'],
        'PredNat_added': (not by_name['PredNat']['old_present']) and by_name['PredNat']['new_present'],
        'revTransitionsIsBounded_added': (not by_name['revTransitionsIsBounded']['old_present']) and by_name['revTransitionsIsBounded']['new_present'],
        'old_AddKeyVal2_deleted': by_name['AddKeyVal2']['old_present'] and not by_name['AddKeyVal2']['new_present'],
        'old_reversemap_auxiliary_predicates_deleted': any(
            by_name[n]['old_present'] and not by_name[n]['new_present']
            for n in ['IsReversemapValid2','IsReversemap','IsReversemap2']
        ),
    }
    material['r3_source_isolation_failure'] = bool(
        (not material['expanded_mask_semantic_context_identical']) and
        material['IsValid_changed'] and
        (material['old_IsReversemapValid_deleted'] or material['new_IsReverseMapValid_added'])
    )
    (OUT / 'isolation_certificate.json').write_text(json.dumps(material, indent=2, sort_keys=True))

    # Run exact endpoints regardless of anticipated R3, so the attrition reason is not
    # confounded with an unrecoverable/broken historical endpoint.
    endpoints = [verify_revision(PARENT, 'exact_parent_endpoint'), verify_revision(HEAD, 'exact_head_endpoint')]
    write_csv(OUT / 'endpoint_results.csv', endpoints,
              ['stage','revision','status','returncode','verified','errors','log_sha256'])

    dafny_version = sh(['dafny', '--version'], check=False).stdout.strip()
    if any(e['status'] == 'INFRA' for e in endpoints):
        disposition = 'INFRA'
        rationale = 'endpoint setup/tool execution did not yield a classified verifier summary'
    elif any(e['status'] == 'FAIL' for e in endpoints):
        disposition = 'R2'
        rationale = 'at least one exact historical endpoint fails under the frozen environment'
    elif material['r3_source_isolation_failure']:
        disposition = 'R3'
        rationale = 'both endpoints pass, but the pair cannot be isolated from changed third-class logical/proof artifacts under the frozen rule'
    else:
        disposition = 'R4_READY'
        rationale = 'both endpoints pass and source isolation did not trigger the frozen R3 rule; four-way construction would be authorized separately'

    (OUT / 'DISPOSITION.txt').write_text(f'{disposition}: {rationale}\n')
    manifest = {
        'status': disposition, 'rationale': rationale,
        'dafny': dafny_version, 'verify_command': VERIFY_CMD,
        **source_identity, 'isolation': material, 'endpoints': endpoints,
        'boundary_mask': BOUNDARY_MASK, 'expanded_mask': EXPANDED_MASK,
    }
    (OUT / 'manifest.json').write_text(json.dumps(manifest, indent=2, sort_keys=True))
    finalize_hashes()

try:
    main()
except Exception:
    (OUT / 'INFRA_FAILURE.txt').write_text(traceback.format_exc())
    finalize_hashes()
    raise
