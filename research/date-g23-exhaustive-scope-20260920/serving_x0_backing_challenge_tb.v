`timescale 1ns/1ps
// Only stimulus and SRAM initialization are changed; original entire SERVing RTL stays untouched.
module serving_x0_backing_challenge_tb;
  parameter integer CSR = 0;
  parameter integer MEMSIZE = 8192;
  reg clk=0;
  always #5 clk=~clk;
  reg rst=1;
  wire [31:0] wb_adr,wb_dat;
  wire [3:0] wb_sel;
  wire wb_we,wb_stb;
  wire wb_ack=wb_stb&&!rst;
  integer cycles=0,target_count=0,ctrl_count=0;
  reg [31:0] target_data=32'hxxxxxxxx,ctrl_data=32'hxxxxxxxx;
  reg [31:0] prog[0:5];
  integer i,j;
  serving #(.memsize(MEMSIZE), .sim(1'b0),.RESET_STRATEGY("MINI"),.WITH_CSR(CSR)) dut (
    .i_clk(clk),.i_rst(rst),.i_timer_irq(1'b0),
    .o_wb_adr(wb_adr),.o_wb_dat(wb_dat),.o_wb_sel(wb_sel),
    .o_wb_we(wb_we),.o_wb_stb(wb_stb),
    .i_wb_rdt(32'd0),.i_wb_ack(wb_ack));
  initial begin
    prog[0]=32'h400002b7; // lui x5,0x40000 -- independent of x0
    prog[1]=32'h00700f93; // addi x31,x0,7 -- probes x0
    prog[2]=32'h01f2a023; // sw x31,0(x5)
    prog[3]=32'h00100093; // addi x1,x0,1 -- probes x0 without x31
    prog[4]=32'h0012a223; // sw x1,4(x5)
    prog[5]=32'h0000006f; // jal x0,0
    for (i=0;i<MEMSIZE;i=i+1) dut.ram.mem[i]=8'd0;
    for (i=0;i<6;i=i+1)
      for (j=0;j<4;j=j+1) dut.ram.mem[4*i+j]=(prog[i]>>(8*j))&8'hff;
    // The original inverted RF address maps the low byte of x0 to MEMSIZE-1.
    // Keep every other byte/ROM word equal to G22's all-zero baseline.
    dut.ram.mem[MEMSIZE-1]=8'h20;
    $display("G23_X0_BACKING_INIT rev=%s csr=%0d low=%02h high=%02h", 
`ifdef PARENT
      "parent",
`else
      "child",
`endif
      CSR,dut.ram.mem[MEMSIZE-1],dut.ram.mem[MEMSIZE-2]);
    for (i=0;i<6;i=i+1) $display("G23_ROM pc=%0d instruction=%08h",4*i,prog[i]);
    repeat(8) @(negedge clk); rst=0;
  end
  always @(posedge clk) if(!rst) begin
    cycles<=cycles+1;
    if(wb_stb&&wb_ack&&wb_we) begin
      $display("G23_EXTERNAL_STORE csr=%0d cycle=%0d addr=%08h data=%08h sel=%b",CSR,cycles,wb_adr,wb_dat,wb_sel);
      if(wb_sel!==4'b1111) $fatal(1,"nonword bus store");
      if(wb_adr===32'h40000000) begin target_count<=target_count+1;target_data<=wb_dat;end
      else if(wb_adr===32'h40000004) begin ctrl_count<=ctrl_count+1;ctrl_data<=wb_dat;end
      else $fatal(1,"unexpected external address");
    end
    if(cycles>=5000) $fatal(1,"G23_TIMEOUT target=%0d control=%0d",target_count,ctrl_count);
    if(target_count==1&&ctrl_count==1) begin
      $display("G23_FINAL csr=%0d target_x31=%08h x1=%08h x0_backing=%02h cycles=%0d",CSR,target_data,ctrl_data,dut.ram.mem[MEMSIZE-1],cycles);
      if(target_count!==1 || ctrl_count!==1) $fatal(1,"duplicate stores");
      if(dut.ram.mem[MEMSIZE-1]!==8'h20) $fatal(1,"initial perturbation overwritten");
`ifdef PARENT
      if(ctrl_data!==32'd33) $fatal(1,"parent x0-leak independent probe mismatch");
      if(CSR==0 && target_data!==32'd0) $fatal(1,"parent CSR-off x31 masking prediction mismatch");
      if(CSR==1 && target_data!==32'd39) $fatal(1,"parent CSR-on x0-leak prediction mismatch");
`else
      if(ctrl_data!==32'd1) $fatal(1,"repaired x0 control mismatch");
      if(target_data!==32'd7) $fatal(1,"repaired x31 result mismatch");
`endif
      $display("G23_ORIGINAL_SOC_CHALLENGE_PASS");
      $finish;
    end
  end
endmodule
