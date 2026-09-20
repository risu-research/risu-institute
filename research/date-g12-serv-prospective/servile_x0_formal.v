`default_nettype none
module servile_x0_formal (
  input wire i_clk,
  input wire i_rst,
  input wire [6:0] i_raddr,
  input wire [7:0] i_sram_rdata,
  input wire i_ren
);
  wire [7:0] rdata;
  wire [7:0] unused_wa,unused_wd,unused_ra;
  wire unused_we,unused_re,unused_ack;
  wire [31:0] unused_rdt;
  servile_rf_mem_if #(.depth(256),.rf_regs(32)) dut(
    .i_clk(i_clk),.i_rst(i_rst),.i_waddr(7'd0),.i_wdata(8'd0),.i_wen(1'b0),
    .i_raddr(i_raddr),.o_rdata(rdata),.i_ren(i_ren),
    .o_sram_waddr(unused_wa),.o_sram_wdata(unused_wd),.o_sram_wen(unused_we),
    .o_sram_raddr(unused_ra),.i_sram_rdata(i_sram_rdata),.o_sram_ren(unused_re),
    .i_wb_adr(6'd0),.i_wb_dat(32'd0),.i_wb_sel(4'd0),.i_wb_we(1'b0),
    .i_wb_stb(1'b0),.o_wb_rdt(unused_rdt),.o_wb_ack(unused_ack));
  reg past_valid=0;
  always @(posedge i_clk) begin
    past_valid <= 1;
    if (past_valid && $past(i_ren) && ($past(i_raddr[6:2])==5'd0))
      assert(rdata==8'd0); // architectural x0, conditioned on a genuine read request
  end
endmodule
`default_nettype wire
