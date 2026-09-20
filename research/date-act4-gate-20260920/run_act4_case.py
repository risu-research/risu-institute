#!/usr/bin/env python3
"""Replay exact ACT4 E cp_rs1_b1 input/operation on original PicoRV32 bus.
This is NOT the full ACT4 compiled ELF, Sail signature, or certification run.
"""
import csv,json,re,subprocess,sys
from pathlib import Path
A=Path(sys.argv[1]); O=Path(sys.argv[2]); O.mkdir(parents=True,exist_ok=True)
EXPECTED_BLOBS={'slli':'795cbeeb074cf0fab7f1434152476e97bdb0a3ee','srli':'34fa035f7b3e6fc04e385de6c12402b9b3a16c7f','srai':'f82030b4370759e176a6584a0cb61a2e3a1e0f7f'}
C={'slli':0,'srli':1,'srai':2}
rows=[]
for op in C:
    fp=A/f'E-{op}-00.S'; src=fp.read_text(); actual_blob=subprocess.check_output(['git','hash-object',str(fp)],text=True).strip()
    assert actual_blob==EXPECTED_BLOBS[op],f'ACT4 file changed {op} {actual_blob}'
    assert "REQUIRED_EXTENSIONS: ['E']" in src and 'MXLEN: 32' in src
    label=f'E_{op}_cg_cp_rs1_b1'
    rex=rf'RVTEST_TESTDATA_LOAD_INT\(\w+, x1\)\s*# load rs1: x1 = (0x[0-9a-f]+)\s*{label}:\s*{op} x(\d+), x1, (\d+)\s*# perform operation'
    m=re.search(rex,src)
    assert m,f'ACT4 b1 not found: {op}'
    value=int(m[1],16);rd=int(m[2]);sh=int(m[3]);assert sh>=16 and 1<=rd<=15
    (O/f'{op}_act4_extract.txt').write_text(m[0]+'\nblob='+actual_blob+'\n')
    if op=='slli': expect=(value<<sh)&0xffffffff; prior=(value<<(sh&15))&0xffffffff
    elif op=='srli': expect=value>>sh; prior=value>>(sh&15)
    else:
        signed=value if value<2**31 else value-2**32
        expect=(signed>>sh)&0xffffffff;prior=(signed>>(sh&15))&0xffffffff
    assert expect!=prior,f'ACT4 vector nondiscriminating {op}'
    for rev in ('parent','child'):
        cmd=['vvp',str(O/f'{rev}.vvp'),f'+OP={C[op]}',f'+SH={sh}',f'+RD={rd}',f'+INPUT={value:08x}']
        p=subprocess.run(cmd,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=20)
        (O/f'{rev}_{op}.log').write_text(p.stdout)
        a=re.search(r'ACT4_CASE_RESULT op=(\d+) sh=(\d+) rd=(\d+) input=([0-9a-fA-F]{8}) data=([0-9a-fA-F]{8}) control=([0-9a-fA-F]{8}) fetches=(\d+) stores=(\d+)',p.stdout)
        assert p.returncode==0 and a, f'Bad native run {rev} {op}: {p.stdout[-1000:]}'
        observed=int(a[5],16); valid=int(a[1])==C[op] and int(a[2])==sh and int(a[3])==rd and int(a[4],16)==value and int(a[6],16)==7 and int(a[7])>=7 and int(a[8])==2
        assert valid,(rev,op,a.groups())
        assert observed==(prior if rev=='parent' else expect),(rev,op,hex(observed),hex(prior),hex(expect))
        rows.append(dict(revision=rev,op=op,ACT4_label=label,source_blob=actual_blob,rs1='x1',rd=f'x{rd}',shamt=sh,operand=f'0x{value:08x}',spec=f'0x{expect:08x}',truncated_source_prediction=f'0x{prior:08x}',actual=f'0x{observed:08x}',ISA_match=observed==expect,protocol_valid=valid))
with (O/'matrix.csv').open('w',newline='') as f:
    writer=csv.DictWriter(f,fieldnames=rows[0]);writer.writeheader();writer.writerows(rows)
(O/'results.json').write_text(json.dumps(rows,indent=2))
print('ACT4_EXACT_SOURCE_CASES',len(rows),'PARENT_MISMATCH',sum(r['revision']=='parent' and not r['ISA_match'] for r in rows),'CHILD_MATCH',sum(r['revision']=='child' and r['ISA_match'] for r in rows),'ALL_PROTOCOL_VALID',all(r['protocol_valid'] for r in rows))
