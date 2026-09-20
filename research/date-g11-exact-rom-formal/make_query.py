#!/usr/bin/env python3
"""Reconstruct exact-ROM bounded queries from complete original Yosys ZipCPU SMT.
Every case keeps zipcpu_i/h/t/u/a, including the first-cycle reset assumption.
Only the shared native-fetch pulse contract is diagnosed away; in parent_relaxed
only the historical pipemem.v:352 assertion is additionally omitted.
"""
import argparse,hashlib,pathlib,re
P=argparse.ArgumentParser()
P.add_argument('model',type=pathlib.Path)
P.add_argument('out',type=pathlib.Path)
P.add_argument('--case',choices=('child','parent','parent_relaxed'),required=True)
P.add_argument('--depth',type=int,default=14)
P.add_argument('--first',type=int,default=12)
P.add_argument('--last',type=int,default=12)
P.add_argument('--anchor',choices=('first-fetch','none'),default='first-fetch')
A=P.parse_args()
assert A.depth>=A.last+1>=A.first+1 and A.depth>=7
original=A.model.read_text();s=original
assert '; yosys-smt2-topmod zipcpu' in s
assert 'dblfetch/ADDRESS_WIDTH=30' in s and 'mpyop' in s
pulse='|$paramod/dblfetch/ADDRESS_WIDTH=30_u 1|'
assert len(re.findall(r'^\(define-fun '+re.escape(pulse)+r'.*; \$assume\$.*dblfetch\.v:350\$',s,re.M))==1
needle='  ('+pulse+' state)\n';assert s.count(needle)==1
s=s.replace(needle,'  true ; DIAGNOSTIC ONLY: omit dblfetch.v:350 new-PC pulse restriction\n',1)
assert '  (|$paramod/dblfetch/ADDRESS_WIDTH=30_u 2| state)\n' in s  # preserve original initial reset
prefix="$paramod/pipemem/ADDRESS_WIDTH=30/IMPLEMENT_LOCK=1'1/WITH_LOCAL_BUS=1'1"
if A.case!='child':
    match=re.findall(r'^\(define-fun \|([^|]*pipemem[^|]*_a [0-9]+)\| .*; \$assert\$.*pipemem\.v:352\$',s,re.M)
    assert len(match)==1,('historical address assertion identification failed',match)
    address='|'+match[0]+'|'
    if A.case=='parent_relaxed':
        needle='  ('+address+' state)\n';assert s.count(needle)==1
        s=s.replace(needle,'  true ; DIAGNOSTIC ONLY: omit pipemem.v:352 OLD address assertion\n',1)
else:address=None

def q(n,t):return '(|zipcpu_n '+n+'| s'+str(t)+')'
def d(n,t):return '(|'+prefix+'_n '+n+'| (|zipcpu_h domem| s'+str(t)+'))'
def b(v,w):return '#b'+format(v,'0'+str(w)+'b')
def put(e):return '(assert '+e+')\n'
lines=['; Exact G11 two-instruction ROM; source-model SHA256 '+hashlib.sha256(original.encode()).hexdigest()+'\n','; case '+A.case+' anchor '+A.anchor+'\n',s,'(set-option :produce-models true)\n']
for t in range(A.depth+1):lines.append('(declare-fun s'+str(t)+' () |zipcpu_s|)\n')
lines.append(put('(|zipcpu_i| s0)'))
for t in range(A.depth+1):
    for name in ('zipcpu_h','zipcpu_u','zipcpu_a'):lines.append(put('(|'+name+'| s'+str(t)+')'))
    lines.append(put('(= '+q('i_reset',t)+' '+('true' if t==0 else 'false')+')'))
    for x in ('i_halt','i_dbg_we','i_interrupt','i_clear_pf_cache','i_wb_stall','i_wb_err'):
        lines.append(put('(not '+q(x,t)+')'))
    if t<A.depth:lines.append(put('(|zipcpu_t| s'+str(t)+' s'+str(t+1)+')'))
lines.append(put('(not '+q('i_wb_ack',0)+')'))
lines.append(put('(= '+q('i_wb_data',0)+' '+b(0,32)+')'))
for t in range(1,A.depth+1):
    j=t-1
    req='(or (and '+q('o_wb_gbl_cyc',j)+' '+q('o_wb_gbl_stb',j)+') (and '+q('o_wb_lcl_cyc',j)+' '+q('o_wb_lcl_stb',j)+'))'
    addr=q('o_wb_addr',j)
    rom='(ite (= '+addr+' '+b(0x40000,30)+') '+b(0x14800100,32)+' (ite (= '+addr+' '+b(0x40001,30)+') '+b(0x1c800100,32)+' '+b(0x07c00000,32)+'))'
    lines.append(put('(= '+q('i_wb_ack',t)+' '+req+')'))
    lines.append(put('(= '+q('i_wb_data',t)+' (ite '+req+' '+rom+' '+q('i_wb_data',j)+'))'))
# A single source-observed, non-target fetch signal guides model search.
# It does NOT constrain either instruction word, address, or the subsequent pipeline.
if A.anchor=='first-fetch':lines.append(put('(= '+q('pf_valid',5)+' true)'))
target=[]
for t in range(A.first,A.last+1):
    xs=[d('i_pipe_stb',t),d('f_cyc',t),'(= '+d('i_addr',t)+' '+b(0x100,32)+')','(= '+d('o_wb_addr',t)+' '+b(0x40,30)+')','(not '+d('i_wb_stall',t)+')']
    target.append('(and '+' '.join(xs)+')')
lines.append(put('(or '+' '.join(target)+')'))
lines.append('(check-sat)\n')
for t in range(A.depth+1):
    obs=[q('i_reset',t),q('i_wb_ack',t),q('i_wb_data',t),q('o_wb_addr',t),q('pf_valid',t),q('pf_instruction',t),q('pf_instruction_pc',t),d('i_pipe_stb',t),d('f_cyc',t),d('i_addr',t),d('o_wb_addr',t)]
    if address:obs.append('('+address+' (|zipcpu_h domem| s'+str(t)+'))')
    lines.append('(get-value ('+' '.join(obs)+'))\n')
A.out.write_text(''.join(lines))
print('ORIGINAL_MODEL_SHA256',hashlib.sha256(original.encode()).hexdigest())
print('EXACT_QUERY_SHA256',hashlib.sha256(A.out.read_bytes()).hexdigest())
print('CASE',A.case,'DEPTH',A.depth,'TARGET',A.first,A.last,'ANCHOR',A.anchor)
