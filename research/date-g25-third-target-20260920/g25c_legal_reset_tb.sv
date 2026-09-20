`timescale 1ns/1ps
// Corrected G25C property harness. Original wbuart32 source is NOT modified.
module g25c_legal_reset_harness(input wire clk);
  reg [5:0] step=0;
`ifdef FORMAL_CHECK
  (* anyconst *) reg [7:0] payload;
`else
  reg [7:0] payload=8'h55;
`endif
  wire resetn=(step>=6 && (step<18 || step>=26));
  wire valid=(step==12 || step==13);
  reg [1:0] accepted=0;
  wire tx,awready,wready,bvalid,arready,rvalid,rts;
  wire [1:0] bresp,rresp;
  wire [31:0] rdata;
  wire rxint,txint,rxfint,txfint;
  axiluart #(.INITIAL_SETUP(31'd25),.OPT_SKIDBUFFER(1'b0),.HARDWARE_FLOW_CONTROL_PRESENT(1'b0)) dut(
    .S_AXI_ACLK(clk),.S_AXI_ARESETN(resetn),
    .S_AXI_AWVALID(valid),.S_AXI_AWREADY(awready),.S_AXI_AWADDR(4'hc),.S_AXI_AWPROT(3'd0),
    .S_AXI_WVALID(valid),.S_AXI_WREADY(wready),.S_AXI_WDATA({24'd0,payload}),.S_AXI_WSTRB(4'b0001),
    .S_AXI_BVALID(bvalid),.S_AXI_BREADY(1'b1),.S_AXI_BRESP(bresp),
    .S_AXI_ARVALID(1'b0),.S_AXI_ARREADY(arready),.S_AXI_ARADDR(4'd0),.S_AXI_ARPROT(3'd0),
    .S_AXI_RVALID(rvalid),.S_AXI_RREADY(1'b1),.S_AXI_RDATA(rdata),.S_AXI_RRESP(rresp),
    .i_uart_rx(1'b1),.o_uart_tx(tx),.i_cts_n(1'b0),.o_rts_n(rts),
    .o_uart_rx_int(rxint),.o_uart_tx_int(txint),
    .o_uart_rxfifo_int(rxfint),.o_uart_txfifo_int(txfint)
  );
  always @(posedge clk) begin
    step<=step+1;
    if(valid && awready && wready) accepted<=accepted+1;
`ifdef FORMAL_CHECK
`ifdef COVER_ONLY
    if(step==20) cover(accepted==1 && !resetn && !tx && dut.tx_busy);
`else
    if(step>=15 && step<=28) assert(accepted==1);
    if(step>=20 && step<=25) assert(tx==1'b0);
`endif
`else
    if(step>=11 && step<=28)
      $display("LEGAL_RESET_TRACE step=%0d resetn=%b valid=%b awready=%b accepted=%0d serial=%b busy=%b payload=%02h",step,resetn,valid,awready,accepted,tx,dut.tx_busy,payload);
    if(step==30) begin
      if(accepted!==1) $fatal(1,"DUPLICATE_OR_MISSING_WRITE accepted=%0d",accepted);
      $display("LEGAL_RESET_NATIVE_DONE accepted=%0d",accepted);
      $finish;
    end
`endif
  end
endmodule
`ifndef FORMAL_CHECK
module g25c_legal_reset_native_tb;
  reg clk=0;
  always #5 clk=~clk;
  g25c_legal_reset_harness harness(clk);
  initial begin #400;$fatal(1,"G25C_LEGAL_TIMEOUT");end
endmodule
`endif
