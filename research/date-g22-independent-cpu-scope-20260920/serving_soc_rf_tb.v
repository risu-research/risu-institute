`timescale 1ns/1ps
module serving_soc_rf_tb;
  reg clk=0;
  always #5 clk=~clk;
  reg rst=1;
  wire [31:0] wb_adr,wb_dat;
  wire [3:0] wb_sel;
  wire wb_we,wb_stb;
  wire wb_ack=wb_stb&&!rst;
  integer cycles=0, old_count=0, ctrl_count=0;
  reg [31:0] old_data=32'hxxxxxxxx,ctrl_data=32'hxxxxxxxx;
  reg [31:0] prog [0:5];
  integer i,j;
  // Untouched historical CPU and SoC RTL; testbench populates only program SRAM.
  serving #(.memsize(8192),.sim(1'b0),.RESET_STRATEGY("MINI"),.WITH_CSR(1)) dut (
    .i_clk(clk),.i_rst(rst),.i_timer_irq(1'b0),
    .o_wb_adr(wb_adr),.o_wb_dat(wb_dat),.o_wb_sel(wb_sel),.o_wb_we(wb_we),.o_wb_stb(wb_stb),
    .i_wb_rdt(32'h00000000),.i_wb_ack(wb_ack));
  initial begin
    prog[0]=32'h400002b7; // lui  x5,0x40000 (external peripheral base)
    prog[1]=32'h00700f93; // addi x31,x0,7 (G12 target)
    prog[2]=32'h01f2a023; // sw   x31,0(x5)
    prog[3]=32'h00100093; // addi x1,x0,1 (unaffected-register control)
    prog[4]=32'h0012a223; // sw   x1,4(x5)
    prog[5]=32'h0000006f; // jal  x0,0
    for (i=0;i<8192;i=i+1) dut.ram.mem[i]=8'h00;
    for (i=0;i<6;i=i+1)
      for (j=0;j<4;j=j+1) dut.ram.mem[4*i+j]=(prog[i]>>(j*8)) & 8'hff;
    for (i=0;i<6;i=i+1) $display("FROZEN_INSN addr=%0d value=%08h",i*4,prog[i]);
    repeat (8) @(negedge clk);
    rst=0;
  end
  always @(posedge clk) if (!rst) begin
    cycles<=cycles+1;
    if (wb_stb && wb_ack && wb_we) begin
      $display("EXTERNAL_STORE cycle=%0d addr=%08h data=%08h sel=%b",cycles,wb_adr,wb_dat,wb_sel);
      if (wb_sel !== 4'b1111) $fatal(1,"nonword transaction");
      if (wb_adr==32'h40000000) begin old_count<=old_count+1;old_data<=wb_dat;end
      if (wb_adr==32'h40000004) begin ctrl_count<=ctrl_count+1;ctrl_data<=wb_dat;end
    end
    if (cycles==5000) begin
      $display("SOC_TIMEOUT old_count=%0d ctrl_count=%0d old_data=%08h ctrl_data=%08h",old_count,ctrl_count,old_data,ctrl_data);
      $fatal(1,"no complete original SoC program");
    end
    if (old_count==1 && ctrl_count==1) begin
      $display("SOC_FINAL x31_store=%08h x1_store=%08h cycles=%0d",old_data,ctrl_data,cycles);
      if (ctrl_data!==32'd1) $fatal(1,"unaffected x1 control did not match ISA");
`ifdef PARENT
      if (old_data!==32'd0) $fatal(1,"predecessor mismatch from frozen x31 prediction");
`else
      if (old_data!==32'd7) $fatal(1,"successor mismatch from frozen x31 prediction");
`endif
      $display("G22_ORIGINAL_SERVING_SOC_ARCHITECTURAL_SCOPE_CONFIRMED");
      $finish;
    end
  end
endmodule
