////////////////////////////////////////////////////////////////////////////////
// Module: hyperbolic_router
// Description: Hyperbolic geometry-based routing for φ-space addresses
//              Maps access patterns to shell partitions for efficient memory
//
// Key Insight:
//   - φ-space has natural hyperbolic structure
//   - Similar meanings cluster in similar shells
//   - Route based on max_shell (depth) and parity
//   - Enables efficient memory partitioning
////////////////////////////////////////////////////////////////////////////////

module hyperbolic_router #(
    parameter PHI_WIDTH = 48,
    parameter NUM_PARTITIONS = 8,      // Memory partitions (power of 2)
    parameter PARTITION_BITS = 3       // log2(NUM_PARTITIONS)
)(
    input  wire                        clk,
    input  wire                        rst_n,
    input  wire                        valid_in,
    input  wire [PHI_WIDTH-1:0]        phi_addr,
    input  wire [5:0]                  max_shell,       // From encoder
    input  wire                        parity,          // From encoder
    output reg                         valid_out,
    output reg  [PARTITION_BITS-1:0]   partition,       // Target partition
    output reg  [PHI_WIDTH-1:0]        local_addr,      // Address within partition
    output reg  [2:0]                  shell_zone       // Coarse shell zone (0-7)
);

    // Shell zone boundaries (exponential spacing - hyperbolic shells)
    // Zone 0: shells 0-2   (innermost, most dense)
    // Zone 1: shells 3-5
    // Zone 2: shells 6-10
    // Zone 3: shells 11-17
    // Zone 4: shells 18-26
    // Zone 5: shells 27-35
    // Zone 6: shells 36-43
    // Zone 7: shells 44-47 (outermost, sparse)

    function [2:0] shell_to_zone;
        input [5:0] shell;
        begin
            if (shell <= 2)       shell_to_zone = 3'd0;
            else if (shell <= 5)  shell_to_zone = 3'd1;
            else if (shell <= 10) shell_to_zone = 3'd2;
            else if (shell <= 17) shell_to_zone = 3'd3;
            else if (shell <= 26) shell_to_zone = 3'd4;
            else if (shell <= 35) shell_to_zone = 3'd5;
            else if (shell <= 43) shell_to_zone = 3'd6;
            else                  shell_to_zone = 3'd7;
        end
    endfunction

    // Routing function: combines shell zone and parity for partition selection
    // This distributes semantically similar tokens to same partition
    function [PARTITION_BITS-1:0] compute_partition;
        input [2:0] zone;
        input parity;
        input [PHI_WIDTH-1:0] addr;
        begin
            // Primary routing by zone
            // Secondary routing by parity (splits each zone in half)
            // Tertiary routing by address hash (for load balancing)
            compute_partition = zone[PARTITION_BITS-1:0] ^ {PARTITION_BITS{parity}} ^ addr[PARTITION_BITS-1:0];
        end
    endfunction

    // Pipeline registers
    reg [PHI_WIDTH-1:0] addr_pipe [0:1];
    reg [5:0] shell_pipe [0:1];
    reg par_pipe [0:1];
    reg valid_pipe [0:1];
    reg [2:0] zone_pipe;

    integer i;

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            valid_out <= 1'b0;
            partition <= {PARTITION_BITS{1'b0}};
            local_addr <= {PHI_WIDTH{1'b0}};
            shell_zone <= 3'd0;
            zone_pipe <= 3'd0;

            for (i = 0; i < 2; i = i + 1) begin
                addr_pipe[i] <= {PHI_WIDTH{1'b0}};
                shell_pipe[i] <= 6'd0;
                par_pipe[i] <= 1'b0;
                valid_pipe[i] <= 1'b0;
            end
        end else begin
            // Stage 0: Input registration and zone computation
            valid_pipe[0] <= valid_in;
            addr_pipe[0] <= phi_addr;
            shell_pipe[0] <= max_shell;
            par_pipe[0] <= parity;
            zone_pipe <= shell_to_zone(max_shell);

            // Stage 1: Partition computation
            valid_pipe[1] <= valid_pipe[0];
            addr_pipe[1] <= addr_pipe[0];
            shell_pipe[1] <= shell_pipe[0];
            par_pipe[1] <= par_pipe[0];

            // Output
            valid_out <= valid_pipe[1];
            shell_zone <= zone_pipe;
            partition <= compute_partition(zone_pipe, par_pipe[1], addr_pipe[1]);
            local_addr <= addr_pipe[1]; // Could transform for partition-local addressing
        end
    end

endmodule


////////////////////////////////////////////////////////////////////////////////
// Module: shell_partitioned_memory
// Description: Memory system with hyperbolic shell-based partitioning
//              Each partition handles tokens from specific shell zones
////////////////////////////////////////////////////////////////////////////////

module shell_partitioned_memory #(
    parameter PHI_WIDTH = 48,
    parameter NUM_PARTITIONS = 8,
    parameter PARTITION_BITS = 3,
    parameter PARTITION_SIZE = 512,    // Entries per partition
    parameter ADDR_WIDTH = 9           // log2(PARTITION_SIZE)
)(
    input  wire                        clk,
    input  wire                        rst_n,
    // Write port
    input  wire                        we,
    input  wire [PARTITION_BITS-1:0]   wr_partition,
    input  wire [ADDR_WIDTH-1:0]       wr_addr,
    input  wire [PHI_WIDTH-1:0]        wr_data,
    // Read port
    input  wire [PARTITION_BITS-1:0]   rd_partition,
    input  wire [ADDR_WIDTH-1:0]       rd_addr,
    output reg  [PHI_WIDTH-1:0]        rd_data,
    output reg                         rd_valid
);

    // Partition memories
    (* ram_style = "block" *)
    reg [PHI_WIDTH-1:0] partitions [0:NUM_PARTITIONS-1][0:PARTITION_SIZE-1];

    // Read pipeline
    reg [PARTITION_BITS-1:0] rd_part_pipe;
    reg [ADDR_WIDTH-1:0] rd_addr_pipe;
    reg rd_pending;

    integer i, j;

    // Initialize (for simulation)
    initial begin
        for (i = 0; i < NUM_PARTITIONS; i = i + 1) begin
            for (j = 0; j < PARTITION_SIZE; j = j + 1) begin
                partitions[i][j] = {PHI_WIDTH{1'b0}};
            end
        end
    end

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            rd_data <= {PHI_WIDTH{1'b0}};
            rd_valid <= 1'b0;
            rd_part_pipe <= {PARTITION_BITS{1'b0}};
            rd_addr_pipe <= {ADDR_WIDTH{1'b0}};
            rd_pending <= 1'b0;
        end else begin
            // Write
            if (we) begin
                partitions[wr_partition][wr_addr] <= wr_data;
            end

            // Read (2-cycle latency for BRAM)
            rd_part_pipe <= rd_partition;
            rd_addr_pipe <= rd_addr;
            rd_pending <= 1'b1;

            rd_valid <= rd_pending;
            rd_data <= partitions[rd_part_pipe][rd_addr_pipe];
        end
    end

endmodule


////////////////////////////////////////////////////////////////////////////////
// Module: hyperbolic_distance
// Description: Compute hyperbolic distance between two φ-space points
//              Uses shell distance with logarithmic scaling
////////////////////////////////////////////////////////////////////////////////

module hyperbolic_distance #(
    parameter PHI_WIDTH = 48,
    parameter DIST_WIDTH = 16          // Fixed-point distance output
)(
    input  wire                        clk,
    input  wire                        rst_n,
    input  wire                        valid_in,
    input  wire [PHI_WIDTH-1:0]        point_a,
    input  wire [PHI_WIDTH-1:0]        point_b,
    input  wire [5:0]                  shell_a,         // Pre-computed max shells
    input  wire [5:0]                  shell_b,
    output reg                         valid_out,
    output reg  [DIST_WIDTH-1:0]       hyper_dist,      // Hyperbolic distance
    output reg  [5:0]                  shell_dist       // Raw shell distance
);

    // Hyperbolic distance approximation:
    // d_H(a,b) ≈ acosh(1 + 2*d_shell^2 / ((1+|a|)(1+|b|)))
    // Simplified: use log-scaled shell distance

    // Log2 approximation LUT (scaled by 256)
    reg [DIST_WIDTH-1:0] LOG2_LUT [0:63];

    initial begin
        LOG2_LUT[0]  = 16'd0;
        LOG2_LUT[1]  = 16'd0;
        LOG2_LUT[2]  = 16'd256;    // log2(2) * 256
        LOG2_LUT[3]  = 16'd406;    // log2(3) * 256
        LOG2_LUT[4]  = 16'd512;
        LOG2_LUT[5]  = 16'd595;
        LOG2_LUT[6]  = 16'd662;
        LOG2_LUT[7]  = 16'd719;
        LOG2_LUT[8]  = 16'd768;
        LOG2_LUT[9]  = 16'd812;
        LOG2_LUT[10] = 16'd851;
        LOG2_LUT[11] = 16'd887;
        LOG2_LUT[12] = 16'd918;
        LOG2_LUT[13] = 16'd948;
        LOG2_LUT[14] = 16'd975;
        LOG2_LUT[15] = 16'd1000;
        // ... continue pattern
    end

    // Popcount for shell distance
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

    // Pipeline
    reg [5:0] xor_popcount;
    reg [5:0] shell_sum;
    reg valid_pipe [0:2];
    reg [5:0] dist_pipe;

    integer i;

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            valid_out <= 1'b0;
            hyper_dist <= {DIST_WIDTH{1'b0}};
            shell_dist <= 6'd0;
            xor_popcount <= 6'd0;
            shell_sum <= 6'd0;
            dist_pipe <= 6'd0;
            for (i = 0; i < 3; i = i + 1) valid_pipe[i] <= 1'b0;
        end else begin
            // Stage 0: XOR and popcount
            valid_pipe[0] <= valid_in;
            xor_popcount <= popcount(point_a ^ point_b);
            shell_sum <= shell_a + shell_b;

            // Stage 1: Store raw distance
            valid_pipe[1] <= valid_pipe[0];
            dist_pipe <= xor_popcount;

            // Stage 2: Compute hyperbolic distance
            valid_pipe[2] <= valid_pipe[1];

            // Output
            valid_out <= valid_pipe[2];
            shell_dist <= dist_pipe;

            // Hyperbolic distance: scale by shell depth
            // d_H = d_shell * (1 + shell_sum/48)
            // Approximated as: d_shell + (d_shell * shell_sum) >> 6
            if (dist_pipe < 64) begin
                hyper_dist <= LOG2_LUT[dist_pipe] + ((dist_pipe * shell_sum) >> 2);
            end else begin
                hyper_dist <= {DIST_WIDTH{1'b1}}; // Saturate
            end
        end
    end

endmodule
