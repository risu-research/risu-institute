`timescale 1ns/1ps
module native_fetch_two_word_tb;
  reg clk=0;
  always #5 clk=~clk;
  reg reset=1;
  reg ack=0;
  reg [31:0] rdata=0;
  wire gcyc,gstb,lcyc,lstb,we;
  wire [29:0] addr;
  wire [31:0] wdata;
  wire [3:0] sel;
  integer cycle=0, fetches=0, accesses=0, hits=0;
  function [31:0] rom;
    input [29:0] a;
    begin
      case(a)
       30'h00040000: rom=32'ha4c80cc8;
       30'h00040001: rom=32'h8640c000;
       default:      rom=32'h00000000;
      endcase
    end
  endfunction
  zipcpu #(.RESET_ADDRESS(32'h00100000)) dut (
    .i_clk(clk), .i_reset(reset), .i_interrupt(1'b0),
    .i_halt(1'b0), .i_clear_pf_cache(1'b0),
    .i_dbg_reg(5'b0), .i_dbg_we(1'b0), .i_dbg_data(32'b0),
    .o_dbg_stall(), .o_dbg_reg(), .o_dbg_cc(), .o_break(),
    .o_wb_gbl_cyc(gcyc), .o_wb_gbl_stb(gstb),
    .o_wb_lcl_cyc(lcyc), .o_wb_lcl_stb(lstb),
    .o_wb_we(we), .o_wb_addr(addr), .o_wb_data(wdata), .o_wb_sel(sel),
    .i_wb_ack(ack), .i_wb_stall(1'b0), .i_wb_data(rdata), .i_wb_err(1'b0),
    .o_op_stall(), .o_pf_stall(), .o_i_count()
  );
  initial begin
    $dumpfile("native_fetch.vcd");
    $dumpvars(0, native_fetch_two_word_tb);
    repeat(4) @(negedge clk);
    reset=0;
    repeat(125) @(negedge clk);
    $display("SUMMARY fetches=%0d accesses=%0d witness_hits=%0d",fetches,accesses,hits);
    if (hits==0) $display("NO_SIM_WITNESS: the fixed ROM and one-cycle bus did not reach the desired transaction in 125 clocks");
    $finish;
  end
  always @(posedge clk) begin
    cycle=cycle+1;
    // One-cycle, zero-stall Wishbone responder: data corresponds to the
    // *previous* outgoing request address; the two-word program is a ROM.
    ack <= (!reset) && ((gcyc&&gstb)||(lcyc&&lstb));
    if (!reset && ((gcyc&&gstb)||(lcyc&&lstb))) begin
      rdata <= rom(addr);
      accesses=accesses+1;
      if (!we && (addr==30'h40000 || addr==30'h40001)) begin
        fetches=fetches+1;
        $display("FETCH_REQ cycle=%0d wb_word_addr=%h data=%h",cycle,addr,rom(addr));
      end
    end
    if (!reset && dut.pf_valid) begin
      $display("FETCH_VALID cycle=%0d pc=%h insn=%h",cycle,dut.pf_instruction_pc,dut.pf_instruction);
    end
    if (!reset && dut.domem.i_pipe_stb) begin
      $display("PIPE_REQ cycle=%0d byte_addr=%h wb_word_addr=%h cyc=%b",cycle,dut.domem.i_addr,dut.domem.o_wb_addr,dut.domem.cyc);
    end
    if (!reset && dut.domem.i_pipe_stb && dut.domem.cyc && dut.domem.i_addr==32'h00000100 && dut.domem.o_wb_addr==30'h00000040) begin
       hits=hits+1;
       $display("NATIVE_FETCH_WITNESS cycle=%0d byte_addr=00000100 wb_word_addr=00000040 old_comparison_false=%b new_comparison_true=%b",cycle, ((dut.domem.i_addr==dut.domem.o_wb_addr)||(dut.domem.i_addr==dut.domem.o_wb_addr+1)), ((dut.domem.i_addr[31:2]==dut.domem.o_wb_addr)||(dut.domem.i_addr[31:2]==dut.domem.o_wb_addr+1)));
    end
  end
endmodule
