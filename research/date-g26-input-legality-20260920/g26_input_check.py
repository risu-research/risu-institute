#!/usr/bin/env python3
"""Post-hoc threat-to-validity audit. Never changes original upstream RTL/checker."""
import csv,os,shutil,subprocess,tarfile,time
from pathlib import Path
op=os.environ['OP'];revision=os.environ['REV']
root=Path('/tmp/g26rvf/cores/picorv32');out=Path('g26-out')/f'{revision}-{op}';out.mkdir(parents=True,exist_ok=True)
orig=(root/'wrapper.sv').read_text();cfg=(root/'checks.cfg').read_text();(out/'ORIGINAL_WRAPPER.sv').write_text(orig);(out/'ORIGINAL_CHECKS.cfg').write_text(cfg)
assert orig.count('.COMPRESSED_ISA(1)')==1 and orig.count('picorv32 #(\n')==1
assert orig.count('`ifdef PICORV32_CSR_RESTRICT')==1
match={'slli':"[14:12] == 3'b001 && {V}[31:25] == 7'b0000000",'srli':"[14:12] == 3'b101 && {V}[31:25] == 7'b0000000",'srai':"[14:12] == 3'b101 && {V}[31:25] == 7'b0100000"}[op]
rows=[]
for mode in ('param_only','retired_legal','input_legal'):
 w=orig.replace('picorv32 #(\n','picorv32 #(\n    .ENABLE_REGS_16_31(0),\n',1).replace('.COMPRESSED_ISA(1)','.COMPRESSED_ISA(0)',1)
 if mode in ('retired_legal','input_legal'):
  src='rvfi_insn' if mode=='retired_legal' else 'mem_rdata'
  cond=f"{src}[6:0] == 7'h13 && {src}"+match.replace('{V}',src)
  gate='rvfi_valid' if mode=='retired_legal' else 'mem_valid && mem_ready && mem_instr && mem_rdata[1:0] == 2\'b11'
  text=f"// G26 diagnostic {mode}: legal x0..x15 for incoming/retired {op}; NEVER restrict shamt.\nalways @(posedge clock) if (!reset && {gate} && ({cond})) begin\n  assume (!{src}[19]);\n  assume (!{src}[11]);\nend\n"
  w=w.replace('`ifdef PICORV32_CSR_RESTRICT',text+'`ifdef PICORV32_CSR_RESTRICT',1)
 (root/'wrapper.sv').write_text(w);(root/'checks.cfg').write_text(cfg);(out/f'{mode}_WRAPPER.sv').write_text(w)
 if (root/'checks').exists():shutil.rmtree(root/'checks')
 t=time.monotonic();gen=subprocess.run(['python3','../../checks/genchecks.py'],cwd=root,capture_output=True,text=True,timeout=45)
 (out/f'{mode}_generator.log').write_text(gen.stdout+gen.stderr)
 result={'revision':revision,'op':op,'mode':mode,'generator_exit':gen.returncode,'task_exit':'NA','status':'NOT_RUN','time_s':'NA','trace':False}
 if gen.returncode==0:
  try:
   r=subprocess.run(['timeout','150','make','-C','checks',f'insn_{op}_ch0'],cwd=root,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,timeout=163)
   result['task_exit']=r.returncode;result['time_s']=round(time.monotonic()-t,3);(out/f'{mode}_RUN.log').write_text(r.stdout)
  except subprocess.TimeoutExpired as exc:(out/f'{mode}_RUN.log').write_text(str(exc));result['status']='TIMEOUT'
  task=root/'checks'/f'insn_{op}_ch0';status=task/'status'
  if status.exists():result['status']=status.read_text().strip()
  if task.exists():
   result['trace']=bool(list(task.glob('engine_*/trace*.vcd')))
   with tarfile.open(out/f'{mode}_ORIGINAL_SBY.tar.gz','w:gz') as f:f.add(task,arcname=task.name)
 rows.append(result);print(result,flush=True)
(root/'wrapper.sv').write_text(orig);(root/'checks.cfg').write_text(cfg)
with (out/'G26_MATRIX.csv').open('w',newline='') as f:
 wr=csv.DictWriter(f,fieldnames=rows[0]);wr.writeheader();wr.writerows(rows)
assert len(rows)==3
