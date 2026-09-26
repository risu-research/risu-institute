#!/usr/bin/env bash
set -u
BASE="7e6f5489d5b6ab74adb7af21dc005c6ac17e97df"
HEAD="0022b2e11243db9f9dfdc86129b20a1bf21e7348"
UPSTREAM="https://github.com/haalfi/remote-store.git"
OUT="${GITHUB_WORKSPACE:-$PWD}/coevolution-results/pr667"
ROOT="${RUNNER_TEMP:-/tmp}/pr667-matrix"
rm -rf "$ROOT" "$OUT"; mkdir -p "$ROOT" "$OUT"
printf 'candidate=haalfi/remote-store#667\nbase=%s\nhead=%s\nverifier=%s\n' "$BASE" "$HEAD" "$(dafny --version 2>&1 | tr '\n' ' ')" | tee "$OUT/METADATA.txt"
git clone --quiet "$UPSTREAM" "$ROOT/upstream"
git -C "$ROOT/upstream" diff --binary "$BASE" "$HEAD" -- sdd/formal/BackendContract.dfy sdd/formal/MemoryBackend.dfy > "$OUT/historical_formal.patch"
git -C "$ROOT/upstream" show -s --format=fuller "$BASE" > "$OUT/base_commit.txt"
git -C "$ROOT/upstream" show -s --format=fuller "$HEAD" > "$OUT/head_commit.txt"
echo -e 'quadrant\tbody\tspec\tcontract_exit\trefinement_exit' > "$OUT/matrix.tsv"

transform_memory() {
  python3 - "$1" "$2" "$3" <<'PY'
from pathlib import Path
import sys
p=Path(sys.argv[1]); body=sys.argv[2]=='1'; spec=sys.argv[3]=='1'; s=p.read_text()
old_ens="""      fs[dst].content == old(fs)[src].content &&\n      (src != dst ==> !PathExists(fs, src))\n"""
new_ens="""      fs[dst].content == old(fs)[src].content &&\n      fs[dst].info.metadata == old(fs)[src].info.metadata &&\n      (src != dst ==> !PathExists(fs, src))\n"""
if spec:
    n=s.count(old_ens)
    if n!=2: raise SystemExit(f'expected 2 Move ensures stanzas, found {n}')
    s=s.replace(old_ens,new_ens)
if body:
    old_ctor="""    var newInfo := BasicFileInfo(dst, dst, srcEntry.info.size);\n"""
    new_ctor="""    var newInfo := FileInfo(dst, dst, srcEntry.info.size,\n                            None, None, None, srcEntry.info.metadata);\n"""
    n=s.count(old_ctor)
    if n!=2: raise SystemExit(f'expected 2 BasicFileInfo Move sites, found {n}')
    s=s.replace(old_ctor,new_ctor)
    needle="""    assert fs[dst].content == old(fs)[src].content;\n"""
    add=needle+"""    assert fs[dst].info.metadata == old(fs)[src].info.metadata;\n"""
    # At this historical base, two Move implementations each have two such assertions.
    n=s.count(needle)
    if n < 4: raise SystemExit(f'expected at least 4 content assertions, found {n}')
    # Limit ourselves to the four Move-region sites by replacing all only if exactly four;
    # fail closed if unrelated methods share the exact assertion.
    if n!=4: raise SystemExit(f'ambiguous content assertion count {n}')
    s=s.replace(needle,add)
p.write_text(s)
PY
}

run_one(){
  local B="$1" S="$2" L="B${1}S${2}" D="$ROOT/B${1}S${2}"
  git -C "$ROOT/upstream" worktree add --quiet --detach "$D" "$BASE"
  [[ "$S" == 1 ]] && git -C "$D" checkout "$HEAD" -- sdd/formal/BackendContract.dfy
  transform_memory "$D/sdd/formal/MemoryBackend.dfy" "$B" "$S"
  mkdir -p "$OUT/$L"
  git -C "$D" diff -- sdd/formal/BackendContract.dfy sdd/formal/MemoryBackend.dfy > "$OUT/$L/hybrid.diff"
  sha256sum "$D/sdd/formal/BackendContract.dfy" "$D/sdd/formal/MemoryBackend.dfy" > "$OUT/$L/file-sha256.txt"
  set +e
  (cd "$D" && dafny verify sdd/formal/BackendContract.dfy) > "$OUT/$L/contract.log" 2>&1; C=$?
  (cd "$D" && dafny verify sdd/formal/MemoryBackend.dfy) > "$OUT/$L/refinement.log" 2>&1; R=$?
  set -e
  echo "$C" > "$OUT/$L/contract.exit"; echo "$R" > "$OUT/$L/refinement.exit"
  echo -e "$L\t$B\t$S\t$C\t$R" | tee -a "$OUT/matrix.tsv"
}
run_one 0 0; run_one 1 0; run_one 0 1; run_one 1 1
cat "$OUT/matrix.tsv"
