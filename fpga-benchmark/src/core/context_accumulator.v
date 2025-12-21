////////////////////////////////////////////////////////////////////////////////
// Module: context_accumulator
// Description: Accumulates tokens into φ-space context representation
//
// COMPREHENSION MODE (Forward):
//   - Stream of input tokens
//   - Each ORs into context
//   - Cascade after each
//   - No output until "query" signal
//   - Final equilibrium = sentence meaning
//
// RECALL MODE (Backward):
//   - Take current context
//   - Reverse lookup → nearest token
//   - That's the "answer" or "next token"
////////////////////////////////////////////////////////////////////////////////

module context_accumulator #(
    parameter PHI_WIDTH = 48,
    parameter CONTEXT_DEPTH = 16,      // History depth for weighted union
    parameter WEIGHT_BITS = 8          // Fibonacci weight precision
)(
    input  wire                       clk,
    input  wire                       rst_n,
    input  wire                       mode,          // 0=comprehend, 1=recall
    input  wire                       valid_in,
    input  wire [PHI_WIDTH-1:0]       token_phi,     // Token in φ-space
    input  wire                       query,         // Trigger output in comprehend mode
    input  wire                       clear,         // Clear context
    output reg                        valid_out,
    output reg  [PHI_WIDTH-1:0]       context_out,   // Current context state
    output reg  [5:0]                 max_shell,     // Highest active shell
    output reg                        parity,        // Context parity
    output reg  [3:0]                 depth          // Number of accumulated tokens
);

    localparam MODE_COMPREHEND = 1'b0;
    localparam MODE_RECALL = 1'b1;

    // Context state register
    reg [PHI_WIDTH-1:0] context_state;
    reg [PHI_WIDTH-1:0] context_history [0:CONTEXT_DEPTH-1];
    reg [3:0] history_ptr;
    reg [3:0] token_count;

    // Fibonacci weights for history blending
    // Recent tokens get higher weight
    reg [WEIGHT_BITS-1:0] FIB_WEIGHTS [0:CONTEXT_DEPTH-1];

    // Cascade interface
    wire cascade_valid_out;
    wire [PHI_WIDTH-1:0] cascade_out;
    wire cascade_overflow;
    reg cascade_valid_in;
    reg [PHI_WIDTH-1:0] cascade_in;

    // Shell tracking
    reg [5:0] shell_tracker;

    integer i;
    reg [PHI_WIDTH-1:0] weighted_context;
    reg [PHI_WIDTH-1:0] merged_context;

    // Initialize Fibonacci weights (F_1 to F_16)
    initial begin
        FIB_WEIGHTS[0]  = 8'd1;    // Most recent
        FIB_WEIGHTS[1]  = 8'd1;
        FIB_WEIGHTS[2]  = 8'd2;
        FIB_WEIGHTS[3]  = 8'd3;
        FIB_WEIGHTS[4]  = 8'd5;
        FIB_WEIGHTS[5]  = 8'd8;
        FIB_WEIGHTS[6]  = 8'd13;
        FIB_WEIGHTS[7]  = 8'd21;
        FIB_WEIGHTS[8]  = 8'd34;
        FIB_WEIGHTS[9]  = 8'd55;
        FIB_WEIGHTS[10] = 8'd89;
        FIB_WEIGHTS[11] = 8'd144;
        FIB_WEIGHTS[12] = 8'd233;
        FIB_WEIGHTS[13] = 8'd255; // Saturate
        FIB_WEIGHTS[14] = 8'd255;
        FIB_WEIGHTS[15] = 8'd255;
    end

    // Find highest set bit
    function [5:0] find_max_shell;
        input [PHI_WIDTH-1:0] data;
        integer j;
        reg [5:0] result;
        begin
            result = 6'd0;
            for (j = PHI_WIDTH-1; j >= 0; j = j - 1) begin
                if (data[j] && result == 0) begin
                    result = j[5:0];
                end
            end
            find_max_shell = result;
        end
    endfunction

    // Cascade engine instantiation
    cascade_engine #(
        .PHI_WIDTH(PHI_WIDTH),
        .CASCADE_STAGES(6)
    ) cascade_inst (
        .clk(clk),
        .rst_n(rst_n),
        .valid_in(cascade_valid_in),
        .phi_in(cascade_in),
        .op_mode(3'b000), // NORMALIZE
        .valid_out(cascade_valid_out),
        .phi_out(cascade_out),
        .overflow(cascade_overflow),
        .iterations()
    );

    // State machine
    localparam ST_IDLE = 2'b00;
    localparam ST_MERGE = 2'b01;
    localparam ST_CASCADE = 2'b10;
    localparam ST_OUTPUT = 2'b11;

    reg [1:0] state;

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            context_state <= {PHI_WIDTH{1'b0}};
            valid_out <= 1'b0;
            context_out <= {PHI_WIDTH{1'b0}};
            max_shell <= 6'd0;
            parity <= 1'b0;
            depth <= 4'd0;
            history_ptr <= 4'd0;
            token_count <= 4'd0;
            cascade_valid_in <= 1'b0;
            cascade_in <= {PHI_WIDTH{1'b0}};
            state <= ST_IDLE;

            for (i = 0; i < CONTEXT_DEPTH; i = i + 1) begin
                context_history[i] <= {PHI_WIDTH{1'b0}};
            end
        end else begin
            // Default outputs
            valid_out <= 1'b0;
            cascade_valid_in <= 1'b0;

            if (clear) begin
                context_state <= {PHI_WIDTH{1'b0}};
                history_ptr <= 4'd0;
                token_count <= 4'd0;
                depth <= 4'd0;
                for (i = 0; i < CONTEXT_DEPTH; i = i + 1) begin
                    context_history[i] <= {PHI_WIDTH{1'b0}};
                end
                state <= ST_IDLE;
            end else begin
                case (state)
                    ST_IDLE: begin
                        if (valid_in && mode == MODE_COMPREHEND) begin
                            // Store in history
                            context_history[history_ptr] <= token_phi;
                            history_ptr <= (history_ptr + 1) & (CONTEXT_DEPTH - 1);
                            if (token_count < CONTEXT_DEPTH) begin
                                token_count <= token_count + 1;
                            end

                            // Merge: OR new token into context
                            merged_context = context_state | token_phi;
                            cascade_in <= merged_context;
                            cascade_valid_in <= 1'b1;
                            state <= ST_CASCADE;
                        end else if (query && mode == MODE_COMPREHEND) begin
                            // Output current context
                            valid_out <= 1'b1;
                            context_out <= context_state;
                            max_shell <= find_max_shell(context_state);
                            parity <= ^context_state;
                            depth <= token_count;
                        end else if (mode == MODE_RECALL) begin
                            // Recall mode: output for reverse lookup
                            valid_out <= 1'b1;
                            context_out <= context_state;
                            max_shell <= find_max_shell(context_state);
                            parity <= ^context_state;
                            depth <= token_count;
                        end
                    end

                    ST_CASCADE: begin
                        if (cascade_valid_out) begin
                            // Update context with normalized result
                            context_state <= cascade_out;
                            max_shell <= find_max_shell(cascade_out);
                            depth <= token_count;
                            state <= ST_IDLE;
                        end
                    end

                    default: state <= ST_IDLE;
                endcase
            end
        end
    end

endmodule


////////////////////////////////////////////////////////////////////////////////
// Module: context_shell_computer
// Description: Computes weighted union of context shells
//              Recent tokens get higher weight (Fibonacci weighting)
////////////////////////////////////////////////////////////////////////////////

module context_shell_computer #(
    parameter PHI_WIDTH = 48,
    parameter CONTEXT_DEPTH = 16
)(
    input  wire                       clk,
    input  wire                       rst_n,
    input  wire                       compute,
    input  wire [PHI_WIDTH-1:0]       context_history [0:CONTEXT_DEPTH-1],
    input  wire [3:0]                 history_count,
    output reg                        done,
    output reg  [PHI_WIDTH-1:0]       weighted_context,
    output reg  [5:0]                 active_shells    // Bitmap of active shell indices
);

    // Fibonacci weights for blending (higher index = less recent = lower weight)
    // But we want recent = higher weight, so invert index
    reg [7:0] FIB [0:15];

    integer i;
    reg [PHI_WIDTH-1:0] accumulator;
    reg [3:0] process_idx;
    reg computing;
    reg [PHI_WIDTH-1:0] weighted_entry;

    initial begin
        FIB[0]  = 8'd144; // Most recent gets highest weight
        FIB[1]  = 8'd89;
        FIB[2]  = 8'd55;
        FIB[3]  = 8'd34;
        FIB[4]  = 8'd21;
        FIB[5]  = 8'd13;
        FIB[6]  = 8'd8;
        FIB[7]  = 8'd5;
        FIB[8]  = 8'd3;
        FIB[9]  = 8'd2;
        FIB[10] = 8'd1;
        FIB[11] = 8'd1;
        FIB[12] = 8'd1;
        FIB[13] = 8'd1;
        FIB[14] = 8'd1;
        FIB[15] = 8'd1;
    end

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            done <= 1'b0;
            weighted_context <= {PHI_WIDTH{1'b0}};
            active_shells <= 6'd0;
            accumulator <= {PHI_WIDTH{1'b0}};
            process_idx <= 4'd0;
            computing <= 1'b0;
        end else begin
            done <= 1'b0;

            if (compute && !computing) begin
                computing <= 1'b1;
                accumulator <= {PHI_WIDTH{1'b0}};
                process_idx <= 4'd0;
            end else if (computing) begin
                if (process_idx < history_count) begin
                    // Weighted OR: include bits based on weight threshold
                    // Simple approach: OR all, but track shell activity
                    accumulator <= accumulator | context_history[process_idx];
                    process_idx <= process_idx + 1;
                end else begin
                    // Done computing
                    weighted_context <= accumulator;

                    // Count active shells (count set bits in 6 shell ranges)
                    active_shells <= 6'd0;
                    for (i = 0; i < 6; i = i + 1) begin
                        if (|accumulator[i*8 +: 8]) begin
                            active_shells[i] <= 1'b1;
                        end
                    end

                    done <= 1'b1;
                    computing <= 1'b0;
                end
            end
        end
    end

endmodule
