#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
PIN=13c97dbb6f781d4aab38ed34e6e441f42b79aff4
mkdir -p source/native_inc results/v8
[[ "$(git -C upstream rev-parse HEAD)" == "$PIN" ]]
for file in Source/BasicMathFunctions/arm_elementwise_mul_s8.c Include/arm_nnsupportfunctions.h; do
  git -C upstream ls-tree HEAD "$file" >> results/v8/upstream_git_blobs.txt
  git -C upstream hash-object "$file" >> results/v8/upstream_worktree_git_blobs.txt
 done
cp upstream/Source/BasicMathFunctions/arm_elementwise_mul_s8.c source/arm_elementwise_mul_s8.c
cp upstream/Include/arm_nnsupportfunctions.h source/official_arm_nnsupportfunctions.h
cmp source/arm_elementwise_mul_s8.c upstream/Source/BasicMathFunctions/arm_elementwise_mul_s8.c
cmp source/official_arm_nnsupportfunctions.h upstream/Include/arm_nnsupportfunctions.h
sha256sum source/{arm_elementwise_mul_s8.c,official_arm_nnsupportfunctions.h} >results/v8/original_source_sha256.txt
python3 - <<'PY'
from pathlib import Path
h=Path('source/official_arm_nnsupportfunctions.h').read_text()
for name in ['arm_nn_requantize','arm_requantize_mve_32x4']:
 prefix='__STATIC_FORCEINLINE '
 start=h.index(prefix,h.rfind('\n',0,h.index(name+'(')))
 brace=h.index('{',start);depth=0;end=None
 for i in range(brace,len(h)):
  if h[i]=='{':depth+=1
  elif h[i]=='}':
   depth-=1
   if depth==0:end=i+1;break
 assert end is not None
 fn=h[start+len(prefix):end]
 assert fn in h and name+'(' in fn
 Path('source/native_inc/'+name+'.inc').write_text(fn+'\n')
Path('source/native_inc/arm_nnfunctions.h').write_text('#ifndef G3_ABI_H\n#define G3_ABI_H\n#include <stdint.h>\ntypedef enum { ARM_CMSIS_NN_SUCCESS=0 } arm_cmsis_nn_status;\n#endif\n')
Path('source/native_inc/arm_nnsupportfunctions.h').write_text('''#ifndef G3_HELPER_H
#define G3_HELPER_H
#include "arm_nnfunctions.h"
#define __STATIC_FORCEINLINE static inline __attribute__((always_inline))
#define MIN(a,b) ((a)<(b)?(a):(b))
#define MAX(a,b) ((a)>(b)?(a):(b))
#if defined(ARM_MATH_MVEI)
#include <arm_mve.h>
static inline
#include "arm_requantize_mve_32x4.inc"
#else
static inline
#include "arm_nn_requantize.inc"
#endif
#endif
''')
print('V8_ORIGINAL_HELPER_BODIES_EXTRACTED_VERBATIM')
PY
C=clang
FLAGS=(--target=thumbv8.1m.main-none-eabi -march=armv8.1-m.main+mve -mfloat-abi=hard -O1 -ffreestanding -fno-builtin -fno-unwind-tables -fno-asynchronous-unwind-tables -DCMSIS_NN_USE_SINGLE_ROUNDING -Isource/native_inc)
"$C" "${FLAGS[@]}" -Darm_elementwise_mul_s8=scalar_kernel -c source/arm_elementwise_mul_s8.c -o results/v8/scalar.o
"$C" "${FLAGS[@]}" -DARM_MATH_MVEI -Darm_elementwise_mul_s8=mve_kernel -c source/arm_elementwise_mul_s8.c -o results/v8/mve.o
"$C" "${FLAGS[@]}" -c native/startup.c -o results/v8/startup.o
"$C" "${FLAGS[@]}" -c native/driver.c -o results/v8/driver.o
"$C" "${FLAGS[@]}" -nostdlib -fuse-ld=lld -Wl,-T,native/an547.ld -Wl,-Map,results/v8/mve_kernel.map results/v8/{startup,driver,scalar,mve}.o -o results/v8/mve_kernel.elf
llvm-objdump -d results/v8/mve_kernel.elf > results/v8/mve_kernel.disasm
for mnemonic in 'vshl.s32' 'vqdmulh.s32' 'vrshl.s32'; do grep -Fq "$mnemonic" results/v8/mve_kernel.disasm; done
qemu-system-arm --version | tee results/v8/qemu_version.txt
clang --version | head -1 | tee results/v8/clang_version.txt
set +e
timeout 35s qemu-system-arm -M mps3-an547 -cpu cortex-m55 -nographic -monitor none -serial none -semihosting-config enable=on,target=native -kernel results/v8/mve_kernel.elf >results/v8/qemu_output.log 2>&1
rc=$?
set -e
cat results/v8/qemu_output.log
echo "QEMU_EXIT_CODE=$rc" | tee results/v8/qemu_exit_code.txt
sha256sum results/v8/{mve_kernel.elf,scalar.o,mve.o} > results/v8/binary_sha256.txt
[[ $rc == 0 ]] && grep -Fq 'NATIVE_MVE_RESULT_PASS' results/v8/qemu_output.log
for control in 'CASE CONTROL_SHIFT14 scalar=100 mve=100' 'CASE WITNESS_SHIFT15 scalar=100 mve=-100' 'CASE TAIL_SHIFT15 scalar=100 mve=-100' 'CASE BOUNDARY_SHIFT15 scalar=100 mve=-100' 'CASE TFLM_MODEL_FULL_INT8 scalar=127 mve=-128'; do grep -Fq "$control" results/v8/qemu_output.log; done
printf 'V8_GENUINE_UPSTREAM_QEMU_CONTROL_PASS\n'