#!/usr/bin/env python3
import csv, difflib, hashlib, json, re, shutil, subprocess, traceback
from pathlib import Path

OUT = Path('out/U052-v2')
OUT.mkdir(parents=True, exist_ok=True)
TMP = Path('/tmp/fse126-u052-repo-v2')
REPO = 'franck44/evm-dis'
HEAD = 'ac962f72645d3d4a6c2d996b6ea19435ad630d2c'
PARENT = 'c194f56d15152c3e09f3bd8fa9c73875e1854592'
CHILD = 'ac0d71b96d32962d5b7f88ebd511d3d4851286f8'  # diagnostic only; never a U052 endpoint
TARGET = 'src/dafny/utils/Automata.dfy'
HELPER_FILE = 'src/dafny/utils/MiscTypes.dfy'
VERIFY_CMD = ['dafny', '/dafnyVerify:1', '/compile:0', '/timeLimit:20', '/vcsCores:12', TARGET]

BOUNDARY_MASK = ['AddState', 'AddStates', 'AddEdge', 'AddEdges']
EXPANDED_MASK = BOUNDARY_MASK + ['AddEdgeInTRandTrNatPreservesValid']
AUDIT_DECLS = [
    'AddState','AddStates','AddEdge','AddEdgeInTRandTrNatPreservesValid','AddEdges',
    'AddKeyVal','AddKeyVal2','foo303','foo','foo404','PredNat','revTransitionsIsBounded',
    'IsValid','IsReversemapValid','IsReverseMapValid','IsReversemapValid2','IsReversemap','IsReversemap2'
]
EXPECTED_CHILD_HELPERS = ['AddKeyVal','ExtendByOneGoodIsGood','ReverseMapsIsCongruent','IsReverseMap']


def sh(cmd, cwd=None, check=True):
    p = subprocess.run(cmd, cwd=cwd, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if check and p.returncode:
        raise RuntimeError(f"rc={p.returncode}: {' '.join(cmd)}\nSTDOUT:\n{p.stdout}\nSTDERR:\n{p.stderr}")
    return p


def sha_text(s): return hashlib.sha256(s.encode()).hexdigest()
def sha_bytes(b): return hashlib.sha256(b).hexdigest()
def read_at(rev, path): return sh(['git','show',f'{rev}:{path}'], cwd=TMP).stdout
def line_of(src, off): return src.count('\n', 0, off) + 1


def find_decl_span(src, name):
    pat = re.compile(
        rf'(?m)^[ \t]*(?:(?:static|ghost|opaque)\s+|\{{:[^\n]*\}}\s+)*'
        rf'(?:function|lemma|predicate|method)\b[^\n]*\b{re.escape(name)}\s*\('
    )
    ms = list(pat.finditer(src))
    if not ms: return None
    if len(ms) != 1: raise RuntimeError(f'{name}: {len(ms)} declarations found')
    m = ms[0]
    brace = src.find('{', m.end())
    if brace < 0: raise RuntimeError(f'{name}: opening brace missing')
    depth = 0; end = None; in_str = False; esc = False
    for i in range(brace, len(src)):
        ch = src[i]
        if in_str:
            if esc: esc = False
            elif ch == '\\': esc = True
            elif ch == '"': in_str = False
            continue
        if ch == '"': in_str = True
        elif ch == '{': depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0:
                end = i + 1
                if end < len(src) and src[end] == '\n': end += 1
                break
    if end is None: raise RuntimeError(f'{name}: closing brace missing')
    return m.start(), end


def decl_record(src, name):
    sp = find_decl_span(src, name)
    if sp is None:
        return {'present':False,'start':None,'end':None,'sha256':None}
    a,b=sp; t=src[a:b]
    return {'present':True,'start':line_of(src,a),'end':line_of(src,b),'sha256':sha_text(t)}


def mask_decls(src, names):
    spans=[]
    for n in names:
        sp=find_decl_span(src,n)
        if sp is None: raise RuntimeError(f'mask declaration absent: {n}')
        spans.append((sp[0],sp[1],n))
    out=src
    for a,b,n in sorted(spans,reverse=True):
        out=out[:a]+f'@@FSE126_DECL_{n}@@\n'+out[b:]
    return out


def strip_comments_ws(src):
    out=[]; i=0; in_str=False; esc=False
    while i<len(src):
        if in_str:
            ch=src[i]; out.append(ch)
            if esc: esc=False
            elif ch=='\\': esc=True
            elif ch=='"': in_str=False
            i+=1; continue
        if src.startswith('//',i):
            j=src.find('\n',i)
            if j<0: break
            out.append('\n'); i=j+1; continue
        if src.startswith('/*',i):
            j=src.find('*/',i+2)
            if j<0: raise RuntimeError('unterminated block comment')
            i=j+2; continue
        ch=src[i]; out.append(ch)
        if ch=='"': in_str=True
        i+=1
    return re.sub(r'\s+','', ''.join(out))


def udiff(a,b,an,bn):
    return ''.join(difflib.unified_diff(a.splitlines(True),b.splitlines(True),fromfile=an,tofile=bn))


def classify_dafny_output(returncode, text):
    ms=re.findall(r'Dafny program verifier finished with\s+(\d+) verified,\s+(\d+) errors?', text)
    if ms:
        v,e=map(int,ms[-1])
        return ('PASS' if returncode==0 and e==0 else 'VERIFY_FAIL', v, e)
    if re.search(r'\bresolution/type errors? detected\b|Error:\s+unresolved identifier|Error:\s+expected method call', text):
        return ('RESOLUTION_NOT_GREEN', None, None)
    if re.search(r'parse errors? detected|Parser error|syntax error', text, re.I):
        return ('PARSE_NOT_GREEN', None, None)
    return ('INFRA', None, None)


def verify_rev(rev, tag):
    sh(['git','checkout','--quiet','--detach',rev],cwd=TMP)
    p=sh(VERIFY_CMD,cwd=TMP,check=False)
    text=p.stdout+'\n--- STDERR ---\n'+p.stderr
    (OUT/f'{tag}.log').write_text(text)
    status,v,e=classify_dafny_output(p.returncode,text)
    unresolved=sorted(set(re.findall(r'Error: unresolved identifier: ([A-Za-z_][A-Za-z0-9_]*)',text)))
    return {'stage':tag,'revision':rev,'status':status,'returncode':p.returncode,'verified':v,'errors':e,'unresolved_identifiers':';'.join(unresolved),'log_sha256':sha_text(text)}


def write_csv(path, rows, fields):
    with Path(path).open('w',newline='') as f:
        w=csv.DictWriter(f,fieldnames=fields); w.writeheader()
        for r in rows: w.writerow({k:r.get(k) for k in fields})


def finish_hashes():
    rows=[]
    for p in sorted(OUT.rglob('*')):
        if p.is_file() and p.name!='MANIFEST_SHA256.csv':
            rows.append({'path':str(p.relative_to(OUT)),'sha256':sha_bytes(p.read_bytes()),'bytes':p.stat().st_size})
    write_csv(OUT/'MANIFEST_SHA256.csv',rows,['path','sha256','bytes'])


def main():
    if TMP.exists(): shutil.rmtree(TMP)
    sh(['git','clone','--filter=blob:none','--no-checkout','--quiet',f'https://github.com/{REPO}.git',str(TMP)])
    if sh(['git','rev-parse',f'{HEAD}^'],cwd=TMP).stdout.strip()!=PARENT:
        raise RuntimeError('U052 parent relation changed')
    if sh(['git','rev-parse',f'{CHILD}^'],cwd=TMP).stdout.strip()!=HEAD:
        raise RuntimeError('diagnostic child is not immediate child of U052 head')

    changed=[x for x in sh(['git','diff','--name-only',PARENT,HEAD],cwd=TMP).stdout.splitlines() if x]
    if changed!=[TARGET]: raise RuntimeError(f'U052 changed-file scope mismatch: {changed}')
    child_changed=[x for x in sh(['git','diff','--name-only',HEAD,CHILD],cwd=TMP).stdout.splitlines() if x]
    if child_changed!=[HELPER_FILE]: raise RuntimeError(f'child changed-file scope mismatch: {child_changed}')

    old=read_at(PARENT,TARGET); head=read_at(HEAD,TARGET); child_auto=read_at(CHILD,TARGET)
    if child_auto!=head: raise RuntimeError('diagnostic child unexpectedly changes Automata.dfy')
    helper_old=read_at(HEAD,HELPER_FILE); helper_child=read_at(CHILD,HELPER_FILE)
    helper_diff=udiff(helper_old,helper_child,'head/MiscTypes.dfy','child/MiscTypes.dfy')
    (OUT/'immediate_child_helper.diff').write_text(helper_diff)
    helper_presence={n: bool(re.search(rf'\b{re.escape(n)}\s*(?:<[^>]*>)?\s*\(',helper_child)) for n in EXPECTED_CHILD_HELPERS}
    helper_added={n: helper_presence[n] and not bool(re.search(rf'\b{re.escape(n)}\s*(?:<[^>]*>)?\s*\(',helper_old)) for n in EXPECTED_CHILD_HELPERS}
    (OUT/'child_helper_diagnostic.json').write_text(json.dumps({'child':CHILD,'child_parent':HEAD,'child_changed_files':child_changed,'automata_byte_identical_to_head':True,'expected_helpers_present_in_child':helper_presence,'expected_helpers_added_by_child':helper_added,'helper_diff_sha256':sha_text(helper_diff)},indent=2,sort_keys=True))

    (OUT/'old_Automata.dfy').write_text(old); (OUT/'head_Automata.dfy').write_text(head)
    exact_diff=udiff(old,head,'parent/Automata.dfy','head/Automata.dfy')
    (OUT/'exact_parent_head.diff').write_text(exact_diff)

    decls=[]
    for n in AUDIT_DECLS:
        o=decl_record(old,n); h=decl_record(head,n)
        decls.append({'name':n,'old_present':o['present'],'head_present':h['present'],'old_start':o['start'],'old_end':o['end'],'head_start':h['start'],'head_end':h['end'],'old_sha256':o['sha256'],'head_sha256':h['sha256'],'same_when_present':bool(o['present'] and h['present'] and o['sha256']==h['sha256'])})
    write_csv(OUT/'declaration_inventory.csv',decls,['name','old_present','head_present','old_start','old_end','head_start','head_end','old_sha256','head_sha256','same_when_present'])
    d={r['name']:r for r in decls}

    bo=mask_decls(old,BOUNDARY_MASK); bh=mask_decls(head,BOUNDARY_MASK)
    eo=mask_decls(old,EXPANDED_MASK); eh=mask_decls(head,EXPANDED_MASK)
    bd=udiff(bo,bh,'parent-boundary-masked','head-boundary-masked'); ed=udiff(eo,eh,'parent-expanded-masked','head-expanded-masked')
    (OUT/'boundary_mask_residual.diff').write_text(bd); (OUT/'expanded_pair_mask_residual.diff').write_text(ed)
    isolation={
        'boundary_mask_raw_context_identical':bo==bh,
        'boundary_mask_semantic_context_identical':strip_comments_ws(bo)==strip_comments_ws(bh),
        'expanded_mask_raw_context_identical':eo==eh,
        'expanded_mask_semantic_context_identical':strip_comments_ws(eo)==strip_comments_ws(eh),
        'IsValid_changed':d['IsValid']['old_present'] and d['IsValid']['head_present'] and not d['IsValid']['same_when_present'],
        'old_IsReversemapValid_deleted':d['IsReversemapValid']['old_present'] and not d['IsReversemapValid']['head_present'],
        'new_IsReverseMapValid_added':not d['IsReverseMapValid']['old_present'] and d['IsReverseMapValid']['head_present'],
        'PredNat_added':not d['PredNat']['old_present'] and d['PredNat']['head_present'],
        'revTransitionsIsBounded_added':not d['revTransitionsIsBounded']['old_present'] and d['revTransitionsIsBounded']['head_present'],
        'old_local_AddKeyVal_deleted':d['AddKeyVal']['old_present'] and not d['AddKeyVal']['head_present'],
        'old_proof_helpers_deleted':any(d[n]['old_present'] and not d[n]['head_present'] for n in ['foo303','foo','foo404']),
        'old_reversemap_auxiliary_predicates_deleted':any(d[n]['old_present'] and not d[n]['head_present'] for n in ['IsReversemapValid2','IsReversemap','IsReversemap2']),
    }
    isolation['r3_source_isolation_failure']=bool(not isolation['expanded_mask_semantic_context_identical'] and isolation['IsValid_changed'] and (isolation['old_IsReversemapValid_deleted'] or isolation['new_IsReverseMapValid_added']))
    (OUT/'isolation_certificate.json').write_text(json.dumps(isolation,indent=2,sort_keys=True))

    endpoints=[verify_rev(PARENT,'exact_parent_endpoint'),verify_rev(HEAD,'exact_head_endpoint')]
    child_diag=verify_rev(CHILD,'immediate_child_diagnostic')
    write_csv(OUT/'endpoint_results.csv',endpoints,['stage','revision','status','returncode','verified','errors','unresolved_identifiers','log_sha256'])
    write_csv(OUT/'child_diagnostic_result.csv',[child_diag],['stage','revision','status','returncode','verified','errors','unresolved_identifiers','log_sha256'])

    if any(e['status']=='INFRA' for e in endpoints):
        disposition='INFRA'; rationale='tool/setup failure prevented classification of an exact U052 endpoint'
    elif any(e['status']!='PASS' for e in endpoints):
        disposition='R2'; rationale='exact U052 parent/head are not both green under the frozen Dafny 4.4.0 environment'
    elif isolation['r3_source_isolation_failure']:
        disposition='R3'; rationale='both endpoints are green but source-context isolation requires third-class logical/proof choices'
    else:
        disposition='R4_READY'; rationale='both endpoints green and unique mechanical two-factor isolation remains possible'

    diag_support=bool(endpoints[1]['status']=='RESOLUTION_NOT_GREEN' and child_diag['status']=='PASS' and all(helper_added.values()))
    source_identity={
        'repo':REPO,'parent':PARENT,'head':HEAD,'target':TARGET,'changed_files':changed,
        'old_sha256':sha_text(old),'head_sha256':sha_text(head),'child_automata_sha256':sha_text(child_auto),
        'parent_head_diff_sha256':sha_text(exact_diff)
    }
    (OUT/'source_identity.json').write_text(json.dumps(source_identity,indent=2,sort_keys=True))
    (OUT/'DISPOSITION.txt').write_text(f'{disposition}: {rationale}\n')
    (OUT/'manifest.json').write_text(json.dumps({'status':disposition,'rationale':rationale,'dafny':sh(['dafny','--version'],check=False).stdout.strip(),'verify_command':VERIFY_CMD,**source_identity,'endpoints':endpoints,'source_isolation':isolation,'diagnostic_child':child_diag,'diagnostic_child_explains_head_resolution_failure':diag_support,'expected_child_helpers_added':helper_added},indent=2,sort_keys=True))
    finish_hashes()

try:
    main()
except Exception:
    (OUT/'INFRA_FAILURE.txt').write_text(traceback.format_exc())
    finish_hashes()
    raise
