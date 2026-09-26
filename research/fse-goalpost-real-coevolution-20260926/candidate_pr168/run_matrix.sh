#!/usr/bin/env bash
set -u

BASE="f7b921456f4930bd6c9e58ca2bc7022535a50939"
HEAD="fd67943663b201f789aa7a24b9c9d8ff192a6cb1"
UPSTREAM="https://github.com/dafny-lang/libraries.git"
OUT="${GITHUB_WORKSPACE:-$PWD}/coevolution-results/pr168"
ROOT="${RUNNER_TEMP:-/tmp}/pr168-matrix"

rm -rf "$ROOT" "$OUT"
mkdir -p "$ROOT" "$OUT"

echo "candidate=dafny-lang/libraries#168" | tee "$OUT/METADATA.txt"
echo "base=$BASE" | tee -a "$OUT/METADATA.txt"
echo "head=$HEAD" | tee -a "$OUT/METADATA.txt"
echo "verifier=$(dafny --version 2>&1 | tr '\n' ' ')" | tee -a "$OUT/METADATA.txt"
echo "runner=$(uname -a)" | tee -a "$OUT/METADATA.txt"

git clone --quiet "$UPSTREAM" "$ROOT/upstream"
git -C "$ROOT/upstream" cat-file -e "$BASE^{commit}"
git -C "$ROOT/upstream" cat-file -e "$HEAD^{commit}"
git -C "$ROOT/upstream" diff --binary "$BASE" "$HEAD" -- src/JSON/Deserializer.dfy > "$OUT/historical_impl.patch"
git -C "$ROOT/upstream" diff --binary "$BASE" "$HEAD" -- src/JSON/Spec.dfy > "$OUT/historical_spec.patch"
git -C "$ROOT/upstream" show -s --format=fuller "$HEAD" > "$OUT/historical_head_commit.txt"
git -C "$ROOT/upstream" show -s --format=fuller "$BASE" > "$OUT/historical_base_commit.txt"

echo -e "quadrant\tbody\tspec\tverify_exit\trun_exit" > "$OUT/matrix.tsv"

run_one() {
  local BODY="$1" SPEC="$2" LABEL="B${1}S${2}"
  local D="$ROOT/$LABEL"
  git -C "$ROOT/upstream" worktree add --quiet --detach "$D" "$BASE"

  if [[ "$BODY" == "1" ]]; then
    git -C "$D" checkout "$HEAD" -- src/JSON/Deserializer.dfy
  fi
  if [[ "$SPEC" == "1" ]]; then
    git -C "$D" checkout "$HEAD" -- src/JSON/Spec.dfy
  fi

  mkdir -p "$OUT/$LABEL"
  git -C "$D" diff -- src/JSON/Deserializer.dfy src/JSON/Spec.dfy > "$OUT/$LABEL/hybrid.diff"
  sha256sum "$D/src/JSON/Deserializer.dfy" "$D/src/JSON/Spec.dfy" > "$OUT/$LABEL/file-sha256.txt"

  (
    cd "$D/src/JSON"
    set +e
    dafny verify Deserializer.dfy --unicode-char:false ../Unicode/UnicodeStringsWithoutUnicodeChar.dfy > "$OUT/$LABEL/verify.log" 2>&1
    V=$?
    echo "$V" > "$OUT/$LABEL/verify.exit"

    # Preserve the repository's own executable JSON test path as a second, non-primary observation.
    # The historical RUN line uses %run with the same Unicode input.  --input is the Dafny CLI form.
    timeout 180 dafny run Tests.dfy --unicode-char:false --input ../Unicode/UnicodeStringsWithoutUnicodeChar.dfy > "$OUT/$LABEL/run.log" 2>&1
    R=$?
    echo "$R" > "$OUT/$LABEL/run.exit"
    set -e
  )

  local V R
  V=$(cat "$OUT/$LABEL/verify.exit")
  R=$(cat "$OUT/$LABEL/run.exit")
  echo -e "$LABEL\t$BODY\t$SPEC\t$V\t$R" | tee -a "$OUT/matrix.tsv"
}

run_one 0 0
run_one 1 0
run_one 0 1
run_one 1 1

python3 - <<'PY'
from pathlib import Path
out = Path((__import__('os').environ.get('GITHUB_WORKSPACE') or '.')) / 'coevolution-results/pr168'
rows = out.joinpath('matrix.tsv').read_text().strip().splitlines()
md = ['# PR #168 four-way replay', '', 'Primary observation is Dafny verification of `Deserializer.dfy` under one pinned verifier. The repository test execution is preserved separately.', '', '| Quadrant | Body | Spec | verify exit | run exit |', '|---|---:|---:|---:|---:|']
for row in rows[1:]:
    q,b,s,v,r = row.split('\t')
    md.append(f'| {q} | {b} | {s} | {v} | {r} |')
md += ['', 'Interpretation rule: exit 0 = pass. Nonzero is retained verbatim and must be diagnosed from the corresponding log; no desired matrix is assumed in advance.']
out.joinpath('RESULT.md').write_text('\n'.join(md)+'\n')
PY

cat "$OUT/matrix.tsv"
