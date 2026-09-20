#!/usr/bin/env python3
"""Re-use independently audited exact ROM generator; *restore* original 
new-PC clause from the freshly re-synthesized reset-qualified SOURCE model.
Fail closed if source or generated query differs from pinned structure.
"""
import sys,pathlib,subprocess,hashlib
argv=sys.argv[1:]
assert '--pulse' in argv and argv[argv.index('--pulse')+1]=='keep',argv
assert '--min-target' in argv and '--max-target' in argv
assert argv[argv.index('--min-target')+1]=='12' and argv[argv.index('--max-target')+1]=='12'
assert '--single-fetch-anchor' in argv
model=pathlib.Path(argv[0]);out=pathlib.Path(argv[1]);case=argv[argv.index('--case')+1]
orig=model.read_text()
old=pathlib.Path(__file__).with_name('make_query.py')
cmd=[sys.executable,str(old),str(model),str(out),'--case',case,'--depth','14','--first','12','--last','12','--anchor','first-fetch']
subprocess.run(cmd,check=True)
s=out.read_text()
needle='  true ; DIAGNOSTIC ONLY: omit dblfetch.v:350 new-PC pulse restriction\n'
restored='  (|$paramod/dblfetch/ADDRESS_WIDTH=30_u 1| state)\n'
assert s.count(needle)==1 and orig.count(restored)==1,(case,'expected one new-PC assumption')
s=s.replace(needle,restored,1)
assert orig in s,('original source model must be embedded unchanged',case)
assert needle not in s
out.write_text(s)
print('GUARD_CONTRACT_KEPT',case,'MODEL_SHA256',hashlib.sha256(orig.encode()).hexdigest(),'QUERY_SHA256',hashlib.sha256(s.encode()).hexdigest())
