#!/usr/bin/env python3
"""Independent VCD and log auditor for a downloaded G11 GitHub Actions artifact."""
import re
import sys
import zipfile

ORIGINAL_PARENT = '128cab89f5edaae4699184f50c1334598ebe904e'
ORIGINAL_SHA = {
 'rtl/core/zipcpu.v':'d1401f1372d51028585200df9e616c66fff371b0b721b88f22f582476a869042',
 'rtl/core/pipemem.v':'1d07d3e7fc3816f8af1c3f5f4c1a6f0c97e30de60fc9722e2a76d73b83a9bf96',
 '/tmp/child-pipemem.v':'7238c0ff1c735c8dd467ec0ba9c3acc6a91ddd7bd1cc8268a3d4cffca0d61abc',
}

def parse_vcd(data):
 lines=data.decode('ascii','replace').splitlines()
 scopes=[]; identifiers={}; vals={}; first=None
 for i,line in enumerate(lines):
  if line.startswith('$scope '): scopes.append(line.split()[2])
  elif line.startswith('$upscope '): scopes.pop()
  elif line.startswith('$var '):
   a=line.split(); identifiers['.'.join(scopes+[a[4]])]=a[3]
  elif line.startswith('$enddefinitions '): first=i+1;break
 assert first is not None
 root='native_program_tb.'
 signals={
 'clk':'clk','reset':'reset','gcyc':'gcyc','gstb':'gstb','we':'we','addr':'addr',
 'pipe':'dut.domem.i_pipe_stb','cycle':'dut.domem.cyc',
 'byte':'dut.domem.i_addr','word':'dut.domem.o_wb_addr',
 'stall':'dut.domem.i_wb_stall'
 }
 signals={k:identifiers[root+v] for k,v in signals.items()}
 rows=[]; stamp=None
 def store():
  if stamp is not None and vals.get(signals['clk'])=='1':
   rows.append((stamp,{k:vals.get(v,'x') for k,v in signals.items()}))
 for line in lines[first:]:
  if line.startswith('#'): store();stamp=int(line[1:])
  elif line and line[0] in '01xXzZ' and len(line)>1: vals[line[1:]]=line[0].lower()
  elif line.startswith('b'):
   value,key=line[1:].split(); vals[key]=value.lower()
 store()
 return rows

def num(s):
 return int(s,2) if re.fullmatch('[01]+',s) else None

def main(filename):
 with zipfile.ZipFile(filename) as z:
  assert z.testzip() is None, 'Invalid ZIP CRC'
  assert z.read('parent-commit.txt').decode().strip()==ORIGINAL_PARENT
  hashes={line.split()[1]:line.split()[0] for line in z.read('ORIGINAL_SOURCE_SHA256.txt').decode().splitlines()}
  for name,digest in ORIGINAL_SHA.items(): assert hashes.get(name)==digest,('Source mismatch',name)
  for revision in ('parent','child'):
   case=revision+'-IMMEDIATE'
   log=z.read(case+'/run.log').decode()
   assert 'COMPILATION_EXIT=0' in z.read(case+'/compile.log').decode()
   assert 'SIMULATION_EXIT=0' in log and 'NATIVE_RTL_WITNESS_PASS' in log
   assert 'insn=14800100' in log and 'insn=1c800100' in log
   matches=[]; bus=[]
   for stamp,s in parse_vcd(z.read(case+'/trace.vcd')):
    if (num(s['reset'])==0 and num(s['pipe'])==1 and num(s['cycle'])==1
       and num(s['stall'])==0 and num(s['byte'])==0x100 and num(s['word'])==0x40):
     matches.append(stamp)
    if (num(s['gcyc'])==1 and num(s['gstb'])==1 and num(s['we'])==0 and num(s['addr'])==0x40):
     bus.append(stamp)
   assert matches and bus, 'Missing internal or external bus witness: '+case
   assert 0x100 not in (0x40,0x41) and (0x100>>2)==0x40
   print(f'{case}: PASS internal_witness={len(matches)} top_level_bus_reads={len(bus)} first_ps={matches[0]}')
  for revision in ('parent','child'):
   for mode in ('LDI','OLD'):
    log=z.read(revision+'-'+mode+'/run.log').decode()
    assert 'SIMULATION_EXIT=1' in log and 'NO_NATIVE_WITNESS' in log
    print(f'{revision}-{mode}: expected NONWITNESS')
 print('AUDIT_PASS: controlled non-FORMAL Icarus replay, not pristine RTL or a physical chip finding')

if __name__=='__main__':main(sys.argv[1])
