`timescale 1ns/1ps
// NEW TESTBENCH ONLY. The wbuart32 DUT files must be original, byte-unchanged.
module g25_axil_idle_harness(input wire clk);
  reg [5:0] step = 0;
  wire resetn = (step >= 2);
  wire uart_tx;
  wire awready,wready,bvalid,arready,rvalid,rts_n;
  wire [1:0] bresp,rresp;
  wire [31:0] rdata;
  wire rx_int,tx_int,rxfifo_int,txfifo_int;
  axiluart #(.INITIAL_SETUP(31'd25),.OPT_SKIDBUFFER(1'b0),.HARDWARE_FLOW_CONTROL_PRESENT(1'b0)) dut (
    .S_AXI_ACLK(clk),.S_AXI_ARESETN(resetn),
    .S_AXI_AWVALID(1'b0),.S_AXI_AWREADY(awready),.S_AXI_AWADDR(4'd0),.S_AXI_AWPROT(3'd0),
    .S_AXI_WVALID(1'b0),.S_AXI_WREADY(wready),.S_AXI_WDATA(32'd0),.S_AXI_WSTRB(4'd0),
    .S_AXI_BVALID(bvalid),.S_AXI_BREADY(1'b1),.S_AXI_BRESP(bresp),
    .S_AXI_ARVALID(1'b0),.S_AXI_ARREADY(arready),.S_AXI_ARADDR(4'd0),.S_AXI_ARPROT(3'd0),
    .S_AXI_RVALID(rvalid),.S_AXI_RREADY(1'b1),.S_AXI_RDATA(rdata),.S_AXI_RRESP(rresp),
    .i_uart_rx(1'b1),.o_uart_tx(uart_tx),.i_cts_n(1'b0),.o_rts_n(rts_n),
    .o_uart_rx_int(rx_int),.o_uart_tx_int(tx_int),
    .o_uart_rxfifo_int(rxfifo_int),.o_uart_txfifo_int(txfifo_int)
  );
  always @(posedge clk) begin
    step <= step + 1'b1;
    if (step >= 4 && step <= 12) begin
`ifdef FORMAL
      assert(uart_tx == 1'b1);
`else
      $display("NATIVE_IDLE step=%0d resetn=%b uart_tx=%b",step,resetn,uart_tx);
      if (uart_tx !== 1'b1) $fatal(1,"idle high property false or unknown");
`endif
    end
`ifndef FORMAL
    if (step == 13) begin
      $display("NATIVE_IDLE_COMPLETED");
      $finish;
    end
`endif
  end
endmodule

`ifndef FORMAL
module g25_idle_native_tb;
  reg clk=0;
  always #5 clk=~clk;
  g25_axil_idle_harness inner(clk);
  initial begin
    #300;
    $fatal(1,"NATIVE_TIMEOUT");
  end
endmodule
`endif
