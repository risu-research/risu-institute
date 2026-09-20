`timescale 1ns/1ps
// Original upstream DUT RTL is not edited. This new testbench drives a real AXI write.
module g25_reset_midframe_tb;
  reg clk=0;
  always #5 clk=~clk;
  reg resetn=0;
  reg awvalid=0,wvalid=0;
  reg [3:0] awaddr=4'hc;
  reg [31:0] wdata=32'h00000055;
  reg [3:0] wstrb=4'b0001;
  wire awready,wready,bvalid,arready,rvalid,tx,rts;
  wire [1:0] bresp,rresp;
  wire [31:0] rdata;
  wire rxint,txint,rxfint,txfint;
  integer cycle=0, reset_observations=0, low_cycles=0;
  axiluart #(.INITIAL_SETUP(31'd25),.OPT_SKIDBUFFER(1'b0),.HARDWARE_FLOW_CONTROL_PRESENT(1'b0)) dut(
    .S_AXI_ACLK(clk),.S_AXI_ARESETN(resetn),
    .S_AXI_AWVALID(awvalid),.S_AXI_AWREADY(awready),.S_AXI_AWADDR(awaddr),.S_AXI_AWPROT(3'b0),
    .S_AXI_WVALID(wvalid),.S_AXI_WREADY(wready),.S_AXI_WDATA(wdata),.S_AXI_WSTRB(wstrb),
    .S_AXI_BVALID(bvalid),.S_AXI_BREADY(1'b1),.S_AXI_BRESP(bresp),
    .S_AXI_ARVALID(1'b0),.S_AXI_ARREADY(arready),.S_AXI_ARADDR(4'd0),.S_AXI_ARPROT(3'd0),
    .S_AXI_RVALID(rvalid),.S_AXI_RREADY(1'b1),.S_AXI_RDATA(rdata),.S_AXI_RRESP(rresp),
    .i_uart_rx(1'b1),.o_uart_tx(tx),.i_cts_n(1'b0),.o_rts_n(rts),
    .o_uart_rx_int(rxint),.o_uart_tx_int(txint),
    .o_uart_rxfifo_int(rxfint),.o_uart_txfifo_int(txfint));
  always @(posedge clk) begin
    cycle <= cycle + 1;
    if (cycle>400) $fatal(1,"NO_COMPLETION");
    if (!resetn && cycle>6) begin
      reset_observations <= reset_observations + 1;
      $display("RESET_UART cycle=%0d resetn=%b serial=%b busy=%b",cycle,resetn,tx,dut.tx_busy);
      if (tx === 1'b0) low_cycles <= low_cycles + 1;
    end
  end
  initial begin
    repeat(6) @(negedge clk);
    $display("ORIGINAL_UART_START idle_pin=%b",tx);
    if(tx !== 1'b1) $fatal(1,"BAD_INITIAL_IDLE");
    resetn=1;
    repeat(6) @(negedge clk);
    awvalid=1;wvalid=1;
    $display("AXI_ENQUEUE addr=%h data=%h strb=%b",awaddr,wdata,wstrb);
    wait(awready && wready);
    @(negedge clk);
    awvalid=0;wvalid=0;
    wait(tx === 1'b0);
    $display("SERIAL_STARTED cycle=%0d serial=%b",cycle,tx);
    repeat(3) @(negedge clk);
    resetn=0;
    $display("AXI_RESET_ASSERT cycle=%0d serial=%b",cycle,tx);
    repeat(8) @(negedge clk);
    $display("AXI_RESET_END cycle=%0d serial=%b low_cycles=%0d samples=%0d",cycle,tx,low_cycles,reset_observations);
    if(reset_observations<7) $fatal(1,"RESET_WINDOW_NOT_OBSERVED");
    resetn=1;
    repeat(5) @(negedge clk);
    $display("FINAL_RESTART cycle=%0d serial=%b low_cycles=%0d",cycle,tx,low_cycles);
    $display("G25_RESET_MIDFRAME_COMPLETED");
    $finish;
  end
endmodule
