#!/usr/bin/env bash
set -euo pipefail
mkdir -p results
UP=22080c68d040c98139e6cb1549473e3149735f4d
TEST=upstream/Source/BasicMathFunctions/arm_elementwise_mul_s8.c
[ "$(git -C upstream rev-parse HEAD)" = "$UP" ]
sha256sum "$TEST" upstream/Include/arm_nnsupportfunctions.h > results/upstream_source_sha256.txt
mkdir -p work
cp "$TEST" work/arm_elementwise_mul_s8.c
python3 - <<'PY'
from pathlib import Path
original=Path('upstream/Source/BasicMathFunctions/arm_elementwise_mul_s8.c').read_text()
target='arm_nn_requantize(mul_res, out_mult, out_shift)'
count=original.count(target)
assert count == 5, f'unexpected target count {count}'
modified=original.replace(target, 'certified_ref(mul_res, out_mult, out_shift)')
assert modified.replace('certified_ref(mul_res, out_mult, out_shift)', target)==original
Path('work/mul_composed.c').write_text(modified)
print('REPLACEMENT_COUNT', count)
PY
sha256sum work/* >> results/upstream_source_sha256.txt
cc -std=c11 -O0 -DCMSIS_NN_USE_SINGLE_ROUNDING -Iupstream/Include -Iupstream/Include/Internal -Iwork -fsyntax-only src/verify.c 2>&1 | tee results/host_syntax.log
cbmc --version | tee results/cbmc_version.txt
python3 - <<'PY'
import json,subprocess,time,pathlib
cases=[('lemma',1,['-DPROVE_LEMMA'],75,False),('direct_1',1,[],75,False),('direct_4',4,[],95,False),('composed_1',1,['-DCOMPOSED'],75,False),('composed_4',4,['-DCOMPOSED'],95,False),('mutant_1',1,['-DMUTANT'],75,True)]
base=['cbmc','src/verify.c','--function','main','--unwind','7','--unwinding-assertions','--bounds-check','--pointer-check','--signed-overflow-check','--div-by-zero-check','--undefined-shift-check','--64','-I','upstream/Include','-I','upstream/Include/Internal','-I','work','-D','CMSIS_NN_USE_SINGLE_ROUNDING']
results=[]
for name,size,defs,limit,negative in cases:
 cmd=base+['-D',f'SIZE={size}']+defs
 t=time.monotonic()
 try:
  cp=subprocess.run(cmd,capture_output=True,text=True,timeout=limit)
  status='PROVED' if cp.returncode==0 and 'VERIFICATION SUCCESSFUL' in cp.stdout else ('EXPECTED_COUNTEREXAMPLE' if negative and 'VERIFICATION FAILED' in cp.stdout else 'NOT_PROVED')
  code=cp.returncode; out=cp.stdout+'\n'+cp.stderr
 except subprocess.TimeoutExpired as exc:
  status='TIMEOUT'; code=124; out=(exc.stdout or b'').decode(errors='replace') if isinstance(exc.stdout,bytes) else (exc.stdout or '')
  out+='\nTIMEOUT\n'; out+=((exc.stderr or b'').decode(errors='replace') if isinstance(exc.stderr,bytes) else (exc.stderr or ''))
 elapsed=round(time.monotonic()-t,3)
 pathlib.Path(f'results/{name}.log').write_text('COMMAND: '+' '.join(cmd)+'\n\n'+out)
 record=dict(name=name, status=status,exit_code=code,elapsed_s=elapsed,negative_control=negative,command=cmd)
 results.append(record)
 print(json.dumps(record),flush=True)
pathlib.Path('results/summary.json').write_text(json.dumps(results,indent=2))
PY
