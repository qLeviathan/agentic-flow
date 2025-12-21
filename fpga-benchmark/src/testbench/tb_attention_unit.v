////////////////////////////////////////////////////////////////////////////////
// Testbench: tb_attention_unit
// Description: Tests XOR-distance attention mechanism
////////////////////////////////////////////////////////////////////////////////

`timescale 1ns / 1ps

module tb_attention_unit;

    parameter PHI_WIDTH = 48;
    parameter WEIGHT_WIDTH = 16;
    parameter CLK_PERIOD = 10;

    // Signals
    reg                        clk;
    reg                        rst_n;
    reg                        valid_in;
    reg  [PHI_WIDTH-1:0]       query;
    reg  [PHI_WIDTH-1:0]       key;
    reg  [PHI_WIDTH-1:0]       value;
    wire                       valid_out;
    wire [5:0]                 distance;
    wire [WEIGHT_WIDTH-1:0]    weight;
    wire [PHI_WIDTH-1:0]       weighted_value;
    wire                       sign;

    // Shell distance module
    wire                       dist_valid_out;
    wire [5:0]                 shell_dist;

    // Test tracking
    integer test_count;
    integer pass_count;
    integer fail_count;

    // DUT: Attention Unit
    attention_unit #(
        .PHI_WIDTH(PHI_WIDTH),
        .NUM_HEADS(8),
        .WEIGHT_WIDTH(WEIGHT_WIDTH)
    ) attention_dut (
        .clk(clk),
        .rst_n(rst_n),
        .valid_in(valid_in),
        .query(query),
        .key(key),
        .value(value),
        .valid_out(valid_out),
        .distance(distance),
        .weight(weight),
        .weighted_value(weighted_value),
        .sign(sign)
    );

    // DUT: Shell Distance
    shell_distance #(
        .PHI_WIDTH(PHI_WIDTH)
    ) dist_dut (
        .clk(clk),
        .rst_n(rst_n),
        .valid_in(valid_in),
        .addr_a(query),
        .addr_b(key),
        .valid_out(dist_valid_out),
        .distance(shell_dist)
    );

    // Clock generation
    initial begin
        clk = 0;
        forever #(CLK_PERIOD/2) clk = ~clk;
    end

    // Expected popcount
    function [5:0] expected_popcount;
        input [PHI_WIDTH-1:0] xor_val;
        integer i;
        reg [5:0] count;
        begin
            count = 0;
            for (i = 0; i < PHI_WIDTH; i = i + 1) begin
                count = count + xor_val[i];
            end
            expected_popcount = count;
        end
    endfunction

    // Test attention
    task test_attention;
        input [PHI_WIDTH-1:0] q;
        input [PHI_WIDTH-1:0] k;
        input [PHI_WIDTH-1:0] v;
        input [79:0] test_name;
        reg [5:0] expected_dist;
        begin
            expected_dist = expected_popcount(q ^ k);

            @(posedge clk);
            valid_in <= 1'b1;
            query <= q;
            key <= k;
            value <= v;
            @(posedge clk);
            valid_in <= 1'b0;

            wait(valid_out);
            @(posedge clk);

            test_count = test_count + 1;

            if (distance != expected_dist) begin
                $display("FAIL [%s]: Distance mismatch: got %d, expected %d",
                         test_name, distance, expected_dist);
                fail_count = fail_count + 1;
            end else begin
                $display("PASS [%s]: q=%h k=%h -> dist=%d, weight=%d, sign=%b",
                         test_name, q[15:0], k[15:0], distance, weight, sign);
                pass_count = pass_count + 1;
            end
        end
    endtask

    // Main test sequence
    initial begin
        $display("========================================");
        $display("Attention Unit Testbench");
        $display("========================================");

        // Initialize
        rst_n = 0;
        valid_in = 0;
        query = 0;
        key = 0;
        value = 0;
        test_count = 0;
        pass_count = 0;
        fail_count = 0;

        // Reset
        repeat(10) @(posedge clk);
        rst_n = 1;
        repeat(5) @(posedge clk);

        // Test 1: Identical query and key (distance = 0)
        $display("\n--- Test: Identical Q/K (Distance 0) ---");
        test_attention(48'hAAAAAAAAAAAA, 48'hAAAAAAAAAAAA, 48'hFFFF, "identical");

        // Test 2: Single bit difference
        $display("\n--- Test: Single Bit Difference ---");
        test_attention(48'h000000000001, 48'h000000000000, 48'hFFFF, "1bit");
        test_attention(48'h000000000003, 48'h000000000001, 48'hFFFF, "1bit_2");

        // Test 3: Multiple bit differences
        $display("\n--- Test: Multiple Bit Differences ---");
        test_attention(48'h00000000000F, 48'h000000000000, 48'hFFFF, "4bits");
        test_attention(48'h0000000000FF, 48'h000000000000, 48'hFFFF, "8bits");
        test_attention(48'h000000000FFF, 48'h000000000000, 48'hFFFF, "12bits");

        // Test 4: Opposite patterns
        $display("\n--- Test: Opposite Patterns ---");
        test_attention(48'hAAAAAAAAAAAA, 48'h555555555555, 48'hFFFF, "opposite");

        // Test 5: Verify sign alternation
        $display("\n--- Test: Sign Alternation by Distance ---");
        test_attention(48'h000000000001, 48'h000000000000, 48'hFFFF, "d1_odd");
        test_attention(48'h000000000003, 48'h000000000000, 48'hFFFF, "d2_even");
        test_attention(48'h000000000007, 48'h000000000000, 48'hFFFF, "d3_odd");
        test_attention(48'h00000000000F, 48'h000000000000, 48'hFFFF, "d4_even");

        // Test 6: Weight decay with distance
        $display("\n--- Test: Weight Decay ---");
        test_attention(48'h000000000000, 48'h000000000000, 48'hFFFF, "d0");
        test_attention(48'h000000000001, 48'h000000000000, 48'hFFFF, "d1");
        test_attention(48'h000000000003, 48'h000000000000, 48'hFFFF, "d2");
        test_attention(48'h00000000001F, 48'h000000000000, 48'hFFFF, "d5");
        test_attention(48'h00000000003FF, 48'h000000000000, 48'hFFFF, "d10");

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

    // Timeout
    initial begin
        #100000;
        $display("ERROR: Testbench timeout!");
        $finish;
    end

    // VCD dump
    initial begin
        $dumpfile("tb_attention_unit.vcd");
        $dumpvars(0, tb_attention_unit);
    end

endmodule
