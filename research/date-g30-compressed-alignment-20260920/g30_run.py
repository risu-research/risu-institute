#!/usr/bin/env python3
"""G30 original CPU, input legality with compressed enabled, matched exact covers."""
import hashlib,json,os,shutil,subprocess,tarfile
from pathlib import Path
op=os.environ['OP'];rev=os.environ['REV'];base=Path('/tmp/g30-rvf/cores/picorv32')
out=Path('g30-out')/f'{rev}-{op}';out.mkdir(parents=True,exist_ok=True)
orig=(base/'wrapper.sv').read_text();cfg=(base/'checks.cfg').read_text()
assert orig.count('.COMPRESSED_ISA(1)')==1 and orig.count('picorv32 #(\n')==1
assert orig.count('`ifdef PICORV32_CSR_RESTRICT')==1
qual="""
// G30 common input domain, all three shifts. No RVFI legality assumptions.
// For 32-bit aligned instructions both fields arrive in one external word.
// For split instructions the lower half and rd arrive in a high input lane;
// rs1 arrives in the following low input lane. CPU buffered half is framing
// context, not an environmental input. This is not output-independent.
wire g30_aligned = (mem_rdata[6:0]==7'h13 &&
 ((mem_rdata[14:12]==3'b001 && mem_rdata[31:25]==7'b0000000) ||
  (mem_rdata[14:12]==3'b101 && (mem_rdata[31:25]==7'b0000000 || mem_rdata[31:25]==7'b0100000))));
wire g30_upper = mem_rdata[22:16]==7'h13 &&
 (mem_rdata[30:28]==3'b001 || mem_rdata[30:28]==3'b101);
wire g30_split = uut.mem_16bit_buffer[6:0]==7'h13 &&
 ((uut.mem_16bit_buffer[14:12]==3'b001 && mem_rdata[15:9]==7'b0000000) ||
  (uut.mem_16bit_buffer[14:12]==3'b101 &&
   (mem_rdata[15:9]==7'b0000000 || mem_rdata[15:9]==7'b0100000)));
always @(posedge clock) if (!reset && mem_valid && mem_ready && mem_instr) begin
 if (!uut.mem_la_firstword && !uut.mem_la_secondword && g30_aligned) begin
  assume (!mem_rdata[11]); assume (!mem_rdata[19]);
 end
 if (g30_upper) assume (!mem_rdata[27]);
 if (uut.mem_la_secondword && g30_split) assume (!mem_rdata[3]);
 // Compressed C.SLLI may specify full 5-bit x16..x31, unlike C.SRLI/SRAI.
 if (mem_rdata[1:0]==2'b10 && mem_rdata[15:13]==3'b000) assume (!mem_rdata[11]);
 if (mem_rdata[17:16]==2'b10 && mem_rdata[31:29]==3'b000) assume (!mem_rdata[27]);
end
"""
w=orig.replace('picorv32 #(\n','picorv32 #(\n    .ENABLE_REGS_16_31(0),\n',1)
w=w.replace('`ifdef PICORV32_CSR_RESTRICT',qual+'`ifdef PICORV32_CSR_RESTRICT',1)
assert '.COMPRESSED_ISA(1)' in w and 'assume (!rvfi_insn' not in w
(base/'wrapper.sv').write_text(w)
(out/'ORIGINAL_WRAPPER.sv').write_text(orig);(out/'EFFECTIVE_WRAPPER.sv').write_text(w)
(out/'SOURCE_WRAPPER_HASH.txt').write_text('original='+hashlib.sha256(orig.encode()).hexdigest()+'\neffective='+hashlib.sha256(w.encode()).hexdigest()+'\n')
(out/'ORIGINAL_CHECKS.cfg').write_text(cfg)
(out/'SOURCE_REVISIONS.txt').write_text(subprocess.check_output(['git','rev-parse','HEAD'],cwd=base.parent.parent,text=True))
results=[]
def run(name,cmd,cwd,timeout):
 try:
  p=subprocess.run(cmd,cwd=cwd,capture_output=True,text=True,timeout=timeout)
  (out/(name+'.log')).write_text(p.stdout+p.stderr);return p.returncode
 except subprocess.TimeoutExpired as e:
  (out/(name+'.log')).write_text(str(e));return 124
rc=run('GENERATOR',['python3','../../checks/genchecks.py'],base,65)
if rc:raise RuntimeError('generator error '+str(rc))
name=f'insn_{op}_ch0';task=base/'checks'/name
rc=run('PROOF',['timeout','170','make','-C','checks',name],base,190)
status=(task/'status').read_text().strip() if (task/'status').exists() else 'MISSING'
results.append(dict(revision=rev,op=op,kind='proof',status=status,exit=rc))
if task.exists():
 with tarfile.open(out/'PROOF_ORIGINAL_SBY.tar.gz','w:gz') as z:z.add(task,arcname=name)
if not task.exists():raise RuntimeError('no formal task')
for sh in ([16] if rev=='parent' else [15,16]):
 word=(0x20<<25 if op=='srai' else 0)|(sh<<20)|(9<<15)|((1 if op=='slli' else 5)<<12)|(2<<7)|0x13
 for place in (['any','split'] if rev=='child' and sh==16 else ['any']):
  label=f'cover_{sh}_{place}';cover=base/'checks'/f'g30_{rev}_{op}_{sh}_{place}'
  if cover.exists():shutil.rmtree(cover)
  shutil.copytree(task,cover)
  sbyp=cover/'config.sby';s=sbyp.read_text()
  assert 'mode bmc' in s and 'depth 21' in s and 'skip 20' in s
  s=s.replace('mode bmc','mode cover',1)
  checker=cover/'src/rvfi_insn_check.sv';t=checker.read_text()
  for stmt in ('cover(spec_valid);','cover(spec_valid && !trap);','cover(check && spec_valid);','cover(check && spec_valid && !trap);'):
   assert t.count(stmt)==1;t=t.replace(stmt,'// generic disabled')
  marker='if (!reset && check) begin';assert t.count(marker)==1
  suffix=' && pc_rdata[1]' if place=='split' else ''
  goal=(f"cover(check && valid && spec_valid && !trap && insn == 32'h{word:08x} "
        f"&& rs1_addr == 5'd9 && rd_addr == 5'd2{suffix});\n")
  t=t.replace(marker,goal+marker,1)
  assert t.count('cover(')==1
  checker.write_text(t)
  original_checker='/tmp/g30-rvf/cores/picorv32/../../checks/rvfi_insn_check.sv'
  assert s.count(original_checker)==1
  sbyp.write_text(s.replace(original_checker,str(checker.resolve()),1))
  rc=run(label,['timeout','125','sby','-f','config.sby'],cover,140)
  status_file=cover/'config/status';state=status_file.read_text().strip() if status_file.exists() else 'MISSING'
  results.append(dict(revision=rev,op=op,kind=label,word=f'{word:08x}',status=state,exit=rc,witness=bool(list(cover.glob('config/engine_*/trace*.vcd')))))
  (out/(label+'.sby')).write_text(sbyp.read_text());(out/(label+'_checker.sv')).write_text(t)
  with tarfile.open(out/(label+'_ORIGINAL_SBY.tar.gz'),'w:gz') as z:z.add(cover,arcname=cover.name)
(out/'RESULTS.json').write_text(json.dumps(results,indent=2)+'\n')
(base/'wrapper.sv').write_text(orig)
print(json.dumps(results,indent=2),flush=True)
