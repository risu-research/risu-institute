#!/usr/bin/env python3
"""Derive a bounded, address-stable external bus from the frozen ROM model."""
from pathlib import Path
import difflib
src=Path('results/memory_bridge.sv')
out=Path('results/memory_bridge_wait.sv')
orig=src.read_text()
old='  wire mem_ready = mem_valid;'
new='''  // External response latency is chosen per ROM address class, not per cycle.
  // Word contents remain an immutable function of the requested address.
  reg [1:0] pending_wait = 0;
`ifdef BRIDGE_FORMAL
  (* anyconst *) reg [1:0] response4;
  (* anyconst *) reg [1:0] response8;
  (* anyconst *) reg [1:0] response_else;
  wire [1:0] wait4 = response4 == 2'd3 ? 2'd2 : response4;
  wire [1:0] wait8 = response8 == 2'd3 ? 2'd2 : response8;
  wire [1:0] wait_else = response_else == 2'd3 ? 2'd2 : response_else;
`else
  wire [1:0] wait4 = 2'd2;
  wire [1:0] wait8 = 2'd2;
  wire [1:0] wait_else = 2'd2;
`endif
  wire [1:0] wait_limit = mem_addr == 32'd4 ? wait4 :
                          mem_addr == 32'd8 ? wait8 : wait_else;
  wire mem_ready = mem_valid && pending_wait >= wait_limit;
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
print('ADDRESS_STABLE_WAIT_VARIANT_OK')
