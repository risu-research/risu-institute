// An external immutable instruction ROM; the pinned DUT is never modified.
// The domain is this small legal RV32E program family, NOT all RV32E programs.
module memory_bridge #(
  parameter integer OP = 0,       // 0=SLLI, 1=SRLI, 2=SRAI
  parameter integer SPLIT = 1,    // 1=32-bit shift starts at PC=6
  parameter integer LOW_ONLY = 0, // shift amounts 0..15, negative control
  parameter integer SH_FIXED = 16 // simulation witness
) (input wire clock);
  reg [6:0] ticks = 0;
  wire resetn = ticks >= 3;
  always @(posedge clock) if (ticks < 100) ticks <= ticks + 1;
`ifdef BRIDGE_FORMAL
  (* anyconst *) reg [19:0] rom_hi;
  (* anyconst *) reg [4:0] shift_raw;
`else
  reg [19:0] rom_hi = 20'h80010;
  reg [4:0] shift_raw = SH_FIXED;
`endif
  wire [4:0] shamt = LOW_ONLY ? {1'b0,shift_raw[3:0]} : shift_raw;
  wire [31:0] operand = {rom_hi,12'b0};
  wire [31:0] shift_word = {(OP==2 ? 7'b0100000 : 7'b0000000),
    shamt,5'd9,(OP==0 ? 3'b001 : 3'b101),5'd2,7'h13};
  wire signed [31:0] signed_operand = $signed(operand);
  wire [31:0] arith_shift = signed_operand >>> shamt;
  wire [31:0] expected = OP==0 ? (operand << shamt) :
    OP==1 ? (operand >> shamt) : arith_shift;
  localparam [31:0] TARGET_PC = SPLIT ? 32'd6 : 32'd8;
  // PC0 LUI x9; PC4 c.nop / shift-low; PC8 shift / shift-high + c.nop.
  // PC12 SW x2,128(x0); PC16 ADDI x3,x0,7; PC20 SW x3,132(x0).
  wire [31:0] rom_0 = {rom_hi,5'd9,7'h37};
  wire [31:0] rom_4 = SPLIT ? {shift_word[15:0],16'h0001} : 32'h00010001;
  wire [31:0] rom_8 = SPLIT ? {16'h0001,shift_word[31:16]} : shift_word;
  wire [31:0] rom_12 = {7'd4,5'd2,5'd0,3'b010,5'd0,7'h23};
  wire [31:0] rom_16 = {12'd7,5'd0,3'b000,5'd3,7'h13};
  wire [31:0] rom_20 = {7'd4,5'd3,5'd0,3'b010,5'd4,7'h23};
  wire [31:0] rom_24 = 32'h00100073;
  wire mem_valid,mem_instr,trap;
  wire [31:0] mem_addr,mem_wdata;
  wire [3:0] mem_wstrb;
  wire mem_ready = mem_valid;
  reg [31:0] rom_word;
  always @* begin
    case (mem_addr)
      32'd0: rom_word=rom_0;
      32'd4: rom_word=rom_4;
      32'd8: rom_word=rom_8;
      32'd12: rom_word=rom_12;
      32'd16: rom_word=rom_16;
      32'd20: rom_word=rom_20;
      32'd24: rom_word=rom_24;
      default: rom_word=32'h00100073;
    endcase
  end
  wire [31:0] mem_rdata = mem_instr ? rom_word : 32'b0;
  wire rvfi_valid,rvfi_trap;
  wire [31:0] rvfi_insn,rvfi_pc_rdata,rvfi_rs1_rdata,rvfi_rd_wdata;
  wire [4:0] rvfi_rd_addr,rvfi_rs1_addr;
  picorv32 #(.ENABLE_REGS_16_31(0),.COMPRESSED_ISA(1),
    .BARREL_SHIFTER(1),.ENABLE_MUL(0),.ENABLE_DIV(0),
    .ENABLE_IRQ(0),.REGS_INIT_ZERO(1)) dut (
    .clk(clock),.resetn(resetn),.trap(trap),
    .mem_valid(mem_valid),.mem_instr(mem_instr),.mem_ready(mem_ready),
    .mem_addr(mem_addr),.mem_wdata(mem_wdata),.mem_wstrb(mem_wstrb),
    .mem_rdata(mem_rdata),.irq(32'b0),
    .pcpi_wr(1'b0),.pcpi_rd(32'b0),.pcpi_wait(1'b0),.pcpi_ready(1'b0),
    .rvfi_valid(rvfi_valid),.rvfi_insn(rvfi_insn),.rvfi_trap(rvfi_trap),
    .rvfi_pc_rdata(rvfi_pc_rdata),.rvfi_rs1_addr(rvfi_rs1_addr),
    .rvfi_rs1_rdata(rvfi_rs1_rdata),.rvfi_rd_addr(rvfi_rd_addr),
    .rvfi_rd_wdata(rvfi_rd_wdata));
  reg seen_target=0,seen_store=0,seen_control=0;
  reg saw_first=0,saw_second=0;
  always @(posedge clock) if (resetn) begin
    if (mem_valid && mem_ready && mem_instr && mem_addr==32'd4)
      saw_first <= 1;
    if (mem_valid && mem_ready && mem_instr && mem_addr==32'd8)
      saw_second <= 1;
    if (rvfi_valid && rvfi_pc_rdata==TARGET_PC) begin
      seen_target <= 1;
`ifndef BRIDGE_FORMAL
      $display("RETIRE op=%0d split=%0d shamt=%0d operand=%08h got=%08h expected=%08h pc=%08h",OP,SPLIT,shamt,operand,rvfi_rd_wdata,expected,rvfi_pc_rdata);
      if (rvfi_rd_wdata !== expected) begin $display("EXPECTED_OLD_MISMATCH"); $finish; end
`endif
      assert(rvfi_insn==shift_word);
      assert(rvfi_trap==0);
      assert(rvfi_rs1_addr==5'd9);
      assert(rvfi_rs1_rdata==operand);
      assert(rvfi_rd_addr==5'd2);
      assert(rvfi_rd_wdata==expected);
      if (SPLIT) assert(saw_first && saw_second);
`ifdef BRIDGE_FORMAL
      cover(shift_raw[4] && rom_hi!=0 && SPLIT && saw_first && saw_second);
`endif
    end
    if (mem_valid && mem_ready && !mem_instr && mem_wstrb==4'hf) begin
      if (mem_addr==32'd128) begin
        seen_store <= 1;
        assert(mem_wdata==expected);
      end
      if (mem_addr==32'd132) begin
        seen_control <= 1;
        assert(mem_wdata==32'd7);
      end
    end
`ifdef BRIDGE_FORMAL
    if (ticks==7'd70) begin
      assert(seen_target);
      assert(seen_store);
      assert(seen_control);
      assert(saw_first && saw_second);
    end
`endif
  end
`ifndef BRIDGE_FORMAL
  initial begin #2000; $display("TIMEOUT"); $fatal(1); end
  always @(posedge clock) if (ticks==7'd75) begin
    $display("RESULT op=%0d split=%0d shift=%0d operand=%08h expected=%08h target=%0d store=%0d control=%0d",OP,SPLIT,shamt,operand,expected,seen_target,seen_store,seen_control);
    if (!(seen_target && seen_store && seen_control && saw_first && saw_second)) $fatal(1,"missing coverage");
    $finish;
  end
`endif
endmodule
`ifndef BRIDGE_FORMAL
module bridge_sim;
  reg clock=0;
  always #5 clock=~clock;
  memory_bridge #(.OP(`SIM_OP),.SPLIT(`SIM_SPLIT),.LOW_ONLY(`SIM_LOW),.SH_FIXED(`SIM_SHIFT)) test(.clock(clock));
endmodule
`endif
