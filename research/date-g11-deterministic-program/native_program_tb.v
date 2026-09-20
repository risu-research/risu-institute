`timescale 1ns/1ps
module native_program_tb;
  reg clk=0;
  always #5 clk=~clk;
  reg reset=1, ack=0;
  reg [31:0] rdata=0;
  wire gcyc,gstb,lcyc,lstb,we;
  wire [29:0] addr;
  wire [31:0] wdata;
  wire [3:0] sel;
  integer cycle=0,fetched=0,accepted=0,pipe_seen=0,hits=0;
  // The historical idecode.v: destination bits 30:27; opcode 26:22;
  // when bit 18 is zero, uncompressed LOD uses a signed 18-bit immediate.
  function [31:0] rom;
    input [29:0] a;
    begin
      case(a)
`ifdef TEST_IMMEDIATE
      30'h00040000:rom=32'h14800100; // LOD $0x100,R2
      30'h00040001:rom=32'h1c800100; // LOD $0x100,R3
`elsif TEST_LDI
      30'h00040000:rom=32'h0e000100; // LDI $0x100,R1
      30'h00040001:rom=32'h14844000; // LOD (R1),R2
      30'h00040002:rom=32'h1c844000; // LOD (R1),R3
`else
      30'h00040000:rom=32'ha4c80cc8; // earlier SMT-derived 2-word control
      30'h00040001:rom=32'h8640c000;
`endif
      default:rom=32'h07c00000; // no-op opcode 0x1f
      endcase
    end
  endfunction
  zipcpu #(.RESET_ADDRESS(32'h00100000)) dut (
    .i_clk(clk),.i_reset(reset),.i_interrupt(1'b0),
    .i_halt(1'b0),.i_clear_pf_cache(1'b0),
    .i_dbg_reg(5'b0),.i_dbg_we(1'b0),.i_dbg_data(32'b0),
    .o_dbg_stall(),.o_dbg_reg(),.o_dbg_cc(),.o_break(),
    .o_wb_gbl_cyc(gcyc),.o_wb_gbl_stb(gstb),
    .o_wb_lcl_cyc(lcyc),.o_wb_lcl_stb(lstb),
    .o_wb_we(we),.o_wb_addr(addr),.o_wb_data(wdata),.o_wb_sel(sel),
    .i_wb_ack(ack),.i_wb_stall(1'b0),.i_wb_data(rdata),.i_wb_err(1'b0),
    .o_op_stall(),.o_pf_stall(),.o_i_count()
  );
  initial begin
    $dumpfile("trace.vcd");
    $dumpvars(0,native_program_tb);
    repeat(4) @(negedge clk);
    reset=0;
    repeat(160) @(negedge clk);
    $display("SUMMARY fetched=%0d accepted=%0d pipe_seen=%0d witness_hits=%0d",fetched,accepted,pipe_seen,hits);
    if(fetched<2) $fatal(1,"INCONCLUSIVE_FETCH: program instructions not observed");
    if(hits==0) $fatal(1,"NO_NATIVE_WITNESS: cannot claim actual RTL replay");
    $display("NATIVE_RTL_WITNESS_PASS");
    $finish;
  end
  always @(posedge clk) begin
    cycle=cycle+1;
    ack<=(!reset)&&((gcyc===1'b1&&gstb===1'b1)||(lcyc===1'b1&&lstb===1'b1));
    if(!reset&&((gcyc===1'b1&&gstb===1'b1)||(lcyc===1'b1&&lstb===1'b1))) begin
      rdata<=rom(addr);
      accepted=accepted+1;
      if(!we&&(addr>=30'h40000&&addr<=30'h40002))
        $display("FETCH_BUS cycle=%0d word=%h instruction=%h",cycle,addr,rom(addr));
    end
    if(!reset&&dut.pf_valid===1'b1) begin
      fetched=fetched+1;
      $display("FETCH_VALID cycle=%0d pc=%h insn=%h",cycle,dut.pf_instruction_pc,dut.pf_instruction);
    end
    if(!reset&&dut.domem.i_pipe_stb===1'b1) begin
      pipe_seen=pipe_seen+1;
      $display("PIPE cycle=%0d addr=%h wb_word=%h cyc=%b mem_ce=%b op_valid_mem=%b",cycle,dut.domem.i_addr,dut.domem.o_wb_addr,dut.domem.cyc,dut.mem_ce,dut.op_valid_mem);
    end
    if(!reset&&dut.domem.i_pipe_stb===1'b1&&dut.domem.cyc===1'b1
        &&dut.domem.i_addr===32'h00000100&&dut.domem.o_wb_addr===30'h00000040
        &&dut.domem.i_wb_stall===1'b0) begin
      if((dut.domem.i_addr==dut.domem.o_wb_addr||dut.domem.i_addr==dut.domem.o_wb_addr+1)!==1'b0)
        $fatal(1,"OLD_COMPARISON_DID_NOT_FAIL");
      if((dut.domem.i_addr[31:2]==dut.domem.o_wb_addr||dut.domem.i_addr[31:2]==dut.domem.o_wb_addr+1)!==1'b1)
        $fatal(1,"NEW_COMPARISON_DID_NOT_HOLD");
      hits=hits+1;
      $display("NATIVE_FETCH_WITNESS cycle=%0d byte_addr=00000100 word_addr=00000040 old_comparison_false=1 new_comparison_true=1",cycle);
    end
  end
endmodule
