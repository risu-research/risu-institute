#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
PIN=13c97dbb6f781d4aab38ed34e6e441f42b79aff4
[[ "$(git -C upstream rev-parse HEAD)" == "$PIN" ]]
mkdir -p source/native_inc results/v8_default
cp upstream/Source/BasicMathFunctions/arm_elementwise_mul_s8.c source/arm_elementwise_mul_s8.c
cp upstream/Include/arm_nnsupportfunctions.h source/official_arm_nnsupportfunctions.h
printf '%s  %s\n' 4365d15aa7e44dd7c85891c29f57955de09a77cde24c128ed665697561c19596 source/arm_elementwise_mul_s8.c 0d5f6dd9f81ae6361e2d0ffa7fa91ccd3ae1f84fb898942b027260609caaae6b source/official_arm_nnsupportfunctions.h | sha256sum -c -
python3 - <<'PY'
from pathlib import Path
import re
h=Path('source/official_arm_nnsupportfunctions.h').read_text()
for name in ['arm_doubling_high_mult_mve_32x4','arm_divide_by_power_of_two_mve_32x4','arm_requantize_mve_32x4']:
 prefix='__STATIC_FORCEINLINE '
 match=re.search(r'__STATIC_FORCEINLINE\s+int32x4_t\s+'+re.escape(name)+r'\s*\(',h)
 assert match is not None,name
 start=match.start()
 brace=h.index('{',match.end());depth=0;end=None
 for i in range(brace,len(h)):
  if h[i]=='{':depth+=1
  elif h[i]=='}':
   depth-=1
   if depth==0:end=i+1;break
 assert end is not None,name
 fn=h[start+len(prefix):end]
 assert name+'(' in fn and fn in h,name
 Path('source/native_inc/'+name+'.inc').write_text(fn+'\n')
Path('source/native_inc/arm_nnfunctions.h').write_text('#ifndef G3_ABI_H\n#define G3_ABI_H\n#include <stdint.h>\ntypedef enum { ARM_CMSIS_NN_SUCCESS=0 } arm_cmsis_nn_status;\n#endif\n')
Path('source/native_inc/arm_nnsupportfunctions.h').write_text('''#ifndef G3_HELPER_H
#define G3_HELPER_H
#include "arm_nnfunctions.h"
#define __STATIC_FORCEINLINE static inline __attribute__((always_inline))
#define MIN(a,b) ((a)<(b)?(a):(b))
#define MAX(a,b) ((a)>(b)?(a):(b))
#define LEFT_SHIFT(s) ((s)>0?(s):0)
#define RIGHT_SHIFT(s) ((s)>0?0:-(s))
#if defined(ARM_MATH_MVEI)
#include <arm_mve.h>
static inline
#include "arm_doubling_high_mult_mve_32x4.inc"
static inline
#include "arm_divide_by_power_of_two_mve_32x4.inc"
static inline
#include "arm_requantize_mve_32x4.inc"
#endif
#endif
''')
print('V8_DEFAULT_HELPERS_EXTRACTED_VERBATIM')
PY
C=clang
FLAGS=(--target=thumbv8.1m.main-none-eabi -march=armv8.1-m.main+mve -mfloat-abi=hard -O1 -ffreestanding -fno-builtin -fno-unwind-tables -fno-asynchronous-unwind-tables -Isource/native_inc)
"$C" "${FLAGS[@]}" -DARM_MATH_MVEI -Darm_elementwise_mul_s8=mve_kernel -c source/arm_elementwise_mul_s8.c -o results/v8_default/mve.o
"$C" "${FLAGS[@]}" -c native/startup.c -o results/v8_default/startup.o
"$C" "${FLAGS[@]}" -c native/default_rounding_driver.c -o results/v8_default/driver.o
"$C" "${FLAGS[@]}" -nostdlib -fuse-ld=lld -Wl,-T,native/an547.ld results/v8_default/{startup,driver,mve}.o -o results/v8_default/mve_kernel.elf
llvm-objdump -d results/v8_default/mve_kernel.elf > results/v8_default/mve_kernel.disasm
qemu-system-arm --version | tee results/v8_default/qemu_version.txt
set +e
timeout 35s qemu-system-arm -M mps3-an547 -cpu cortex-m55 -nographic -monitor none -serial none -semihosting-config enable=on,target=native -kernel results/v8_default/mve_kernel.elf >results/v8_default/qemu_output.log 2>&1
rc=$?
set -e
cat results/v8_default/qemu_output.log
printf 'QEMU_EXIT_CODE=%s\n' "$rc" | tee results/v8_default/qemu_exit_code.txt
sha256sum source/{arm_elementwise_mul_s8.c,official_arm_nnsupportfunctions.h} results/v8_default/{mve_kernel.elf,mve.o} >results/v8_default/sha256.txt
[[ "$rc" == 0 ]] && grep -Fq 'DEFAULT_ROUNDING_CONTROL_PASS' results/v8_default/qemu_output.log
for control in 'CASE DEFAULT_SHIFT15_100 mve_default=127' 'CASE DEFAULT_SHIFT15_81 mve_default=127' 'CASE DEFAULT_SHIFT15_82 mve_default=127'; do grep -Fq "$control" results/v8_default/qemu_output.log; done
printf 'V8_DEFAULT_ROUNDING_CONTROL_PASS\n'