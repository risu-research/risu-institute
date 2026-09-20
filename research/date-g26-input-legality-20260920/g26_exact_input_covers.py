#!/usr/bin/env python3
"""Source-identical input-owned legal-shift nonvacuity; exact independent cover tasks."""
from pathlib import Path
import json,os,shutil,subprocess,tarfile,time
rev=os.environ['REV'];op=os.environ['OP'];base=Path('/tmp/g26cover/cores/picorv32');out=Path('g26-cover')/f'{rev}-{op}';out.mkdir(parents=True,exist_ok=True)
orig=(base/'wrapper.sv').read_text();cfg=(base/'checks.cfg').read_text();assert orig.count('picorv32 #(\n')==1 and orig.count('.COMPRESSED_ISA(1)')==1
w=orig.replace('picorv32 #(\n','picorv32 #(\n    .ENABLE_REGS_16_31(0),\n',1).replace('.COMPRESSED_ISA(1)','.COMPRESSED_ISA(0)',1)
f3="3'b001" if op=='slli' else "3'b101";f7="7'b0100000" if op=='srai' else "7'b0000000"
qual=f"// G26 incoming instruction only; NO DUT output assumption or shamt restriction.\nalways @(posedge clock) if (!reset && mem_valid && mem_ready && mem_instr && mem_rdata[1:0] == 2'b11 && mem_rdata[6:0] == 7'h13 && mem_rdata[14:12] == {f3} && mem_rdata[31:25] == {f7}) begin\n assume (!mem_rdata[19]);\n assume (!mem_rdata[11]);\nend\n"
assert w.count('`ifdef PICORV32_CSR_RESTRICT')==1
w=w.replace('`ifdef PICORV32_CSR_RESTRICT',qual+'`ifdef PICORV32_CSR_RESTRICT',1)
(base/'wrapper.sv').write_text(w);(out/'EFFECTIVE_WRAPPER.sv').write_text(w)
r=subprocess.run(['python3','../../checks/genchecks.py'],cwd=base,capture_output=True,text=True,timeout=45);(out/'GENERATOR.log').write_text(r.stdout+r.stderr);assert r.returncode==0
r=subprocess.run(['timeout','90','make','-C','checks',f'insn_{op}_ch0'],cwd=base,capture_output=True,text=True,timeout=105);(out/'BASE_CHECK.log').write_text(r.stdout+r.stderr);assert (base/'checks'/f'insn_{op}_ch0').exists()
source=base/'checks'/f'insn_{op}_ch0';rows=[]
for shamt in ([16] if rev=='parent' else [15,16]):
 word=((0x20 if op=='srai' else 0)<<25)|(shamt<<20)|(9<<15)|((1 if op=='slli' else 5)<<12)|(2<<7)|0x13
 name=f'{rev}_{op}_{shamt}';task=base/'checks'/('g26_'+name)
 if task.exists():shutil.rmtree(task)
 shutil.copytree(source,task)
 sbyp=task/'config.sby';s=sbyp.read_text();assert 'mode bmc' in s and 'skip 20' in s
 s=s.replace('mode bmc','mode cover',1).replace('skip 20','skip 0',1).replace('depth 21','depth 22',1)
 check=task/'src/rvfi_insn_check.sv';t=check.read_text()
 for stmt in ('cover(spec_valid);','cover(spec_valid && !trap);','cover(check && spec_valid);','cover(check && spec_valid && !trap);'):
  assert t.count(stmt)==1; t=t.replace(stmt,'// G26 remove generic cover '+stmt)
 marker='if (!reset && check) begin';assert t.count(marker)==1
 t=t.replace(marker,f"cover(check && valid && spec_valid && !trap && insn == 32'h{word:08x} && rs1_addr == 5'd9 && rd_addr == 5'd2);\n"+marker,1)
 check.write_text(t)
 old='/tmp/g26cover/cores/picorv32/../../checks/rvfi_insn_check.sv';assert s.count(old)==1
 sbyp.write_text(s.replace(old,str(check.resolve()),1))
 t0=time.monotonic();r=subprocess.run(['timeout','100','sby','-f','config.sby'],cwd=task,capture_output=True,text=True,timeout=110)
 (out/f'{name}.log').write_text(r.stdout+r.stderr)
 status=(task/'config/status').read_text().strip() if (task/'config/status').exists() else 'NO_STATUS'
 vcd=list((task/'config/engine_0').glob('trace*.vcd')) if (task/'config/engine_0').is_dir() else []
 if vcd:shutil.copy2(vcd[0],out/f'{name}.vcd')
 (out/f'{name}.sby').write_text(sbyp.read_text());(out/f'{name}_checker.sv').write_text(t)
 rows.append(dict(revision=rev,op=op,shamt=shamt,instruction=f'{word:08x}',status=status,exit=r.returncode,vcd=bool(vcd),seconds=round(time.monotonic()-t0,3)))
 print(rows[-1],flush=True)
(out/'COVER_RESULTS.json').write_text(json.dumps(rows,indent=2)+'\n');assert len(rows)==(1 if rev=='parent' else 2)
