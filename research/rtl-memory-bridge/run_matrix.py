#!/usr/bin/env python3
"""Run a fixed external-ROM bounded-check matrix and preserve SBY evidence."""
import csv
from pathlib import Path
import subprocess

ROOT=Path('results')
OPS=('slli','srli','srai')
rows=[]

def task(rev,op,split,low,mode):
    name=f'{rev}_{OPS[op]}_{"split" if split else "aligned"}_{"low" if low else "full"}_{mode}'
    out=ROOT/'formal'/name
    out.mkdir(parents=True,exist_ok=True)
    (out/'cpu.v').write_bytes((ROOT/f'{rev}.v').read_bytes())
    (out/'memory_bridge.sv').write_bytes((ROOT/'memory_bridge.sv').read_bytes())
    config=f'''[options]
mode {mode}
depth 76
expect pass,fail
[engines]
smtbmc boolector
[script]
read -sv -DRISCV_FORMAL -DBRIDGE_FORMAL memory_bridge.sv cpu.v
chparam -set OP {op} -set SPLIT {split} -set LOW_ONLY {low} memory_bridge
prep -top memory_bridge
[files]
memory_bridge.sv
cpu.v
'''
    (out/'contract.sby').write_text(config)
    try:
        r=subprocess.run(['timeout','115','sby','-f','contract.sby'],cwd=out,
                         capture_output=True,text=True,timeout=125)
        rc=r.returncode;log=r.stdout+r.stderr
    except subprocess.TimeoutExpired as e:
        rc=124;log=str(e)
    (out/'EXECUTION.log').write_text(log)
    statusfile=out/'contract'/'status'
    status=statusfile.read_text().split()[0] if statusfile.is_file() else 'MISSING'
    expected='PASS' if rev=='child' or low or mode=='cover' else 'FAIL'
    trace=bool(list((out/'contract'/'engine_0').glob('trace*.vcd')))
    rec=dict(case=name,revision=rev,op=OPS[op],split=split,low_only=low,
             mode=mode,expected=expected,status=status,trace=trace,exit_code=rc)
    rows.append(rec)
    print(rec,flush=True)
    with (ROOT/'matrix.csv').open('w',newline='') as f:
        writer=csv.DictWriter(f,fieldnames=list(rec));writer.writeheader();writer.writerows(rows)
    if status!=expected or (status=='FAIL' and not trace) or (mode=='cover' and not trace):
        raise RuntimeError(f'Unexpected result: {rec}')

for op in range(3):
    for split in (1,0):
        for rev in ('parent','child'):
            task(rev,op,split,0,'bmc')
for op in range(3):
    task('parent',op,1,1,'bmc')
for op in range(3):
    task('child',op,1,0,'cover')
print(f'ALL_EXPECTED {len(rows)}',flush=True)
