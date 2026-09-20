// G13: unchanged, pinned, historical picorv32.v as DUT. Bus-only test, no forcing of internal decoded_rs2.
`timescale 1ns/1ps
module rv32e_shift_tb;
  reg clk=0, resetn=0;
  always #5 clk=~clk;
  wire trap, mem_valid, mem_instr;
  reg mem_ready=0;
  wire [31:0] mem_addr, mem_wdata;
  wire [3:0] mem_wstrb;
  reg [31:0] mem_rdata=0;
  reg [31:0] memory[0:255];
  integer i, stores=0, fetches=0;
  function [31:0] addi(input [4:0] rd, input [4:0] rs1, input [11:0] imm);
    addi={imm,rs1,3'b000,rd,7'h13};
  endfunction
  function [31:0] slli(input [4:0] rd, input [4:0] rs1, input [4:0] shamt);
    slli={7'd0,shamt,rs1,3'b001,rd,7'h13};
  endfunction
  function [31:0] srli(input [4:0] rd, input [4:0] rs1, input [4:0] shamt);
    srli={7'd0,shamt,rs1,3'b101,rd,7'h13};
  endfunction
  function [31:0] srai(input [4:0] rd, input [4:0] rs1, input [4:0] shamt);
    srai={7'b0100000,shamt,rs1,3'b101,rd,7'h13};
  endfunction
  function [31:0] sw(input [4:0] rs2, input [4:0] rs1, input [11:0] off);
    sw={off[11:5],rs2,rs1,3'b010,off[4:0],7'h23};
  endfunction
  initial begin
    for(i=0;i<256;i=i+1) memory[i]=32'h00000013; // ADDI x0,x0,0
    memory[0]=addi(1,0,12'd1);
    memory[1]=slli(2,1,5'd16);
    memory[2]=slli(3,1,5'd17);
    memory[3]=srli(4,3,5'd16);
    memory[4]=srai(5,3,5'd17);
    memory[5]=slli(6,1,5'd15); // low shamt control
    memory[6]=sw(2,0,12'd128);
    memory[7]=sw(3,0,12'd132);
    memory[8]=sw(4,0,12'd136);
    memory[9]=sw(5,0,12'd140);
    memory[10]=sw(6,0,12'd144);
    memory[11]=32'h00100073; // EBREAK, not a made-up internal signal
    repeat(10) @(negedge clk);
    resetn=1;
    repeat(1600) @(posedge clk);
    $fatal(1,"TIMEOUT: program did not retire to trap");
  end
  picorv32 #(
`ifdef RV32E_MODE
    .ENABLE_REGS_16_31(0),
`else
    .ENABLE_REGS_16_31(1),
`endif
    .COMPRESSED_ISA(0),.BARREL_SHIFTER(0),.ENABLE_MUL(0),.ENABLE_DIV(0),.REGS_INIT_ZERO(1)
  ) dut(.clk(clk),.resetn(resetn),.trap(trap),
    .mem_valid(mem_valid),.mem_instr(mem_instr),.mem_ready(mem_ready),
    .mem_addr(mem_addr),.mem_wdata(mem_wdata),.mem_wstrb(mem_wstrb),.mem_rdata(mem_rdata),
    .irq(32'd0),.pcpi_wr(1'b0),.pcpi_rd(32'd0),.pcpi_wait(1'b0),.pcpi_ready(1'b0));
  always @(posedge clk) begin
    mem_ready <= 0;
    if(mem_valid && !mem_ready && mem_addr<1024) begin
      mem_ready<=1;
      mem_rdata<=memory[mem_addr>>2];
      if(mem_wstrb[0]) memory[mem_addr>>2][7:0]<=mem_wdata[7:0];
      if(mem_wstrb[1]) memory[mem_addr>>2][15:8]<=mem_wdata[15:8];
      if(mem_wstrb[2]) memory[mem_addr>>2][23:16]<=mem_wdata[23:16];
      if(mem_wstrb[3]) memory[mem_addr>>2][31:24]<=mem_wdata[31:24];
    end
    if(resetn && mem_valid && mem_ready) begin
      if(mem_instr) begin
        fetches=fetches+1;
        $display("FETCH pc=%08h insn=%08h",mem_addr,mem_rdata);
      end else if (|mem_wstrb) begin
        stores=stores+1;
        $display("STORE addr=%08h data=%08h strobe=%b",mem_addr,mem_wdata,mem_wstrb);
      end
    end
    if(resetn && trap) begin
      #1;
      $display("END fetches=%0d stores=%0d slli16=%08h slli17=%08h srli16=%08h srai17=%08h slli15=%08h",fetches,stores,memory[32],memory[33],memory[34],memory[35],memory[36]);
      if(stores!=5 || fetches<11 || memory[36]!==32'h00008000)
        $fatal(1,"INVALID TEST: incomplete run or low-shamt control failed");
      if(memory[32]===32'h00010000 && memory[33]===32'h00020000 && memory[34]===32'h00000002 && memory[35]===32'h00000001)
        $display("ARCH_RESULT=PASS");
      else
        $display("ARCH_RESULT=FAIL");
      $finish;
    end
  end
endmodule
