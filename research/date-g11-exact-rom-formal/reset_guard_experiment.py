#!/usr/bin/env python3
"""Generate a source-level FORMAL-only reset-qualified pulse contract.
Only this file's formal restriction changes; no CPU datapath/ROM patch.
"""
from pathlib import Path
import hashlib,sys
root=Path(sys.argv[1])
p=root/'rtl/core/dblfetch.v'
s=p.read_text()
original='\t\tif ($past(i_new_pc))\n\t\t\trestrict(!i_new_pc);'
replacement='\t\tif ((!f_past_reset)&&($past(i_new_pc)))\n\t\t\trestrict(!i_new_pc);'
assert s.count(original)==1,'historical guard source anchor changed'
new=s.replace(original,replacement)
p.write_text(new)
print('ORIGINAL_DBLFETCH_SHA256',hashlib.sha256(s.encode()).hexdigest())
print('RESET_QUALIFIED_DBLFETCH_SHA256',hashlib.sha256(new.encode()).hexdigest())
print('EXACT_SOURCE_DIFF',repr(original),'->',repr(replacement))
