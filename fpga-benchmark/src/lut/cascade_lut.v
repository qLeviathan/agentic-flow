////////////////////////////////////////////////////////////////////////////////
// Module: cascade_lut
// Description: Pre-computed cascade lookup tables for φ-space operations
//              In φ-space, there's no calculation - just LUT lookups
//
// Operations via LUT:
//   ADD: merge bits → CASCADE_LUT[a|b]
//   SUB: diff bits → CASCADE_LUT[a^b] + borrow handling
//   MUL_PHI: index + 1 → SHIFT_L_LUT[a]
//   DIV_PHI: index - 1 → SHIFT_R_LUT[a]
//   DISTANCE: XOR + popcount → POPCOUNT_LUT[a^b]
////////////////////////////////////////////////////////////////////////////////

module cascade_lut #(
    parameter LUT_WIDTH = 8,           // Input width for small LUTs
    parameter OUTPUT_WIDTH = 8         // Output width
)(
    input  wire                        clk,
    input  wire                        rst_n,
    // Cascade normalize lookup
    input  wire [LUT_WIDTH-1:0]        cascade_addr,
    output reg  [OUTPUT_WIDTH-1:0]     cascade_data,
    // Popcount lookup
    input  wire [LUT_WIDTH-1:0]        popcount_addr,
    output reg  [3:0]                  popcount_data,
    // Shift left (multiply by φ)
    input  wire [LUT_WIDTH-1:0]        shift_l_addr,
    output reg  [OUTPUT_WIDTH-1:0]     shift_l_data,
    // Shift right (divide by φ)
    input  wire [LUT_WIDTH-1:0]        shift_r_addr,
    output reg  [OUTPUT_WIDTH-1:0]     shift_r_data
);

    // CASCADE_LUT: normalizes 8-bit input to Zeckendorf form
    // Removes adjacent 1s by carrying up
    (* rom_style = "distributed" *)
    reg [OUTPUT_WIDTH-1:0] CASCADE_LUT [0:255];

    // POPCOUNT_LUT: counts set bits in 8-bit value
    (* rom_style = "distributed" *)
    reg [3:0] POPCOUNT_LUT [0:255];

    // SHIFT_L_LUT: left shift with cascade (multiply by φ)
    (* rom_style = "distributed" *)
    reg [OUTPUT_WIDTH-1:0] SHIFT_L_LUT [0:255];

    // SHIFT_R_LUT: right shift (divide by φ, floor)
    (* rom_style = "distributed" *)
    reg [OUTPUT_WIDTH-1:0] SHIFT_R_LUT [0:255];

    // Cascade normalization function
    function [7:0] normalize_cascade;
        input [7:0] value;
        reg [8:0] work;
        integer pass, k;
        begin
            work = {1'b0, value};
            // Multiple passes to ensure full normalization
            for (pass = 0; pass < 4; pass = pass + 1) begin
                for (k = 0; k < 7; k = k + 1) begin
                    if (work[k] && work[k+1]) begin
                        work[k] = 1'b0;
                        work[k+1] = 1'b0;
                        work[k+2] = work[k+2] | 1'b1;
                    end
                end
            end
            normalize_cascade = work[7:0];
        end
    endfunction

    // Popcount function for initialization
    function [3:0] count_bits;
        input [7:0] value;
        integer j;
        reg [3:0] count;
        begin
            count = 4'd0;
            for (j = 0; j < 8; j = j + 1) begin
                count = count + {3'b0, value[j]};
            end
            count_bits = count;
        end
    endfunction

    // Initialize LUTs
    integer i;
    initial begin
        for (i = 0; i < 256; i = i + 1) begin
            // Cascade LUT
            CASCADE_LUT[i] = normalize_cascade(i[7:0]);

            // Popcount LUT
            POPCOUNT_LUT[i] = count_bits(i[7:0]);

            // Shift left + cascade (multiply by φ)
            SHIFT_L_LUT[i] = normalize_cascade({i[6:0], 1'b0});

            // Shift right (divide by φ, with special handling)
            // In Zeckendorf, right shift needs care at bit 0
            SHIFT_R_LUT[i] = {1'b0, i[7:1]};
        end
    end

    // Synchronous LUT reads (for FPGA BRAM inference)
    always @(posedge clk) begin
        cascade_data <= CASCADE_LUT[cascade_addr];
        popcount_data <= POPCOUNT_LUT[popcount_addr];
        shift_l_data <= SHIFT_L_LUT[shift_l_addr];
        shift_r_data <= SHIFT_R_LUT[shift_r_addr];
    end

endmodule


////////////////////////////////////////////////////////////////////////////////
// Module: wide_cascade_lut
// Description: Cascaded LUT for wider inputs using 8-bit LUT building blocks
//              Processes 48-bit φ-addresses using 6 × 8-bit LUTs
////////////////////////////////////////////////////////////////////////////////

module wide_cascade_lut #(
    parameter PHI_WIDTH = 48
)(
    input  wire                        clk,
    input  wire                        rst_n,
    input  wire                        valid_in,
    input  wire [PHI_WIDTH-1:0]        phi_in,
    output reg                         valid_out,
    output reg  [PHI_WIDTH-1:0]        phi_out
);

    // Number of 8-bit chunks
    localparam NUM_CHUNKS = PHI_WIDTH / 8;

    // Chunk LUT instances
    wire [7:0] chunk_normalized [0:NUM_CHUNKS-1];
    reg [PHI_WIDTH-1:0] stage1_result;
    reg valid_stage1, valid_stage2;

    // LUT ROMs for each chunk (replicated for parallel access)
    (* rom_style = "distributed" *)
    reg [7:0] NORM_LUT [0:255];

    integer i, pass, k;
    reg [8:0] work;

    // Initialize normalization LUT
    initial begin
        for (i = 0; i < 256; i = i + 1) begin
            work = {1'b0, i[7:0]};
            for (pass = 0; pass < 4; pass = pass + 1) begin
                for (k = 0; k < 7; k = k + 1) begin
                    if (work[k] && work[k+1]) begin
                        work[k] = 1'b0;
                        work[k+1] = 1'b0;
                        work[k+2] = work[k+2] | 1'b1;
                    end
                end
            end
            NORM_LUT[i] = work[7:0];
        end
    end

    // Generate parallel chunk normalizers
    genvar g;
    generate
        for (g = 0; g < NUM_CHUNKS; g = g + 1) begin : chunk_norm
            assign chunk_normalized[g] = NORM_LUT[phi_in[g*8 +: 8]];
        end
    endgenerate

    // Pipeline: normalize chunks, then handle inter-chunk carries
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            valid_out <= 1'b0;
            phi_out <= {PHI_WIDTH{1'b0}};
            stage1_result <= {PHI_WIDTH{1'b0}};
            valid_stage1 <= 1'b0;
            valid_stage2 <= 1'b0;
        end else begin
            // Stage 1: Parallel chunk normalization
            valid_stage1 <= valid_in;
            for (i = 0; i < NUM_CHUNKS; i = i + 1) begin
                stage1_result[i*8 +: 8] <= chunk_normalized[i];
            end

            // Stage 2: Handle carries at chunk boundaries
            // If bit 7 of chunk N and bit 0 of chunk N+1 are both set
            valid_stage2 <= valid_stage1;
            for (i = 0; i < NUM_CHUNKS-1; i = i + 1) begin
                if (stage1_result[i*8 + 7] && stage1_result[(i+1)*8]) begin
                    // Carry across boundary
                    stage1_result[i*8 + 7] <= 1'b0;
                    stage1_result[(i+1)*8] <= 1'b0;
                    stage1_result[(i+1)*8 + 1] <= stage1_result[(i+1)*8 + 1] | 1'b1;
                end
            end

            // Output
            valid_out <= valid_stage2;
            phi_out <= stage1_result;
        end
    end

endmodule


////////////////////////////////////////////////////////////////////////////////
// Module: fibonacci_ratio_lut
// Description: LUT for Fibonacci ratios F_n/F_m for attention weights
//              Provides integer approximation of φ^(-d) = F_{base-d}/F_{base}
////////////////////////////////////////////////////////////////////////////////

module fibonacci_ratio_lut #(
    parameter BASE_INDEX = 46,         // Reference Fibonacci index
    parameter MAX_DISTANCE = 48,       // Maximum distance supported
    parameter WEIGHT_WIDTH = 16        // Output precision
)(
    input  wire                        clk,
    input  wire [5:0]                  distance,        // Shell distance d
    output reg  [WEIGHT_WIDTH-1:0]     weight,          // φ^(-d) approximation
    output reg                         sign_bit         // (-1)^d for alternating sign
);

    // Ratio LUT: stores F_{46-d}/F_46 * 65536
    (* rom_style = "distributed" *)
    reg [WEIGHT_WIDTH-1:0] RATIO_LUT [0:47];

    // Fibonacci numbers (for documentation)
    // F_46 = 2971215073
    // F_45 = 1836311903
    // F_44 = 1134903170
    // ...

    initial begin
        // φ^(-d) ≈ F_{46-d}/F_46, scaled by 65536
        RATIO_LUT[0]  = 16'd65536;  // φ^0 = 1
        RATIO_LUT[1]  = 16'd40503;  // φ^(-1) ≈ 0.618
        RATIO_LUT[2]  = 16'd25033;  // φ^(-2) ≈ 0.382
        RATIO_LUT[3]  = 16'd15470;  // φ^(-3) ≈ 0.236
        RATIO_LUT[4]  = 16'd9563;   // φ^(-4) ≈ 0.146
        RATIO_LUT[5]  = 16'd5907;   // φ^(-5) ≈ 0.090
        RATIO_LUT[6]  = 16'd3656;   // φ^(-6) ≈ 0.056
        RATIO_LUT[7]  = 16'd2260;   // φ^(-7) ≈ 0.034
        RATIO_LUT[8]  = 16'd1397;   // φ^(-8) ≈ 0.021
        RATIO_LUT[9]  = 16'd863;    // φ^(-9) ≈ 0.013
        RATIO_LUT[10] = 16'd534;    // φ^(-10) ≈ 0.008
        RATIO_LUT[11] = 16'd330;
        RATIO_LUT[12] = 16'd204;
        RATIO_LUT[13] = 16'd126;
        RATIO_LUT[14] = 16'd78;
        RATIO_LUT[15] = 16'd48;
        RATIO_LUT[16] = 16'd30;
        RATIO_LUT[17] = 16'd18;
        RATIO_LUT[18] = 16'd11;
        RATIO_LUT[19] = 16'd7;
        RATIO_LUT[20] = 16'd4;
        RATIO_LUT[21] = 16'd3;
        RATIO_LUT[22] = 16'd2;
        RATIO_LUT[23] = 16'd1;
        RATIO_LUT[24] = 16'd1;
        RATIO_LUT[25] = 16'd0;
        RATIO_LUT[26] = 16'd0;
        RATIO_LUT[27] = 16'd0;
        RATIO_LUT[28] = 16'd0;
        RATIO_LUT[29] = 16'd0;
        RATIO_LUT[30] = 16'd0;
        RATIO_LUT[31] = 16'd0;
        RATIO_LUT[32] = 16'd0;
        RATIO_LUT[33] = 16'd0;
        RATIO_LUT[34] = 16'd0;
        RATIO_LUT[35] = 16'd0;
        RATIO_LUT[36] = 16'd0;
        RATIO_LUT[37] = 16'd0;
        RATIO_LUT[38] = 16'd0;
        RATIO_LUT[39] = 16'd0;
        RATIO_LUT[40] = 16'd0;
        RATIO_LUT[41] = 16'd0;
        RATIO_LUT[42] = 16'd0;
        RATIO_LUT[43] = 16'd0;
        RATIO_LUT[44] = 16'd0;
        RATIO_LUT[45] = 16'd0;
        RATIO_LUT[46] = 16'd0;
        RATIO_LUT[47] = 16'd0;
    end

    always @(posedge clk) begin
        weight <= RATIO_LUT[distance];
        sign_bit <= distance[0]; // (-1)^d: LSB gives parity
    end

endmodule
