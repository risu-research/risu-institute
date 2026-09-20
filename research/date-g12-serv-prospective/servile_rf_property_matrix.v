`default_nettype none
// Independent, source-pinned DUT interface: no pokes into DUT internals.
// Compiler flags CHECK_X0, CHECK_X31, CHECK_X1 choose ONE property per proof.
module servile_rf_property_matrix(
  input wire i_clk, i_rst, i_ren,
  input wire [6:0] i_raddr,
  input wire [7:0] i_sram_rdata
);
  wire [7:0] rdata, wa, wd, ra;
  wire we, re, ack;
  wire [31:0] rdt;
  servile_rf_mem_if #(.depth(256),.rf_regs(32)) dut(
    .i_clk(i_clk),.i_rst(i_rst),.i_waddr(7'd0),.i_wdata(8'd0),.i_wen(1'b0),
    .i_raddr(i_raddr),.o_rdata(rdata),.i_ren(i_ren),
    .o_sram_waddr(wa),.o_sram_wdata(wd),.o_sram_wen(we),
    .o_sram_raddr(ra),.i_sram_rdata(i_sram_rdata),.o_sram_ren(re),
    .i_wb_adr(6'd0),.i_wb_dat(32'd0),.i_wb_sel(4'd0),.i_wb_we(1'b0),
    .i_wb_stb(1'b0),.o_wb_rdt(rdt),.o_wb_ack(ack));
  reg f_past_valid=0;
  always @(posedge i_clk) begin
    f_past_valid <= 1;
`ifdef CHECK_X0
    if (f_past_valid && $past(i_ren) && $past(i_raddr[6:2])==5'd0) begin
      assert(rdata == 8'h00);
      cover(i_sram_rdata != 8'h00);
    end
`elsif CHECK_X31
    if (f_past_valid && $past(i_ren) && $past(i_raddr[6:2])==5'd31) begin
      assert(rdata == i_sram_rdata);
      cover(i_sram_rdata != 8'h00);
    end
`elsif CHECK_X1
    if (f_past_valid && $past(i_ren) && $past(i_raddr[6:2])==5'd1) begin
      assert(rdata == i_sram_rdata);
      cover(i_sram_rdata != 8'h00);
    end
`else
    nonexistent_property_flag no_property_selected();
`endif
  end
endmodule
`default_nettype wire
