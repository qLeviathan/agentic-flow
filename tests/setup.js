"use strict";
/**
 * @file Test Setup and Global Configuration
 * @description Global test setup for QUIC test suite
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.simulateNetworkDelay = exports.createMockAgent = exports.wait = void 0;
const vitest_1 = require("vitest");
// Global test configuration
(0, vitest_1.beforeAll)(() => {
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.QUIC_SERVER = 'localhost:8443';
    process.env.QUIC_0RTT = 'true';
    process.env.QUIC_MAX_STREAMS = '1000';
    process.env.QUIC_FALLBACK = 'true';
    // Mock console methods to reduce noise in tests
    global.console = {
        ...console,
        log: vitest_1.vi.fn(),
        debug: vitest_1.vi.fn(),
        info: vitest_1.vi.fn(),
        warn: console.warn, // Keep warnings
        error: console.error, // Keep errors
    };
    console.info('Test environment initialized');
});
(0, vitest_1.afterAll)(() => {
    console.info('Test environment cleanup complete');
});
// Global test utilities
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
exports.wait = wait;
const createMockAgent = (type) => ({
    id: `agent-${Math.random().toString(36).substring(7)}`,
    type,
    status: 'active',
    createdAt: Date.now(),
});
exports.createMockAgent = createMockAgent;
const simulateNetworkDelay = (min = 10, max = 50) => (0, exports.wait)(Math.random() * (max - min) + min);
exports.simulateNetworkDelay = simulateNetworkDelay;
//# sourceMappingURL=setup.js.map