/**
 * TypeScript type definitions for math-framework-wasm
 *
 * High-performance WASM bindings for mathematical framework operations
 */

/**
 * Initialize the WASM module
 * Must be called before using any other functions
 */
export default function init(input?: string | URL | Request): Promise<void>;

// ============================================================================
// SEQUENCE OPERATIONS
// ============================================================================

/**
 * Compute Fibonacci number F(n) using O(log n) matrix exponentiation
 * @param n - The index (supports BigInt for large values)
 * @returns The Fibonacci number as a string
 */
export function fibonacci(n: bigint): string;

/**
 * Compute Lucas number L(n) using O(log n) algorithm
 * @param n - The index
 * @returns The Lucas number as a string
 */
export function lucas(n: number): string;

/**
 * Compute multiple Fibonacci numbers efficiently
 * @param start - Starting index
 * @param end - Ending index (inclusive)
 * @returns JSON string containing array of Fibonacci numbers
 */
export function fibonacci_range(start: number, end: number): string;

/**
 * Compute multiple Lucas numbers efficiently
 * @param start - Starting index
 * @param end - Ending index (inclusive)
 * @returns JSON string containing array of Lucas numbers
 */
export function lucas_range(start: number, end: number): string;

/**
 * Get golden ratio approximation using F(n+1)/F(n)
 * @param n - The index (higher values give more accurate approximations)
 * @returns Approximation of φ (phi)
 */
export function golden_ratio(n: number): number;

// ============================================================================
// ZECKENDORF DECOMPOSITION
// ============================================================================

/**
 * Zeckendorf decomposition result
 */
export class WasmZeckendorf {
    /**
     * Get the original number as a string
     */
    readonly number: string;

    /**
     * Get Fibonacci indices as a JSON array string
     */
    readonly indices: string;

    /**
     * Get Fibonacci numbers as a JSON array of strings
     */
    readonly fibonacci_numbers: string;

    /**
     * Verify the decomposition is valid
     */
    isValid(): boolean;

    /**
     * Get string representation (e.g., "3 + 8 + 89")
     */
    toString(): string;

    /**
     * Convert to JSON string
     */
    toJSON(): string;
}

/**
 * Perform Zeckendorf decomposition using greedy O(log n) algorithm
 * @param n - The number to decompose
 * @returns Zeckendorf decomposition object
 */
export function zeckendorf(n: number): WasmZeckendorf;

/**
 * Convert Zeckendorf representation to binary string
 * @param z - Zeckendorf decomposition
 * @returns Binary string representation
 */
export function zeckendorf_to_binary(z: WasmZeckendorf): string;

/**
 * Parse binary Zeckendorf string back to a number
 * @param binary - Binary string representation
 * @returns The number as a string
 */
export function binary_to_zeckendorf(binary: string): string;

/**
 * Get Fibonacci weight (number of terms in Zeckendorf decomposition)
 * @param n - The number
 * @returns Number of terms
 */
export function fibonacci_weight(n: number): number;

/**
 * Check if a number is a Fibonacci number
 * @param n - The number to check
 * @returns True if n is a Fibonacci number
 */
export function is_fibonacci(n: number): boolean;

// ============================================================================
// BK DIVERGENCE
// ============================================================================

/**
 * Compute V(n): Sum of Fibonacci indices in Zeckendorf decomposition
 * @param n - The index
 * @returns V(n)
 */
export function bk_v(n: number): number;

/**
 * Compute U(n): Cumulative sum of V values from 1 to n
 * @param n - The index
 * @returns U(n)
 */
export function bk_u(n: number): number;

/**
 * Compute S(n): BK divergence - cumulative sum of U values from 1 to n
 * @param n - The index
 * @returns S(n)
 */
export function bk_divergence(n: number): number;

// ============================================================================
// PHASE SPACE
// ============================================================================

/**
 * Phase space point with coordinates
 */
export class WasmPhaseSpacePoint {
    /**
     * Create a new phase space point for value n
     * @param n - The index
     */
    constructor(n: number);

    /** The index */
    readonly n: number;

    /** V(n) value */
    readonly v: number;

    /** U(n) value */
    readonly u: number;

    /** S(n) value */
    readonly s: number;

    /** Normalized X coordinate (log scale) */
    readonly x: number;

    /** Normalized Y coordinate (log scale) */
    readonly y: number;

    /** Normalized Z coordinate (log scale) */
    readonly z: number;

    /**
     * Compute Euclidean distance to another point
     * @param other - Another phase space point
     * @returns Distance
     */
    distanceTo(other: WasmPhaseSpacePoint): number;

    /**
     * Convert to JSON string
     */
    toJSON(): string;
}

/**
 * Phase space trajectory
 */
export class WasmTrajectory {
    /**
     * Create a trajectory from start to end
     * @param start - Starting index
     * @param end - Ending index (inclusive)
     */
    constructor(start: number, end: number);

    /**
     * Get number of points in trajectory
     */
    readonly length: number;

    /**
     * Get a point at index
     * @param index - Point index
     * @returns Phase space point or undefined if out of bounds
     */
    getPoint(index: number): WasmPhaseSpacePoint | undefined;

    /**
     * Get total path length
     */
    pathLength(): number;

    /**
     * Find equilibrium points (low velocity regions)
     * @param threshold - Velocity threshold
     * @returns JSON string containing array of equilibrium indices
     */
    findEquilibria(threshold: number): string;

    /**
     * Convert to JSON string
     */
    toJSON(): string;
}

// ============================================================================
// NASH EQUILIBRIUM
// ============================================================================

/**
 * Nash equilibrium detection result
 */
export class WasmNashEquilibrium {
    /** Position in trajectory */
    readonly position: number;

    /** V value at equilibrium */
    readonly v: number;

    /** U value at equilibrium */
    readonly u: number;

    /** S value at equilibrium */
    readonly s: number;

    /** Stability score (0-1, higher is more stable) */
    readonly stabilityScore: number;

    /**
     * Convert to JSON string
     */
    toJSON(): string;
}

/**
 * Detect Nash equilibria in a trajectory
 * @param trajectory - Phase space trajectory
 * @param window_size - Window size for local analysis
 * @returns Array of Nash equilibria
 */
export function detect_nash_equilibria(
    trajectory: WasmTrajectory,
    window_size: number
): WasmNashEquilibrium[];

// ============================================================================
// METRICS
// ============================================================================

/**
 * Divergence metrics for a range
 */
export class WasmDivergenceMetrics {
    /**
     * Compute metrics for a range
     * @param start - Starting index
     * @param end - Ending index (inclusive)
     */
    constructor(start: number, end: number);

    /** Range start */
    readonly rangeStart: number;

    /** Range end */
    readonly rangeEnd: number;

    /** Mean V value */
    readonly meanV: number;

    /** Mean U value */
    readonly meanU: number;

    /** Mean S value */
    readonly meanS: number;

    /** Maximum V value */
    readonly maxV: number;

    /** Maximum U value */
    readonly maxU: number;

    /** Maximum S value */
    readonly maxS: number;

    /**
     * Convert to JSON string
     */
    toJSON(): string;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Clear all internal caches (useful for memory management)
 */
export function clear_caches(): void;

/**
 * Get library version
 */
export function version(): string;
