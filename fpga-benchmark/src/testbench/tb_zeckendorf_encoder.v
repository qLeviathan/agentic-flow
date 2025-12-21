////////////////////////////////////////////////////////////////////////////////
// Testbench: tb_zeckendorf_encoder
// Description: Comprehensive testbench for Zeckendorf encoder/decoder
////////////////////////////////////////////////////////////////////////////////

`timescale 1ns / 1ps

module tb_zeckendorf_encoder;

    // Parameters
    parameter WIDTH = 32;
    parameter PHI_WIDTH = 48;
    parameter CLK_PERIOD = 10;

    // Signals
    reg                      clk;
    reg                      rst_n;
    reg                      valid_in;
    reg  [WIDTH-1:0]         token_in;
    wire                     valid_out;
    wire [PHI_WIDTH-1:0]     phi_addr_out;
    wire [5:0]               max_shell;
    wire                     parity;
    wire                     ready;

    // Decoder signals
    wire                     dec_valid_out;
    wire [WIDTH-1:0]         dec_token_out;

    // Test tracking
    integer test_count;
    integer pass_count;
    integer fail_count;

    // Fibonacci sequence for verification
    reg [WIDTH-1:0] FIB [0:47];

    // DUT instantiation
    zeckendorf_encoder #(
        .WIDTH(WIDTH),
        .PHI_WIDTH(PHI_WIDTH),
        .PIPELINE_STAGES(4)
    ) encoder_dut (
        .clk(clk),
        .rst_n(rst_n),
        .valid_in(valid_in),
        .token_in(token_in),
        .valid_out(valid_out),
        .phi_addr_out(phi_addr_out),
        .max_shell(max_shell),
        .parity(parity),
        .ready(ready)
    );

    // Decoder for round-trip verification
    zeckendorf_decoder #(
        .WIDTH(WIDTH),
        .PHI_WIDTH(PHI_WIDTH)
    ) decoder_dut (
        .clk(clk),
        .rst_n(rst_n),
        .valid_in(valid_out),
        .phi_addr_in(phi_addr_out),
        .valid_out(dec_valid_out),
        .token_out(dec_token_out)
    );

    // Clock generation
    initial begin
        clk = 0;
        forever #(CLK_PERIOD/2) clk = ~clk;
    end

    // Initialize Fibonacci sequence
    initial begin
        FIB[0]  = 32'd1;      FIB[1]  = 32'd1;
        FIB[2]  = 32'd2;      FIB[3]  = 32'd3;
        FIB[4]  = 32'd5;      FIB[5]  = 32'd8;
        FIB[6]  = 32'd13;     FIB[7]  = 32'd21;
        FIB[8]  = 32'd34;     FIB[9]  = 32'd55;
        FIB[10] = 32'd89;     FIB[11] = 32'd144;
        FIB[12] = 32'd233;    FIB[13] = 32'd377;
        FIB[14] = 32'd610;    FIB[15] = 32'd987;
        FIB[16] = 32'd1597;   FIB[17] = 32'd2584;
        FIB[18] = 32'd4181;   FIB[19] = 32'd6765;
        FIB[20] = 32'd10946;  FIB[21] = 32'd17711;
        FIB[22] = 32'd28657;  FIB[23] = 32'd46368;
        FIB[24] = 32'd75025;  FIB[25] = 32'd121393;
        FIB[26] = 32'd196418; FIB[27] = 32'd317811;
        FIB[28] = 32'd514229; FIB[29] = 32'd832040;
    end

    // Check for adjacent 1s (Zeckendorf property violation)
    function has_adjacent_ones;
        input [PHI_WIDTH-1:0] addr;
        integer i;
        begin
            has_adjacent_ones = 0;
            for (i = 0; i < PHI_WIDTH-1; i = i + 1) begin
                if (addr[i] && addr[i+1]) begin
                    has_adjacent_ones = 1;
                end
            end
        end
    endfunction

    // Test task
    task test_encode;
        input [WIDTH-1:0] value;
        input [79:0] test_name;
        begin
            @(posedge clk);
            valid_in <= 1'b1;
            token_in <= value;
            @(posedge clk);
            valid_in <= 1'b0;

            // Wait for encoder output
            wait(valid_out);
            @(posedge clk);

            test_count = test_count + 1;

            // Check Zeckendorf property
            if (has_adjacent_ones(phi_addr_out)) begin
                $display("FAIL [%s]: Value %d has adjacent 1s in encoding: %b",
                         test_name, value, phi_addr_out);
                fail_count = fail_count + 1;
            end else begin
                $display("PASS [%s]: Value %d -> %b (shell=%d, parity=%b)",
                         test_name, value, phi_addr_out, max_shell, parity);
                pass_count = pass_count + 1;
            end

            // Wait for decoder round-trip
            wait(dec_valid_out);
            @(posedge clk);

            if (dec_token_out != value) begin
                $display("FAIL [%s]: Round-trip mismatch: in=%d, out=%d",
                         test_name, value, dec_token_out);
                fail_count = fail_count + 1;
            end else begin
                $display("PASS [%s]: Round-trip verified: %d -> %b -> %d",
                         test_name, value, phi_addr_out, dec_token_out);
                pass_count = pass_count + 1;
            end
        end
    endtask

    // Main test sequence
    initial begin
        $display("========================================");
        $display("Zeckendorf Encoder/Decoder Testbench");
        $display("========================================");

        // Initialize
        rst_n = 0;
        valid_in = 0;
        token_in = 0;
        test_count = 0;
        pass_count = 0;
        fail_count = 0;

        // Reset
        repeat(10) @(posedge clk);
        rst_n = 1;
        repeat(5) @(posedge clk);

        // Test 1: Fibonacci numbers (should have single bit set)
        $display("\n--- Test: Fibonacci Numbers ---");
        test_encode(1, "F_0");
        test_encode(2, "F_2");
        test_encode(3, "F_3");
        test_encode(5, "F_4");
        test_encode(8, "F_5");
        test_encode(13, "F_6");
        test_encode(21, "F_7");
        test_encode(34, "F_8");
        test_encode(55, "F_9");
        test_encode(89, "F_10");

        // Test 2: Non-Fibonacci numbers
        $display("\n--- Test: Non-Fibonacci Numbers ---");
        test_encode(4, "4");      // 3 + 1 = F_3 + F_0
        test_encode(6, "6");      // 5 + 1 = F_4 + F_0
        test_encode(7, "7");      // 5 + 2 = F_4 + F_2
        test_encode(10, "10");    // 8 + 2 = F_5 + F_2
        test_encode(15, "15");    // 13 + 2 = F_6 + F_2
        test_encode(100, "100");
        test_encode(1000, "1000");
        test_encode(12345, "12345");

        // Test 3: Edge cases
        $display("\n--- Test: Edge Cases ---");
        test_encode(0, "Zero");
        test_encode(1, "One");
        test_encode(32'hFFFFFFFF, "Max");

        // Test 4: Powers of 2
        $display("\n--- Test: Powers of 2 ---");
        test_encode(2, "2^1");
        test_encode(4, "2^2");
        test_encode(16, "2^4");
        test_encode(256, "2^8");
        test_encode(1024, "2^10");

        // Summary
        repeat(20) @(posedge clk);
        $display("\n========================================");
        $display("Test Summary");
        $display("========================================");
        $display("Total tests: %d", test_count);
        $display("Passed:      %d", pass_count);
        $display("Failed:      %d", fail_count);
        $display("========================================");

        if (fail_count == 0) begin
            $display("ALL TESTS PASSED!");
        end else begin
            $display("SOME TESTS FAILED!");
        end

        $finish;
    end

    // Timeout watchdog
    initial begin
        #100000;
        $display("ERROR: Testbench timeout!");
        $finish;
    end

    // VCD dump for waveform viewing
    initial begin
        $dumpfile("tb_zeckendorf_encoder.vcd");
        $dumpvars(0, tb_zeckendorf_encoder);
    end

endmodule
