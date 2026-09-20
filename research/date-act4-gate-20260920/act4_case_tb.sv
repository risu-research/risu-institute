`timescale 1ns/1ps
module act4_case_tb;
  reg clk=0,resetn=0,mem_ready=0;
  always #5 clk=~clk;
  wire trap,mem_valid,mem_instr;
  wire [31:0] mem_addr,mem_wdata;
  wire [3:0] mem_wstrb;
  reg [31:0] mem_rdata=0;
  reg [31:0] mem[0:255];
  reg [31:0] operand=0;
  reg [19:0] hi;
  reg [11:0] lo;
  integer i,op=0,amt=0,rd=0,fetches=0,stores=0;
  function [31:0] insn_shift(input integer which, sh, dest);
    reg [6:0] f7;reg [2:0] f3;
    begin
      f7=(which==2) ? 7'b0100000 : 7'b0000000;
      f3=(which==0)? 3'b001 : 3'b101;
      insn_shift={f7,sh[4:0],5'd1,f3,dest[4:0],7'h13};
    end
  endfunction
  function [31:0] insn_sw(input [4:0] rs,input [11:0] off);
    insn_sw={off[11:5],rs,5'd0,3'b010,off[4:0],7'h23};
  endfunction
  picorv32 #(
    .ENABLE_REGS_16_31(0), .BARREL_SHIFTER(1),
    .COMPRESSED_ISA(0),.ENABLE_MUL(0),.ENABLE_DIV(0),.REGS_INIT_ZERO(1)
  ) dut (
    .clk(clk),.resetn(resetn),.trap(trap),.mem_valid(mem_valid),.mem_instr(mem_instr),
    .mem_ready(mem_ready),.mem_addr(mem_addr),.mem_wdata(mem_wdata),.mem_wstrb(mem_wstrb),
    .mem_rdata(mem_rdata),.irq(32'd0),.pcpi_wr(1'b0),.pcpi_rd(32'd0),.pcpi_wait(1'b0),.pcpi_ready(1'b0));
  initial begin
    if(!$value$plusargs("OP=%d",op))$fatal(1,"missing OP");
    if(!$value$plusargs("SH=%d",amt))$fatal(1,"missing SH");
    if(!$value$plusargs("RD=%d",rd))$fatal(1,"missing RD");
    if(!$value$plusargs("INPUT=%h",operand))$fatal(1,"missing INPUT");
    if(op<0 || op>2 || amt<0 || amt>31 || rd<1 || rd>15)$fatal(1,"illegal ACT4 case");
    hi=(operand+32'h800)>>12;
    lo=operand-(hi<<12);
    for(i=0;i<256;i=i+1)mem[i]=32'h00000013;
    mem[0]={hi,5'd1,7'h37};
    mem[1]={lo,5'd1,3'd0,5'd1,7'h13};
    mem[2]=insn_shift(op,amt,rd);
    mem[3]=insn_sw(rd[4:0],12'd128);
    mem[4]={12'd7,5'd0,3'd0,5'd3,7'h13};
    mem[5]=insn_sw(3,12'd132);
    mem[6]=32'h00100073;
    repeat(10) @(negedge clk);resetn=1;
    repeat(1600) @(negedge clk);
    $fatal(1,"TIMEOUT before CPU end");
  end
  always @(posedge clk) begin
    mem_ready<=0;
    if(mem_valid && !mem_ready && mem_addr<1024)begin
      mem_ready<=1;mem_rdata<=mem[mem_addr>>2];
      if(mem_wstrb[0])mem[mem_addr>>2][7:0]<=mem_wdata[7:0];
      if(mem_wstrb[1])mem[mem_addr>>2][15:8]<=mem_wdata[15:8];
      if(mem_wstrb[2])mem[mem_addr>>2][23:16]<=mem_wdata[23:16];
      if(mem_wstrb[3])mem[mem_addr>>2][31:24]<=mem_wdata[31:24];
    end
    if(resetn && mem_valid && mem_ready)begin
      if(mem_instr)fetches=fetches+1;
      else if(|mem_wstrb)stores=stores+1;
    end
    if(resetn && trap)begin
      #1;
      $display("ACT4_CASE_RESULT op=%0d sh=%0d rd=%0d input=%08h data=%08h control=%08h fetches=%0d stores=%0d",op,amt,rd,operand,mem[32],mem[33],fetches,stores);
      if(stores!=2 || fetches<7 || mem[33]!==32'd7)$fatal(1,"INVALID protocol/control");
      $finish;
    end
  end
endmodule
