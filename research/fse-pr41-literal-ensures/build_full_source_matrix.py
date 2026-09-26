#!/usr/bin/env python3
from pathlib import Path
import re, shutil, sys

if len(sys.argv) != 3:
    raise SystemExit('usage: build_full_source_matrix.py BASE.dfy HEAD.dfy')
base = Path(sys.argv[1]).read_text()
head = Path(sys.argv[2]).read_text()
out = Path('research/fse-pr41-literal-ensures/full-source')
out.mkdir(parents=True, exist_ok=True)

# B0S0 and B1S1 are byte-for-byte historical files from the PR base/head.
(out/'B0S0.dfy').write_text(base)
(out/'B1S1.dfy').write_text(head)

agents = ['Rifampicin','Carbamazepine','Phenytoin','Phenobarbital']

# B1S0: exact head implementation with only the four PR-added literal
# OrthopaedicVTEProphylaxis postconditions removed. Everything else stays head-exact.
b1s0 = head
for a in agents:
    pat = re.compile(r'^\s*ensures \(doac == Apixaban && agent == ' + re.escape(a) + r' && treatmentIndication == OrthopaedicVTEProphylaxis\) ==> CheckInteraction\([^\n]+\) == InteractionResult\(NotCovered, UnknownRisk\)\n', re.M)
    b1s0, n = pat.subn('', b1s0)
    if n != 1:
        raise SystemExit(f'expected exactly one new ensures for {a}, found {n}')
(out/'B1S0.dfy').write_text(b1s0)

# B0S1: exact head contract, but restore each of the four changed executable
# match arms to the base semantics from this PR: unconditional Caution.
b0s1 = head
for a in agents:
    pat = re.compile(
        r'case \(Apixaban, ' + re.escape(a) + r'\) =>\n'
        r'\s*if treatmentIndication == AFStrokePrevention \|\| treatmentIndication == RecurrentVTEPrevention\n'
        r'\s*then InteractionResult\(Caution, ThrombosisRisk\)\n'
        r'\s*else InteractionResult\(NotCovered, UnknownRisk\)'
    )
    repl = f'case (Apixaban, {a}) => InteractionResult(Caution, ThrombosisRisk)'
    b0s1, n = pat.subn(repl, b0s1)
    if n != 1:
        raise SystemExit(f'expected exactly one new body block for {a}, found {n}')
(out/'B0S1.dfy').write_text(b0s1)

print('built full-source matrix')
for p in sorted(out.glob('*.dfy')):
    print(p, p.stat().st_size)
