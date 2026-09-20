`timescale 1ns/1ps
`default_nettype none
module g27_native_exhaustive_tb;
  reg clk=0;
  always #5 clk=~clk;
`ifdef CSR_ON
  localparam integer CSR=1;
`else
  localparam integer CSR=0;
`endif
  localparam integer RF_REGS=32+CSR*4;
  localparam integer RF_DEPTH=$clog2(RF_REGS*4);
  localparam integer AW=9;
  reg [RF_DEPTH-1:0] raddr=0;
  reg [7:0] sram_byte=0;
  wire [7:0] actual;
  wire [AW-1:0] sram_addr;
  servile_rf_mem_if #(.depth(512),.rf_regs(RF_REGS)) dut (
    .i_clk(clk),.i_rst(1'b0),.i_waddr({RF_DEPTH{1'b0}}),
    .i_wdata(8'h00),.i_wen(1'b0),.i_raddr(raddr),.o_rdata(actual),.i_ren(1'b1),
    .o_sram_waddr(),.o_sram_wdata(),.o_sram_wen(),.o_sram_raddr(sram_addr),
    .i_sram_rdata(sram_byte),.o_sram_ren(),.i_wb_adr({(AW-2){1'b0}}),
    .i_wb_dat(32'b0),.i_wb_sel(4'b0),.i_wb_we(1'b0),.i_wb_stb(1'b0),
    .o_wb_rdt(),.o_wb_ack()
  );
  integer idx,lane,b,n=0,errors=0,e0=0,e30=0,e31=0,eother=0;
  reg [7:0] expected;
  initial begin
    for (idx=0;idx<32;idx=idx+1) begin
      for (lane=0;lane<4;lane=lane+1) begin
        for (b=0;b<256;b=b+1) begin
          @(negedge clk);
          raddr=(idx*4+lane);
          sram_byte=b;
          expected=(idx==0)?8'h00:b;
          @(posedge clk);
          #1;
          n=n+1;
          if (actual !== expected) begin
            errors=errors+1;
            if(idx==0)e0=e0+1;
            else if(idx==30)e30=e30+1;
            else if(idx==31)e31=e31+1;
            else eother=eother+1;
            if(errors<=8 || (errors==1020) || (errors==1021) || (errors==2040))
              $display("WITNESS csr=%0d reg=%0d lane=%0d payload=%02x expected=%02x actual=%02x address=%03x",CSR,idx,lane,b,expected,actual,sram_addr);
          end
        end
      end
    end
    $display("RESULT csr=%0d checks=%0d errors=%0d x0=%0d x30=%0d x31=%0d other=%0d",CSR,n,errors,e0,e30,e31,eother);
    if(n!=32768) $fatal(1,"wrong denominator");
    if(e30!=0 || eother!=0) $fatal(1,"control/non-target failure");
    $finish;
  end
  initial begin #1000000; $fatal(1,"simulation timeout"); end
endmodule
`default_nettype wire
