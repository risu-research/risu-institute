# U087 focused false-negative witness — Swap3

Frozen label: N1  
Audit correction: **E1**

The exact parent already contains `Swap3`. Its body swaps stack positions 0 and 2, despite the declaration being `Swap3` and requiring more than three operands. Its contract likewise describes position 2.

Parent fragments:
```dafny
function Swap3(s: EState): (s': EState)
  requires s.Operands() > 3
  ...
  ensures s'.stack[0] == s.stack[2]
  ensures s'.stack[2] == s.stack[0]
{
  EState(s.pc + 1, s.stack[0 := s.stack[2]][2 := s.stack[0]])
}
```

The historical head changes the same declaration to position 3 and relates it to generic `Swap(s,3)`:
```dafny
function Swap3(s: EState): (s': EState)
  requires s.Operands() > 3
  ...
  ensures s'.stack[0] == s.stack[3]
  ensures s'.stack[3] == s.stack[0]
  ensures s' == Swap(s, 3)
{
  EState(s.pc + 1, s.stack[0 := s.stack[3]][3 := s.stack[0]])
}
```

This is direct existing-declaration executable-contract co-evolution. The correction is E1 rather than E0 because the same unit is a broad 718-line patch containing hundreds of additional contract lines, new concrete opcode declarations, and pretty-printer rewrites. A patch-wide exact-endpoint four-way factorization is therefore not unique/mechanical under the frozen rule.
