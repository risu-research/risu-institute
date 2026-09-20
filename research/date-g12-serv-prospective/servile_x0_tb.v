`timescale 1ns/1ps
`default_nettype none
module servile_x0_tb;
  reg clk=0;
  always #5 clk=~clk;
  reg rst=1;
  reg [6:0] waddr=0,raddr=0;
  reg [7:0] wdata=0;
  reg wen=0,ren=0;
  reg [5:0] wb_adr=0;
  reg [31:0] wb_dat=0;
  reg [3:0] wb_sel=0;
  reg wb_we=0,wb_stb=0;
  wire [7:0] rdata,sram_wdata;
  wire [7:0] sram_waddr,sram_raddr;
  wire sram_wen,sram_ren;
  wire [31:0] wb_rdt;
  wire wb_ack;
  reg [7:0] mem [0:255];
  wire [7:0] sram_rdata=mem[sram_raddr];
  servile_rf_mem_if #(.depth(256),.rf_regs(32)) dut(
    .i_clk(clk),.i_rst(rst),.i_waddr(waddr),.i_wdata(wdata),.i_wen(wen),
    .i_raddr(raddr),.o_rdata(rdata),.i_ren(ren),
    .o_sram_waddr(sram_waddr),.o_sram_wdata(sram_wdata),.o_sram_wen(sram_wen),
    .o_sram_raddr(sram_raddr),.i_sram_rdata(sram_rdata),.o_sram_ren(sram_ren),
    .i_wb_adr(wb_adr),.i_wb_dat(wb_dat),.i_wb_sel(wb_sel),.i_wb_we(wb_we),
    .i_wb_stb(wb_stb),.o_wb_rdt(wb_rdt),.o_wb_ack(wb_ack));
  integer j;
  initial for(j=0;j<256;j=j+1) mem[j]=0;
  always @(posedge clk) if (sram_wen) mem[sram_waddr] <= sram_wdata;
  task write_rf;
    input [6:0] addr;
    input [7:0] data;
    begin
      @(negedge clk); waddr=addr; wdata=data; wen=1;
      @(posedge clk); #1;
      if (!sram_wen || sram_waddr !== ~{1'b0,addr}) $fatal(1,"write address mismatch rf=%0d sram=%0d",addr,sram_waddr);
      @(negedge clk); wen=0;
    end
  endtask
  task read_rf;
    input [6:0] addr;
    input [7:0] want_parent;
    input [7:0] want_child;
    begin
      @(negedge clk);raddr=addr; ren=1;
      @(posedge clk); #1;
      if (sram_raddr !== ~{1'b0,addr}) $fatal(1,"read address mismatch rf=%0d sram=%0d",addr,sram_raddr);
`ifdef EXPECT_NEW
      if (rdata !== want_child) $fatal(1,"POST FAIL rf=%0d data=%02x expected=%02x",addr,rdata,want_child);
`else
      if (rdata !== want_parent) $fatal(1,"PRE FAIL rf=%0d data=%02x expected=%02x",addr,rdata,want_parent);
`endif
      $display("RF_READ addr=%0d SRAM_ADDR=%0d SRAM_BYTE=%02x ARCH_BYTE=%02x",addr,sram_raddr,sram_rdata,rdata);
      @(negedge clk); ren=0;
    end
  endtask
  initial begin
    $dumpfile("servile_rf_x0.vcd");$dumpvars(0,servile_x0_tb);
    repeat(2) @(negedge clk);rst=0;
    write_rf(7'd0,8'hA5);write_rf(7'd1,8'hA6);
    write_rf(7'd4,8'h5A);write_rf(7'd124,8'hC3);
    read_rf(7'd0,8'hA5,8'h00);  // architectural x0 byte 0
    read_rf(7'd1,8'hA6,8'h00);  // architectural x0 byte 1
    read_rf(7'd4,8'h5A,8'h5A); // unrelated architectural x1 byte 0
    read_rf(7'd124,8'h00,8'hC3); // x31 must NOT be mistaken for x0
`ifdef EXPECT_NEW
    $display("PASS POST: x0 masked; x1 and x31 preserved");
`else
    $display("PASS PRE CHARACTERIZATION: x0 leaks physical SRAM; x31 spuriously zeroed");
`endif
    $finish;
  end
endmodule
`default_nettype wire
