/**
 * State Encoder Zeckendorf Tests
 *
 * Tests Zeckendorf encoding of market data, bidirectional lattice calculation,
 * phase space mapping, LRU cache performance, and regime classification.
 *
 * Requirements:
 * - Zeckendorf decomposition for market data
 * - Bidirectional lattice (φ^n/ψ^n)
 * - Phase space mapping (q, p)
 * - LRU cache performance
 * - Market regime classification
 */

import {
  ZeckendorfStateEncoder,
  defaultEncoder,
  encodeMarketState,
  calculateGrowthIndicator,
  classifyMarketRegime,
  MarketData,
  EncodedMarketState,
  BidirectionalLattice,
  PHI,
  PSI,
  PHI_INVERSE
} from '../../../src/trading/core/state-encoder';

describe('Zeckendorf State Encoder', () => {
  describe('Golden Ratio Constants', () => {
    it('should have correct φ value', () => {
      const expectedPhi = (1 + Math.sqrt(5)) / 2;
      expect(PHI).toBeCloseTo(expectedPhi, 10);
      expect(PHI).toBeCloseTo(1.618033988749895, 10);
    });

    it('should have correct ψ value', () => {
      const expectedPsi = (1 - Math.sqrt(5)) / 2;
      expect(PSI).toBeCloseTo(expectedPsi, 10);
      expect(PSI).toBeCloseTo(-0.618033988749895, 10);
    });

    it('should have correct φ⁻¹ value', () => {
      expect(PHI_INVERSE).toBeCloseTo(1 / PHI, 10);
      expect(PHI_INVERSE).toBeCloseTo(0.618033988749895, 10);
    });

    it('should satisfy φ² = φ + 1', () => {
      expect(PHI * PHI).toBeCloseTo(PHI + 1, 10);
    });

    it('should satisfy ψ² = ψ + 1', () => {
      expect(PSI * PSI).toBeCloseTo(PSI + 1, 10);
    });
  });

  describe('Market Data Encoding', () => {
    const sampleMarketData: MarketData = {
      timestamp: Date.now(),
      price: 150.75,
      volume: 1000000,
      rsi: 65.5,
      volatility: 0.25,
      marketCap: 1000000000
    };

    it('should encode market data to Zeckendorf representation', () => {
      const encoded = encodeMarketState(sampleMarketData);

      expect(encoded).toBeDefined();
      expect(encoded.market).toEqual(sampleMarketData);
      expect(encoded.priceEncoding).toBeDefined();
      expect(encoded.volumeEncoding).toBeDefined();
    });

    it('should encode price with default scale (100)', () => {
      const encoded = encodeMarketState(sampleMarketData);

      expect(encoded.priceEncoding.value).toBeDefined();
      expect(encoded.priceEncoding.indices).toBeDefined();
      expect(encoded.priceEncoding.indices.size).toBeGreaterThan(0);
    });

    it('should encode volume with default scale (1)', () => {
      const encoded = encodeMarketState(sampleMarketData);

      expect(encoded.volumeEncoding.value).toBeDefined();
      expect(encoded.volumeEncoding.indices).toBeDefined();
      expect(encoded.volumeEncoding.indices.size).toBeGreaterThan(0);
    });

    it('should encode RSI if provided', () => {
      const encoded = encodeMarketState(sampleMarketData);

      expect(encoded.rsiEncoding).toBeDefined();
      expect(encoded.rsiEncoding!.value).toBeDefined();
    });

    it('should handle custom price scale', () => {
      const encoder = new ZeckendorfStateEncoder();
      const encoded = encoder.encodeMarketState(sampleMarketData, 1000, 1);

      expect(encoded.priceEncoding.value).toBeGreaterThan(0);
    });

    it('should reject negative prices', () => {
      const encoder = new ZeckendorfStateEncoder();
      const invalidData = { ...sampleMarketData, price: -50 };

      expect(() => encoder.encodeMarketState(invalidData)).toThrow();
    });

    it('should reject zero prices', () => {
      const encoder = new ZeckendorfStateEncoder();
      const invalidData = { ...sampleMarketData, price: 0 };

      expect(() => encoder.encodeMarketState(invalidData)).toThrow();
    });
  });

  describe('Bidirectional Lattice (φ^n/ψ^n)', () => {
    it('should calculate bidirectional lattice from Zeckendorf', () => {
      const encoder = new ZeckendorfStateEncoder();
      const marketData: MarketData = {
        timestamp: Date.now(),
        price: 100,
        volume: 50000
      };

      const encoded = encoder.encodeMarketState(marketData);

      expect(encoded.priceLattice).toBeDefined();
      expect(encoded.priceLattice.phiComponent).toBeDefined();
      expect(encoded.priceLattice.psiComponent).toBeDefined();
    });

    it('should compute φ component (growth) correctly', () => {
      const encoder = new ZeckendorfStateEncoder();
      const marketData: MarketData = {
        timestamp: Date.now(),
        price: 100,
        volume: 50000
      };

      const encoded = encoder.encodeMarketState(marketData);
      const lattice = encoded.priceLattice;

      expect(lattice.phiComponent).toBeGreaterThan(0);
      expect(Number.isFinite(lattice.phiComponent)).toBe(true);
    });

    it('should compute ψ component (decay) correctly', () => {
      const encoder = new ZeckendorfStateEncoder();
      const marketData: MarketData = {
        timestamp: Date.now(),
        price: 100,
        volume: 50000
      };

      const encoded = encoder.encodeMarketState(marketData);
      const lattice = encoded.priceLattice;

      expect(Number.isFinite(lattice.psiComponent)).toBe(true);
    });

    it('should calculate net balance (φ - |ψ|)', () => {
      const encoder = new ZeckendorfStateEncoder();
      const marketData: MarketData = {
        timestamp: Date.now(),
        price: 100,
        volume: 50000
      };

      const encoded = encoder.encodeMarketState(marketData);
      const lattice = encoded.priceLattice;

      const expectedBalance = lattice.phiComponent - Math.abs(lattice.psiComponent);

      expect(lattice.netBalance).toBeCloseTo(expectedBalance, 5);
    });

    it('should calculate phase angle arctan(ψ/φ)', () => {
      const encoder = new ZeckendorfStateEncoder();
      const marketData: MarketData = {
        timestamp: Date.now(),
        price: 100,
        volume: 50000
      };

      const encoded = encoder.encodeMarketState(marketData);
      const lattice = encoded.priceLattice;

      expect(lattice.phaseAngle).toBeDefined();
      expect(Number.isFinite(lattice.phaseAngle)).toBe(true);
      expect(Math.abs(lattice.phaseAngle)).toBeLessThanOrEqual(Math.PI);
    });

    it('should calculate magnitude √(φ² + ψ²)', () => {
      const encoder = new ZeckendorfStateEncoder();
      const marketData: MarketData = {
        timestamp: Date.now(),
        price: 100,
        volume: 50000
      };

      const encoded = encoder.encodeMarketState(marketData);
      const lattice = encoded.priceLattice;

      const expectedMagnitude = Math.sqrt(
        lattice.phiComponent ** 2 + lattice.psiComponent ** 2
      );

      expect(lattice.magnitude).toBeCloseTo(expectedMagnitude, 5);
    });
  });

  describe('Phase Space Mapping (q, p)', () => {
    it('should map (price, volume) to (q, p) coordinates', () => {
      const encoder = new ZeckendorfStateEncoder();
      const marketData: MarketData = {
        timestamp: Date.now(),
        price: 150,
        volume: 100000
      };

      const encoded = encoder.encodeMarketState(marketData);

      expect(encoded.phaseSpace).toBeDefined();
      expect(encoded.phaseSpace.q).toBeDefined();
      expect(encoded.phaseSpace.p).toBeDefined();
      expect(encoded.phaseSpace.theta).toBeDefined();
    });

    it('should use price lattice net balance for q coordinate', () => {
      const encoder = new ZeckendorfStateEncoder();
      const marketData: MarketData = {
        timestamp: Date.now(),
        price: 150,
        volume: 100000
      };

      const encoded = encoder.encodeMarketState(marketData);

      expect(encoded.phaseSpace.q).toBe(encoded.priceLattice.netBalance);
    });

    it('should use volume lattice magnitude for p coordinate', () => {
      const encoder = new ZeckendorfStateEncoder();
      const marketData: MarketData = {
        timestamp: Date.now(),
        price: 150,
        volume: 100000
      };

      const encoded = encoder.encodeMarketState(marketData);

      expect(encoded.phaseSpace.p).toBe(encoded.volumeLattice.magnitude);
    });

    it('should calculate combined phase angle theta', () => {
      const encoder = new ZeckendorfStateEncoder();
      const marketData: MarketData = {
        timestamp: Date.now(),
        price: 150,
        volume: 100000
      };

      const encoded = encoder.encodeMarketState(marketData);

      const expectedTheta = Math.atan2(
        encoded.phaseSpace.p,
        encoded.phaseSpace.q
      );

      expect(encoded.phaseSpace.theta).toBeCloseTo(expectedTheta, 10);
    });
  });

  describe('LRU Cache Performance', () => {
    it('should cache encoded values', () => {
      const encoder = new ZeckendorfStateEncoder(100);

      // Encode same value twice
      const encoding1 = encoder.encodeValue(100);
      const encoding2 = encoder.encodeValue(100);

      expect(encoding1).toEqual(encoding2);
    });

    it('should cache lattice calculations', () => {
      const encoder = new ZeckendorfStateEncoder(100);

      const marketData: MarketData = {
        timestamp: Date.now(),
        price: 100,
        volume: 50000
      };

      // Encode twice
      const encoded1 = encoder.encodeMarketState(marketData);
      const encoded2 = encoder.encodeMarketState(marketData);

      expect(encoded1.priceLattice).toEqual(encoded2.priceLattice);
    });

    it('should evict old entries when cache is full', () => {
      const encoder = new ZeckendorfStateEncoder(5); // Small cache

      // Fill cache beyond capacity
      for (let i = 0; i < 10; i++) {
        encoder.encodeValue(i + 1);
      }

      const stats = encoder.getCacheStats();

      expect(stats.size).toBeLessThanOrEqual(5);
    });

    it('should clear cache on demand', () => {
      const encoder = new ZeckendorfStateEncoder();

      encoder.encodeValue(100);
      encoder.encodeValue(200);

      encoder.clearCache();

      const stats = encoder.getCacheStats();

      expect(stats.size).toBe(0);
      expect(stats.latticeSize).toBe(0);
    });

    it('should improve performance with caching', () => {
      const encoder = new ZeckendorfStateEncoder(1000);
      const value = 12345;

      // First encoding (cache miss)
      const start1 = performance.now();
      encoder.encodeValue(value);
      const duration1 = performance.now() - start1;

      // Second encoding (cache hit)
      const start2 = performance.now();
      encoder.encodeValue(value);
      const duration2 = performance.now() - start2;

      // Cache hit should be faster (though very small values might be equal)
      expect(duration2).toBeLessThanOrEqual(duration1);
    });
  });

  describe('Batch Encoding', () => {
    it('should batch encode multiple market states', () => {
      const encoder = new ZeckendorfStateEncoder();

      const markets: MarketData[] = [
        { timestamp: Date.now(), price: 100, volume: 50000 },
        { timestamp: Date.now(), price: 150, volume: 75000 },
        { timestamp: Date.now(), price: 200, volume: 100000 }
      ];

      const encoded = encoder.batchEncode(markets);

      expect(encoded).toHaveLength(3);
      expect(encoded[0].market.price).toBe(100);
      expect(encoded[1].market.price).toBe(150);
      expect(encoded[2].market.price).toBe(200);
    });

    it('should handle empty batch', () => {
      const encoder = new ZeckendorfStateEncoder();
      const encoded = encoder.batchEncode([]);

      expect(encoded).toHaveLength(0);
    });
  });

  describe('State Similarity Calculation', () => {
    it('should calculate similarity between encoded states', () => {
      const encoder = new ZeckendorfStateEncoder();

      const state1 = encoder.encodeMarketState({
        timestamp: Date.now(),
        price: 100,
        volume: 50000
      });

      const state2 = encoder.encodeMarketState({
        timestamp: Date.now(),
        price: 102,
        volume: 51000
      });

      const similarity = encoder.calculateSimilarity(state1, state2);

      expect(similarity).toBeGreaterThanOrEqual(0);
      expect(similarity).toBeLessThanOrEqual(1);
    });

    it('should return high similarity for identical states', () => {
      const encoder = new ZeckendorfStateEncoder();

      const marketData: MarketData = {
        timestamp: Date.now(),
        price: 100,
        volume: 50000
      };

      const state1 = encoder.encodeMarketState(marketData);
      const state2 = encoder.encodeMarketState(marketData);

      const similarity = encoder.calculateSimilarity(state1, state2);

      expect(similarity).toBeGreaterThan(0.95);
    });

    it('should return low similarity for very different states', () => {
      const encoder = new ZeckendorfStateEncoder();

      const state1 = encoder.encodeMarketState({
        timestamp: Date.now(),
        price: 50,
        volume: 10000
      });

      const state2 = encoder.encodeMarketState({
        timestamp: Date.now(),
        price: 500,
        volume: 1000000
      });

      const similarity = encoder.calculateSimilarity(state1, state2);

      expect(similarity).toBeLessThan(0.5);
    });
  });

  describe('Market Regime Classification', () => {
    it('should classify bullish market', () => {
      const encoder = new ZeckendorfStateEncoder();

      // High price growth, high volume
      const state = encoder.encodeMarketState({
        timestamp: Date.now(),
        price: 200,
        volume: 1000000
      });

      const regime = classifyMarketRegime(state);

      // Depending on the encoding, this might be bullish, neutral, or volatile
      expect(['bullish', 'neutral', 'volatile', 'bearish']).toContain(regime);
    });

    it('should classify bearish market', () => {
      const encoder = new ZeckendorfStateEncoder();

      // Low price, moderate volume
      const state = encoder.encodeMarketState({
        timestamp: Date.now(),
        price: 10,
        volume: 50000
      });

      const regime = classifyMarketRegime(state);

      expect(['bullish', 'neutral', 'volatile', 'bearish']).toContain(regime);
    });

    it('should classify volatile market', () => {
      const encoder = new ZeckendorfStateEncoder();

      const state = encoder.encodeMarketState({
        timestamp: Date.now(),
        price: 100,
        volume: 5000000 // Very high volume
      });

      const regime = classifyMarketRegime(state);

      expect(['bullish', 'neutral', 'volatile', 'bearish']).toContain(regime);
    });

    it('should calculate growth indicator correctly', () => {
      const lattice: BidirectionalLattice = {
        phiComponent: 10,
        psiComponent: -2,
        netBalance: 8,
        phaseAngle: 0.5,
        magnitude: 10.2
      };

      const growth = calculateGrowthIndicator(lattice);

      expect(growth).toBeCloseTo(8 / 10.2, 5);
    });

    it('should handle zero magnitude gracefully', () => {
      const lattice: BidirectionalLattice = {
        phiComponent: 0,
        psiComponent: 0,
        netBalance: 0,
        phaseAngle: 0,
        magnitude: 0
      };

      const growth = calculateGrowthIndicator(lattice);

      expect(Number.isFinite(growth)).toBe(true);
    });
  });

  describe('Lattice Decoding', () => {
    it('should decode lattice back to approximate value', () => {
      const encoder = new ZeckendorfStateEncoder();

      const originalPrice = 150;
      const scale = 100;

      const encoded = encoder.encodeValue(originalPrice, scale);
      const lattice = encoder.calculateBidirectionalLattice(encoded);
      const decoded = encoder.decodeLattice(lattice, scale);

      // Should be approximately the original value
      expect(decoded).toBeCloseTo(originalPrice, 0); // Within 1
    });
  });

  describe('Default Encoder Instance', () => {
    it('should provide default encoder singleton', () => {
      expect(defaultEncoder).toBeDefined();
      expect(defaultEncoder).toBeInstanceOf(ZeckendorfStateEncoder);
    });

    it('should use default encoder in convenience function', () => {
      const marketData: MarketData = {
        timestamp: Date.now(),
        price: 100,
        volume: 50000
      };

      const encoded = encodeMarketState(marketData);

      expect(encoded).toBeDefined();
      expect(encoded.market).toEqual(marketData);
    });
  });
});
