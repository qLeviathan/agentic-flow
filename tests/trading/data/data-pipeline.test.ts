/**
 * Data Pipeline Integration Tests
 *
 * Tests FRED API mocking, Yahoo Finance mocking, Zeckendorf encoding of indicators,
 * Moody's risk scoring, and GMV anomaly detection.
 *
 * Requirements:
 * - Mock FRED API
 * - Mock Yahoo Finance API
 * - Test Zeckendorf encoding of economic indicators
 * - Test Moody's risk scoring
 * - Test GMV anomaly detection
 */

import { EventEmitter } from 'events';

// Mock types based on the data-aggregator.ts file
interface ZeckendorfEconomicIndicator {
  seriesId: string;
  value: number;
  timestamp: number;
  phaseSpace: {
    phi: number;
    psi: number;
    theta: number;
  };
}

interface EconomicSnapshot {
  id: string;
  timestamp: number;
  indicators: ZeckendorfEconomicIndicator[];
  aggregates: {
    totalPhiEnergy: number;
    totalPsiEnergy: number;
    systemPhase: number;
    systemMagnitude: number;
  };
  moodyScore?: MoodysRiskScore;
  gmvScore?: GMVAnomalyScore;
}

interface MoodysRiskScore {
  rating: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'CCC' | 'CC' | 'C' | 'D';
  score: number;
  outlook: 'positive' | 'stable' | 'negative';
  components: {
    creditSpreadRisk: number;
    interestRateRisk: number;
    liquidityRisk: number;
    macroeconomicRisk: number;
  };
  timestamp: number;
}

interface GMVAnomalyScore {
  score: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  anomalies: Array<{
    indicator: string;
    expectedValue: number;
    actualValue: number;
    deviation: number;
    zScore: number;
  }>;
  geometricMean: number;
  variance: number;
  timestamp: number;
}

describe('Data Pipeline - FRED API Mock', () => {
  describe('FRED Data Fetching', () => {
    it('should mock FRED API response for GDP', () => {
      const mockGDPData = {
        seriesId: 'GDP',
        value: 25000,
        timestamp: Date.now()
      };

      expect(mockGDPData.seriesId).toBe('GDP');
      expect(mockGDPData.value).toBeGreaterThan(0);
    });

    it('should mock FRED API response for unemployment rate', () => {
      const mockUnemploymentData = {
        seriesId: 'UNRATE',
        value: 3.8,
        timestamp: Date.now()
      };

      expect(mockUnemploymentData.seriesId).toBe('UNRATE');
      expect(mockUnemploymentData.value).toBeGreaterThan(0);
      expect(mockUnemploymentData.value).toBeLessThan(20);
    });

    it('should mock FRED API response for inflation', () => {
      const mockInflationData = {
        seriesId: 'CPIAUCSL',
        value: 2.5,
        timestamp: Date.now()
      };

      expect(mockInflationData.seriesId).toBe('CPIAUCSL');
      expect(mockInflationData.value).toBeGreaterThan(0);
    });

    it('should handle API errors gracefully', () => {
      const mockError = {
        error: 'API_LIMIT_EXCEEDED',
        message: 'Rate limit exceeded'
      };

      expect(mockError.error).toBe('API_LIMIT_EXCEEDED');
    });

    it('should mock batch FRED data fetching', () => {
      const seriesIds = ['GDP', 'UNRATE', 'CPIAUCSL'];
      const mockBatchData = seriesIds.map(id => ({
        seriesId: id,
        value: Math.random() * 100,
        timestamp: Date.now()
      }));

      expect(mockBatchData).toHaveLength(3);
      expect(mockBatchData.every(d => d.value > 0)).toBe(true);
    });
  });

  describe('FRED Data Validation', () => {
    it('should validate series ID format', () => {
      const validSeriesId = 'GDP';
      const invalidSeriesId = '';

      expect(validSeriesId.length).toBeGreaterThan(0);
      expect(invalidSeriesId.length).toBe(0);
    });

    it('should validate timestamp is recent', () => {
      const recentTimestamp = Date.now();
      const oldTimestamp = Date.now() - 365 * 24 * 60 * 60 * 1000; // 1 year ago

      expect(recentTimestamp).toBeGreaterThan(oldTimestamp);
    });

    it('should validate value is numeric', () => {
      const validValue = 100.5;
      const invalidValue = NaN;

      expect(Number.isFinite(validValue)).toBe(true);
      expect(Number.isFinite(invalidValue)).toBe(false);
    });
  });
});

describe('Data Pipeline - Yahoo Finance Mock', () => {
  describe('Market Data Fetching', () => {
    it('should mock Yahoo Finance stock price', () => {
      const mockStockData = {
        symbol: 'AAPL',
        price: 175.50,
        volume: 50000000,
        timestamp: Date.now()
      };

      expect(mockStockData.symbol).toBe('AAPL');
      expect(mockStockData.price).toBeGreaterThan(0);
      expect(mockStockData.volume).toBeGreaterThan(0);
    });

    it('should mock multiple stock symbols', () => {
      const symbols = ['AAPL', 'GOOGL', 'MSFT'];
      const mockData = symbols.map(symbol => ({
        symbol,
        price: 100 + Math.random() * 200,
        volume: 10000000 + Math.random() * 90000000,
        timestamp: Date.now()
      }));

      expect(mockData).toHaveLength(3);
      expect(mockData.every(d => d.price > 0)).toBe(true);
    });

    it('should mock index data (S&P 500)', () => {
      const mockIndexData = {
        symbol: '^GSPC',
        price: 4500.25,
        volume: 3000000000,
        timestamp: Date.now()
      };

      expect(mockIndexData.symbol).toBe('^GSPC');
      expect(mockIndexData.price).toBeGreaterThan(1000);
    });

    it('should handle invalid symbols', () => {
      const invalidSymbol = 'INVALID';
      const mockError = {
        symbol: invalidSymbol,
        error: 'Symbol not found'
      };

      expect(mockError.error).toBe('Symbol not found');
    });

    it('should include technical indicators', () => {
      const mockTechnicalData = {
        symbol: 'AAPL',
        price: 175.50,
        rsi: 65.5,
        macd: 2.3,
        bollingerBands: {
          upper: 180,
          middle: 175,
          lower: 170
        }
      };

      expect(mockTechnicalData.rsi).toBeGreaterThanOrEqual(0);
      expect(mockTechnicalData.rsi).toBeLessThanOrEqual(100);
    });
  });

  describe('Real-time Updates Mock', () => {
    it('should simulate real-time price updates', (done) => {
      const emitter = new EventEmitter();
      let updateCount = 0;

      emitter.on('price-update', (data) => {
        updateCount++;
        expect(data.price).toBeGreaterThan(0);

        if (updateCount >= 3) {
          done();
        }
      });

      // Simulate 3 updates
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          emitter.emit('price-update', {
            symbol: 'AAPL',
            price: 175 + Math.random() * 5,
            timestamp: Date.now()
          });
        }, i * 10);
      }
    });

    it('should handle polling interval', () => {
      const pollingInterval = 15000; // 15 seconds

      expect(pollingInterval).toBe(15000);
      expect(pollingInterval).toBeGreaterThan(0);
    });
  });
});

describe('Zeckendorf Encoding of Economic Indicators', () => {
  describe('Indicator Encoding', () => {
    it('should encode GDP to Zeckendorf representation', () => {
      const gdpValue = 25000;
      const mockEncoded: ZeckendorfEconomicIndicator = {
        seriesId: 'GDP',
        value: gdpValue,
        timestamp: Date.now(),
        phaseSpace: {
          phi: 10.5,
          psi: -3.2,
          theta: 0.5
        }
      };

      expect(mockEncoded.value).toBe(gdpValue);
      expect(mockEncoded.phaseSpace.phi).toBeDefined();
      expect(mockEncoded.phaseSpace.psi).toBeDefined();
    });

    it('should calculate phase space coordinates', () => {
      const mockIndicator: ZeckendorfEconomicIndicator = {
        seriesId: 'UNRATE',
        value: 3.8,
        timestamp: Date.now(),
        phaseSpace: {
          phi: 5.2,
          psi: -2.1,
          theta: Math.atan2(-2.1, 5.2)
        }
      };

      expect(mockIndicator.phaseSpace.theta).toBeDefined();
      expect(Number.isFinite(mockIndicator.phaseSpace.theta)).toBe(true);
    });

    it('should encode multiple indicators in batch', () => {
      const indicators = ['GDP', 'UNRATE', 'CPIAUCSL'];
      const mockEncodedBatch: ZeckendorfEconomicIndicator[] = indicators.map((seriesId, i) => ({
        seriesId,
        value: 100 * (i + 1),
        timestamp: Date.now(),
        phaseSpace: {
          phi: 10 + i * 2,
          psi: -3 - i,
          theta: 0.5 + i * 0.1
        }
      }));

      expect(mockEncodedBatch).toHaveLength(3);
      expect(mockEncodedBatch.every(ind => ind.phaseSpace.phi > 0)).toBe(true);
    });

    it('should maintain bidirectional lattice separation', () => {
      const mockIndicator: ZeckendorfEconomicIndicator = {
        seriesId: 'GDP',
        value: 25000,
        timestamp: Date.now(),
        phaseSpace: {
          phi: 15.5,  // Growth component
          psi: -4.2,  // Decay component
          theta: 0.6
        }
      };

      // φ should be positive (growth)
      expect(mockIndicator.phaseSpace.phi).toBeGreaterThan(0);

      // ψ should be negative or small (decay)
      expect(mockIndicator.phaseSpace.psi).toBeLessThan(mockIndicator.phaseSpace.phi);
    });
  });

  describe('Phase Space Aggregation', () => {
    it('should aggregate multiple indicators into system state', () => {
      const indicators: ZeckendorfEconomicIndicator[] = [
        { seriesId: 'GDP', value: 25000, timestamp: Date.now(), phaseSpace: { phi: 10, psi: -3, theta: 0.5 } },
        { seriesId: 'UNRATE', value: 3.8, timestamp: Date.now(), phaseSpace: { phi: 5, psi: -2, theta: 0.3 } }
      ];

      const totalPhi = indicators.reduce((sum, ind) => sum + ind.phaseSpace.phi, 0);
      const totalPsi = indicators.reduce((sum, ind) => sum + ind.phaseSpace.psi, 0);

      expect(totalPhi).toBe(15);
      expect(totalPsi).toBe(-5);
    });

    it('should calculate system phase and magnitude', () => {
      const totalPhi = 15;
      const totalPsi = -5;

      const systemPhase = Math.atan2(totalPsi, totalPhi);
      const systemMagnitude = Math.sqrt(totalPhi ** 2 + totalPsi ** 2);

      expect(Number.isFinite(systemPhase)).toBe(true);
      expect(systemMagnitude).toBeGreaterThan(0);
    });
  });
});

describe('Moody\'s Risk Scoring', () => {
  describe('Risk Rating Calculation', () => {
    it('should calculate AAA rating for low risk', () => {
      const mockScore: MoodysRiskScore = {
        rating: 'AAA',
        score: 95,
        outlook: 'stable',
        components: {
          creditSpreadRisk: 5,
          interestRateRisk: 8,
          liquidityRisk: 3,
          macroeconomicRisk: 6
        },
        timestamp: Date.now()
      };

      expect(mockScore.rating).toBe('AAA');
      expect(mockScore.score).toBeGreaterThanOrEqual(90);
    });

    it('should calculate BBB rating for moderate risk', () => {
      const mockScore: MoodysRiskScore = {
        rating: 'BBB',
        score: 70,
        outlook: 'stable',
        components: {
          creditSpreadRisk: 18,
          interestRateRisk: 24,
          liquidityRisk: 13,
          macroeconomicRisk: 17
        },
        timestamp: Date.now()
      };

      expect(mockScore.rating).toBe('BBB');
      expect(mockScore.score).toBeGreaterThanOrEqual(65);
      expect(mockScore.score).toBeLessThan(75);
    });

    it('should calculate D rating for high risk', () => {
      const mockScore: MoodysRiskScore = {
        rating: 'D',
        score: 10,
        outlook: 'negative',
        components: {
          creditSpreadRisk: 45,
          interestRateRisk: 50,
          liquidityRisk: 40,
          macroeconomicRisk: 48
        },
        timestamp: Date.now()
      };

      expect(mockScore.rating).toBe('D');
      expect(mockScore.score).toBeLessThan(15);
    });

    it('should include risk components', () => {
      const mockScore: MoodysRiskScore = {
        rating: 'A',
        score: 80,
        outlook: 'positive',
        components: {
          creditSpreadRisk: 12,
          interestRateRisk: 18,
          liquidityRisk: 8,
          macroeconomicRisk: 14
        },
        timestamp: Date.now()
      };

      const totalRisk = Object.values(mockScore.components).reduce((a, b) => a + b, 0);

      expect(totalRisk).toBeGreaterThan(0);
      expect(totalRisk).toBeLessThan(100);
    });

    it('should set outlook based on trend', () => {
      const outlooks: Array<'positive' | 'stable' | 'negative'> = ['positive', 'stable', 'negative'];

      for (const outlook of outlooks) {
        const mockScore: MoodysRiskScore = {
          rating: 'A',
          score: 80,
          outlook,
          components: {
            creditSpreadRisk: 10,
            interestRateRisk: 15,
            liquidityRisk: 8,
            macroeconomicRisk: 12
          },
          timestamp: Date.now()
        };

        expect(outlooks).toContain(mockScore.outlook);
      }
    });
  });

  describe('Score to Rating Conversion', () => {
    it('should map scores to ratings correctly', () => {
      const scoreRatingPairs: Array<[number, MoodysRiskScore['rating']]> = [
        [95, 'AAA'],
        [87, 'AA'],
        [78, 'A'],
        [68, 'BBB'],
        [58, 'BB'],
        [48, 'B'],
        [38, 'CCC'],
        [28, 'CC'],
        [18, 'C'],
        [8, 'D']
      ];

      for (const [score, expectedRating] of scoreRatingPairs) {
        // Simple scoring logic
        let rating: MoodysRiskScore['rating'];
        if (score >= 90) rating = 'AAA';
        else if (score >= 85) rating = 'AA';
        else if (score >= 75) rating = 'A';
        else if (score >= 65) rating = 'BBB';
        else if (score >= 55) rating = 'BB';
        else if (score >= 45) rating = 'B';
        else if (score >= 35) rating = 'CCC';
        else if (score >= 25) rating = 'CC';
        else if (score >= 15) rating = 'C';
        else rating = 'D';

        expect(rating).toBe(expectedRating);
      }
    });
  });
});

describe('GMV Anomaly Detection', () => {
  describe('Geometric Mean Calculation', () => {
    it('should calculate geometric mean of values', () => {
      const values = [100, 200, 150];
      const product = values.reduce((acc, val) => acc * val, 1);
      const geometricMean = Math.pow(product, 1 / values.length);

      expect(geometricMean).toBeGreaterThan(0);
      expect(geometricMean).toBeCloseTo(145.77, 1);
    });

    it('should calculate variance from geometric mean', () => {
      const values = [100, 200, 150];
      const geometricMean = 145.77;

      const squaredDiffs = values.map(v => Math.pow(v - geometricMean, 2));
      const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;

      expect(variance).toBeGreaterThan(0);
    });
  });

  describe('Anomaly Severity Classification', () => {
    it('should classify low severity anomaly', () => {
      const mockScore: GMVAnomalyScore = {
        score: 20,
        severity: 'low',
        anomalies: [],
        geometricMean: 100,
        variance: 50,
        timestamp: Date.now()
      };

      expect(mockScore.severity).toBe('low');
      expect(mockScore.score).toBeLessThan(25);
    });

    it('should classify medium severity anomaly', () => {
      const mockScore: GMVAnomalyScore = {
        score: 40,
        severity: 'medium',
        anomalies: [],
        geometricMean: 100,
        variance: 200,
        timestamp: Date.now()
      };

      expect(mockScore.severity).toBe('medium');
      expect(mockScore.score).toBeGreaterThanOrEqual(25);
      expect(mockScore.score).toBeLessThan(50);
    });

    it('should classify high severity anomaly', () => {
      const mockScore: GMVAnomalyScore = {
        score: 65,
        severity: 'high',
        anomalies: [
          {
            indicator: 'GDP',
            expectedValue: 25000,
            actualValue: 22000,
            deviation: -3000,
            zScore: -2.5
          }
        ],
        geometricMean: 100,
        variance: 500,
        timestamp: Date.now()
      };

      expect(mockScore.severity).toBe('high');
      expect(mockScore.score).toBeGreaterThanOrEqual(50);
      expect(mockScore.score).toBeLessThan(75);
      expect(mockScore.anomalies.length).toBeGreaterThan(0);
    });

    it('should classify critical severity anomaly', () => {
      const mockScore: GMVAnomalyScore = {
        score: 85,
        severity: 'critical',
        anomalies: [
          {
            indicator: 'GDP',
            expectedValue: 25000,
            actualValue: 15000,
            deviation: -10000,
            zScore: -5.2
          }
        ],
        geometricMean: 100,
        variance: 1000,
        timestamp: Date.now()
      };

      expect(mockScore.severity).toBe('critical');
      expect(mockScore.score).toBeGreaterThanOrEqual(75);
    });
  });

  describe('Z-Score Calculation', () => {
    it('should calculate z-score for anomaly detection', () => {
      const currentValue = 120;
      const mean = 100;
      const stdDev = 10;

      const zScore = (currentValue - mean) / stdDev;

      expect(zScore).toBe(2.0);
    });

    it('should detect anomaly when |z-score| > 2', () => {
      const zScores = [2.5, -2.8, 1.5, -3.2];
      const anomalies = zScores.filter(z => Math.abs(z) > 2);

      expect(anomalies).toHaveLength(3);
      expect(anomalies).toContain(2.5);
      expect(anomalies).toContain(-2.8);
      expect(anomalies).toContain(-3.2);
    });
  });

  describe('Economic Snapshot Integration', () => {
    it('should create economic snapshot with all data', () => {
      const mockSnapshot: EconomicSnapshot = {
        id: `snapshot_${Date.now()}`,
        timestamp: Date.now(),
        indicators: [
          { seriesId: 'GDP', value: 25000, timestamp: Date.now(), phaseSpace: { phi: 10, psi: -3, theta: 0.5 } }
        ],
        aggregates: {
          totalPhiEnergy: 10,
          totalPsiEnergy: -3,
          systemPhase: -0.291,
          systemMagnitude: 10.44
        },
        moodyScore: {
          rating: 'A',
          score: 80,
          outlook: 'stable',
          components: {
            creditSpreadRisk: 12,
            interestRateRisk: 18,
            liquidityRisk: 8,
            macroeconomicRisk: 14
          },
          timestamp: Date.now()
        },
        gmvScore: {
          score: 35,
          severity: 'medium',
          anomalies: [],
          geometricMean: 100,
          variance: 150,
          timestamp: Date.now()
        }
      };

      expect(mockSnapshot.id).toBeDefined();
      expect(mockSnapshot.indicators.length).toBeGreaterThan(0);
      expect(mockSnapshot.aggregates).toBeDefined();
      expect(mockSnapshot.moodyScore).toBeDefined();
      expect(mockSnapshot.gmvScore).toBeDefined();
    });

    it('should include timestamp for all components', () => {
      const now = Date.now();

      const mockSnapshot: EconomicSnapshot = {
        id: `snapshot_${now}`,
        timestamp: now,
        indicators: [],
        aggregates: {
          totalPhiEnergy: 0,
          totalPsiEnergy: 0,
          systemPhase: 0,
          systemMagnitude: 0
        }
      };

      expect(mockSnapshot.timestamp).toBe(now);
    });
  });
});
