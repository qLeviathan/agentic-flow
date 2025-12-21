////////////////////////////////////////////////////////////////////////////////
// Module: reverse_lookup
// Description: Reverse lookup from φ-space context to nearest token
//              context → token (for generation/recall mode)
//
// Algorithm:
//   1. Compare query context against all vocabulary entries
//   2. Use XOR + popcount for shell distance
//   3. Return token with minimum distance
//
// This is the BACKWARD pass - recall from accumulated context
////////////////////////////////////////////////////////////////////////////////

module reverse_lookup #(
    parameter PHI_WIDTH = 48,
    parameter VOCAB_SIZE = 4096,       // Vocabulary size (power of 2)
    parameter TOKEN_WIDTH = 12,        // log2(VOCAB_SIZE)
    parameter PARALLEL_COMPARATORS = 16 // Parallel distance computations
)(
    input  wire                        clk,
    input  wire                        rst_n,
    input  wire                        start,
    input  wire [PHI_WIDTH-1:0]        query_context,    // Context to look up
    // Vocabulary interface (external memory or BRAM)
    output reg  [TOKEN_WIDTH-1:0]      vocab_addr,
    input  wire [PHI_WIDTH-1:0]        vocab_data,       // φ-space repr of token
    // Results
    output reg                         done,
    output reg  [TOKEN_WIDTH-1:0]      best_token,
    output reg  [5:0]                  best_distance,
    output reg  [TOKEN_WIDTH-1:0]      second_token,     // For beam search
    output reg  [5:0]                  second_distance
);

    // State machine
    localparam IDLE = 3'b000;
    localparam FETCH = 3'b001;
    localparam COMPARE = 3'b010;
    localparam UPDATE = 3'b011;
    localparam FINISH = 3'b100;

    reg [2:0] state;
    reg [TOKEN_WIDTH-1:0] scan_idx;
    reg [PHI_WIDTH-1:0] query_reg;

    // Best candidates
    reg [TOKEN_WIDTH-1:0] best_idx;
    reg [5:0] best_dist;
    reg [TOKEN_WIDTH-1:0] second_idx;
    reg [5:0] second_dist;

    // Distance computation
    wire [PHI_WIDTH-1:0] xor_result;
    reg [5:0] current_dist;

    assign xor_result = query_reg ^ vocab_data;

    // Popcount function
    function [5:0] popcount;
        input [PHI_WIDTH-1:0] data;
        integer i;
        reg [5:0] count;
        begin
            count = 6'd0;
            for (i = 0; i < PHI_WIDTH; i = i + 1) begin
                count = count + {5'b0, data[i]};
            end
            popcount = count;
        end
    endfunction

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            state <= IDLE;
            done <= 1'b0;
            best_token <= {TOKEN_WIDTH{1'b0}};
            best_distance <= 6'd63;
            second_token <= {TOKEN_WIDTH{1'b0}};
            second_distance <= 6'd63;
            vocab_addr <= {TOKEN_WIDTH{1'b0}};
            scan_idx <= {TOKEN_WIDTH{1'b0}};
            query_reg <= {PHI_WIDTH{1'b0}};
            best_idx <= {TOKEN_WIDTH{1'b0}};
            best_dist <= 6'd63;
            second_idx <= {TOKEN_WIDTH{1'b0}};
            second_dist <= 6'd63;
        end else begin
            case (state)
                IDLE: begin
                    done <= 1'b0;
                    if (start) begin
                        query_reg <= query_context;
                        scan_idx <= {TOKEN_WIDTH{1'b0}};
                        best_dist <= 6'd63;  // Maximum distance
                        second_dist <= 6'd63;
                        vocab_addr <= {TOKEN_WIDTH{1'b0}};
                        state <= FETCH;
                    end
                end

                FETCH: begin
                    // Request vocabulary entry
                    vocab_addr <= scan_idx;
                    state <= COMPARE;
                end

                COMPARE: begin
                    // Compute distance (1 cycle latency for memory read)
                    current_dist = popcount(xor_result);
                    state <= UPDATE;
                end

                UPDATE: begin
                    // Update best candidates
                    if (current_dist < best_dist) begin
                        // New best - demote current best to second
                        second_idx <= best_idx;
                        second_dist <= best_dist;
                        best_idx <= scan_idx;
                        best_dist <= current_dist;
                    end else if (current_dist < second_dist) begin
                        // New second best
                        second_idx <= scan_idx;
                        second_dist <= current_dist;
                    end

                    // Check if done
                    if (scan_idx == VOCAB_SIZE - 1) begin
                        state <= FINISH;
                    end else begin
                        scan_idx <= scan_idx + 1;
                        state <= FETCH;
                    end
                end

                FINISH: begin
                    best_token <= best_idx;
                    best_distance <= best_dist;
                    second_token <= second_idx;
                    second_distance <= second_dist;
                    done <= 1'b1;
                    state <= IDLE;
                end

                default: state <= IDLE;
            endcase
        end
    end

endmodule


////////////////////////////////////////////////////////////////////////////////
// Module: reverse_lookup_parallel
// Description: Parallel reverse lookup with PARALLEL_COMPARATORS concurrent
//              distance computations for higher throughput
////////////////////////////////////////////////////////////////////////////////

module reverse_lookup_parallel #(
    parameter PHI_WIDTH = 48,
    parameter VOCAB_SIZE = 4096,
    parameter TOKEN_WIDTH = 12,
    parameter PARALLEL = 16
)(
    input  wire                        clk,
    input  wire                        rst_n,
    input  wire                        start,
    input  wire [PHI_WIDTH-1:0]        query_context,
    // Parallel vocabulary interface
    output reg  [TOKEN_WIDTH-1:0]      vocab_addr_base,
    input  wire [PHI_WIDTH-1:0]        vocab_data [0:PARALLEL-1],
    // Results
    output reg                         done,
    output reg  [TOKEN_WIDTH-1:0]      best_token,
    output reg  [5:0]                  best_distance
);

    localparam CHUNKS = VOCAB_SIZE / PARALLEL;

    reg [2:0] state;
    localparam IDLE = 3'b000;
    localparam FETCH = 3'b001;
    localparam COMPARE = 3'b010;
    localparam REDUCE = 3'b011;
    localparam FINISH = 3'b100;

    reg [TOKEN_WIDTH-1:0] chunk_idx;
    reg [PHI_WIDTH-1:0] query_reg;

    // Parallel distance results
    reg [5:0] distances [0:PARALLEL-1];
    reg [TOKEN_WIDTH-1:0] global_best_idx;
    reg [5:0] global_best_dist;

    // Local best in current chunk
    reg [3:0] local_best_slot;
    reg [5:0] local_best_dist;

    integer i;

    // Popcount function
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
            state <= IDLE;
            done <= 1'b0;
            best_token <= {TOKEN_WIDTH{1'b0}};
            best_distance <= 6'd63;
            vocab_addr_base <= {TOKEN_WIDTH{1'b0}};
            chunk_idx <= {TOKEN_WIDTH{1'b0}};
            query_reg <= {PHI_WIDTH{1'b0}};
            global_best_idx <= {TOKEN_WIDTH{1'b0}};
            global_best_dist <= 6'd63;

            for (i = 0; i < PARALLEL; i = i + 1) begin
                distances[i] <= 6'd63;
            end
        end else begin
            case (state)
                IDLE: begin
                    done <= 1'b0;
                    if (start) begin
                        query_reg <= query_context;
                        chunk_idx <= {TOKEN_WIDTH{1'b0}};
                        global_best_dist <= 6'd63;
                        vocab_addr_base <= {TOKEN_WIDTH{1'b0}};
                        state <= FETCH;
                    end
                end

                FETCH: begin
                    vocab_addr_base <= chunk_idx * PARALLEL;
                    state <= COMPARE;
                end

                COMPARE: begin
                    // Compute all distances in parallel
                    for (i = 0; i < PARALLEL; i = i + 1) begin
                        distances[i] <= popcount(query_reg ^ vocab_data[i]);
                    end
                    state <= REDUCE;
                end

                REDUCE: begin
                    // Find local minimum
                    local_best_slot = 4'd0;
                    local_best_dist = distances[0];

                    for (i = 1; i < PARALLEL; i = i + 1) begin
                        if (distances[i] < local_best_dist) begin
                            local_best_dist = distances[i];
                            local_best_slot = i[3:0];
                        end
                    end

                    // Update global best
                    if (local_best_dist < global_best_dist) begin
                        global_best_dist <= local_best_dist;
                        global_best_idx <= chunk_idx * PARALLEL + {8'b0, local_best_slot};
                    end

                    // Next chunk or finish
                    if (chunk_idx == CHUNKS - 1) begin
                        state <= FINISH;
                    end else begin
                        chunk_idx <= chunk_idx + 1;
                        state <= FETCH;
                    end
                end

                FINISH: begin
                    best_token <= global_best_idx;
                    best_distance <= global_best_dist;
                    done <= 1'b1;
                    state <= IDLE;
                end

                default: state <= IDLE;
            endcase
        end
    end

endmodule


////////////////////////////////////////////////////////////////////////////////
// Module: vocab_memory
// Description: Vocabulary memory storing token → φ-space mappings
//              Dual-port BRAM for parallel access
////////////////////////////////////////////////////////////////////////////////

module vocab_memory #(
    parameter PHI_WIDTH = 48,
    parameter VOCAB_SIZE = 4096,
    parameter TOKEN_WIDTH = 12
)(
    input  wire                        clk,
    // Port A: Write/Update
    input  wire                        we_a,
    input  wire [TOKEN_WIDTH-1:0]      addr_a,
    input  wire [PHI_WIDTH-1:0]        din_a,
    output reg  [PHI_WIDTH-1:0]        dout_a,
    // Port B: Read-only
    input  wire [TOKEN_WIDTH-1:0]      addr_b,
    output reg  [PHI_WIDTH-1:0]        dout_b
);

    // BRAM storage
    (* ram_style = "block" *)
    reg [PHI_WIDTH-1:0] memory [0:VOCAB_SIZE-1];

    // Initialize with test patterns (in practice, loaded from file)
    integer i;
    initial begin
        for (i = 0; i < VOCAB_SIZE; i = i + 1) begin
            // Simple pattern: token ID encoded as Zeckendorf
            // In practice, this would be meaningful embeddings
            memory[i] = {PHI_WIDTH{1'b0}};
            memory[i][i % PHI_WIDTH] = 1'b1;
        end
    end

    // Port A
    always @(posedge clk) begin
        if (we_a) begin
            memory[addr_a] <= din_a;
        end
        dout_a <= memory[addr_a];
    end

    // Port B
    always @(posedge clk) begin
        dout_b <= memory[addr_b];
    end

endmodule
