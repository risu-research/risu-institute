#!/usr/bin/env bash
set -Eeuo pipefail
export LC_ALL=C
ROOT="${GITHUB_WORKSPACE:-$PWD}"
OUT="$ROOT/date-g15-output"
mkdir -p "$OUT/build-logs" "$OUT/results"
{
  echo "runner_date_utc=$(date -u --iso-8601=seconds)"
  uname -a
  python3 --version
  riscv64-unknown-elf-gcc --version | head -1
  riscv64-unknown-elf-ld --version | head -1
  dpkg-query -W -f='${Version}\n' picolibc-riscv64-unknown-elf
} > "$OUT/environment.txt"

git clone --quiet --depth 1 --branch embench-1.0 https://github.com/embench/embench-iot.git "$ROOT/embench-iot"
cd "$ROOT/embench-iot"
git rev-parse HEAD > "$OUT/embench_commit.txt"
git status --porcelain > "$OUT/embench_worktree_before.txt"
PICO_SPECS="$(dpkg -L picolibc-riscv64-unknown-elf | grep '/picolibc.specs$' | head -n1)"
test -f "$PICO_SPECS"
printf 'picolibc_specs=%s\n' "$PICO_SPECS" >> "$OUT/environment.txt"

# Fixed strong baseline variants. -c is mandatory: Embench invokes the C compiler
# individually for each object; omitting -c silently attempts to link each one.
for variant in Os O2 O3 OsLTO; do
  case "$variant" in
    Os) opt='-Os' ;;
    O2) opt='-O2' ;;
    O3) opt='-O3' ;;
    OsLTO) opt='-Os -flto' ;;
  esac
  flags="-c --specs=$PICO_SPECS -march=rv32imac -mabi=ilp32 $opt -ffunction-sections -fdata-sections"
  linkflags="--specs=$PICO_SPECS --oslib=semihost -march=rv32imac -mabi=ilp32 -Wl,--gc-sections"
  if [[ "$variant" == OsLTO ]]; then linkflags="$linkflags -flto"; fi
  printf '%s\t%s\t%s\n' "$variant" "$flags" "$linkflags" >> "$OUT/compiler_matrix.tsv"
  echo "BUILD_START $variant $(date -u +%FT%TZ)"
  python3 build_all.py --arch riscv32 --chip generic --board ri5cyverilator \
    --cc riscv64-unknown-elf-gcc --ld riscv64-unknown-elf-gcc \
    --cflags="$flags" --ldflags="$linkflags" --timeout 90 \
    --builddir "$OUT/build-$variant" --logdir "$OUT/build-logs/$variant" \
    > "$OUT/build-logs/${variant}.stdout.log" 2>&1 || {
      echo "BUILD_FAILED $variant" >&2
      tail -60 "$OUT/build-logs/${variant}.stdout.log" >&2
      exit 21
    }
  if grep -E 'Warning: (Compilation|Linking).*failed' "$OUT/build-logs/${variant}.stdout.log" >/dev/null; then
    echo "UPSTREAM_SILENT_BUILD_FAILURE $variant" >&2
    grep -E -m 5 -A 7 'Warning: (Compilation|Linking).*failed' "$OUT/build-logs/$variant"/build-*.log >&2 || true
    exit 22
  fi
  echo "BUILD_DONE $variant $(date -u +%FT%TZ)"
done
python3 "$ROOT/research/date-g15/analyze_elf.py" "$OUT" | tee "$OUT/results/summary.txt"
