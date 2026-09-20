#!/usr/bin/env python3
"""G30D: original CPU plus assumption-only in-module probe, same for original proof and exact cover."""
from pathlib import Path
import hashlib
base=Path('/tmp/g30-rvf/cores/picorv32');out=Path('g30-out')/( __import__('os').environ['REV']+'-'+__import__('os').environ['OP'])
out.mkdir(parents=True,exist_ok=True)
p=base/'picorv32.v';original=p.read_text()
marker='\talways @(posedge clk) begin\n\t\tif (!resetn) begin\n\t\t\tmem_la_firstword_reg <= 0;'
assert original.count(marker)==1,'cannot safely identify original memory-assembly boundary'
probe='''
`ifdef RISCV_FORMAL
// G30D: assumption-only evidence boundary, executed IN picorv32; NOT a circuit repair.
// The instruction word has been framed into mem_rdata_latched; no RVFI output assumption.
wire g30d_assembled_shift = mem_rdata_latched[6:0]==7'h13 &&
  ((mem_rdata_latched[14:12]==3'b001 && mem_rdata_latched[31:25]==7'b0000000) ||
   (mem_rdata_latched[14:12]==3'b101 &&
    (mem_rdata_latched[31:25]==7'b0000000 || mem_rdata_latched[31:25]==7'b0100000)));
wire g30d_assembled_c_slli = mem_rdata_latched[1:0]==2'b10 && mem_rdata_latched[15:13]==3'b000;
always @(posedge clk) if (resetn && mem_done && (mem_do_prefetch || mem_do_rinst)) begin
  if (g30d_assembled_shift) begin
    assume (!mem_rdata_latched[11]); // RV32E rd[4] of SLLI/SRLI/SRAI
    assume (!mem_rdata_latched[19]); // RV32E rs1[4]
  end
  if (g30d_assembled_c_slli) assume (!mem_rdata_latched[11]); // C.SLLI rd[4]
end
`endif
'''
assert 'g30d_assembled_shift' not in original
instrumented=original.replace(marker,probe+marker,1)
assert instrumented.replace(probe,'',1)==original,'source has functional modifications'
p.write_text(instrumented)
(out/'ORIGINAL_CPU_EXACT.v').write_text(original)
(out/'PROBE_ONLY_CPU.v').write_text(instrumented)
(out/'INMODULE_PROBE_ONLY.sv').write_text(probe)
(out/'INMODULE_SOURCE_SHA256.txt').write_text('original='+hashlib.sha256(original.encode()).hexdigest()+'\nprobe_only='+hashlib.sha256(instrumented.encode()).hexdigest()+'\n')
# Run the same frozen G30 engine/cover matrix, but remove the failed wrapper
# hierarchical constraints. Only CPU-local probe provides additional legality.
driver=Path('research/date-g30-compressed-alignment-20260920/g30_run.py').read_text()
a=driver.index('qual="""')+len('qual="""');b=driver.index('"""',a)
assert 'uut.mem_16bit_buffer' in driver[a:b]
derived=driver[:a]+'\n// G30D: no wrapper assumption. See CPU-local assumption-only probe.\n'+driver[b:]
assert derived[:a]==driver[:a] and derived[a+len('\n// G30D: no wrapper assumption. See CPU-local assumption-only probe.\n') :]==driver[b:]
Path('g30d_derived_driver.py').write_text(derived)
(out/'DRIVER_SHA256.txt').write_text('original='+hashlib.sha256(driver.encode()).hexdigest()+'\nderived='+hashlib.sha256(derived.encode()).hexdigest()+'\n')
exec(compile(derived,'g30d_derived_driver.py','exec'),{'__name__':'__main__'})
