////////////////////////////////////////////////////////////////////////////////
// Module: zeckendorf_encoder
// Description: Converts integer tokens to Zeckendorf (φ-space) representation
//              using greedy algorithm with Fibonacci sequence lookup
//
// Key Properties:
//   - No adjacent 1s in output (canonical Zeckendorf form)
//   - Maps token → φ-ring address
//   - Deterministic latency (pipelined)
//   - Integer-only operations
////////////////////////////////////////////////////////////////////////////////

module zeckendorf_encoder #(
    parameter WIDTH = 32,              // Input token width
    parameter PHI_WIDTH = 48,          // φ-space address width (Fib indices)
    parameter PIPELINE_STAGES = 4      // Pipeline depth for timing closure
)(
    input  wire                  clk,
    input  wire                  rst_n,
    input  wire                  valid_in,
    input  wire [WIDTH-1:0]      token_in,       // Integer token to encode
    output reg                   valid_out,
    output reg  [PHI_WIDTH-1:0]  phi_addr_out,   // Zeckendorf bit pattern
    output reg  [5:0]            max_shell,      // Highest set bit index
    output reg                   parity,         // XOR of all bits (useful for attention)
    output reg                   ready           // Ready for next input
);

    // Fibonacci sequence lookup table (F_0 to F_47)
    // F_47 = 2971215073 fits in 32 bits
    reg [WIDTH-1:0] FIB_LUT [0:47];

    // Pipeline registers
    reg [WIDTH-1:0]     remainder [0:PIPELINE_STAGES-1];
    reg [PHI_WIDTH-1:0] result    [0:PIPELINE_STAGES-1];
    reg [5:0]           shell     [0:PIPELINE_STAGES-1];
    reg                 par       [0:PIPELINE_STAGES-1];
    reg                 valid_pipe[0:PIPELINE_STAGES-1];

    // Working variables
    integer i, j, stage;
    reg [5:0] current_idx;
    reg [WIDTH-1:0] current_rem;
    reg [PHI_WIDTH-1:0] current_result;

    // Initialize Fibonacci LUT
    initial begin
        FIB_LUT[0]  = 32'd1;
        FIB_LUT[1]  = 32'd1;
        FIB_LUT[2]  = 32'd2;
        FIB_LUT[3]  = 32'd3;
        FIB_LUT[4]  = 32'd5;
        FIB_LUT[5]  = 32'd8;
        FIB_LUT[6]  = 32'd13;
        FIB_LUT[7]  = 32'd21;
        FIB_LUT[8]  = 32'd34;
        FIB_LUT[9]  = 32'd55;
        FIB_LUT[10] = 32'd89;
        FIB_LUT[11] = 32'd144;
        FIB_LUT[12] = 32'd233;
        FIB_LUT[13] = 32'd377;
        FIB_LUT[14] = 32'd610;
        FIB_LUT[15] = 32'd987;
        FIB_LUT[16] = 32'd1597;
        FIB_LUT[17] = 32'd2584;
        FIB_LUT[18] = 32'd4181;
        FIB_LUT[19] = 32'd6765;
        FIB_LUT[20] = 32'd10946;
        FIB_LUT[21] = 32'd17711;
        FIB_LUT[22] = 32'd28657;
        FIB_LUT[23] = 32'd46368;
        FIB_LUT[24] = 32'd75025;
        FIB_LUT[25] = 32'd121393;
        FIB_LUT[26] = 32'd196418;
        FIB_LUT[27] = 32'd317811;
        FIB_LUT[28] = 32'd514229;
        FIB_LUT[29] = 32'd832040;
        FIB_LUT[30] = 32'd1346269;
        FIB_LUT[31] = 32'd2178309;
        FIB_LUT[32] = 32'd3524578;
        FIB_LUT[33] = 32'd5702887;
        FIB_LUT[34] = 32'd9227465;
        FIB_LUT[35] = 32'd14930352;
        FIB_LUT[36] = 32'd24157817;
        FIB_LUT[37] = 32'd39088169;
        FIB_LUT[38] = 32'd63245986;
        FIB_LUT[39] = 32'd102334155;
        FIB_LUT[40] = 32'd165580141;
        FIB_LUT[41] = 32'd267914296;
        FIB_LUT[42] = 32'd433494437;
        FIB_LUT[43] = 32'd701408733;
        FIB_LUT[44] = 32'd1134903170;
        FIB_LUT[45] = 32'd1836311903;
        FIB_LUT[46] = 32'd2971215073;
        FIB_LUT[47] = 32'd4294967295; // Saturate for overflow protection
    end

    // Find largest Fibonacci index <= value (combinational)
    function [5:0] find_fib_index;
        input [WIDTH-1:0] value;
        integer k;
        begin
            find_fib_index = 0;
            for (k = 46; k >= 0; k = k - 1) begin
                if (FIB_LUT[k] <= value && find_fib_index == 0) begin
                    find_fib_index = k[5:0];
                end
            end
        end
    endfunction

    // Main encoding pipeline
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            valid_out <= 1'b0;
            phi_addr_out <= {PHI_WIDTH{1'b0}};
            max_shell <= 6'd0;
            parity <= 1'b0;
            ready <= 1'b1;

            for (i = 0; i < PIPELINE_STAGES; i = i + 1) begin
                remainder[i] <= {WIDTH{1'b0}};
                result[i] <= {PHI_WIDTH{1'b0}};
                shell[i] <= 6'd0;
                par[i] <= 1'b0;
                valid_pipe[i] <= 1'b0;
            end
        end else begin
            // Stage 0: Input registration and initial index finding
            if (valid_in && ready) begin
                remainder[0] <= token_in;
                result[0] <= {PHI_WIDTH{1'b0}};
                shell[0] <= find_fib_index(token_in);
                par[0] <= 1'b0;
                valid_pipe[0] <= 1'b1;
            end else begin
                valid_pipe[0] <= 1'b0;
            end

            // Stages 1 to N-1: Iterative Zeckendorf conversion
            // Each stage processes multiple Fibonacci indices
            for (stage = 1; stage < PIPELINE_STAGES; stage = stage + 1) begin
                if (valid_pipe[stage-1]) begin
                    current_rem = remainder[stage-1];
                    current_result = result[stage-1];
                    current_idx = shell[stage-1];

                    // Process 12 indices per stage (48/4 = 12)
                    for (j = 0; j < 12; j = j + 1) begin
                        if (current_idx > 0 && current_rem > 0) begin
                            if (current_rem >= FIB_LUT[current_idx]) begin
                                current_result[current_idx] = 1'b1;
                                current_rem = current_rem - FIB_LUT[current_idx];
                                // Skip adjacent index (Zeckendorf property)
                                current_idx = (current_idx > 1) ? current_idx - 2 : 0;
                            end else begin
                                current_idx = current_idx - 1;
                            end
                        end
                    end

                    remainder[stage] <= current_rem;
                    result[stage] <= current_result;
                    shell[stage] <= current_idx;
                    par[stage] <= ^current_result; // Running parity
                    valid_pipe[stage] <= 1'b1;
                end else begin
                    valid_pipe[stage] <= 1'b0;
                end
            end

            // Output stage
            valid_out <= valid_pipe[PIPELINE_STAGES-1];
            if (valid_pipe[PIPELINE_STAGES-1]) begin
                phi_addr_out <= result[PIPELINE_STAGES-1];
                // Find actual max shell (highest set bit)
                max_shell <= 6'd0;
                for (i = PHI_WIDTH-1; i >= 0; i = i - 1) begin
                    if (result[PIPELINE_STAGES-1][i] && max_shell == 0) begin
                        max_shell <= i[5:0];
                    end
                end
                parity <= ^result[PIPELINE_STAGES-1];
            end

            // Ready signal (simple backpressure)
            ready <= 1'b1; // Fully pipelined, always ready
        end
    end

endmodule


////////////////////////////////////////////////////////////////////////////////
// Module: zeckendorf_decoder
// Description: Converts Zeckendorf representation back to integer
//              addr = Σ F_i where bit i is set
////////////////////////////////////////////////////////////////////////////////

module zeckendorf_decoder #(
    parameter WIDTH = 32,
    parameter PHI_WIDTH = 48
)(
    input  wire                  clk,
    input  wire                  rst_n,
    input  wire                  valid_in,
    input  wire [PHI_WIDTH-1:0]  phi_addr_in,
    output reg                   valid_out,
    output reg  [WIDTH-1:0]      token_out
);

    // Fibonacci LUT (same as encoder)
    reg [WIDTH-1:0] FIB_LUT [0:47];

    // Pipeline for accumulation
    reg [WIDTH-1:0] sum_stage [0:3];
    reg valid_stage [0:3];
    reg [PHI_WIDTH-1:0] addr_stage [0:3];

    integer i;
    reg [WIDTH-1:0] partial_sum;

    // Initialize Fibonacci LUT
    initial begin
        FIB_LUT[0]  = 32'd1;      FIB_LUT[1]  = 32'd1;
        FIB_LUT[2]  = 32'd2;      FIB_LUT[3]  = 32'd3;
        FIB_LUT[4]  = 32'd5;      FIB_LUT[5]  = 32'd8;
        FIB_LUT[6]  = 32'd13;     FIB_LUT[7]  = 32'd21;
        FIB_LUT[8]  = 32'd34;     FIB_LUT[9]  = 32'd55;
        FIB_LUT[10] = 32'd89;     FIB_LUT[11] = 32'd144;
        FIB_LUT[12] = 32'd233;    FIB_LUT[13] = 32'd377;
        FIB_LUT[14] = 32'd610;    FIB_LUT[15] = 32'd987;
        FIB_LUT[16] = 32'd1597;   FIB_LUT[17] = 32'd2584;
        FIB_LUT[18] = 32'd4181;   FIB_LUT[19] = 32'd6765;
        FIB_LUT[20] = 32'd10946;  FIB_LUT[21] = 32'd17711;
        FIB_LUT[22] = 32'd28657;  FIB_LUT[23] = 32'd46368;
        FIB_LUT[24] = 32'd75025;  FIB_LUT[25] = 32'd121393;
        FIB_LUT[26] = 32'd196418; FIB_LUT[27] = 32'd317811;
        FIB_LUT[28] = 32'd514229; FIB_LUT[29] = 32'd832040;
        FIB_LUT[30] = 32'd1346269; FIB_LUT[31] = 32'd2178309;
        FIB_LUT[32] = 32'd3524578; FIB_LUT[33] = 32'd5702887;
        FIB_LUT[34] = 32'd9227465; FIB_LUT[35] = 32'd14930352;
        FIB_LUT[36] = 32'd24157817; FIB_LUT[37] = 32'd39088169;
        FIB_LUT[38] = 32'd63245986; FIB_LUT[39] = 32'd102334155;
        FIB_LUT[40] = 32'd165580141; FIB_LUT[41] = 32'd267914296;
        FIB_LUT[42] = 32'd433494437; FIB_LUT[43] = 32'd701408733;
        FIB_LUT[44] = 32'd1134903170; FIB_LUT[45] = 32'd1836311903;
        FIB_LUT[46] = 32'd2971215073; FIB_LUT[47] = 32'd4294967295;
    end

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            valid_out <= 1'b0;
            token_out <= {WIDTH{1'b0}};
            for (i = 0; i < 4; i = i + 1) begin
                sum_stage[i] <= {WIDTH{1'b0}};
                valid_stage[i] <= 1'b0;
                addr_stage[i] <= {PHI_WIDTH{1'b0}};
            end
        end else begin
            // Stage 0: Process bits 0-11
            valid_stage[0] <= valid_in;
            addr_stage[0] <= phi_addr_in;
            partial_sum = {WIDTH{1'b0}};
            for (i = 0; i < 12; i = i + 1) begin
                if (phi_addr_in[i]) partial_sum = partial_sum + FIB_LUT[i];
            end
            sum_stage[0] <= partial_sum;

            // Stage 1: Process bits 12-23
            valid_stage[1] <= valid_stage[0];
            addr_stage[1] <= addr_stage[0];
            partial_sum = sum_stage[0];
            for (i = 12; i < 24; i = i + 1) begin
                if (addr_stage[0][i]) partial_sum = partial_sum + FIB_LUT[i];
            end
            sum_stage[1] <= partial_sum;

            // Stage 2: Process bits 24-35
            valid_stage[2] <= valid_stage[1];
            addr_stage[2] <= addr_stage[1];
            partial_sum = sum_stage[1];
            for (i = 24; i < 36; i = i + 1) begin
                if (addr_stage[1][i]) partial_sum = partial_sum + FIB_LUT[i];
            end
            sum_stage[2] <= partial_sum;

            // Stage 3: Process bits 36-47 and output
            valid_stage[3] <= valid_stage[2];
            partial_sum = sum_stage[2];
            for (i = 36; i < 48; i = i + 1) begin
                if (addr_stage[2][i]) partial_sum = partial_sum + FIB_LUT[i];
            end
            sum_stage[3] <= partial_sum;

            // Output
            valid_out <= valid_stage[3];
            token_out <= sum_stage[3];
        end
    end

endmodule
