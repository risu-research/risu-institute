module round_tb;
  reg clk=0; always #5 clk=~clk;
  reg [3:0] reset_count=0;
  always @(posedge clk) if(reset_count<4) reset_count<=reset_count+1;
  wire resetn=reset_count==4;
  wire mem_valid,mem_instr,mem_ready,trap;
  wire [31:0] mem_addr,mem_wdata,mem_rdata;
  wire [3:0] mem_wstrb;
  wire rvfi_valid,rvfi_trap;
  wire [31:0] rvfi_insn,rvfi_pc_rdata,rvfi_rd_wdata;
  wire [4:0] rvfi_rs1_addr,rvfi_rd_addr;
  wire [31:0] rvfi_rs1_rdata;
  reg [31:0] rom[0:33];
  initial $readmemh("round.hex",rom);
  reg [31:0] rd_word;
  always @* begin
    rd_word=32'h00100073;
    if(mem_addr < 32'd136 && mem_addr[1:0]==0) rd_word=rom[mem_addr[8:2]];
    else case(mem_addr)
      32'h1000:rd_word=32'h11111111;
      32'h1004:rd_word=32'h01020304;
      32'h1008:rd_word=32'h9b8d6f43;
      32'h100c:rd_word=32'h01234567;
      default:rd_word=32'h00000000;
    endcase
  end
  assign mem_rdata=rd_word;
  assign mem_ready=mem_valid;
  picorv32 #(.ENABLE_REGS_16_31(0),.COMPRESSED_ISA(`SIM_COMPRESSED),
    .BARREL_SHIFTER(1),.REGS_INIT_ZERO(1),.ENABLE_IRQ(0),
    .ENABLE_MUL(0),.ENABLE_DIV(0)) dut (
    .clk(clk),.resetn(resetn),.trap(trap),
    .mem_valid(mem_valid),.mem_instr(mem_instr),.mem_ready(mem_ready),
    .mem_addr(mem_addr),.mem_wdata(mem_wdata),.mem_wstrb(mem_wstrb),
    .mem_rdata(mem_rdata),.irq(32'b0),
    .pcpi_wr(1'b0),.pcpi_rd(32'b0),.pcpi_wait(1'b0),.pcpi_ready(1'b0),
    .rvfi_valid(rvfi_valid),.rvfi_insn(rvfi_insn),.rvfi_trap(rvfi_trap),
    .rvfi_pc_rdata(rvfi_pc_rdata),.rvfi_rs1_addr(rvfi_rs1_addr),
    .rvfi_rs1_rdata(rvfi_rs1_rdata),.rvfi_rd_addr(rvfi_rd_addr),
    .rvfi_rd_wdata(rvfi_rd_wdata));
  reg [3:0] seen=0;
  integer high_shift_retires=0;
  integer total_retires=0;
  reg [31:0] out0=0,out1=0,out2=0,out3=0;
  always @(posedge clk) if(resetn) begin
    if(trap) $fatal(1,"CPU_TRAP");
    if(rvfi_valid) begin
      total_retires<=total_retires+1;
      if(rvfi_insn[6:0]==7'h13 &&
        (rvfi_insn[14:12]==3'b001 || rvfi_insn[14:12]==3'b101) &&
        rvfi_insn[24:20]>=16) begin
        high_shift_retires<=high_shift_retires+1;
        $display("HIGH_SHIFT pc=%08h insn=%08h shamt=%0d input=%08h result=%08h",rvfi_pc_rdata,rvfi_insn,rvfi_insn[24:20],rvfi_rs1_rdata,rvfi_rd_wdata);
      end
    end
    if(mem_valid && mem_ready && mem_wstrb) begin
      if(mem_wstrb!==4'hf) $fatal(1,"UNEXPECTED_WRITE_STROBE");
      case(mem_addr)
        32'h1100:begin out0<=mem_wdata;seen[0]<=1;$display("OUTPUT[0]=%08h",mem_wdata);end
        32'h1104:begin out1<=mem_wdata;seen[1]<=1;$display("OUTPUT[1]=%08h",mem_wdata);end
        32'h1108:begin out2<=mem_wdata;seen[2]<=1;$display("OUTPUT[2]=%08h",mem_wdata);end
        32'h110c:begin out3<=mem_wdata;seen[3]<=1;$display("OUTPUT[3]=%08h",mem_wdata);end
        32'h1110:begin
          if(mem_wdata!==32'h600dfeed || seen!==4'hf) $fatal(1,"INVALID_COMPLETION");
          if(high_shift_retires<4) $fatal(1,"HIGH_SHIFTS_NOT_EXECUTED");
          $display("COMPLETE outputs=%08h,%08h,%08h,%08h high_shifts=%0d retires=%0d",out0,out1,out2,out3,high_shift_retires,total_retires);
          if(out0===32'hea2a92f4 && out1===32'hcb1cf8ce && out2===32'h4581472e && out3===32'h5881c4bb) $display("RFC_MATCH");
          else $display("RFC_MISMATCH");
          $finish;
        end
        default:$fatal(1,"UNEXPECTED_WRITE_ADDRESS=%08h",mem_addr);
      endcase
    end
  end
  initial begin #1000000; $fatal(1,"TIMEOUT"); end
endmodule
