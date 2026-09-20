`timescale 1ns/1ps
module picorv32_signed_div_oracle_tb;
 reg clk=0,resetn=0,mem_ready=0;
 always #5 clk=~clk;
 wire trap,mem_valid,mem_instr;
 wire [31:0] mem_addr,mem_wdata;
 wire [3:0] mem_wstrb;
 reg [31:0] mem_rdata=0;
 reg [31:0] memory[0:255];
 integer i,stores=0,fetches=0,correct_rejected=0,corrected_rejected=0;
 reg [31:0] a=0,b=0;
 reg [31:0] cpu_q,cpu_r;
 wire [31:0] old_q,old_r,fixed_q,fixed_r;
 wire div_valid,rem_valid;
 localparam [31:0] DINSN={7'd1,5'd2,5'd1,3'b100,5'd3,7'h33};
 localparam [31:0] RINSN={7'd1,5'd2,5'd1,3'b110,5'd4,7'h33};
 function [31:0] addi(input [4:0] rd, input [11:0] imm);
  addi={imm,5'd0,3'b000,rd,7'h13};
 endfunction
 function [31:0] sw(input [4:0] rs2, input [11:0] off);
  sw={off[11:5],rs2,5'd0,3'b010,off[4:0],7'h23};
 endfunction
 task automatic program_case(input integer off, input [11:0] aa,bb,input [11:0] outaddr);
  begin
   memory[off+0]=addi(1,aa);
   memory[off+1]=addi(2,bb);
   memory[off+2]=DINSN;
   memory[off+3]=RINSN;
   memory[off+4]=sw(3,outaddr);
   memory[off+5]=sw(4,outaddr+12'd4);
  end
 endtask
 picorv32 #(.ENABLE_REGS_16_31(1),.COMPRESSED_ISA(0),.ENABLE_MUL(0),.ENABLE_DIV(1),.REGS_INIT_ZERO(1)) dut (
  .clk(clk),.resetn(resetn),.trap(trap),
  .mem_valid(mem_valid),.mem_instr(mem_instr),.mem_ready(mem_ready),
  .mem_addr(mem_addr),.mem_wdata(mem_wdata),.mem_wstrb(mem_wstrb),.mem_rdata(mem_rdata),
  .irq(32'd0),.pcpi_wr(1'b0),.pcpi_rd(32'd0),.pcpi_wait(1'b0),.pcpi_ready(1'b0));
 rvfi_insn_div oracle_d(.rvfi_valid(1'b1),.rvfi_insn(DINSN),.rvfi_pc_rdata(32'd0),.rvfi_rs1_rdata(a),.rvfi_rs2_rdata(b),.rvfi_mem_rdata(32'd0),.spec_rd_wdata(old_q),.spec_valid(div_valid));
 rvfi_insn_rem oracle_r(.rvfi_valid(1'b1),.rvfi_insn(RINSN),.rvfi_pc_rdata(32'd0),.rvfi_rs1_rdata(a),.rvfi_rs2_rdata(b),.rvfi_mem_rdata(32'd0),.spec_rd_wdata(old_r),.spec_valid(rem_valid));
 rvfi_insn_div_corrected fix_d(.rvfi_valid(1'b1),.rvfi_insn(DINSN),.rvfi_pc_rdata(32'd0),.rvfi_rs1_rdata(a),.rvfi_rs2_rdata(b),.rvfi_mem_rdata(32'd0),.spec_rd_wdata(fixed_q));
 rvfi_insn_rem_corrected fix_r(.rvfi_valid(1'b1),.rvfi_insn(RINSN),.rvfi_pc_rdata(32'd0),.rvfi_rs1_rdata(a),.rvfi_rs2_rdata(b),.rvfi_mem_rdata(32'd0),.spec_rd_wdata(fixed_r));
 task automatic inspect_case(input integer testid,input [31:0] ia,ib,expect_q,expect_r);
  begin
   a=ia; b=ib; #3;
   cpu_q=memory[(128+testid*8)/4]; cpu_r=memory[(132+testid*8)/4];
   if (div_valid!==1'b1 || rem_valid!==1'b1) $fatal(1,"original opcode checker not active");
   if (cpu_q!==expect_q || cpu_r!==expect_r) $fatal(1,"real CPU disagrees with independent ISA testid=%0d q=%h r=%h expected q=%h r=%h",testid,cpu_q,cpu_r,expect_q,expect_r);
   if (old_q!==cpu_q || old_r!==cpu_r) correct_rejected=correct_rejected+1;
   if (fixed_q!==cpu_q || fixed_r!==cpu_r) corrected_rejected=corrected_rejected+1;
   $display("CASE id=%0d a=%08h b=%08h actual_cpu_q=%08h actual_cpu_r=%08h old_oracle_q=%08h old_oracle_r=%08h corrected_oracle_q=%08h corrected_oracle_r=%08h original_rejects_cpu=%0d",testid,a,b,cpu_q,cpu_r,old_q,old_r,fixed_q,fixed_r,(old_q!==cpu_q || old_r!==cpu_r));
  end
 endtask
 initial begin
  for(i=0;i<256;i=i+1)memory[i]=32'h00000013;
  program_case(0,12'hfff,12'd2,12'd128);
  program_case(6,12'd7,12'd3,12'd136);
  program_case(12,12'hff9,12'd3,12'd144);
  memory[18]=32'h00100073;
  repeat(10)@(negedge clk);resetn=1;
  repeat(4000)@(posedge clk);
  $fatal(1,"TIMEOUT: full CPU failed to finish program");
 end
 always @(posedge clk) begin
  mem_ready<=0;
  if(mem_valid&&!mem_ready&&mem_addr<1024)begin
   mem_ready<=1;mem_rdata<=memory[mem_addr>>2];
   if(mem_wstrb[0])memory[mem_addr>>2][7:0]<=mem_wdata[7:0];
   if(mem_wstrb[1])memory[mem_addr>>2][15:8]<=mem_wdata[15:8];
   if(mem_wstrb[2])memory[mem_addr>>2][23:16]<=mem_wdata[23:16];
   if(mem_wstrb[3])memory[mem_addr>>2][31:24]<=mem_wdata[31:24];
  end
  if(resetn&&mem_valid&&mem_ready)begin
   if(mem_instr)begin fetches=fetches+1;$display("FETCH pc=%08h opcode=%08h",mem_addr,mem_rdata);end
   else if(|mem_wstrb)begin stores=stores+1;$display("STORE addr=%08h data=%08h wstrb=%b",mem_addr,mem_wdata,mem_wstrb);end
  end
  if(resetn&&trap)begin
   #1;
   $display("CPU_COMPLETED fetches=%0d stores=%0d",fetches,stores);
   if(stores!==6 || fetches<19)$fatal(1,"incomplete real CPU trace");
   inspect_case(0,32'hffffffff,32'd2,32'd0,32'hffffffff);
   inspect_case(1,32'd7,32'd3,32'd2,32'd1);
   inspect_case(2,32'hfffffff9,32'd3,32'hfffffffe,32'hffffffff);
   if(corrected_rejected!==0)$fatal(1,"corrected checker rejected real CPU");
   $display("END actual_isa_pass=3 original_false_rejections=%0d corrected_false_rejections=%0d",correct_rejected,corrected_rejected);
   $finish;
  end
 end
endmodule
