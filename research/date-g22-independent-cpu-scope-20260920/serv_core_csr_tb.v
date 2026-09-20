`timescale 1ns/1ps
module serv_core_csr_tb;
  reg clk=0;
  always #5 clk=~clk;
  reg rst=1;
  wire [31:0] ibus_adr,dbus_adr,dbus_dat;
  wire ibus_cyc,dbus_cyc,dbus_we;
  wire [3:0] dbus_sel;
  wire ibus_ack=ibus_cyc && !rst;
  wire dbus_ack=dbus_cyc && !rst;
  reg [31:0] ibus_rdt;
  wire rvfi_valid;
  wire [31:0] rvfi_insn, rvfi_rd_wdata;
  wire [4:0] rvfi_rd_addr;
  integer cycles=0, retired=0, csrret=0, stores=0;
  reg [31:0] store0=32'hx,store4=32'hx;
  reg seen_oldcsr=0,seen_newcsr=0;
  always @* begin
    case (ibus_adr)
      32'h00000000: ibus_rdt=32'h00100093; // addi x1,x0,1
      32'h00000004: ibus_rdt=32'h340091f3; // csrrw x3,mscratch,x1 (GPR-write control)
      32'h00000008: ibus_rdt=32'h34015073; // csrrwi x0,mscratch,2 (CSR write, NO GPR write)
      32'h0000000c: ibus_rdt=32'h34002173; // csrrs x2,mscratch,x0 (architectural read)
      32'h00000010: ibus_rdt=32'h00202023; // sw x2,0(x0)
      32'h00000014: ibus_rdt=32'h00102223; // sw x1,4(x0), ADDI control
      32'h00000018: ibus_rdt=32'h0000006f; // jal x0,0
      default: ibus_rdt=32'h00000013;
    endcase
  end
  serv_rf_top #(.DEBUG(1'b1),.WITH_CSR(1),.W(1),.RESET_PC(0)) dut (
    .clk(clk), .i_rst(rst), .i_timer_irq(1'b0),
    .rvfi_valid(rvfi_valid),.rvfi_insn(rvfi_insn),.rvfi_rd_wdata(rvfi_rd_wdata),.rvfi_rd_addr(rvfi_rd_addr),
    .o_ibus_adr(ibus_adr),.o_ibus_cyc(ibus_cyc),.i_ibus_rdt(ibus_rdt),.i_ibus_ack(ibus_ack),
    .o_dbus_adr(dbus_adr),.o_dbus_dat(dbus_dat),.o_dbus_sel(dbus_sel),.o_dbus_we(dbus_we),.o_dbus_cyc(dbus_cyc),.i_dbus_rdt(32'd0),.i_dbus_ack(dbus_ack),
    .i_ext_rd(32'd0),.i_ext_ready(1'b0),.o_ext_rs1(),.o_ext_rs2(),.o_ext_funct3(),.o_mdu_valid());
  initial begin
    repeat (6) @(negedge clk);
    rst=0;
  end
  always @(posedge clk) if (!rst) begin
    cycles <= cycles+1;
    if (rvfi_valid) begin
      retired<=retired+1;
      if (rvfi_insn==32'h34015073) begin
        csrret<=csrret+1;
        $display("CSR_ONLY_RETIRE cycle=%0d instr=%08h mirror=%08h rd=%0d rd_data=%08h",cycles,rvfi_insn,dut.cpu.gen_debug.debug.dbg_mscratch,rvfi_rd_addr,rvfi_rd_wdata);
        if (dut.cpu.gen_debug.debug.dbg_mscratch===32'h00000001) seen_oldcsr<=1;
        if (dut.cpu.gen_debug.debug.dbg_mscratch===32'h00000002) seen_newcsr<=1;
      end
      if (retired<12) $display("RETIRE cycle=%0d instr=%08h",cycles,rvfi_insn);
    end
    if (dbus_cyc && dbus_ack && dbus_we) begin
      stores<=stores+1;
      $display("STORE cycle=%0d addr=%08h data=%08h mask=%b mirror=%08h",cycles,dbus_adr,dbus_dat,dbus_sel,dut.cpu.gen_debug.debug.dbg_mscratch);
      if (dbus_adr==0) store0<=dbus_dat;
      if (dbus_adr==4) store4<=dbus_dat;
    end
    if (cycles==4000) begin
      $display("TIMEOUT retired=%0d csrret=%0d stores=%0d store0=%08h store4=%08h",retired,csrret,stores,store0,store4);
      $fatal(1,"full core did not complete program");
    end
    if (store0===32'd2 && store4===32'd1) begin
      $display("FULL_CPU_ARCH_PASS old_new_identical arch_mscratch=2 addi=1 csrret=%0d mirror=%08h",csrret,dut.cpu.gen_debug.debug.dbg_mscratch);
      if (csrret<1) $fatal(1,"missed CSR retirement");
`ifdef PARENT
      if (!seen_oldcsr) $fatal(1,"old observer did not retain first CSR value");
`else
      if (!seen_newcsr) $fatal(1,"new observer did not follow second CSR value");
`endif
      $display("G22_FULL_CPU_OBSERVER_DIVERGENCE_VALIDATED");
      $finish;
    end
  end
endmodule
