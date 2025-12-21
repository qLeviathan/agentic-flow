////////////////////////////////////////////////////////////////////////////////
// Testbench: tb_cascade_engine
// Description: Tests cascade normalization - the φ^k + φ^(k+1) = φ^(k+2) identity
////////////////////////////////////////////////////////////////////////////////

`timescale 1ns / 1ps

module tb_cascade_engine;

    parameter PHI_WIDTH = 48;
    parameter CLK_PERIOD = 10;

    // Signals
    reg                      clk;
    reg                      rst_n;
    reg                      valid_in;
    reg  [PHI_WIDTH-1:0]     phi_in;
    reg  [2:0]               op_mode;
    wire                     valid_out;
    wire [PHI_WIDTH-1:0]     phi_out;
    wire                     overflow;
    wire [5:0]               iterations;

    // Cascade adder signals
    wire                     add_valid_out;
    wire [PHI_WIDTH-1:0]     add_phi_sum;
    wire                     add_overflow;

    // Test tracking
    integer test_count;
    integer pass_count;
    integer fail_count;

    // DUT: Cascade Engine
    cascade_engine #(
        .PHI_WIDTH(PHI_WIDTH),
        .CASCADE_STAGES(6)
    ) cascade_dut (
        .clk(clk),
        .rst_n(rst_n),
        .valid_in(valid_in),
        .phi_in(phi_in),
        .op_mode(op_mode),
        .valid_out(valid_out),
        .phi_out(phi_out),
        .overflow(overflow),
        .iterations(iterations)
    );

    // DUT: Cascade Adder
    reg                      add_valid_in;
    reg  [PHI_WIDTH-1:0]     add_phi_a;
    reg  [PHI_WIDTH-1:0]     add_phi_b;

    cascade_adder #(
        .PHI_WIDTH(PHI_WIDTH)
    ) adder_dut (
        .clk(clk),
        .rst_n(rst_n),
        .valid_in(add_valid_in),
        .phi_a(add_phi_a),
        .phi_b(add_phi_b),
        .valid_out(add_valid_out),
        .phi_sum(add_phi_sum),
        .overflow(add_overflow)
    );

    // Clock generation
    initial begin
        clk = 0;
        forever #(CLK_PERIOD/2) clk = ~clk;
    end

    // Check for adjacent 1s
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

    // Test cascade normalization
    task test_cascade;
        input [PHI_WIDTH-1:0] value;
        input [79:0] test_name;
        begin
            @(posedge clk);
            valid_in <= 1'b1;
            phi_in <= value;
            op_mode <= 3'b000; // NORMALIZE
            @(posedge clk);
            valid_in <= 1'b0;

            wait(valid_out);
            @(posedge clk);

            test_count = test_count + 1;

            if (has_adjacent_ones(phi_out)) begin
                $display("FAIL [%s]: Output %b has adjacent 1s", test_name, phi_out);
                fail_count = fail_count + 1;
            end else begin
                $display("PASS [%s]: %b -> %b (iter=%d, ovf=%b)",
                         test_name, value, phi_out, iterations, overflow);
                pass_count = pass_count + 1;
            end
        end
    endtask

    // Test cascade addition
    task test_add;
        input [PHI_WIDTH-1:0] a;
        input [PHI_WIDTH-1:0] b;
        input [79:0] test_name;
        begin
            @(posedge clk);
            add_valid_in <= 1'b1;
            add_phi_a <= a;
            add_phi_b <= b;
            @(posedge clk);
            add_valid_in <= 1'b0;

            wait(add_valid_out);
            @(posedge clk);

            test_count = test_count + 1;

            if (has_adjacent_ones(add_phi_sum)) begin
                $display("FAIL [%s]: Sum %b has adjacent 1s", test_name, add_phi_sum);
                fail_count = fail_count + 1;
            end else begin
                $display("PASS [%s]: %b + %b = %b",
                         test_name, a, b, add_phi_sum);
                pass_count = pass_count + 1;
            end
        end
    endtask

    // Main test sequence
    initial begin
        $display("========================================");
        $display("Cascade Engine Testbench");
        $display("========================================");

        // Initialize
        rst_n = 0;
        valid_in = 0;
        phi_in = 0;
        op_mode = 0;
        add_valid_in = 0;
        add_phi_a = 0;
        add_phi_b = 0;
        test_count = 0;
        pass_count = 0;
        fail_count = 0;

        // Reset
        repeat(10) @(posedge clk);
        rst_n = 1;
        repeat(5) @(posedge clk);

        // Test 1: Adjacent bits should cascade
        // 0b011 (φ^0 + φ^1) → 0b100 (φ^2)
        $display("\n--- Test: Basic Cascade (φ^k + φ^(k+1) = φ^(k+2)) ---");
        test_cascade(48'b011, "phi0+phi1");           // Should become 0b100
        test_cascade(48'b0110, "phi1+phi2");          // Should become 0b1000
        test_cascade(48'b01100, "phi2+phi3");         // Should become 0b10000
        test_cascade(48'b011011, "multi");            // Multiple cascades needed

        // Test 2: Already normalized inputs
        $display("\n--- Test: Already Normalized ---");
        test_cascade(48'b10101010, "norm1");          // Already normalized
        test_cascade(48'b100100100100, "norm2");      // Already normalized
        test_cascade(48'b1, "single");                // Single bit

        // Test 3: Worst-case cascades
        $display("\n--- Test: Worst-Case Cascades ---");
        test_cascade({24{2'b01}}, "alternating");     // 010101... pattern
        test_cascade({16{3'b011}}, "011_repeat");     // Needs full cascade

        // Test 4: Addition
        $display("\n--- Test: φ-space Addition ---");
        test_add(48'b100, 48'b010, "F2+F1");          // φ^2 + φ^1
        test_add(48'b10000, 48'b01000, "F4+F3");      // φ^4 + φ^3
        test_add(48'b100100, 48'b010010, "multi");    // Multiple positions

        // Test 5: Edge cases
        $display("\n--- Test: Edge Cases ---");
        test_cascade({PHI_WIDTH{1'b0}}, "zero");
        test_cascade(48'b1, "one");
        test_cascade({PHI_WIDTH{1'b1}}, "all_ones");  // Worst case

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
        #200000;
        $display("ERROR: Testbench timeout!");
        $finish;
    end

    // VCD dump
    initial begin
        $dumpfile("tb_cascade_engine.vcd");
        $dumpvars(0, tb_cascade_engine);
    end

endmodule
