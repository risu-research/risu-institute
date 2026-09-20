`timescale 1ns/1ps
// Exploratory TESTBENCH only; entire upstream UART RTL is unchanged.
module g25d_frame_timing_tb;
  reg clk=0;
  always #5 clk=~clk;
  reg [6:0] step=0;
  integer accepted=0;
  wire resetn=step>=6;
  wire awvalid=(step>=12 && step<=14);
  wire wvalid=awvalid;
  wire tx,awready,wready,bvalid,arready,rvalid,rts;
  wire [1:0] bresp,rresp;
  wire [31:0] rdata;
  wire rxint,txint,rxfint,txfint;
  axiluart #(.INITIAL_SETUP(31'd4),.OPT_SKIDBUFFER(1'b0),.HARDWARE_FLOW_CONTROL_PRESENT(1'b0)) dut(
    .S_AXI_ACLK(clk),.S_AXI_ARESETN(resetn),
    .S_AXI_AWVALID(awvalid),.S_AXI_AWREADY(awready),.S_AXI_AWADDR(4'hc),.S_AXI_AWPROT(3'd0),
    .S_AXI_WVALID(wvalid),.S_AXI_WREADY(wready),.S_AXI_WDATA(32'h000000a5),.S_AXI_WSTRB(4'b0001),
    .S_AXI_BVALID(bvalid),.S_AXI_BREADY(1'b1),.S_AXI_BRESP(bresp),
    .S_AXI_ARVALID(1'b0),.S_AXI_ARREADY(arready),.S_AXI_ARADDR(4'd0),.S_AXI_ARPROT(3'd0),
    .S_AXI_RVALID(rvalid),.S_AXI_RREADY(1'b1),.S_AXI_RDATA(rdata),.S_AXI_RRESP(rresp),
    .i_uart_rx(1'b1),.o_uart_tx(tx),.i_cts_n(1'b0),.o_rts_n(rts),
    .o_uart_rx_int(rxint),.o_uart_tx_int(txint),
    .o_uart_rxfifo_int(rxfint),.o_uart_txfifo_int(txfint)
  );
  always @(posedge clk) begin
    step<=step+1;
    if(awvalid&&awready&&wvalid&&wready) begin accepted<=accepted+1; $display("AXI_HANDSHAKE step=%0d data=a5",step);end
    if(step>=10 && step<=61) $display("FRAME_TRACE step=%0d tx=%b busy=%b state=%0d counter=%0d",step,tx,dut.tx_busy,dut.tx.state,dut.tx.baud_counter);
    if(step==65) begin
      $display("FRAME_NATIVE_DONE accepted=%0d",accepted);
      if(accepted!==1) $fatal(1,"not exactly one accepted write");
      $finish;
    end
  end
  initial begin #800; $fatal(1,"TIMEOUT");end
endmodule
