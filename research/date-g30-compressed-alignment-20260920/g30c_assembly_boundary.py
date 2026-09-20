#!/usr/bin/env python3
"""Replace only G30 input qualifier with clearly labeled predecode boundary; preserve original G30 evidence."""
from pathlib import Path
import hashlib
p=Path('research/date-g30-compressed-alignment-20260920/g30_run.py')
s=p.read_text()
start=s.index('qual="""')+len('qual="""')
end=s.index('"""',start)
original=s[start:end]
assert 'g30_aligned' in original and 'g30_split' in original and 'mem_la_firstword' in original
qual='''
// G30C is an assembly-boundary policy, NOT a pure externally-owned input policy.
// Original mem_rdata_latched is fully assembled from the original CPU's
// accepted memory response and optional prefetch halfword. It is before decode
// and the RVFI retirement signals remain entirely unconstrained by assumption.
wire g30_assembled_shift = uut.mem_rdata_latched[6:0] == 7'h13 &&
  ((uut.mem_rdata_latched[14:12]==3'b001 && uut.mem_rdata_latched[31:25]==7'b0000000) ||
   (uut.mem_rdata_latched[14:12]==3'b101 &&
      (uut.mem_rdata_latched[31:25]==7'b0000000 || uut.mem_rdata_latched[31:25]==7'b0100000)));
wire g30_assembled_c_slli = uut.mem_rdata_latched[1:0]==2'b10 && uut.mem_rdata_latched[15:13]==3'b000;
always @(posedge clock) if (!reset && uut.mem_done && (uut.mem_do_prefetch || uut.mem_do_rinst)) begin
  if (g30_assembled_shift) begin
    assume (!uut.mem_rdata_latched[11]); // 32-bit shift rd[4]
    assume (!uut.mem_rdata_latched[19]); // 32-bit shift rs1[4]
  end
  if (g30_assembled_c_slli) assume (!uut.mem_rdata_latched[11]); // C.SLLI rd[4]
end
'''
fixed=s[:start]+qual+s[end:]
assert fixed[:start]==s[:start] and fixed[start+len(qual):]==s[end:]
assert 'assume (!rvfi_insn' not in fixed
Path('g30c_derived_driver.py').write_text(fixed)
Path('g30c_derived_rule.sv').write_text(qual)
Path('g30c_DRIVER_SHA.txt').write_text('source_driver='+hashlib.sha256(s.encode()).hexdigest()+'\nassembly_driver='+hashlib.sha256(fixed.encode()).hexdigest()+'\n')
exec(compile(fixed,'g30c_derived_driver.py','exec'),{'__name__':'__main__'})
