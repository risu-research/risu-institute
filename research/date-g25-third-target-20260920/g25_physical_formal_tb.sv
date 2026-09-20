`timescale 1ns/1ps
// Original AXI UART, FIFO and physical TX/RX source are loaded WITHOUT FORMAL macro.
// Only this new harness is read with -formal; FORMAL_CHECK controls its properties.
module g25_physical_harness(input wire clk);
  reg [5:0] step=0;
`ifdef FORMAL_CHECK
  (* anyconst *) reg [7:0] payload;
`else
  reg [7:0] payload=8'h55;
`endif
  wire resetn = (step>=6 && (step<18 || step>=26));
  wire awvalid=(step>=12 && step<=14);
  wire wvalid=awvalid;
  wire uart_tx,awready,wready,bvalid,arready,rvalid,rts_n;
  wire [1:0] bresp,rresp;
  wire [31:0] rdata;
  wire rx_int,tx_int,rxfifo_int,txfifo_int;
  axiluart #(.INITIAL_SETUP(31'd25),.OPT_SKIDBUFFER(1'b0),.HARDWARE_FLOW_CONTROL_PRESENT(1'b0)) dut (
    .S_AXI_ACLK(clk),.S_AXI_ARESETN(resetn),
    .S_AXI_AWVALID(awvalid),.S_AXI_AWREADY(awready),.S_AXI_AWADDR(4'hc),.S_AXI_AWPROT(3'd0),
    .S_AXI_WVALID(wvalid),.S_AXI_WREADY(wready),.S_AXI_WDATA({24'd0,payload}),.S_AXI_WSTRB(4'b0001),
    .S_AXI_BVALID(bvalid),.S_AXI_BREADY(1'b1),.S_AXI_BRESP(bresp),
    .S_AXI_ARVALID(1'b0),.S_AXI_ARREADY(arready),.S_AXI_ARADDR(4'd0),.S_AXI_ARPROT(3'd0),
    .S_AXI_RVALID(rvalid),.S_AXI_RREADY(1'b1),.S_AXI_RDATA(rdata),.S_AXI_RRESP(rresp),
    .i_uart_rx(1'b1),.o_uart_tx(uart_tx),.i_cts_n(1'b0),.o_rts_n(rts_n),
    .o_uart_rx_int(rx_int),.o_uart_tx_int(tx_int),
    .o_uart_rxfifo_int(rxfifo_int),.o_uart_txfifo_int(txfifo_int)
  );
  always @(posedge clk) begin
    step <= step + 1;
`ifdef FORMAL_CHECK
`ifdef COVER_ONLY
    if (step==20) cover(!resetn && !uart_tx && dut.tx_busy);
`else
    if (step>=20 && step<=25) assert(uart_tx==1'b0);
`endif
`else
    if(step>=11 && step<=28) $display("PHYSICAL_TRACE step=%0d rst=%b awvalid=%b awready=%b tx=%b busy=%b payload=%02h",step,resetn,awvalid,awready,uart_tx,dut.tx_busy,payload);
    if(step==30) begin $display("G25C_NATIVE_COMPLETED"); $finish; end
`endif
  end
endmodule
`ifndef FORMAL_CHECK
module g25_physical_native_tb;
  reg clk=0;
  always #5 clk=~clk;
  g25_physical_harness harness(clk);
  initial begin #400; $fatal(1,"G25C_TIMEOUT"); end
endmodule
`endif
