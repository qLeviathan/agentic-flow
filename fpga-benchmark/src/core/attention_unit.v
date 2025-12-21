////////////////////////////////////////////////////////////////////////////////
// Module: attention_unit
// Description: XOR-distance based attention mechanism for φ-space
//
// Key Formulas:
//   distance(a, b) = popcount(a XOR b)  -- Shell distance
//   weight(d) = φ^(-d) × (-1)^d         -- Attention weight
//            = F_{base-d}/F_{base} × SIGN[d]
//
// All operations are INTEGER only - no floating point
// Uses Fibonacci ratios for exact φ-power computation
////////////////////////////////////////////////////////////////////////////////

module attention_unit #(
    parameter PHI_WIDTH = 48,
    parameter NUM_HEADS = 8,           // Parallel attention heads
    parameter WEIGHT_WIDTH = 16        // Weight precision (fixed point)
)(
    input  wire                       clk,
    input  wire                       rst_n,
    input  wire                       valid_in,
    input  wire [PHI_WIDTH-1:0]       query,         // Query context
    input  wire [PHI_WIDTH-1:0]       key,           // Key context
    input  wire [PHI_WIDTH-1:0]       value,         // Value to weight
    output reg                        valid_out,
    output reg  [5:0]                 distance,      // Shell distance
    output reg  [WEIGHT_WIDTH-1:0]    weight,        // Attention weight (fixed point)
    output reg  [PHI_WIDTH-1:0]       weighted_value,// Value × weight (approximated)
    output reg                        sign           // Sign of weight (alternating by distance)
);

    // Fibonacci ratio LUT for computing φ^(-d) as F_{base-d}/F_{base}
    // We use base=46 to get maximum precision within 32-bit
    // φ^(-d) ≈ F_{46-d} / F_{46}
    // Pre-scaled by 2^16 for fixed-point representation
    reg [WEIGHT_WIDTH-1:0] PHI_NEG_POWER_LUT [0:47];

    // Popcount stages for pipelining
    reg [5:0] popcount_stage [0:2];
    reg [PHI_WIDTH-1:0] xor_result;
    reg [PHI_WIDTH-1:0] value_pipe [0:2];
    reg [PHI_WIDTH-1:0] query_pipe [0:2];
    reg valid_pipe [0:2];

    integer i;

    // Initialize φ^(-d) lookup table
    // φ^(-d) = 1/φ^d = F_{n-d}/F_n (approximately)
    // Scaled by 65536 (2^16) for 16-bit fixed point
    initial begin
        // φ^0 = 1.0 = 65536
        PHI_NEG_POWER_LUT[0]  = 16'd65536;
        // φ^(-1) ≈ 0.618 = 40503
        PHI_NEG_POWER_LUT[1]  = 16'd40503;
        // φ^(-2) ≈ 0.382 = 25033
        PHI_NEG_POWER_LUT[2]  = 16'd25033;
        // φ^(-3) ≈ 0.236 = 15470
        PHI_NEG_POWER_LUT[3]  = 16'd15470;
        // φ^(-4) ≈ 0.146 = 9563
        PHI_NEG_POWER_LUT[4]  = 16'd9563;
        // φ^(-5) ≈ 0.090 = 5907
        PHI_NEG_POWER_LUT[5]  = 16'd5907;
        PHI_NEG_POWER_LUT[6]  = 16'd3656;
        PHI_NEG_POWER_LUT[7]  = 16'd2260;
        PHI_NEG_POWER_LUT[8]  = 16'd1397;
        PHI_NEG_POWER_LUT[9]  = 16'd863;
        PHI_NEG_POWER_LUT[10] = 16'd534;
        PHI_NEG_POWER_LUT[11] = 16'd330;
        PHI_NEG_POWER_LUT[12] = 16'd204;
        PHI_NEG_POWER_LUT[13] = 16'd126;
        PHI_NEG_POWER_LUT[14] = 16'd78;
        PHI_NEG_POWER_LUT[15] = 16'd48;
        PHI_NEG_POWER_LUT[16] = 16'd30;
        PHI_NEG_POWER_LUT[17] = 16'd18;
        PHI_NEG_POWER_LUT[18] = 16'd11;
        PHI_NEG_POWER_LUT[19] = 16'd7;
        PHI_NEG_POWER_LUT[20] = 16'd4;
        PHI_NEG_POWER_LUT[21] = 16'd3;
        PHI_NEG_POWER_LUT[22] = 16'd2;
        PHI_NEG_POWER_LUT[23] = 16'd1;
        // Beyond this, effectively zero
        for (i = 24; i < 48; i = i + 1) begin
            PHI_NEG_POWER_LUT[i] = 16'd0;
        end
    end

    // Popcount function - count set bits
    function [5:0] popcount;
        input [PHI_WIDTH-1:0] data;
        integer j;
        reg [5:0] count;
        begin
            count = 6'd0;
            for (j = 0; j < PHI_WIDTH; j = j + 1) begin
                count = count + {5'b0, data[j]};
            end
            popcount = count;
        end
    endfunction

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            valid_out <= 1'b0;
            distance <= 6'd0;
            weight <= {WEIGHT_WIDTH{1'b0}};
            weighted_value <= {PHI_WIDTH{1'b0}};
            sign <= 1'b0;

            for (i = 0; i < 3; i = i + 1) begin
                popcount_stage[i] <= 6'd0;
                value_pipe[i] <= {PHI_WIDTH{1'b0}};
                query_pipe[i] <= {PHI_WIDTH{1'b0}};
                valid_pipe[i] <= 1'b0;
            end
            xor_result <= {PHI_WIDTH{1'b0}};
        end else begin
            // Stage 0: XOR and start popcount
            valid_pipe[0] <= valid_in;
            xor_result <= query ^ key;
            value_pipe[0] <= value;
            query_pipe[0] <= query;

            // Partial popcount (first 16 bits)
            popcount_stage[0] <= popcount(query ^ key);

            // Stage 1: Complete popcount, lookup weight
            valid_pipe[1] <= valid_pipe[0];
            value_pipe[1] <= value_pipe[0];
            query_pipe[1] <= query_pipe[0];
            popcount_stage[1] <= popcount_stage[0]; // Full count already computed

            // Stage 2: Output
            valid_pipe[2] <= valid_pipe[1];
            value_pipe[2] <= value_pipe[1];
            popcount_stage[2] <= popcount_stage[1];

            // Final output
            valid_out <= valid_pipe[2];
            distance <= popcount_stage[2];

            // Weight lookup - φ^(-d)
            if (popcount_stage[2] < 48) begin
                weight <= PHI_NEG_POWER_LUT[popcount_stage[2]];
            end else begin
                weight <= 16'd0;
            end

            // Sign alternates: (-1)^d
            sign <= popcount_stage[2][0]; // LSB gives parity

            // Weighted value approximation
            // For now, simple mask based on distance
            // Closer = more bits preserved
            if (popcount_stage[2] < 8) begin
                weighted_value <= value_pipe[2];
            end else if (popcount_stage[2] < 16) begin
                weighted_value <= value_pipe[2] & {{16{1'b0}}, {32{1'b1}}};
            end else if (popcount_stage[2] < 24) begin
                weighted_value <= value_pipe[2] & {{32{1'b0}}, {16{1'b1}}};
            end else begin
                weighted_value <= {PHI_WIDTH{1'b0}}; // Too distant
            end
        end
    end

endmodule


////////////////////////////////////////////////////////////////////////////////
// Module: shell_distance
// Description: Compute shell distance between two φ-space addresses
//              d(a,b) = popcount(a XOR b)
////////////////////////////////////////////////////////////////////////////////

module shell_distance #(
    parameter PHI_WIDTH = 48
)(
    input  wire                  clk,
    input  wire                  rst_n,
    input  wire                  valid_in,
    input  wire [PHI_WIDTH-1:0]  addr_a,
    input  wire [PHI_WIDTH-1:0]  addr_b,
    output reg                   valid_out,
    output reg  [5:0]            distance
);

    // 3-stage pipelined popcount for timing
    reg [PHI_WIDTH-1:0] xor_result;
    reg [5:0] count_low, count_mid, count_high;
    reg valid_stage [0:2];

    integer i;

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            valid_out <= 1'b0;
            distance <= 6'd0;
            xor_result <= {PHI_WIDTH{1'b0}};
            count_low <= 6'd0;
            count_mid <= 6'd0;
            count_high <= 6'd0;
            for (i = 0; i < 3; i = i + 1) valid_stage[i] <= 1'b0;
        end else begin
            // Stage 0: XOR
            valid_stage[0] <= valid_in;
            xor_result <= addr_a ^ addr_b;

            // Stage 1: Partial popcounts
            valid_stage[1] <= valid_stage[0];
            count_low <= 6'd0;
            count_mid <= 6'd0;
            count_high <= 6'd0;

            for (i = 0; i < 16; i = i + 1) begin
                count_low <= count_low + {5'b0, xor_result[i]};
            end
            for (i = 16; i < 32; i = i + 1) begin
                count_mid <= count_mid + {5'b0, xor_result[i]};
            end
            for (i = 32; i < 48; i = i + 1) begin
                count_high <= count_high + {5'b0, xor_result[i]};
            end

            // Stage 2: Sum and output
            valid_stage[2] <= valid_stage[1];

            valid_out <= valid_stage[2];
            distance <= count_low + count_mid + count_high;
        end
    end

endmodule


////////////////////////////////////////////////////////////////////////////////
// Module: knn_shell
// Description: k-Nearest Neighbors by shell distance
//              Finds k entries with minimum XOR popcount to query
////////////////////////////////////////////////////////////////////////////////

module knn_shell #(
    parameter PHI_WIDTH = 48,
    parameter K = 8,                   // Number of nearest neighbors
    parameter NUM_ENTRIES = 256        // Size of search space
)(
    input  wire                        clk,
    input  wire                        rst_n,
    input  wire                        start,
    input  wire [PHI_WIDTH-1:0]        query,
    input  wire [PHI_WIDTH-1:0]        entries [0:NUM_ENTRIES-1],
    output reg                         done,
    output reg  [7:0]                  knn_indices [0:K-1],
    output reg  [5:0]                  knn_distances [0:K-1]
);

    // State machine
    localparam IDLE = 2'b00;
    localparam SCAN = 2'b01;
    localparam SORT = 2'b10;
    localparam DONE = 2'b11;

    reg [1:0] state;
    reg [7:0] scan_idx;
    reg [5:0] current_dist;

    // Distance computation
    reg [PHI_WIDTH-1:0] xor_result;

    // Candidate storage (sorted insert)
    reg [7:0] candidates_idx [0:K-1];
    reg [5:0] candidates_dist [0:K-1];

    integer i, j;
    reg [5:0] temp_dist;
    reg [7:0] temp_idx;

    // Popcount function
    function [5:0] popcount;
        input [PHI_WIDTH-1:0] data;
        reg [5:0] count;
        integer m;
        begin
            count = 6'd0;
            for (m = 0; m < PHI_WIDTH; m = m + 1) begin
                count = count + {5'b0, data[m]};
            end
            popcount = count;
        end
    endfunction

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            state <= IDLE;
            done <= 1'b0;
            scan_idx <= 8'd0;
            for (i = 0; i < K; i = i + 1) begin
                knn_indices[i] <= 8'd0;
                knn_distances[i] <= 6'd63; // Max distance
                candidates_idx[i] <= 8'd0;
                candidates_dist[i] <= 6'd63;
            end
        end else begin
            case (state)
                IDLE: begin
                    done <= 1'b0;
                    if (start) begin
                        state <= SCAN;
                        scan_idx <= 8'd0;
                        // Reset candidates
                        for (i = 0; i < K; i = i + 1) begin
                            candidates_idx[i] <= 8'd0;
                            candidates_dist[i] <= 6'd63;
                        end
                    end
                end

                SCAN: begin
                    // Compute distance for current entry
                    xor_result = query ^ entries[scan_idx];
                    current_dist = popcount(xor_result);

                    // Insert into sorted candidate list if closer
                    if (current_dist < candidates_dist[K-1]) begin
                        // Find insertion point
                        candidates_idx[K-1] <= scan_idx;
                        candidates_dist[K-1] <= current_dist;

                        // Bubble sort step (single iteration)
                        for (i = K-2; i >= 0; i = i - 1) begin
                            if (candidates_dist[i+1] < candidates_dist[i]) begin
                                // Swap
                                temp_dist = candidates_dist[i];
                                temp_idx = candidates_idx[i];
                                candidates_dist[i] <= candidates_dist[i+1];
                                candidates_idx[i] <= candidates_idx[i+1];
                                candidates_dist[i+1] <= temp_dist;
                                candidates_idx[i+1] <= temp_idx;
                            end
                        end
                    end

                    if (scan_idx == NUM_ENTRIES - 1) begin
                        state <= DONE;
                    end else begin
                        scan_idx <= scan_idx + 1;
                    end
                end

                DONE: begin
                    // Copy results
                    for (i = 0; i < K; i = i + 1) begin
                        knn_indices[i] <= candidates_idx[i];
                        knn_distances[i] <= candidates_dist[i];
                    end
                    done <= 1'b1;
                    state <= IDLE;
                end

                default: state <= IDLE;
            endcase
        end
    end

endmodule
