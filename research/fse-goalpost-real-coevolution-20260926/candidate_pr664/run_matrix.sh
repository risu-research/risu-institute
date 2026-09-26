#!/usr/bin/env bash
set -u

BASE="31bb53ec1e93936eb3a72cda31a2d042c9cdbbdb"
HEAD="77bf85f3414b5caf9ba68c37b89d6bc7107bfe04"
UPSTREAM="https://github.com/haalfi/remote-store.git"
OUT="${GITHUB_WORKSPACE:-$PWD}/coevolution-results/pr664"
ROOT="${RUNNER_TEMP:-/tmp}/pr664-matrix"

rm -rf "$ROOT" "$OUT"
mkdir -p "$ROOT" "$OUT"

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

# Split the historical MemoryBackend diff semantically rather than swapping the
# whole file. S1 contains the strengthened Copy ensures clauses (plus the trait
# contract in BackendContract.dfy). B1 contains the executable repair and its
# proof assertions.  Every edit below is an exact string present in the real PR.
transform_memory() {
  local FILE="$1" BODY="$2" SPEC="$3"
  python3 - "$FILE" "$BODY" "$SPEC" <<'PY'
from pathlib import Path
import sys
p = Path(sys.argv[1]); body = sys.argv[2] == '1'; spec = sys.argv[3] == '1'
s = p.read_text()

old_ens = """      IsFile(fs, src) && IsFile(fs, dst) &&\n      fs[dst].content == old(fs)[src].content\n"""
new_ens = """      IsFile(fs, src) && IsFile(fs, dst) &&\n      fs[dst].content == old(fs)[src].content &&\n      fs[dst].info.metadata == old(fs)[src].info.metadata\n"""
if spec:
    n = s.count(old_ens)
    if n != 2:
        raise SystemExit(f'expected exactly 2 old Copy ensures stanzas, found {n}')
    s = s.replace(old_ens, new_ens)

if body:
    old_ctor = """    var newInfo := BasicFileInfo(dst, dst, srcEntry.info.size);\n"""
    new_ctor = """    var newInfo := FileInfo(dst, dst, srcEntry.info.size,\n                            None, None, None, srcEntry.info.metadata);\n"""
    n = s.count(old_ctor)
    if n != 2:
        raise SystemExit(f'expected exactly 2 BasicFileInfo Copy sites, found {n}')
    s = s.replace(old_ctor, new_ctor)

    # The PR added this proof assertion in both the src==dst and copy-write paths
    # of both implementations.  Insert it after each content assertion.
    needle = """    assert fs[dst].content == old(fs)[src].content;\n"""
    add = needle + """    assert fs[dst].info.metadata == old(fs)[src].info.metadata;\n"""
    n = s.count(needle)
    if n != 4:
        raise SystemExit(f'expected exactly 4 Copy content assertions, found {n}')
    s = s.replace(needle, add)

p.write_text(s)
PY
}

run_one() {
  local BODY="$1" SPEC="$2" LABEL="B${1}S${2}"
  local D="$ROOT/$LABEL"
  git -C "$ROOT/upstream" worktree add --quiet --detach "$D" "$BASE"

  if [[ "$SPEC" == "1" ]]; then
    # Exact historical abstract contract from the PR head.
    git -C "$D" checkout "$HEAD" -- sdd/formal/BackendContract.dfy
  fi
  transform_memory "$D/sdd/formal/MemoryBackend.dfy" "$BODY" "$SPEC"

  mkdir -p "$OUT/$LABEL"
  git -C "$D" diff -- sdd/formal/BackendContract.dfy sdd/formal/MemoryBackend.dfy > "$OUT/$LABEL/hybrid.diff"
  sha256sum "$D/sdd/formal/BackendContract.dfy" "$D/sdd/formal/MemoryBackend.dfy" > "$OUT/$LABEL/file-sha256.txt"

  set +e
  (cd "$D" && dafny verify sdd/formal/BackendContract.dfy) > "$OUT/$LABEL/contract.log" 2>&1
  C=$?
  (cd "$D" && dafny verify sdd/formal/MemoryBackend.dfy) > "$OUT/$LABEL/refinement.log" 2>&1
  R=$?
  set -e
  echo "$C" > "$OUT/$LABEL/contract.exit"
  echo "$R" > "$OUT/$LABEL/refinement.exit"
  echo -e "$LABEL\t$BODY\t$SPEC\t$C\t$R" | tee -a "$OUT/matrix.tsv"
}

run_one 0 0
run_one 1 0
run_one 0 1
run_one 1 1

python3 - <<'PY'
from pathlib import Path
import os
out = Path(os.environ.get('GITHUB_WORKSPACE') or '.') / 'coevolution-results/pr664'
rows = out.joinpath('matrix.tsv').read_text().strip().splitlines()
md = [
'# remote-store PR #664: historical four-way replay', '',
'Historical event: BK-196 strengthened `Backend.Copy` so success preserves user metadata, while both concrete Copy bodies stopped constructing the destination through `BasicFileInfo` (which dropped metadata).', '',
'B = executable/proof-body repair in `MemoryBackend.dfy`. S = strengthened Copy postcondition in `BackendContract.dfy` plus the corresponding concrete-method ensures clauses. Both dimensions are extracted from the one real PR; all four quadrants use the same pinned Dafny verifier.', '',
'| Quadrant | Body | Spec | contract exit | refinement exit |', '|---|---:|---:|---:|---:|']
for row in rows[1:]:
    q,b,s,c,r = row.split('\t')
    md.append(f'| {q} | {b} | {s} | {c} | {r} |')
md += ['', 'Exit 0 = verification pass. Nonzero results are retained verbatim in logs. No target matrix is assumed.', '',
'Expected diagnostic if the historical narrative is faithfully isolated: old/old passes; old body/new spec fails because BasicFileInfo drops metadata; repaired body/new spec passes. Whether repaired body/old spec passes is measured rather than assumed.']
out.joinpath('RESULT.md').write_text('\n'.join(md)+'\n')
PY

cat "$OUT/matrix.tsv"
