#!/usr/bin/env bash
set -u

BASE="31bb53ec1e93936eb3a72cda31a2d042c9cdbbdb"
HEAD="77bf85f3414b5caf9ba68c37b89d6bc7107bfe04"
UPSTREAM="https://github.com/haalfi/remote-store.git"
OUT="${GITHUB_WORKSPACE:-$PWD}/coevolution-results/pr664"
ROOT="${RUNNER_TEMP:-/tmp}/pr664-matrix"

rm -rf "$ROOT" "$OUT"; mkdir -p "$ROOT" "$OUT"
echo "candidate=haalfi/remote-store#664" | tee "$OUT/METADATA.txt"
echo "base=$BASE" | tee -a "$OUT/METADATA.txt"
echo "head=$HEAD" | tee -a "$OUT/METADATA.txt"
echo "verifier=$(dafny --version 2>&1 | tr '\n' ' ')" | tee -a "$OUT/METADATA.txt"
echo "primary=dafny verify sdd/formal/MemoryBackend.dfy" | tee -a "$OUT/METADATA.txt"

git clone --quiet "$UPSTREAM" "$ROOT/upstream"
git -C "$ROOT/upstream" cat-file -e "$BASE^{commit}"
git -C "$ROOT/upstream" cat-file -e "$HEAD^{commit}"
git -C "$ROOT/upstream" diff --binary "$BASE" "$HEAD" -- sdd/formal/BackendContract.dfy sdd/formal/MemoryBackend.dfy > "$OUT/historical_formal.patch"
git -C "$ROOT/upstream" show -s --format=fuller "$BASE" > "$OUT/base_commit.txt"
git -C "$ROOT/upstream" show -s --format=fuller "$HEAD" > "$OUT/head_commit.txt"
echo -e "quadrant\tbody\tspec\tcontract_exit\trefinement_exit" > "$OUT/matrix.tsv"

transform_memory() {
  python3 - "$1" "$2" "$3" <<'PY'
from pathlib import Path
import re, sys
p=Path(sys.argv[1]); body=sys.argv[2]=='1'; spec=sys.argv[3]=='1'; s=p.read_text()
starts=[m.start() for m in re.finditer(r'^  method Copy\(', s, re.M)]
if len(starts)!=2: raise SystemExit(f'expected 2 Copy methods, found {len(starts)}')
ranges=[]
for st in starts:
    m=re.search(r'^  method ', s[st+1:], re.M)
    en=(st+1+m.start()) if m else len(s)
    ranges.append((st,en))
old_ens="""      IsFile(fs, src) && IsFile(fs, dst) &&\n      fs[dst].content == old(fs)[src].content\n"""
new_ens="""      IsFile(fs, src) && IsFile(fs, dst) &&\n      fs[dst].content == old(fs)[src].content &&\n      fs[dst].info.metadata == old(fs)[src].info.metadata\n"""
old_ctor="""    var newInfo := BasicFileInfo(dst, dst, srcEntry.info.size);\n"""
new_ctor="""    var newInfo := FileInfo(dst, dst, srcEntry.info.size,\n                            None, None, None, srcEntry.info.metadata);\n"""
needle="""    assert fs[dst].content == old(fs)[src].content;\n"""
add=needle+"""    assert fs[dst].info.metadata == old(fs)[src].info.metadata;\n"""
# Replace from bottom to top so offsets stay valid.
for st,en in reversed(ranges):
    chunk=s[st:en]
    if spec:
        if chunk.count(old_ens)!=1: raise SystemExit('Copy spec stanza not unique inside method')
        chunk=chunk.replace(old_ens,new_ens)
    if body:
        if chunk.count(old_ctor)!=1: raise SystemExit('Copy BasicFileInfo site not unique inside method')
        chunk=chunk.replace(old_ctor,new_ctor)
        if chunk.count(needle)!=2: raise SystemExit(f'expected 2 Copy content assertions inside method, found {chunk.count(needle)}')
        chunk=chunk.replace(needle,add)
    s=s[:st]+chunk+s[en:]
p.write_text(s)
PY
}

run_one() {
  local BODY="$1" SPEC="$2" LABEL="B${1}S${2}" D="$ROOT/B${1}S${2}"
  git -C "$ROOT/upstream" worktree add --quiet --detach "$D" "$BASE"
  [[ "$SPEC" == "1" ]] && git -C "$D" checkout "$HEAD" -- sdd/formal/BackendContract.dfy
  transform_memory "$D/sdd/formal/MemoryBackend.dfy" "$BODY" "$SPEC"
  mkdir -p "$OUT/$LABEL"
  git -C "$D" diff -- sdd/formal/BackendContract.dfy sdd/formal/MemoryBackend.dfy > "$OUT/$LABEL/hybrid.diff"
  sha256sum "$D/sdd/formal/BackendContract.dfy" "$D/sdd/formal/MemoryBackend.dfy" > "$OUT/$LABEL/file-sha256.txt"
  set +e
  (cd "$D" && dafny verify sdd/formal/BackendContract.dfy) > "$OUT/$LABEL/contract.log" 2>&1; C=$?
  (cd "$D" && dafny verify sdd/formal/MemoryBackend.dfy) > "$OUT/$LABEL/refinement.log" 2>&1; R=$?
  set -e
  echo "$C" > "$OUT/$LABEL/contract.exit"; echo "$R" > "$OUT/$LABEL/refinement.exit"
  echo -e "$LABEL\t$BODY\t$SPEC\t$C\t$R" | tee -a "$OUT/matrix.tsv"
}
run_one 0 0; run_one 1 0; run_one 0 1; run_one 1 1
python3 - <<'PY'
from pathlib import Path
import os
out=Path(os.environ.get('GITHUB_WORKSPACE') or '.')/'coevolution-results/pr664'
rows=out.joinpath('matrix.tsv').read_text().strip().splitlines()
md=['# remote-store PR #664: historical four-way replay','',
'B = executable/proof-body repair inside the two historical `Copy` methods. S = strengthened Copy postcondition in the abstract `Backend` trait plus the corresponding concrete-method ensures clauses. All four cells use Dafny 4.11.0.', '',
'| Quadrant | Body | Spec | contract exit | refinement exit |','|---|---:|---:|---:|---:|']
for row in rows[1:]:
 q,b,s,c,r=row.split('\t'); md.append(f'| {q} | {b} | {s} | {c} | {r} |')
md += ['', 'Exit 0 = pass; nonzero = verifier failure retained in the logs. No matrix shape was imposed.']
out.joinpath('RESULT.md').write_text('\n'.join(md)+'\n')
PY
cat "$OUT/matrix.tsv"
