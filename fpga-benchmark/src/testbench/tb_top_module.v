////////////////////////////////////////////////////////////////////////////////
// Testbench: tb_top_module
// Description: Integration test for complete φ-space processor
////////////////////////////////////////////////////////////////////////////////

`timescale 1ns / 1ps

module tb_top_module;

    // Parameters
    parameter WIDTH = 32;
    parameter PHI_WIDTH = 48;
    parameter VOCAB_SIZE = 4096;
    parameter TOKEN_WIDTH = 12;
    parameter CLK_PERIOD = 10;

    // Signals
    reg                        clk;
    reg                        rst_n;
    reg                        mode;
    reg                        start;
    reg                        query;
    reg                        clear_context;
    reg                        token_valid;
    reg  [WIDTH-1:0]           token_in;

    wire                       token_out_valid;
    wire [TOKEN_WIDTH-1:0]     token_out;
    wire [5:0]                 token_distance;
    wire                       context_valid;
    wire [PHI_WIDTH-1:0]       context_out;
    wire [5:0]                 context_max_shell;
    wire                       context_parity;
    wire [3:0]                 context_depth;
    wire                       ready;
    wire                       busy;
    wire                       audit_valid;
    wire [7:0]                 audit_op_code;
    wire [PHI_WIDTH-1:0]       audit_operand_a;
    wire [PHI_WIDTH-1:0]       audit_operand_b;
    wire [PHI_WIDTH-1:0]       audit_result;

    // Test tracking
    integer test_count;
    integer pass_count;
    integer fail_count;
    integer audit_event_count;

    // DUT
    phi_space_processor #(
        .WIDTH(WIDTH),
        .PHI_WIDTH(PHI_WIDTH),
        .VOCAB_SIZE(VOCAB_SIZE),
        .TOKEN_WIDTH(TOKEN_WIDTH),
        .CONTEXT_DEPTH(16),
        .NUM_PARTITIONS(8)
    ) dut (
        .clk(clk),
        .rst_n(rst_n),
        .mode(mode),
        .start(start),
        .query(query),
        .clear_context(clear_context),
        .token_valid(token_valid),
        .token_in(token_in),
        .token_out_valid(token_out_valid),
        .token_out(token_out),
        .token_distance(token_distance),
        .context_valid(context_valid),
        .context_out(context_out),
        .context_max_shell(context_max_shell),
        .context_parity(context_parity),
        .context_depth(context_depth),
        .ready(ready),
        .busy(busy),
        .audit_valid(audit_valid),
        .audit_op_code(audit_op_code),
        .audit_operand_a(audit_operand_a),
        .audit_operand_b(audit_operand_b),
        .audit_result(audit_result)
    );

    // Clock generation
    initial begin
        clk = 0;
        forever #(CLK_PERIOD/2) clk = ~clk;
    end

    // Audit logger
    always @(posedge clk) begin
        if (audit_valid) begin
            audit_event_count = audit_event_count + 1;
            case (audit_op_code)
                8'h01: $display("[AUDIT %4d] TOKEN_IN: %h", audit_event_count, audit_operand_a);
                8'h02: $display("[AUDIT %4d] ENCODE_DONE: result=%h", audit_event_count, audit_result);
                8'h03: $display("[AUDIT %4d] ROUTE_DONE: addr=%h, part=%d",
                               audit_event_count, audit_operand_a, audit_operand_b[2:0]);
                8'h04: $display("[AUDIT %4d] ACCUM_DONE: context=%h", audit_event_count, audit_result);
                8'h10: $display("[AUDIT %4d] RECALL_START: query=%h", audit_event_count, audit_operand_a);
                8'h11: $display("[AUDIT %4d] RECALL_DONE: token=%d, dist=%d",
                               audit_event_count, audit_operand_a[TOKEN_WIDTH-1:0], audit_operand_b[5:0]);
                default: $display("[AUDIT %4d] OP=%h", audit_event_count, audit_op_code);
            endcase
        end
    end

    // Task: Send token in comprehension mode
    task send_token;
        input [WIDTH-1:0] token;
        begin
            wait(ready);
            @(posedge clk);
            token_valid <= 1'b1;
            token_in <= token;
            @(posedge clk);
            token_valid <= 1'b0;

            // Wait for processing
            wait(!busy);
            @(posedge clk);
        end
    endtask

    // Task: Query context
    task query_context;
        begin
            @(posedge clk);
            query <= 1'b1;
            @(posedge clk);
            query <= 1'b0;

            wait(context_valid);
            @(posedge clk);
            $display("Context Query Result:");
            $display("  Address:   %h", context_out);
            $display("  Max Shell: %d", context_max_shell);
            $display("  Parity:    %b", context_parity);
            $display("  Depth:     %d", context_depth);
        end
    endtask

    // Task: Recall (generate) token
    task recall_token;
        begin
            wait(ready);
            @(posedge clk);
            mode <= 1'b1; // Recall mode
            start <= 1'b1;
            @(posedge clk);
            start <= 1'b0;

            wait(token_out_valid);
            @(posedge clk);
            $display("Recall Result:");
            $display("  Token:    %d", token_out);
            $display("  Distance: %d", token_distance);

            mode <= 1'b0; // Back to comprehend mode
        end
    endtask

    // Main test sequence
    initial begin
        $display("========================================");
        $display("φ-Space Processor Integration Test");
        $display("========================================");

        // Initialize
        rst_n = 0;
        mode = 0;
        start = 0;
        query = 0;
        clear_context = 0;
        token_valid = 0;
        token_in = 0;
        test_count = 0;
        pass_count = 0;
        fail_count = 0;
        audit_event_count = 0;

        // Reset
        repeat(10) @(posedge clk);
        rst_n = 1;
        repeat(5) @(posedge clk);

        // Test 1: Comprehension Mode - Build context
        $display("\n--- Test 1: Comprehension Mode ---");
        $display("Sending sentence: 'the king is dead'");

        // Simulate tokens (as integer IDs mapped to Fibonacci-like values)
        send_token(32'd100);   // "the"
        send_token(32'd500);   // "king"
        send_token(32'd55);    // "is"
        send_token(32'd1000);  // "dead"

        // Query the accumulated context
        query_context();

        test_count = test_count + 1;
        if (context_depth == 4) begin
            $display("PASS: Context depth = 4");
            pass_count = pass_count + 1;
        end else begin
            $display("FAIL: Context depth = %d (expected 4)", context_depth);
            fail_count = fail_count + 1;
        end

        // Test 2: Recall Mode - Generate token from context
        $display("\n--- Test 2: Recall Mode ---");
        recall_token();

        test_count = test_count + 1;
        if (token_out_valid) begin
            $display("PASS: Token generated");
            pass_count = pass_count + 1;
        end else begin
            $display("FAIL: No token generated");
            fail_count = fail_count + 1;
        end

        // Test 3: Clear and rebuild
        $display("\n--- Test 3: Clear and Rebuild ---");
        @(posedge clk);
        clear_context <= 1'b1;
        @(posedge clk);
        clear_context <= 1'b0;
        repeat(5) @(posedge clk);

        query_context();
        test_count = test_count + 1;
        if (context_depth == 0) begin
            $display("PASS: Context cleared");
            pass_count = pass_count + 1;
        end else begin
            $display("FAIL: Context not cleared");
            fail_count = fail_count + 1;
        end

        // Test 4: Sequential token processing
        $display("\n--- Test 4: Sequential Processing ---");
        send_token(32'd1);
        send_token(32'd2);
        send_token(32'd3);
        send_token(32'd5);
        send_token(32'd8);
        query_context();

        test_count = test_count + 1;
        if (context_depth == 5) begin
            $display("PASS: 5 Fibonacci tokens accumulated");
            pass_count = pass_count + 1;
        end else begin
            $display("FAIL: Depth mismatch");
            fail_count = fail_count + 1;
        end

        // Test 5: Audit trail verification
        $display("\n--- Test 5: Audit Trail ---");
        test_count = test_count + 1;
        if (audit_event_count > 0) begin
            $display("PASS: %d audit events logged", audit_event_count);
            pass_count = pass_count + 1;
        end else begin
            $display("FAIL: No audit events");
            fail_count = fail_count + 1;
        end

        // Summary
        repeat(20) @(posedge clk);
        $display("\n========================================");
        $display("Test Summary");
        $display("========================================");
        $display("Total tests:  %d", test_count);
        $display("Passed:       %d", pass_count);
        $display("Failed:       %d", fail_count);
        $display("Audit events: %d", audit_event_count);
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
        #500000;
        $display("ERROR: Testbench timeout!");
        $finish;
    end

    // VCD dump
    initial begin
        $dumpfile("tb_top_module.vcd");
        $dumpvars(0, tb_top_module);
    end

endmodule
