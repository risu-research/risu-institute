#!/usr/bin/env python3
"""Instrument the exact PR #664 base MemoryBackend.Copy body with one
research-only concrete postcondition that states its metadata-dropping behavior.
The implementation body is not changed. Verification therefore proves that the
historical concrete implementation both refines the old public contract and
exhibits the counter-property absent from that public contract.
"""
from pathlib import Path
import hashlib, re, sys
src=Path(sys.argv[1]); dst=Path(sys.argv[2]); text=src.read_text()
marker='class MemoryBackend extends Backend {'
cs=text.index(marker)
ms=text.index('  method Copy(src: Path, dst: Path, overwrite: bool)',cs)
# Limit to first concrete class, not MemoryBackendMinimal.
next_class=text.index('class MemoryBackendMinimal extends Backend',ms)
open_body=re.search(r'^  \{\s*$',text[ms:next_class],re.M)
if not open_body: raise SystemExit('Copy body opener not found')
body_open=ms+open_body.start()
contract=text[ms:body_open]
old_body=text[body_open:]
probe='''    // RESEARCH-ONLY BEHAVIOR PROBE; implementation body below is unchanged.\n    ensures r.Ok? && IsFile(old(fs), src) && src != dst ==>\n      fs[dst].info.metadata == None\n'''
if 'fs[dst].info.metadata' in contract:
    raise SystemExit('expected old concrete Copy contract without metadata clause')
patched=text[:body_open]+probe+text[body_open:]
dst.write_text(patched)
# Assert method body bytes from the first opening brace onward are unchanged.
def span(t):
    cs=t.index(marker); ms=t.index('  method Copy(src: Path, dst: Path, overwrite: bool)',cs)
    nc=t.index('class MemoryBackendMinimal extends Backend',ms)
    m=re.search(r'^  \{\s*$',t[ms:nc],re.M); bo=ms+m.start(); op=t.index('{',bo); dep=0
    for i in range(op,nc):
        if t[i]=='{': dep+=1
        elif t[i]=='}':
            dep-=1
            if dep==0: return t[op:i+1]
    raise RuntimeError
assert span(text)==span(patched)
(Path(str(dst)+'.body.sha256')).write_text(hashlib.sha256(span(text).encode()).hexdigest()+'\n')
print('historical_body_sha256='+hashlib.sha256(span(text).encode()).hexdigest())
