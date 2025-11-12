/**
 * @file Test Setup and Global Configuration
 * @description Global test setup for QUIC test suite
 */
export declare const wait: (ms: number) => Promise<unknown>;
export declare const createMockAgent: (type: string) => {
    id: string;
    type: string;
    status: string;
    createdAt: number;
};
export declare const simulateNetworkDelay: (min?: number, max?: number) => Promise<unknown>;
//# sourceMappingURL=setup.d.ts.map