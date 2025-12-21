////////////////////////////////////////////////////////////////////////////////
// Module: phi_space_processor
// Description: Top-level module integrating all φ-space computation components
//
// Architecture Components:
//   - Input buffer (tokens coming in)
//   - Zeckendorf encoder (token → address)
//   - Cascade engine (physical, unrolled, deterministic latency)
//   - Address space for tokens (LUT-based vocab)
//   - Storage unit (accumulated context)
//   - Reverse lookup (context → nearest token)
//   - Hyperbolic routing (access pattern → shell partition)
//   - Output buffer (generation)
//   - Audit logger (every bit operation logged)
//
// Two Modes:
//   MODE 1: COMPREHENSION (FORWARD) - tokens → cascade → accumulate
//   MODE 2: RECALL (BACKWARD) - context → reverse lookup → token
////////////////////////////////////////////////////////////////////////////////

module phi_space_processor #(
    parameter WIDTH = 32,              // Token integer width
    parameter PHI_WIDTH = 48,          // φ-space address width
    parameter VOCAB_SIZE = 4096,       // Vocabulary size
    parameter TOKEN_WIDTH = 12,        // log2(VOCAB_SIZE)
    parameter CONTEXT_DEPTH = 16,      // History depth
    parameter NUM_PARTITIONS = 8       // Memory partitions
)(
    input  wire                        clk,
    input  wire                        rst_n,

    // Control interface
    input  wire                        mode,             // 0=comprehend, 1=recall
    input  wire                        start,            // Start processing
    input  wire                        query,            // Trigger output in comprehend mode
    input  wire                        clear_context,    // Reset context

    // Token input (comprehension mode)
    input  wire                        token_valid,
    input  wire [WIDTH-1:0]            token_in,

    // Token output (recall mode)
    output wire                        token_out_valid,
    output wire [TOKEN_WIDTH-1:0]      token_out,
    output wire [5:0]                  token_distance,

    // Context output
    output wire                        context_valid,
    output wire [PHI_WIDTH-1:0]        context_out,
    output wire [5:0]                  context_max_shell,
    output wire                        context_parity,
    output wire [3:0]                  context_depth,

    // Status
    output wire                        ready,
    output wire                        busy,

    // Audit interface
    output wire                        audit_valid,
    output wire [7:0]                  audit_op_code,
    output wire [PHI_WIDTH-1:0]        audit_operand_a,
    output wire [PHI_WIDTH-1:0]        audit_operand_b,
    output wire [PHI_WIDTH-1:0]        audit_result
);

    // =========================================================================
    // Internal Signals
    // =========================================================================

    // Encoder signals
    wire                        encoder_valid_out;
    wire [PHI_WIDTH-1:0]        encoder_phi_addr;
    wire [5:0]                  encoder_max_shell;
    wire                        encoder_parity;
    wire                        encoder_ready;

    // Cascade signals
    wire                        cascade_valid_out;
    wire [PHI_WIDTH-1:0]        cascade_phi_out;
    wire                        cascade_overflow;

    // Context accumulator signals
    wire                        accum_valid_out;
    wire [PHI_WIDTH-1:0]        accum_context;
    wire [5:0]                  accum_max_shell;
    wire                        accum_parity;
    wire [3:0]                  accum_depth;

    // Router signals
    wire                        router_valid_out;
    wire [2:0]                  router_partition;
    wire [PHI_WIDTH-1:0]        router_local_addr;
    wire [2:0]                  router_shell_zone;

    // Reverse lookup signals
    wire                        lookup_done;
    wire [TOKEN_WIDTH-1:0]      lookup_best_token;
    wire [5:0]                  lookup_best_distance;

    // Vocabulary memory signals
    wire [TOKEN_WIDTH-1:0]      vocab_read_addr;
    wire [PHI_WIDTH-1:0]        vocab_read_data;

    // State machine
    localparam ST_IDLE       = 4'd0;
    localparam ST_ENCODE     = 4'd1;
    localparam ST_ROUTE      = 4'd2;
    localparam ST_ACCUMULATE = 4'd3;
    localparam ST_LOOKUP     = 4'd4;
    localparam ST_OUTPUT     = 4'd5;

    reg [3:0] state;
    reg processing;
    reg recall_mode;

    // Audit logging
    reg audit_log_valid;
    reg [7:0] audit_log_op;
    reg [PHI_WIDTH-1:0] audit_log_a;
    reg [PHI_WIDTH-1:0] audit_log_b;
    reg [PHI_WIDTH-1:0] audit_log_result;

    // Output registers
    reg token_out_valid_reg;
    reg [TOKEN_WIDTH-1:0] token_out_reg;
    reg [5:0] token_distance_reg;
    reg context_valid_reg;
    reg [PHI_WIDTH-1:0] context_out_reg;
    reg [5:0] context_max_shell_reg;
    reg context_parity_reg;
    reg [3:0] context_depth_reg;

    // =========================================================================
    // Module Instantiations
    // =========================================================================

    // Zeckendorf Encoder: token → φ-space address
    zeckendorf_encoder #(
        .WIDTH(WIDTH),
        .PHI_WIDTH(PHI_WIDTH),
        .PIPELINE_STAGES(4)
    ) encoder_inst (
        .clk(clk),
        .rst_n(rst_n),
        .valid_in(token_valid && state == ST_ENCODE),
        .token_in(token_in),
        .valid_out(encoder_valid_out),
        .phi_addr_out(encoder_phi_addr),
        .max_shell(encoder_max_shell),
        .parity(encoder_parity),
        .ready(encoder_ready)
    );

    // Cascade Engine: normalize φ-space representations
    cascade_engine #(
        .PHI_WIDTH(PHI_WIDTH),
        .CASCADE_STAGES(6)
    ) cascade_inst (
        .clk(clk),
        .rst_n(rst_n),
        .valid_in(encoder_valid_out),
        .phi_in(encoder_phi_addr),
        .op_mode(3'b000), // NORMALIZE
        .valid_out(cascade_valid_out),
        .phi_out(cascade_phi_out),
        .overflow(cascade_overflow),
        .iterations()
    );

    // Hyperbolic Router: route to appropriate memory partition
    hyperbolic_router #(
        .PHI_WIDTH(PHI_WIDTH),
        .NUM_PARTITIONS(NUM_PARTITIONS),
        .PARTITION_BITS(3)
    ) router_inst (
        .clk(clk),
        .rst_n(rst_n),
        .valid_in(cascade_valid_out),
        .phi_addr(cascade_phi_out),
        .max_shell(encoder_max_shell),
        .parity(encoder_parity),
        .valid_out(router_valid_out),
        .partition(router_partition),
        .local_addr(router_local_addr),
        .shell_zone(router_shell_zone)
    );

    // Context Accumulator: build up context from tokens
    context_accumulator #(
        .PHI_WIDTH(PHI_WIDTH),
        .CONTEXT_DEPTH(CONTEXT_DEPTH),
        .WEIGHT_BITS(8)
    ) accum_inst (
        .clk(clk),
        .rst_n(rst_n),
        .mode(mode),
        .valid_in(router_valid_out && !mode), // Only in comprehend mode
        .token_phi(router_local_addr),
        .query(query),
        .clear(clear_context),
        .valid_out(accum_valid_out),
        .context_out(accum_context),
        .max_shell(accum_max_shell),
        .parity(accum_parity),
        .depth(accum_depth)
    );

    // Vocabulary Memory
    vocab_memory #(
        .PHI_WIDTH(PHI_WIDTH),
        .VOCAB_SIZE(VOCAB_SIZE),
        .TOKEN_WIDTH(TOKEN_WIDTH)
    ) vocab_inst (
        .clk(clk),
        .we_a(1'b0),
        .addr_a({TOKEN_WIDTH{1'b0}}),
        .din_a({PHI_WIDTH{1'b0}}),
        .dout_a(),
        .addr_b(vocab_read_addr),
        .dout_b(vocab_read_data)
    );

    // Reverse Lookup: context → nearest token
    reverse_lookup #(
        .PHI_WIDTH(PHI_WIDTH),
        .VOCAB_SIZE(VOCAB_SIZE),
        .TOKEN_WIDTH(TOKEN_WIDTH),
        .PARALLEL_COMPARATORS(16)
    ) lookup_inst (
        .clk(clk),
        .rst_n(rst_n),
        .start(mode && start), // Only in recall mode
        .query_context(accum_context),
        .vocab_addr(vocab_read_addr),
        .vocab_data(vocab_read_data),
        .done(lookup_done),
        .best_token(lookup_best_token),
        .best_distance(lookup_best_distance),
        .second_token(),
        .second_distance()
    );

    // =========================================================================
    // State Machine
    // =========================================================================

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            state <= ST_IDLE;
            processing <= 1'b0;
            recall_mode <= 1'b0;
            token_out_valid_reg <= 1'b0;
            token_out_reg <= {TOKEN_WIDTH{1'b0}};
            token_distance_reg <= 6'd0;
            context_valid_reg <= 1'b0;
            context_out_reg <= {PHI_WIDTH{1'b0}};
            context_max_shell_reg <= 6'd0;
            context_parity_reg <= 1'b0;
            context_depth_reg <= 4'd0;

            // Audit
            audit_log_valid <= 1'b0;
            audit_log_op <= 8'd0;
            audit_log_a <= {PHI_WIDTH{1'b0}};
            audit_log_b <= {PHI_WIDTH{1'b0}};
            audit_log_result <= {PHI_WIDTH{1'b0}};
        end else begin
            // Default: clear single-cycle outputs
            token_out_valid_reg <= 1'b0;
            context_valid_reg <= 1'b0;
            audit_log_valid <= 1'b0;

            case (state)
                ST_IDLE: begin
                    processing <= 1'b0;
                    if (start) begin
                        recall_mode <= mode;
                        if (mode) begin
                            // Recall mode: start reverse lookup
                            state <= ST_LOOKUP;
                            processing <= 1'b1;

                            // Audit: start recall
                            audit_log_valid <= 1'b1;
                            audit_log_op <= 8'h10; // RECALL_START
                            audit_log_a <= accum_context;
                        end else begin
                            // Comprehend mode: wait for tokens
                            state <= ST_ENCODE;
                        end
                    end else if (token_valid && !mode) begin
                        // Token arriving in comprehend mode
                        state <= ST_ENCODE;
                        processing <= 1'b1;

                        // Audit: token input
                        audit_log_valid <= 1'b1;
                        audit_log_op <= 8'h01; // TOKEN_IN
                        audit_log_a <= {{(PHI_WIDTH-WIDTH){1'b0}}, token_in};
                    end else if (query && !mode) begin
                        // Query in comprehend mode
                        context_valid_reg <= 1'b1;
                        context_out_reg <= accum_context;
                        context_max_shell_reg <= accum_max_shell;
                        context_parity_reg <= accum_parity;
                        context_depth_reg <= accum_depth;
                    end
                end

                ST_ENCODE: begin
                    // Wait for encoder to finish
                    if (encoder_valid_out) begin
                        state <= ST_ROUTE;

                        // Audit: encode complete
                        audit_log_valid <= 1'b1;
                        audit_log_op <= 8'h02; // ENCODE_DONE
                        audit_log_result <= encoder_phi_addr;
                    end
                end

                ST_ROUTE: begin
                    // Wait for router
                    if (router_valid_out) begin
                        state <= ST_ACCUMULATE;

                        // Audit: route complete
                        audit_log_valid <= 1'b1;
                        audit_log_op <= 8'h03; // ROUTE_DONE
                        audit_log_a <= router_local_addr;
                        audit_log_b <= {{(PHI_WIDTH-3){1'b0}}, router_partition};
                    end
                end

                ST_ACCUMULATE: begin
                    // Wait for accumulator
                    if (accum_valid_out) begin
                        state <= ST_IDLE;
                        processing <= 1'b0;

                        // Output context if requested
                        context_valid_reg <= 1'b1;
                        context_out_reg <= accum_context;
                        context_max_shell_reg <= accum_max_shell;
                        context_parity_reg <= accum_parity;
                        context_depth_reg <= accum_depth;

                        // Audit: accumulate complete
                        audit_log_valid <= 1'b1;
                        audit_log_op <= 8'h04; // ACCUM_DONE
                        audit_log_result <= accum_context;
                    end
                end

                ST_LOOKUP: begin
                    // Wait for reverse lookup to complete
                    if (lookup_done) begin
                        state <= ST_OUTPUT;
                    end
                end

                ST_OUTPUT: begin
                    // Output lookup result
                    token_out_valid_reg <= 1'b1;
                    token_out_reg <= lookup_best_token;
                    token_distance_reg <= lookup_best_distance;

                    // Audit: recall complete
                    audit_log_valid <= 1'b1;
                    audit_log_op <= 8'h11; // RECALL_DONE
                    audit_log_a <= {{(PHI_WIDTH-TOKEN_WIDTH){1'b0}}, lookup_best_token};
                    audit_log_b <= {{(PHI_WIDTH-6){1'b0}}, lookup_best_distance};

                    state <= ST_IDLE;
                    processing <= 1'b0;
                end

                default: state <= ST_IDLE;
            endcase
        end
    end

    // =========================================================================
    // Output Assignments
    // =========================================================================

    assign token_out_valid = token_out_valid_reg;
    assign token_out = token_out_reg;
    assign token_distance = token_distance_reg;
    assign context_valid = context_valid_reg;
    assign context_out = context_out_reg;
    assign context_max_shell = context_max_shell_reg;
    assign context_parity = context_parity_reg;
    assign context_depth = context_depth_reg;

    assign ready = (state == ST_IDLE) && !processing;
    assign busy = processing;

    assign audit_valid = audit_log_valid;
    assign audit_op_code = audit_log_op;
    assign audit_operand_a = audit_log_a;
    assign audit_operand_b = audit_log_b;
    assign audit_result = audit_log_result;

endmodule
