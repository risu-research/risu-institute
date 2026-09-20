#!/usr/bin/env python3
"""Derive a zero-to-two-wait external bus from the frozen immediate-ROM model."""
from pathlib import Path
import difflib
src=Path('results/memory_bridge.sv')
out=Path('results/memory_bridge_wait.sv')
orig=src.read_text()
old='  wire mem_ready = mem_valid;'
new='''  // The external memory may respond immediately or after up to two clocks.
  // Its returned word depends only on the address, never on the wait choice.
  reg [1:0] pending_wait = 0;
`ifdef BRIDGE_FORMAL
  (* anyseq *) wire allow_early;
`else
  wire allow_early = 1'b0; // deterministic two-wait simulation control
`endif
  wire mem_ready = mem_valid && (pending_wait == 2 || allow_early);
  always @(posedge clock) begin
    if (!resetn || !mem_valid || mem_ready) pending_wait <= 0;
    else pending_wait <= pending_wait + 1;
  end'''
assert orig.count(old)==1
assert orig.count("if (ticks==7'd70)")==1
assert orig.count("if (ticks==7'd75)")==1
changed=orig.replace(old,new).replace("if (ticks==7'd70)","if (ticks==7'd92)").replace("if (ticks==7'd75)","if (ticks==7'd97)")
assert 'assume(' not in changed and 'assume (' not in changed
out.write_text(changed)
Path('results/BOUNDED_WAIT.patch').write_text(''.join(difflib.unified_diff(orig.splitlines(True),changed.splitlines(True),fromfile='memory_bridge.sv',tofile='memory_bridge_wait.sv')))
print('BOUNDED_WAIT_VARIANT_OK')
