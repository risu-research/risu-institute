#!/usr/bin/env bash
set -euo pipefail
mkdir -p results work
UP=22080c68d040c98139e6cb1549473e3149735f4d
TEST=upstream/Source/BasicMathFunctions/arm_elementwise_mul_s8.c
[ "$(git -C upstream rev-parse HEAD)" = "$UP" ]
sha256sum "$TEST" upstream/Include/arm_nnsupportfunctions.h > results/upstream_source_sha256.txt
cp "$TEST" work/arm_elementwise_mul_s8.c
python3 - <<'PY'
from pathlib import Path
original=Path('upstream/Source/BasicMathFunctions/arm_elementwise_mul_s8.c').read_text()
target='arm_nn_requantize(mul_res, out_mult, out_shift)'
assert original.count(target)==5
modified=original.replace(target,'certified_ref(mul_res, out_mult, out_shift)')
assert modified.replace('certified_ref(mul_res, out_mult, out_shift)',target)==original
Path('work/mul_composed.c').write_text(modified)
print('REPLACEMENT_COUNT 5; original bytes unchanged')
PY
sha256sum work/* >> results/upstream_source_sha256.txt
cbmc --version > results/cbmc_version.txt
python3 - <<'PY'
import json,subprocess,time,pathlib
# The same cheap, independent mathematical oracle is used by both direct and
# compositional verification. 90-second cap is identical for four-lane jobs.
cases=[('lemma_fast',1,['-DPROVE_FAST'],35,False),('direct_fast_1',1,[],70,False),('composed_fast_1',1,['-DCOMPOSED'],70,False),('direct_fast_4',4,[],90,False),('composed_fast_4',4,['-DCOMPOSED'],90,False),('mutant_fast_1',1,['-DMUTANT'],35,True)]
base=['cbmc','src/verify.c','--function','main','--unwind','7','--unwinding-assertions','--bounds-check','--pointer-check','--signed-overflow-check','--div-by-zero-check','--undefined-shift-check','--64','-I','upstream/Include','-I','upstream/Include/Internal','-I','work','-D','CMSIS_NN_USE_SINGLE_ROUNDING']
results=[]
for name,size,defs,limit,negative in cases:
 cmd=base+['-D',f'SIZE={size}']+defs
 start=time.monotonic()
 try:
  cp=subprocess.run(cmd,capture_output=True,text=True,timeout=limit)
  log=cp.stdout+'\n'+cp.stderr
  failed=[line for line in log.splitlines() if ': FAILURE' in line]
  if cp.returncode==0 and 'VERIFICATION SUCCESSFUL' in log: status='PROVED'
  elif negative and any('main.assertion' in line for line in failed): status='EXPECTED_COUNTEREXAMPLE'
  else: status='NOT_PROVED'
  code=cp.returncode
 except subprocess.TimeoutExpired as exc:
  status='TIMEOUT';code=124
  o=exc.stdout or b'';e=exc.stderr or b''
  log=(o.decode(errors='replace') if isinstance(o,bytes) else o)+'\nTIMEOUT\n'+(e.decode(errors='replace') if isinstance(e,bytes) else e)
  failed=[]
 elapsed=round(time.monotonic()-start,3)
 pathlib.Path(f'results/{name}.log').write_text('COMMAND: '+' '.join(cmd)+'\n\n'+log)
 rec=dict(name=name,status=status,exit_code=code,elapsed_s=elapsed,failed_properties=failed,negative_control=negative,command=cmd)
 results.append(rec)
 print(json.dumps(rec),flush=True)
pathlib.Path('results/summary.json').write_text(json.dumps(results,indent=2))
PY
