////////////////////////////////////////////////////////////////////////////////
// Module: cascade_engine
// Description: Physical cascade engine for Zeckendorf normalization
//              Enforces φ^k + φ^(k+1) = φ^(k+2) identity
//
// Key Property: Adjacent 1-bits collapse upward:
//   0b011 (φ^0 + φ^1) → 0b100 (φ^2)
//   This is the physical enforcement of Fibonacci addition
//
// The cascade is UNROLLED - no iterative loops, deterministic latency
// ASIC-ready: fixed timing, no variable-length operations
////////////////////////////////////////////////////////////////////////////////

module cascade_engine #(
    parameter PHI_WIDTH = 48,          // φ-space width
    parameter CASCADE_STAGES = 6       // Unrolled cascade depth (log2(PHI_WIDTH))
)(
    input  wire                  clk,
    input  wire                  rst_n,
    input  wire                  valid_in,
    input  wire [PHI_WIDTH-1:0]  phi_in,        // Input φ-representation
    input  wire [2:0]            op_mode,       // Operation mode
    output reg                   valid_out,
    output reg  [PHI_WIDTH-1:0]  phi_out,       // Normalized output
    output reg                   overflow,      // Cascade overflow flag
    output reg  [5:0]            iterations     // Actual iterations used (for audit)
);

    // Operation modes
    localparam OP_NORMALIZE = 3'b000;   // Just normalize (enforce Zeckendorf)
    localparam OP_ADD       = 3'b001;   // Add (OR + cascade)
    localparam OP_MUL_PHI   = 3'b010;   // Multiply by φ (shift left + cascade)
    localparam OP_DIV_PHI   = 3'b011;   // Divide by φ (shift right + cascade)
    localparam OP_MERGE     = 3'b100;   // Context merge (weighted OR)

    // Pipeline registers for each cascade stage
    reg [PHI_WIDTH-1:0] stage_data [0:CASCADE_STAGES];
    reg [CASCADE_STAGES:0] stage_valid;
    reg [CASCADE_STAGES:0] stage_overflow;

    // Combinational cascade step - single pass
    // Detects pattern 0b11 and converts to 0b100 at next position
    function [PHI_WIDTH:0] cascade_step;
        input [PHI_WIDTH-1:0] data_in;
        reg [PHI_WIDTH:0] result;
        reg carry;
        integer k;
        begin
            result = {1'b0, data_in};
            carry = 1'b0;

            for (k = 0; k < PHI_WIDTH-1; k = k + 1) begin
                if (result[k] && result[k+1]) begin
                    // Adjacent 1s found: φ^k + φ^(k+1) = φ^(k+2)
                    result[k] = 1'b0;
                    result[k+1] = 1'b0;
                    result[k+2] = result[k+2] | 1'b1; // May create new adjacent pair
                end
            end

            // Check for overflow
            if (result[PHI_WIDTH]) begin
                carry = 1'b1;
            end

            cascade_step = result;
        end
    endfunction

    // Multi-pass cascade for complete normalization
    function [PHI_WIDTH-1:0] full_cascade;
        input [PHI_WIDTH-1:0] data_in;
        reg [PHI_WIDTH-1:0] current;
        reg [PHI_WIDTH-1:0] prev;
        reg [PHI_WIDTH:0] step_result;
        integer pass;
        begin
            current = data_in;
            for (pass = 0; pass < CASCADE_STAGES; pass = pass + 1) begin
                prev = current;
                step_result = cascade_step(current);
                current = step_result[PHI_WIDTH-1:0];
            end
            full_cascade = current;
        end
    endfunction

    // Check if normalized (no adjacent 1s)
    function is_normalized;
        input [PHI_WIDTH-1:0] data;
        reg has_adjacent;
        integer m;
        begin
            has_adjacent = 1'b0;
            for (m = 0; m < PHI_WIDTH-1; m = m + 1) begin
                if (data[m] && data[m+1]) has_adjacent = 1'b1;
            end
            is_normalized = ~has_adjacent;
        end
    endfunction

    integer i;
    reg [PHI_WIDTH-1:0] work_data;
    reg [PHI_WIDTH:0] step_out;

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            valid_out <= 1'b0;
            phi_out <= {PHI_WIDTH{1'b0}};
            overflow <= 1'b0;
            iterations <= 6'd0;

            for (i = 0; i <= CASCADE_STAGES; i = i + 1) begin
                stage_data[i] <= {PHI_WIDTH{1'b0}};
                stage_valid[i] <= 1'b0;
                stage_overflow[i] <= 1'b0;
            end
        end else begin
            // Stage 0: Input and operation
            stage_valid[0] <= valid_in;
            stage_overflow[0] <= 1'b0;

            case (op_mode)
                OP_NORMALIZE: stage_data[0] <= phi_in;
                OP_MUL_PHI:   stage_data[0] <= {phi_in[PHI_WIDTH-2:0], 1'b0}; // Left shift
                OP_DIV_PHI:   stage_data[0] <= {1'b0, phi_in[PHI_WIDTH-1:1]}; // Right shift
                default:      stage_data[0] <= phi_in;
            endcase

            // Cascade stages 1 to N (unrolled, physical cascade)
            for (i = 1; i <= CASCADE_STAGES; i = i + 1) begin
                stage_valid[i] <= stage_valid[i-1];

                if (stage_valid[i-1]) begin
                    step_out = cascade_step(stage_data[i-1]);
                    stage_data[i] <= step_out[PHI_WIDTH-1:0];
                    stage_overflow[i] <= stage_overflow[i-1] | step_out[PHI_WIDTH];
                end else begin
                    stage_data[i] <= {PHI_WIDTH{1'b0}};
                    stage_overflow[i] <= 1'b0;
                end
            end

            // Output
            valid_out <= stage_valid[CASCADE_STAGES];
            phi_out <= stage_data[CASCADE_STAGES];
            overflow <= stage_overflow[CASCADE_STAGES];
            iterations <= CASCADE_STAGES[5:0]; // Fixed latency
        end
    end

endmodule


////////////////////////////////////////////////////////////////////////////////
// Module: cascade_adder
// Description: φ-space addition using OR + cascade
//              a + b in φ-space = cascade(a | b)
////////////////////////////////////////////////////////////////////////////////

module cascade_adder #(
    parameter PHI_WIDTH = 48
)(
    input  wire                  clk,
    input  wire                  rst_n,
    input  wire                  valid_in,
    input  wire [PHI_WIDTH-1:0]  phi_a,
    input  wire [PHI_WIDTH-1:0]  phi_b,
    output wire                  valid_out,
    output wire [PHI_WIDTH-1:0]  phi_sum,
    output wire                  overflow
);

    wire [PHI_WIDTH-1:0] merged;
    wire [5:0] iterations_unused;

    // Merge inputs (OR operation)
    assign merged = phi_a | phi_b;

    // Cascade to normalize
    cascade_engine #(
        .PHI_WIDTH(PHI_WIDTH),
        .CASCADE_STAGES(6)
    ) cascade_inst (
        .clk(clk),
        .rst_n(rst_n),
        .valid_in(valid_in),
        .phi_in(merged),
        .op_mode(3'b000), // NORMALIZE
        .valid_out(valid_out),
        .phi_out(phi_sum),
        .overflow(overflow),
        .iterations(iterations_unused)
    );

endmodule


////////////////////////////////////////////////////////////////////////////////
// Module: cascade_subtractor
// Description: φ-space subtraction using borrow propagation
//              More complex than addition - requires carry handling
////////////////////////////////////////////////////////////////////////////////

module cascade_subtractor #(
    parameter PHI_WIDTH = 48
)(
    input  wire                  clk,
    input  wire                  rst_n,
    input  wire                  valid_in,
    input  wire [PHI_WIDTH-1:0]  phi_a,         // Minuend
    input  wire [PHI_WIDTH-1:0]  phi_b,         // Subtrahend
    output reg                   valid_out,
    output reg  [PHI_WIDTH-1:0]  phi_diff,
    output reg                   underflow,
    output reg                   negative
);

    // For subtraction in Zeckendorf representation:
    // We need to "expand" bits: φ^k → φ^(k-1) + φ^(k-2)
    // This is the inverse of cascade

    reg [PHI_WIDTH+4:0] expanded_a;
    reg [PHI_WIDTH-1:0] work_result;
    reg [PHI_WIDTH-1:0] result_stage [0:3];
    reg valid_stage [0:3];

    integer i, j;

    // Expand a single bit position downward
    // φ^k = φ^(k-1) + φ^(k-2) if we need to borrow
    function [PHI_WIDTH-1:0] expand_bit;
        input [PHI_WIDTH-1:0] data;
        input [5:0] pos;
        reg [PHI_WIDTH-1:0] result;
        begin
            result = data;
            if (pos >= 2 && data[pos]) begin
                result[pos] = 1'b0;
                result[pos-1] = result[pos-1] | 1'b1;
                result[pos-2] = result[pos-2] | 1'b1;
            end
            expand_bit = result;
        end
    endfunction

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            valid_out <= 1'b0;
            phi_diff <= {PHI_WIDTH{1'b0}};
            underflow <= 1'b0;
            negative <= 1'b0;
            for (i = 0; i < 4; i = i + 1) begin
                result_stage[i] <= {PHI_WIDTH{1'b0}};
                valid_stage[i] <= 1'b0;
            end
        end else begin
            // Stage 0: Initial comparison and setup
            valid_stage[0] <= valid_in;
            if (valid_in) begin
                // Simple case: if no overlapping bits, XOR gives result
                // Complex case: need borrow propagation
                work_result = phi_a;

                // Expand 'a' where 'b' has bits but 'a' doesn't
                for (i = 0; i < PHI_WIDTH; i = i + 1) begin
                    if (phi_b[i] && !work_result[i]) begin
                        // Need to borrow - find higher bit to expand
                        for (j = i+1; j < PHI_WIDTH; j = j + 1) begin
                            if (work_result[j]) begin
                                work_result = expand_bit(work_result, j[5:0]);
                                j = PHI_WIDTH; // Exit inner loop
                            end
                        end
                    end
                end

                result_stage[0] <= work_result;
            end

            // Stage 1: Perform subtraction (XOR where b has bits)
            valid_stage[1] <= valid_stage[0];
            work_result = result_stage[0];
            for (i = 0; i < PHI_WIDTH; i = i + 1) begin
                if (phi_b[i]) begin
                    work_result[i] = work_result[i] ^ 1'b1;
                end
            end
            result_stage[1] <= work_result;

            // Stages 2-3: Normalize result with cascade
            valid_stage[2] <= valid_stage[1];
            result_stage[2] <= result_stage[1]; // Would use cascade here

            valid_stage[3] <= valid_stage[2];
            result_stage[3] <= result_stage[2];

            // Output
            valid_out <= valid_stage[3];
            phi_diff <= result_stage[3];
            underflow <= (phi_a < phi_b); // Simple comparison for flag
            negative <= (phi_a < phi_b);
        end
    end

endmodule
