// G23 symbolic module-interface test; original upstream DUT source is NOT edited.
// Input RAM byte is a stable, arbitrary byte. This is not an end-to-end CPU proof.
module servile_scope_probe(input wire clk);
`ifdef CSR_ON
  localparam CSR = 1;
`else
  localparam CSR = 0;
`endif
  localparam RF_REGS = 32 + CSR*4;
  localparam RF_DEPTH = $clog2(RF_REGS*4);
  localparam AW = 9;
  (* anyconst *) reg [4:0] regidx;
  (* anyconst *) reg [1:0] byteidx;
  (* anyconst *) reg [7:0] payload;
  wire [RF_DEPTH-1:0] raddr = {regidx,byteidx};
  wire [7:0] output_byte;
  servile_rf_mem_if #(.depth(512), .rf_regs(RF_REGS)) dut (
    .i_clk(clk), .i_rst(1'b0), .i_waddr({RF_DEPTH{1'b0}}),
    .i_wdata(8'h00), .i_wen(1'b0), .i_raddr(raddr),
    .o_rdata(output_byte), .i_ren(1'b1),
    .o_sram_waddr(), .o_sram_wdata(), .o_sram_wen(),
    .o_sram_raddr(), .i_sram_rdata(payload), .o_sram_ren(),
    .i_wb_adr({AW-2{1'b0}}), .i_wb_dat(32'd0),
    .i_wb_sel(4'b0000), .i_wb_we(1'b0), .i_wb_stb(1'b0),
    .o_wb_rdt(), .o_wb_ack()
  );
  reg sampled = 1'b0;
  always @(posedge clk) begin
    sampled <= 1'b1;
    if (sampled) begin
`ifdef CASE_ZERO
      assume(regidx == 5'd0);
      assert(output_byte == 8'd0);
`elsif CASE_THIRTY
      assume(regidx == 5'd30);
      assert(output_byte == payload);
`elsif CASE_THIRTYONE
      assume(regidx == 5'd31);
      assert(output_byte == payload);
`elsif CASE_ALL
      assert(output_byte == ((regidx==0) ? 8'd0 : payload));
`else
      // Never permit an accidentally empty task to report PASS.
      assert(1'b0);
`endif
    end
  end
endmodule
