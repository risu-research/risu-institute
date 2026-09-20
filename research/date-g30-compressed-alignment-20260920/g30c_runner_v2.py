#!/usr/bin/env python3
"""Correct only one Python self-check, preserving the frozen predecode SV rule."""
from pathlib import Path
import hashlib
p=Path('research/date-g30-compressed-alignment-20260920/g30c_assembly_boundary.py')
s=p.read_text()
old="assert 'assume (!rvfi_insn' not in fixed"
new="assert 'assume (!rvfi_insn' not in qual"
assert s.count(old)==1
fixed=s.replace(old,new,1)
assert fixed.replace(new,old,1)==s
Path('g30c_runner_v2_derived.py').write_text(fixed)
Path('g30c_RUNNER_V2_SHA.txt').write_text('initial='+hashlib.sha256(s.encode()).hexdigest()+'\ncorrected='+hashlib.sha256(fixed.encode()).hexdigest()+'\n')
exec(compile(fixed,'g30c_runner_v2_derived.py','exec'),{'__name__':'__main__'})
