#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
# First rebuild the already verified original v8 scalar/MVE implementation and
# its boundary controls; preserve their original evidence verbatim.
bash native/prepare_v8_control.sh
mkdir -p results/exhaustive
C=clang
FLAGS=(--target=thumbv8.1m.main-none-eabi -march=armv8.1-m.main+mve -mfloat-abi=hard -O1 -ffreestanding -fno-builtin -fno-unwind-tables -fno-asynchronous-unwind-tables -DCMSIS_NN_USE_SINGLE_ROUNDING -Isource/native_inc)
"$C" "${FLAGS[@]}" -c native/exhaustive_driver.c -o results/exhaustive/driver.o
"$C" "${FLAGS[@]}" -nostdlib -fuse-ld=lld -Wl,-T,native/an547.ld -Wl,-Map,results/exhaustive/mve_kernel.map results/v8/{startup,scalar,mve}.o results/exhaustive/driver.o -o results/exhaustive/mve_kernel.elf
llvm-objdump -d results/exhaustive/mve_kernel.elf > results/exhaustive/mve_kernel.disasm
for instruction in 'vshl.s32' 'vqdmulh.s32' 'vrshl.s32'; do grep -Fq "$instruction" results/exhaustive/mve_kernel.disasm; done
set +e
timeout 90s qemu-system-arm -M mps3-an547 -cpu cortex-m55 -nographic -monitor none -serial none -semihosting-config enable=on,target=native -kernel results/exhaustive/mve_kernel.elf >results/exhaustive/qemu_output.log 2>&1
rc=$?
set -e
cat results/exhaustive/qemu_output.log
printf 'QEMU_EXIT_CODE=%s\n' "$rc" | tee results/exhaustive/qemu_exit_code.txt
sha256sum results/v8/{scalar,mve,startup}.o results/exhaustive/{driver.o,mve_kernel.elf} > results/exhaustive/binary_sha256.txt
[[ "$rc" == 0 ]]
grep -Fqx 'EXHAUSTIVE_NATIVE total=65536 mismatches=4004 overflow_pairs=4004 errors=0' results/exhaustive/qemu_output.log
grep -Fqx 'EXHAUSTIVE_NATIVE_PASS' results/exhaustive/qemu_output.log
printf 'G3_V8_EXHAUSTIVE_REAL_QEMU_PASS\n'