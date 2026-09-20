`timescale 1ns/1ps
module serving_independent_replay_tb;
  parameter integer CSR = 0;
  parameter integer OLD = 1;
  reg clk=0, rst=1;
  always #5 clk=~clk;
  wire [31:0] adr, dat;
  wire [3:0] sel;
  wire we, stb;
  wire ack=stb && !rst;
  integer n=0, count30=0, count31=0, count1=0;
  reg [31:0] got30=32'hxxxxxxxx, got31=32'hxxxxxxxx, got1=32'hxxxxxxxx;
  reg [31:0] rom [0:7];
  integer i,j;
  serving #(.memsize(8192),.sim(1'b0),.RESET_STRATEGY("MINI"),.WITH_CSR(CSR)) dut(
    .i_clk(clk),.i_rst(rst),.i_timer_irq(1'b0),
    .o_wb_adr(adr),.o_wb_dat(dat),.o_wb_sel(sel),.o_wb_we(we),.o_wb_stb(stb),
    .i_wb_rdt(32'h00000000),.i_wb_ack(ack));
  initial begin
    // Alternate program and value: exercise adjacent x30 and unaffected x1.
    // No force into DUT registers, only ordinary boot image in its original SRAM.
    rom[0]=32'h400002b7; // lui x5,0x40000
    rom[1]=32'h00900f13; // addi x30,x0,9
    rom[2]=32'h01e2a023; // sw x30,0(x5)
    rom[3]=32'h00d00f93; // addi x31,x0,13
    rom[4]=32'h01f2a223; // sw x31,4(x5)
    rom[5]=32'h00100093; // addi x1,x0,1
    rom[6]=32'h0012a423; // sw x1,8(x5)
    rom[7]=32'h0000006f; // jal x0,0
    $display("REPLAY_PINNED csr=%0d old=%0d", CSR, OLD);
    for(i=0;i<8192;i=i+1) dut.ram.mem[i]=8'h00;
    for(i=0;i<8;i=i+1)
      for(j=0;j<4;j=j+1) dut.ram.mem[4*i+j]=(rom[i]>>(8*j))&8'hff;
    for(i=0;i<8;i=i+1) $display("REPLAY_INSN addr=%0d word=%08h",4*i,rom[i]);
    repeat(8) @(negedge clk); rst=0;
  end
  always @(posedge clk) if(!rst) begin
    n<=n+1;
    if(stb&&ack&&we) begin
      $display("REPLAY_STORE cycle=%0d address=%08h data=%08h select=%b",n,adr,dat,sel);
      if(sel!==4'b1111) $fatal(1,"non-word store");
      case(adr)
        32'h40000000: begin count30<=count30+1; got30<=dat; end
        32'h40000004: begin count31<=count31+1; got31<=dat; end
        32'h40000008: begin count1<=count1+1; got1<=dat; end
        default: $fatal(1,"unexpected store address");
      endcase
    end
    if(n>5500) $fatal(1,"replay timeout");
    if(count30==1 && count31==1 && count1==1) begin
      $display("REPLAY_FINAL csr=%0d old=%0d x30=%08h x31=%08h x1=%08h",CSR,OLD,got30,got31,got1);
      if(got30!==32'd9 || got1!==32'd1) $fatal(1,"adjacent/control failure");
      if(OLD && CSR==0) begin
        if(got31!==32'd0) $fatal(1,"old CSR-off boundary not reproduced");
      end else begin
        if(got31!==32'd13) $fatal(1,"correct x31 not reproduced");
      end
      $display("REPLAY_PASS");
      $finish;
    end
    if(count30>1 || count31>1 || count1>1) $fatal(1,"duplicate store");
  end
endmodule
