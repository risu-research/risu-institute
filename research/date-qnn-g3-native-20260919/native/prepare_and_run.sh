#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p source/native_inc results/native
cp upstream/Source/BasicMathFunctions/arm_elementwise_mul_s8.c source/arm_elementwise_mul_s8.c
cp upstream/Include/arm_nnsupportfunctions.h source/official_arm_nnsupportfunctions.h
printf '%s  %s\n' 4365d15aa7e44dd7c85891c29f57955de09a77cde24c128ed665697561c19596 source/arm_elementwise_mul_s8.c 891f62fca60714634eb3036ec226ea0408be4daf040d73e34fed864372f77793 source/official_arm_nnsupportfunctions.h | sha256sum -c -
python3 - <<'PY'
from pathlib import Path
h=Path('source/official_arm_nnsupportfunctions.h').read_text()
for name in ['arm_nn_requantize','arm_requantize_mve_32x4']:
 prefix='__STATIC_FORCEINLINE '
 start=h.index(prefix, h.rfind('\n',0,h.index(name+'(')))
 brace=h.index('{',start);depth=0;end=None
 for i in range(brace,len(h)):
  if h[i]=='{':depth+=1
  elif h[i]=='}':
   depth-=1
   if depth==0:end=i+1;break
 assert end and name in h[start:end]
 fn=h[start+len(prefix):end]
 assert fn in h
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
print('UPSTREAM_FUNCTION_BODY_VERBATIM')
PY
C=clang
FLAGS=(--target=thumbv8.1m.main-none-eabi -march=armv8.1-m.main+mve -mfloat-abi=hard -O1 -ffreestanding -fno-builtin -fno-unwind-tables -fno-asynchronous-unwind-tables -DCMSIS_NN_USE_SINGLE_ROUNDING -Isource/native_inc)
"$C" "${FLAGS[@]}" -Darm_elementwise_mul_s8=scalar_kernel -c source/arm_elementwise_mul_s8.c -o results/native/scalar.o
"$C" "${FLAGS[@]}" -DARM_MATH_MVEI -Darm_elementwise_mul_s8=mve_kernel -c source/arm_elementwise_mul_s8.c -o results/native/mve.o
"$C" "${FLAGS[@]}" -c native/startup.c -o results/native/startup.o
"$C" "${FLAGS[@]}" -c native/driver.c -o results/native/driver.o
"$C" "${FLAGS[@]}" -nostdlib -fuse-ld=lld -Wl,-T,native/an547.ld -Wl,-Map,results/native/mve_kernel.map results/native/{startup,driver,scalar,mve}.o -o results/native/mve_kernel.elf
llvm-objdump -d results/native/mve_kernel.elf > results/native/mve_kernel.disasm
for mnemonic in 'vshl.s32' 'vqdmulh.s32' 'vrshl.s32';do grep -Fq "$mnemonic" results/native/mve_kernel.disasm;done
sha256sum source/arm_elementwise_mul_s8.c source/official_arm_nnsupportfunctions.h results/native/{mve_kernel.elf,scalar.o,mve.o} >results/native/SHA256SUMS
printf 'BUILD_NATIVE_MVE_ELF_PASS\n'
qemu-system-arm --version | tee results/native/qemu_version.txt
clang --version | head -1 | tee results/native/clang_version.txt
set +e
timeout 35s qemu-system-arm -M mps3-an547 -cpu cortex-m55 -nographic -monitor none -serial none -semihosting-config enable=on,target=native -kernel results/native/mve_kernel.elf >results/native/qemu_output.log 2>&1
rc=$?
set -e
cat results/native/qemu_output.log
echo "QEMU_EXIT_CODE=$rc" | tee results/native/qemu_exit_code.txt
if [[ "$rc" != 0 ]] || ! grep -Fq 'NATIVE_MVE_RESULT_PASS' results/native/qemu_output.log; then echo 'NATIVE_MVE_EXECUTION_NOT_CONFIRMED';exit 21;fi
for control in 'CASE CONTROL_SHIFT14 scalar=100 mve=100' 'CASE WITNESS_SHIFT15 scalar=100 mve=-100' 'CASE TAIL_SHIFT15 scalar=100 mve=-100' 'CASE BOUNDARY_SHIFT15 scalar=100 mve=-100';do grep -Fq "$control" results/native/qemu_output.log;done
printf 'NATIVE_MVE_EMULATED_EXECUTION_VERIFIED\n'
