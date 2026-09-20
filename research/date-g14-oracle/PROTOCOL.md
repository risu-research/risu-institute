# G14 — independent oracle integrity probe

2026-09-20: THIS protocol was written after seeing published riscv-formal issue #49 and the buggy XPERM4/XPERM8 source, but BEFORE executing the new tests. It is a post-discovery experiment plan, not blind novelty or a new bug report.

Original checker repository YosysHQ/riscv-formal at commit c992aa61fdfe0846c5ed90324c596202a1c69b76; actual auto-generated insns/insn_xperm4.v blob 3d3c6af2821a78aeb3bd22c45330cb0409eb7aad and insns/insn_xperm8.v blob 0f0b8f79d4113a1e5bac8069e9f15080fa68ffde. The ratified RISC-V Zbkx specification states a width-w selector picks input element at bit position w*index or zero outside the input range. The reported checker instead shifts by raw index.

Execute ORIGINAL checker Verilog, not a Python imitation, using genuine valid XPERM instruction encoding and nonzero rd, iverilog. Compare identity permutation, all-zero selection (negative smoke control), reversed and out-of-range selection against independently implemented ISA oracle. A precisely one-expression corrected-checker control must agree; preserve source and simulator traces. Original source is never modified in place. No CPU was tested or implied.

Baseline challenge: direct source diff against official spec and a single identity-vector test already find the published bug. Accordingly, the experiment verifies a fourth independent failure family (bad checker/oracle), NOT a novel verification method. To earn novel-method status, demonstrate an additional consequential decision beyond these cheap baselines on genuinely held-out defects with sound independent requirements. Preserve unknowns as unknowns.
