#!/usr/bin/env python3
"""Run unmodified G30 workflow driver with exactly two frozen post-CE legal-input gating repairs."""
import hashlib
from pathlib import Path
p=Path('research/date-g30-compressed-alignment-20260920/g30_run.py')
s=p.read_text()
a='if (!uut.mem_la_firstword && !uut.mem_la_secondword && g30_aligned)'
b='if (g30_aligned)'
c='if (uut.mem_la_secondword && g30_split)'
d='if (g30_split)'
assert s.count(a)==1 and s.count(c)==1
assert s.count('assume (!mem_rdata[11])')==2 # aligned and compressed C.SLLI
fixed=s.replace(a,b,1).replace(c,d,1)
assert fixed.replace(b,a,1).replace(d,c,1)==s
out=Path('g30b_driver_derived.py');out.write_text(fixed)
Path('g30b_DRIVER_SHA.txt').write_text('upstream_driver='+hashlib.sha256(s.encode()).hexdigest()+'\ncorrected_driver='+hashlib.sha256(fixed.encode()).hexdigest()+'\n')
exec(compile(fixed,str(out),'exec'),{'__name__':'__main__'})
