`timescale 1ns/1ps
// Original physical RTL is loaded WITHOUT FORMAL. Only THIS harness is formal.
module g25d_symbolic_frame_harness(input wire clk);
  reg [6:0] step=0;
`ifdef FORMAL_CHECK
  (* anyconst *) reg [7:0] payload;
`else
  reg [7:0] payload=8'ha5;
`endif
  wire resetn=step>=6;
  // Exactly one compliant, joint address-and-data transaction at step 13.
  wire valid=(step==12 || step==13);
  wire tx,awready,wready,bvalid,arready,rvalid,rts;
  wire [1:0] bresp,rresp;
  wire [31:0] rdata;
  wire rxint,txint,rxfint,txfint;
  reg [1:0] accepted=0;
  reg [7:0] sampled=0;
  axiluart #(.INITIAL_SETUP(31'd4),.OPT_SKIDBUFFER(1'b0),.HARDWARE_FLOW_CONTROL_PRESENT(1'b0)) dut(
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
    step <= step+1'b1;
    if(valid && awready && wready) accepted <= accepted+1'b1;
    case(step)
      21: sampled[0]<=tx;
      25: sampled[1]<=tx;
      29: sampled[2]<=tx;
      33: sampled[3]<=tx;
      37: sampled[4]<=tx;
      41: sampled[5]<=tx;
      45: sampled[6]<=tx;
      49: sampled[7]<=tx;
    endcase
`ifdef FORMAL_CHECK
`ifdef COVER_ONLY
    if(step==54) cover(accepted==1 && payload==8'ha5 && sampled==payload && tx==1);
`elsif NEGATIVE_CASE
    if(step==21) assert(tx != payload[0]);
`else
    if(step>=15 && step<=58) assert(accepted==1);
    if(step==17) assert(tx==0);
    if(step==21) assert(tx==payload[0]);
    if(step==25) assert(tx==payload[1]);
    if(step==29) assert(tx==payload[2]);
    if(step==33) assert(tx==payload[3]);
    if(step==37) assert(tx==payload[4]);
    if(step==41) assert(tx==payload[5]);
    if(step==45) assert(tx==payload[6]);
    if(step==49) assert(tx==payload[7]);
    if(step==53 || step==57) assert(tx==1);
    if(step==54) assert(sampled==payload);
`endif
`else
    if(step==17 || step==21 || step==25 || step==29 || step==33 || step==37 || step==41 || step==45 || step==49 || step==53 || step==57)
      $display("FRAME_SAMPLE step=%0d serial=%b payload=%02h accepted=%0d",step,tx,payload,accepted);
    if(step==59) begin
      $display("FRAME_FULL_NATIVE_DONE accepted=%0d sampled=%02h byte=%02h",accepted,sampled,payload);
      if(accepted!==1 || sampled!==payload) $fatal(1,"reference frame failed");
      $finish;
    end
`endif
  end
endmodule
`ifndef FORMAL_CHECK
module g25d_native_frame_tb;
  reg clk=0;
  always #5 clk=~clk;
  g25d_symbolic_frame_harness harness(clk);
  initial begin #800;$fatal(1,"TIMEOUT");end
endmodule
`endif
