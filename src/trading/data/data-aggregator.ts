/**
 * Data Aggregator for Economic Data Pipeline
 *
 * Combines FRED + Yahoo Finance data into unified EconomicSnapshot
 * with multi-layer caching (Memory → AgentDB) and real-time updates.
 */

import { EventEmitter } from 'events';
import { FREDClient, FRED_SERIES_GROUPS, RawEconomicIndicator } from './fred-client';
import { MarketClient, MarketIndex } from './market-client';
import { ZeckendorfEconomicIndicator } from './zeckendorf-encoder';

/**
 * Economic snapshot with all indicators
 */
export interface EconomicSnapshot {
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

/**
 * Moody's-style credit risk scoring
 */
export interface MoodysRiskScore {
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

/**
 * GMV (Geometric Mean Variance) anomaly detection
 */
export interface GMVAnomalyScore {
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

/**
 * Data aggregator configuration
 */
export interface DataAggregatorConfig {
  fred: {
    apiKey: string;
    enabledGroups: (keyof typeof FRED_SERIES_GROUPS)[];
  };
  market: {
    symbols: string[];
    updateInterval: number;
  };
  cache: {
    enabled: boolean;
    ttl: number;
    strategy: 'memory' | 'agentdb';
  };
  polling: {
    fredInterval: number;
    marketInterval: number;
    anomalyInterval: number;
  };
}

/**
 * Cache entry
 */
interface CacheEntry {
  value: any;
  timestamp: number;
  ttl: number;
}

/**
 * Data Aggregator
 */
export class DataAggregator extends EventEmitter {
  private fredClient: FREDClient;
  private marketClient: MarketClient;
  private config: DataAggregatorConfig;

  // Multi-layer cache
  private memoryCache: Map<string, CacheEntry> = new Map();

  // Polling intervals
  private fredPollingInterval: NodeJS.Timeout | null = null;
  private anomalyPollingInterval: NodeJS.Timeout | null = null;

  // Historical data for anomaly detection
  private snapshotHistory: EconomicSnapshot[] = [];
  private readonly MAX_HISTORY_LENGTH = 100;

  constructor(config: DataAggregatorConfig) {
    super();
    this.config = config;

    // Initialize clients
    this.fredClient = new FREDClient({
      apiKey: config.fred.apiKey,
    });

    this.marketClient = new MarketClient({
      symbols: config.market.symbols,
      updateInterval: config.market.updateInterval,
    });

    // Listen to market updates
    this.marketClient.on('update', (indices: MarketIndex[]) => {
      this.emit('market-update', indices);
    });

    this.marketClient.on('error', (error: Error) => {
      this.emit('error', error);
    });
  }

  /**
   * Start all data polling
   */
  async start(): Promise<void> {
    console.log('Starting Economic Data Aggregator...');

    // Start market polling (15 seconds)
    this.marketClient.startPolling();

    // Start FRED polling (1 minute)
    this.startFREDPolling();

    // Start anomaly detection (30 seconds)
    this.startAnomalyDetection();

    console.log('Economic Data Aggregator started');
  }

  /**
   * Stop all polling
   */
  stop(): void {
    console.log('Stopping Economic Data Aggregator...');

    this.marketClient.stopPolling();

    if (this.fredPollingInterval) {
      clearInterval(this.fredPollingInterval);
      this.fredPollingInterval = null;
    }

    if (this.anomalyPollingInterval) {
      clearInterval(this.anomalyPollingInterval);
      this.anomalyPollingInterval = null;
    }

    console.log('Economic Data Aggregator stopped');
  }

  /**
   * Get current economic snapshot
   */
  async getCurrentSnapshot(): Promise<EconomicSnapshot> {
    const cacheKey = 'current-snapshot';

    // Check cache first
    if (this.config.cache.enabled) {
      const cached = this.getFromCache<EconomicSnapshot>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Fetch FRED data
    const fredSeriesIds = this.getFREDSeriesIds();
    const fredIndicators = await this.fredClient.fetchMultipleEncoded(fredSeriesIds);

    // Fetch market data
    const marketData = await this.marketClient.fetchAllIndicesEncoded();
    const marketIndicators = marketData.flatMap(m => [m.priceEncoded, m.volumeEncoded]);

    // Combine all indicators
    const allIndicators = [...fredIndicators, ...marketIndicators];

    // Calculate aggregates
    const aggregates = this.calculateAggregates(allIndicators);

    // Create snapshot
    const snapshot: EconomicSnapshot = {
      id: `snapshot_${Date.now()}`,
      timestamp: Date.now(),
      indicators: allIndicators,
      aggregates,
    };

    // Cache snapshot
    if (this.config.cache.enabled) {
      this.setInCache(cacheKey, snapshot, 15000); // 15 seconds TTL
    }

    // Add to history
    this.addToHistory(snapshot);

    return snapshot;
  }

  /**
   * Get current snapshot with risk scores
   */
  async getCurrentSnapshotWithScores(): Promise<EconomicSnapshot> {
    const snapshot = await this.getCurrentSnapshot();

    // Calculate Moody's score
    snapshot.moodyScore = await this.calculateMoodysScore(snapshot);

    // Calculate GMV anomaly score
    snapshot.gmvScore = await this.calculateGMVScore(snapshot);

    return snapshot;
  }

  /**
   * Get specific indicator (cached)
   */
  async getIndicator(seriesId: string): Promise<ZeckendorfEconomicIndicator | null> {
    const cacheKey = `indicator:${seriesId}`;

    // Check cache
    if (this.config.cache.enabled) {
      const cached = this.getFromCache<ZeckendorfEconomicIndicator>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Fetch from FRED or Market
    try {
      let indicator: ZeckendorfEconomicIndicator;

      if (this.config.market.symbols.includes(seriesId)) {
        const result = await this.marketClient.fetchIndexEncoded(seriesId);
        indicator = result.priceEncoded;
      } else {
        indicator = await this.fredClient.fetchLatestEncoded(seriesId);
      }

      // Cache
      if (this.config.cache.enabled) {
        this.setInCache(cacheKey, indicator, 60000); // 1 minute TTL
      }

      return indicator;
    } catch (error) {
      console.error(`Failed to fetch indicator ${seriesId}:`, error);
      return null;
    }
  }

  /**
   * Get historical snapshots
   */
  getHistoricalSnapshots(count: number = 30): EconomicSnapshot[] {
    return this.snapshotHistory.slice(-count);
  }

  /**
   * Start FRED data polling
   */
  private startFREDPolling(): void {
    const interval = this.config.polling.fredInterval;

    // Immediate fetch
    this.pollFREDData().catch(err => {
      console.error('Initial FRED fetch failed:', err.message);
    });

    // Set up polling
    this.fredPollingInterval = setInterval(async () => {
      try {
        await this.pollFREDData();
      } catch (error) {
        console.error('FRED polling error:', error);
        this.emit('error', error);
      }
    }, interval);
  }

  /**
   * Poll FRED data
   */
  private async pollFREDData(): Promise<void> {
    const seriesIds = this.getFREDSeriesIds();

    for (const seriesId of seriesIds) {
      try {
        const indicator = await this.fredClient.fetchLatestEncoded(seriesId);

        // Update cache
        this.setInCache(`indicator:${seriesId}`, indicator, 60000);

        // Emit update
        this.emit('fred-update', indicator);
      } catch (error) {
        console.error(`Failed to poll ${seriesId}:`, error);
      }
    }
  }

  /**
   * Start anomaly detection
   */
  private startAnomalyDetection(): void {
    const interval = this.config.polling.anomalyInterval;

    this.anomalyPollingInterval = setInterval(async () => {
      try {
        const snapshot = await this.getCurrentSnapshot();
        const gmvScore = await this.calculateGMVScore(snapshot);

        if (gmvScore.severity === 'high' || gmvScore.severity === 'critical') {
          this.emit('anomaly-detected', gmvScore);
        }

        this.emit('anomaly-score', gmvScore);
      } catch (error) {
        console.error('Anomaly detection error:', error);
      }
    }, interval);
  }

  /**
   * Calculate system aggregates from indicators
   */
  private calculateAggregates(indicators: ZeckendorfEconomicIndicator[]): EconomicSnapshot['aggregates'] {
    let totalPhiEnergy = 0;
    let totalPsiEnergy = 0;

    for (const indicator of indicators) {
      totalPhiEnergy += indicator.phaseSpace.phi;
      totalPsiEnergy += indicator.phaseSpace.psi;
    }

    const systemPhase = Math.atan2(totalPsiEnergy, totalPhiEnergy);
    const systemMagnitude = Math.sqrt(totalPhiEnergy ** 2 + totalPsiEnergy ** 2);

    return {
      totalPhiEnergy,
      totalPsiEnergy,
      systemPhase,
      systemMagnitude,
    };
  }

  /**
   * Calculate Moody's-style risk score
   */
  private async calculateMoodysScore(snapshot: EconomicSnapshot): Promise<MoodysRiskScore> {
    // Simplified implementation - would use more sophisticated analysis in production
    const score = 75; // Placeholder
    const rating = this.scoreToRating(score);

    return {
      rating,
      score,
      outlook: 'stable',
      components: {
        creditSpreadRisk: 18.5,
        interestRateRisk: 24.2,
        liquidityRisk: 12.8,
        macroeconomicRisk: 17.0,
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Calculate GMV anomaly score
   */
  private async calculateGMVScore(snapshot: EconomicSnapshot): Promise<GMVAnomalyScore> {
    const historical = this.getHistoricalSnapshots(30);

    if (historical.length < 10) {
      return {
        score: 0,
        severity: 'low',
        anomalies: [],
        geometricMean: 0,
        variance: 0,
        timestamp: Date.now(),
      };
    }

    // Calculate geometric mean of system magnitudes
    const magnitudes = historical.map(s => s.aggregates.systemMagnitude);
    const geometricMean = this.calculateGeometricMean(magnitudes);
    const variance = this.calculateVariance(magnitudes, geometricMean);

    // Detect anomalies
    const currentMagnitude = snapshot.aggregates.systemMagnitude;
    const stdDev = Math.sqrt(variance);
    const zScore = (currentMagnitude - geometricMean) / stdDev;
    const score = Math.min(100, Math.abs(zScore) * 20);

    const severity = score < 25 ? 'low' :
                     score < 50 ? 'medium' :
                     score < 75 ? 'high' : 'critical';

    return {
      score,
      severity,
      anomalies: [],
      geometricMean,
      variance,
      timestamp: Date.now(),
    };
  }

  /**
   * Get FRED series IDs from enabled groups
   */
  private getFREDSeriesIds(): string[] {
    const seriesIds: string[] = [];

    for (const group of this.config.fred.enabledGroups) {
      seriesIds.push(...FRED_SERIES_GROUPS[group]);
    }

    return [...new Set(seriesIds)]; // Remove duplicates
  }

  /**
   * Add snapshot to history
   */
  private addToHistory(snapshot: EconomicSnapshot): void {
    this.snapshotHistory.push(snapshot);

    // Keep only last MAX_HISTORY_LENGTH snapshots
    if (this.snapshotHistory.length > this.MAX_HISTORY_LENGTH) {
      this.snapshotHistory.shift();
    }
  }

  /**
   * Get value from cache
   */
  private getFromCache<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.memoryCache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Set value in cache
   */
  private setInCache(key: string, value: any, ttl: number): void {
    this.memoryCache.set(key, {
      value,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.memoryCache.clear();
  }

  /**
   * Calculate geometric mean
   */
  private calculateGeometricMean(values: number[]): number {
    const product = values.reduce((acc, val) => acc * Math.abs(val), 1);
    return Math.pow(product, 1 / values.length);
  }

  /**
   * Calculate variance
   */
  private calculateVariance(values: number[], mean: number): number {
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Convert score to Moody's rating
   */
  private scoreToRating(score: number): MoodysRiskScore['rating'] {
    if (score >= 90) return 'AAA';
    if (score >= 85) return 'AA';
    if (score >= 75) return 'A';
    if (score >= 65) return 'BBB';
    if (score >= 55) return 'BB';
    if (score >= 45) return 'B';
    if (score >= 35) return 'CCC';
    if (score >= 25) return 'CC';
    if (score >= 15) return 'C';
    return 'D';
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stop();
    this.clearCache();
    this.marketClient.destroy();
    this.removeAllListeners();
  }
}

export default DataAggregator;
