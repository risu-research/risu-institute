`timescale 1ns/1ps
// G24 testbench ONLY; all SERVing DUT RTL is unchanged historical upstream.
module serving_lane_carry_tb;
  parameter integer CSR = 0;
  parameter integer LANE = 0;
  parameter integer VALUE = 32;
  localparam integer MEMSIZE=8192;
  localparam [31:0] BACKING = (VALUE & 255) << (8*LANE);
  localparam [31:0] EXPECT_X31_OLD = CSR ? (BACKING + 32'd7) : 32'd0;
  localparam [31:0] EXPECT_X1_OLD = BACKING + 32'd1;
  reg clk=0, rst=1;
  always #5 clk=~clk;
  wire [31:0] wb_adr, wb_dat;
  wire [3:0] wb_sel;
  wire wb_we, wb_stb;
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
    if(LANE<0 || LANE>3 || VALUE<0 || VALUE>255) $fatal(1,"invalid frozen lane/value");
    prog[0]=32'h400002b7; // lui x5,0x40000; independent external base
    prog[1]=32'h00700f93; // addi x31,x0,7
    prog[2]=32'h01f2a023; // sw x31,0(x5)
    prog[3]=32'h00100093; // addi x1,x0,1; independent of x31
    prog[4]=32'h0012a223; // sw x1,4(x5)
    prog[5]=32'h0000006f; // jal x0,0
    for (i=0;i<MEMSIZE;i=i+1) dut.ram.mem[i]=8'h00;
    for (i=0;i<6;i=i+1)
      for (j=0;j<4;j=j+1) dut.ram.mem[4*i+j]=(prog[i]>>(8*j))&8'hff;
    dut.ram.mem[MEMSIZE-1-LANE]=VALUE;
    $display("G24_CASE csr=%0d lane=%0d byte=%02h backing=%08h",CSR,LANE,VALUE,BACKING);
    for(i=0;i<6;i=i+1) $display("G24_ROM pc=%0d insn=%08h",4*i,prog[i]);
    repeat(8) @(negedge clk);rst=0;
  end
  always @(posedge clk) if(!rst) begin
    cycles<=cycles+1;
    if(wb_stb && wb_ack && wb_we) begin
      $display("G24_EXTERNAL_STORE cycle=%0d addr=%08h data=%08h sel=%b",cycles,wb_adr,wb_dat,wb_sel);
      if(wb_sel!==4'b1111) $fatal(1,"non-word store");
      if(wb_adr===32'h40000000) begin target_count<=target_count+1;target_data<=wb_dat;end
      else if(wb_adr===32'h40000004)begin ctrl_count<=ctrl_count+1;ctrl_data<=wb_dat;end
      else $fatal(1,"unexpected external store");
    end
    if(cycles>=5000) $fatal(1,"timeout");
    if(target_count==1 && ctrl_count==1) begin
      $display("G24_FINAL csr=%0d lane=%0d value=%02h x31=%08h x1=%08h cycles=%0d",CSR,LANE,VALUE,target_data,ctrl_data,cycles);
      if(dut.ram.mem[MEMSIZE-1-LANE] !== VALUE[7:0]) $fatal(1,"backing byte overwritten");
`ifdef G24_PARENT
      if(target_data!==EXPECT_X31_OLD || ctrl_data!==EXPECT_X1_OLD)
        $fatal(1,"old RTL differs from preregistered prediction: x31=%08h x1=%08h expected=%08h/%08h",target_data,ctrl_data,EXPECT_X31_OLD,EXPECT_X1_OLD);
`else
      if(target_data!==32'd7 || ctrl_data!==32'd1) $fatal(1,"repaired architecture expectation violated");
`endif
      $display("G24_COMPLETE");$finish;
    end
  end
endmodule
