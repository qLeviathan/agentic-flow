/**
 * FRED API Client for Economic Data
 *
 * Federal Reserve Economic Data (FRED) integration for fetching 30+ economic indicators
 * with rate limiting, retry logic, and automatic Zeckendorf encoding.
 */

import { encodeEconomicIndicator, SCALING_FACTORS, ZeckendorfEconomicIndicator } from './zeckendorf-encoder';

/**
 * Raw economic indicator from FRED API
 */
export interface RawEconomicIndicator {
  seriesId: string;
  name: string;
  value: number;
  timestamp: number;
  source: 'FRED' | 'YAHOO' | 'ALPHAVANTAGE' | 'QUANDL';
  frequency: 'realtime' | 'daily' | 'weekly' | 'monthly' | 'quarterly';
  unit: string;
  metadata: {
    seasonallyAdjusted: boolean;
    revision: number;
    releaseDate?: number;
  };
}

/**
 * FRED API configuration
 */
export interface FREDConfig {
  apiKey: string;
  baseUrl: string;
  rateLimit: number; // requests per minute
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

/**
 * FRED series metadata
 */
interface FREDSeriesInfo {
  id: string;
  name: string;
  frequency: string;
  units: string;
  dataType: keyof typeof SCALING_FACTORS;
}

/**
 * FRED API response types
 */
interface FREDObservation {
  date: string;
  value: string;
  realtime_start: string;
  realtime_end: string;
}

interface FREDResponse {
  observations: FREDObservation[];
  realtime_start: string;
  realtime_end: string;
  observation_start: string;
  observation_end: string;
  units: string;
  output_type: number;
  file_type: string;
  order_by: string;
  sort_order: string;
  count: number;
  offset: number;
  limit: number;
}

/**
 * Rate limiter using token bucket algorithm
 */
class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly capacity: number;
  private readonly refillRate: number;

  constructor(requestsPerMinute: number) {
    this.capacity = requestsPerMinute;
    this.tokens = requestsPerMinute;
    this.lastRefill = Date.now();
    this.refillRate = requestsPerMinute / 60; // tokens per second
  }

  async waitForToken(): Promise<void> {
    this.refill();

    while (this.tokens < 1) {
      const delay = (1 / this.refillRate) * 1000;
      await this.sleep(delay);
      this.refill();
    }

    this.tokens--;
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    const tokensToAdd = elapsed * this.refillRate;

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * FRED API Client
 */
export class FREDClient {
  private config: FREDConfig;
  private rateLimiter: RateLimiter;
  private seriesMetadata: Map<string, FREDSeriesInfo>;

  constructor(config: Partial<FREDConfig> = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.FRED_API_KEY || '',
      baseUrl: config.baseUrl || 'https://api.stlouisfed.org/fred',
      rateLimit: config.rateLimit || 120,
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
    };

    if (!this.config.apiKey) {
      throw new Error('FRED API key is required. Set FRED_API_KEY environment variable.');
    }

    this.rateLimiter = new RateLimiter(this.config.rateLimit);
    this.seriesMetadata = this.initializeSeriesMetadata();
  }

  /**
   * Initialize metadata for 30+ economic indicators
   */
  private initializeSeriesMetadata(): Map<string, FREDSeriesInfo> {
    const metadata = new Map<string, FREDSeriesInfo>();

    // Interest Rates
    metadata.set('DFF', { id: 'DFF', name: 'Federal Funds Rate', frequency: 'daily', units: 'percent', dataType: 'INTEREST_RATE' });
    metadata.set('DGS10', { id: 'DGS10', name: '10-Year Treasury Rate', frequency: 'daily', units: 'percent', dataType: 'INTEREST_RATE' });
    metadata.set('DGS2', { id: 'DGS2', name: '2-Year Treasury Rate', frequency: 'daily', units: 'percent', dataType: 'INTEREST_RATE' });
    metadata.set('DGS5', { id: 'DGS5', name: '5-Year Treasury Rate', frequency: 'daily', units: 'percent', dataType: 'INTEREST_RATE' });
    metadata.set('DGS30', { id: 'DGS30', name: '30-Year Treasury Rate', frequency: 'daily', units: 'percent', dataType: 'INTEREST_RATE' });
    metadata.set('T10Y2Y', { id: 'T10Y2Y', name: '10-Year - 2-Year Treasury Spread', frequency: 'daily', units: 'percent', dataType: 'INTEREST_RATE' });

    // Inflation
    metadata.set('CPIAUCSL', { id: 'CPIAUCSL', name: 'Consumer Price Index', frequency: 'monthly', units: 'index', dataType: 'INDEX' });
    metadata.set('PCEPI', { id: 'PCEPI', name: 'PCE Price Index', frequency: 'monthly', units: 'index', dataType: 'INDEX' });
    metadata.set('CPILFESL', { id: 'CPILFESL', name: 'Core CPI', frequency: 'monthly', units: 'index', dataType: 'INDEX' });
    metadata.set('T5YIE', { id: 'T5YIE', name: '5-Year Breakeven Inflation', frequency: 'daily', units: 'percent', dataType: 'INFLATION' });

    // Employment
    metadata.set('UNRATE', { id: 'UNRATE', name: 'Unemployment Rate', frequency: 'monthly', units: 'percent', dataType: 'PERCENTAGE' });
    metadata.set('PAYEMS', { id: 'PAYEMS', name: 'Nonfarm Payrolls', frequency: 'monthly', units: 'thousands', dataType: 'VOLUME' });
    metadata.set('CIVPART', { id: 'CIVPART', name: 'Labor Force Participation', frequency: 'monthly', units: 'percent', dataType: 'PERCENTAGE' });
    metadata.set('ICSA', { id: 'ICSA', name: 'Initial Jobless Claims', frequency: 'weekly', units: 'thousands', dataType: 'VOLUME' });

    // GDP & Growth
    metadata.set('GDP', { id: 'GDP', name: 'Gross Domestic Product', frequency: 'quarterly', units: 'billions', dataType: 'GDP' });
    metadata.set('GDPC1', { id: 'GDPC1', name: 'Real GDP', frequency: 'quarterly', units: 'billions', dataType: 'GDP' });
    metadata.set('GDPPOT', { id: 'GDPPOT', name: 'Potential GDP', frequency: 'quarterly', units: 'billions', dataType: 'GDP' });

    // Money Supply
    metadata.set('M2SL', { id: 'M2SL', name: 'M2 Money Supply', frequency: 'monthly', units: 'billions', dataType: 'GDP' });
    metadata.set('WALCL', { id: 'WALCL', name: 'Fed Balance Sheet', frequency: 'weekly', units: 'billions', dataType: 'GDP' });
    metadata.set('BOGMBASE', { id: 'BOGMBASE', name: 'Monetary Base', frequency: 'weekly', units: 'billions', dataType: 'GDP' });

    // Credit Markets
    metadata.set('MORTGAGE30US', { id: 'MORTGAGE30US', name: '30-Year Mortgage Rate', frequency: 'weekly', units: 'percent', dataType: 'INTEREST_RATE' });
    metadata.set('BAA10Y', { id: 'BAA10Y', name: 'BAA-10Y Spread', frequency: 'daily', units: 'percent', dataType: 'INTEREST_RATE' });
    metadata.set('DEXCHUS', { id: 'DEXCHUS', name: 'USD/CNY Exchange Rate', frequency: 'daily', units: 'rate', dataType: 'PRICE' });
    metadata.set('DTWEXBGS', { id: 'DTWEXBGS', name: 'Dollar Index (Broad)', frequency: 'daily', units: 'index', dataType: 'INDEX' });

    // Consumer Metrics
    metadata.set('RSXFS', { id: 'RSXFS', name: 'Retail Sales', frequency: 'monthly', units: 'millions', dataType: 'GDP' });
    metadata.set('PCE', { id: 'PCE', name: 'Personal Consumption', frequency: 'monthly', units: 'billions', dataType: 'GDP' });
    metadata.set('UMCSENT', { id: 'UMCSENT', name: 'Consumer Sentiment', frequency: 'monthly', units: 'index', dataType: 'INDEX' });

    // Housing
    metadata.set('HOUST', { id: 'HOUST', name: 'Housing Starts', frequency: 'monthly', units: 'thousands', dataType: 'VOLUME' });
    metadata.set('CSUSHPINSA', { id: 'CSUSHPINSA', name: 'Case-Shiller Index', frequency: 'monthly', units: 'index', dataType: 'INDEX' });

    // Manufacturing
    metadata.set('INDPRO', { id: 'INDPRO', name: 'Industrial Production', frequency: 'monthly', units: 'index', dataType: 'INDEX' });

    return metadata;
  }

  /**
   * Fetch latest observation for a series
   */
  async fetchLatest(seriesId: string): Promise<RawEconomicIndicator> {
    await this.rateLimiter.waitForToken();

    const url = `${this.config.baseUrl}/series/observations`;
    const params = new URLSearchParams({
      series_id: seriesId,
      api_key: this.config.apiKey,
      file_type: 'json',
      sort_order: 'desc',
      limit: '1',
    });

    const response = await this.fetchWithRetry(`${url}?${params}`);
    const data: FREDResponse = await response.json();

    if (!data.observations || data.observations.length === 0) {
      throw new Error(`No observations found for series ${seriesId}`);
    }

    const latest = data.observations[0];
    const metadata = this.seriesMetadata.get(seriesId);

    if (!metadata) {
      throw new Error(`Unknown series ID: ${seriesId}`);
    }

    return {
      seriesId,
      name: metadata.name,
      value: parseFloat(latest.value),
      timestamp: new Date(latest.date).getTime(),
      source: 'FRED',
      frequency: this.mapFrequency(metadata.frequency),
      unit: metadata.units,
      metadata: {
        seasonallyAdjusted: true,
        revision: 0,
      },
    };
  }

  /**
   * Fetch latest and encode to Zeckendorf representation
   */
  async fetchLatestEncoded(seriesId: string): Promise<ZeckendorfEconomicIndicator> {
    const raw = await this.fetchLatest(seriesId);
    const metadata = this.seriesMetadata.get(seriesId);

    if (!metadata) {
      throw new Error(`Unknown series ID: ${seriesId}`);
    }

    return encodeEconomicIndicator(
      raw.seriesId,
      raw.value,
      metadata.dataType,
      'FRED',
      raw.timestamp
    );
  }

  /**
   * Fetch multiple series in parallel
   */
  async fetchMultiple(seriesIds: string[]): Promise<RawEconomicIndicator[]> {
    const results = await Promise.all(
      seriesIds.map(id => this.fetchLatest(id).catch(err => {
        console.error(`Failed to fetch ${id}:`, err.message);
        return null;
      }))
    );

    return results.filter((r): r is RawEconomicIndicator => r !== null);
  }

  /**
   * Fetch multiple series encoded
   */
  async fetchMultipleEncoded(seriesIds: string[]): Promise<ZeckendorfEconomicIndicator[]> {
    const results = await Promise.all(
      seriesIds.map(id => this.fetchLatestEncoded(id).catch(err => {
        console.error(`Failed to fetch and encode ${id}:`, err.message);
        return null;
      }))
    );

    return results.filter((r): r is ZeckendorfEconomicIndicator => r !== null);
  }

  /**
   * Fetch historical data for a series
   */
  async fetchHistorical(
    seriesId: string,
    startDate: Date,
    endDate: Date
  ): Promise<RawEconomicIndicator[]> {
    await this.rateLimiter.waitForToken();

    const url = `${this.config.baseUrl}/series/observations`;
    const params = new URLSearchParams({
      series_id: seriesId,
      api_key: this.config.apiKey,
      file_type: 'json',
      observation_start: startDate.toISOString().split('T')[0],
      observation_end: endDate.toISOString().split('T')[0],
      sort_order: 'asc',
    });

    const response = await this.fetchWithRetry(`${url}?${params}`);
    const data: FREDResponse = await response.json();
    const metadata = this.seriesMetadata.get(seriesId);

    if (!metadata) {
      throw new Error(`Unknown series ID: ${seriesId}`);
    }

    return data.observations
      .filter(obs => obs.value !== '.')
      .map(obs => ({
        seriesId,
        name: metadata.name,
        value: parseFloat(obs.value),
        timestamp: new Date(obs.date).getTime(),
        source: 'FRED' as const,
        frequency: this.mapFrequency(metadata.frequency),
        unit: metadata.units,
        metadata: {
          seasonallyAdjusted: true,
          revision: 0,
        },
      }));
  }

  /**
   * Get all available series IDs
   */
  getAvailableSeries(): string[] {
    return Array.from(this.seriesMetadata.keys());
  }

  /**
   * Get series metadata
   */
  getSeriesMetadata(seriesId: string): FREDSeriesInfo | undefined {
    return this.seriesMetadata.get(seriesId);
  }

  /**
   * Fetch with exponential backoff retry
   */
  private async fetchWithRetry(url: string, attempt: number = 0): Promise<Response> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      if (attempt < this.config.retryAttempts) {
        const delay = this.config.retryDelay * Math.pow(2, attempt);
        console.log(`Retry ${attempt + 1}/${this.config.retryAttempts} after ${delay}ms`);
        await this.sleep(delay);
        return this.fetchWithRetry(url, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Map FRED frequency to our frequency type
   */
  private mapFrequency(fredFrequency: string): RawEconomicIndicator['frequency'] {
    const mapping: Record<string, RawEconomicIndicator['frequency']> = {
      daily: 'daily',
      weekly: 'weekly',
      monthly: 'monthly',
      quarterly: 'quarterly',
    };

    return mapping[fredFrequency.toLowerCase()] || 'monthly';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Predefined series groups for convenience
 */
export const FRED_SERIES_GROUPS = {
  INTEREST_RATES: ['DFF', 'DGS10', 'DGS2', 'DGS5', 'DGS30', 'T10Y2Y'],
  INFLATION: ['CPIAUCSL', 'PCEPI', 'CPILFESL', 'T5YIE'],
  EMPLOYMENT: ['UNRATE', 'PAYEMS', 'CIVPART', 'ICSA'],
  GDP: ['GDP', 'GDPC1', 'GDPPOT'],
  MONEY_SUPPLY: ['M2SL', 'WALCL', 'BOGMBASE'],
  CREDIT_MARKETS: ['MORTGAGE30US', 'BAA10Y', 'DEXCHUS', 'DTWEXBGS'],
  CONSUMER: ['RSXFS', 'PCE', 'UMCSENT'],
  HOUSING: ['HOUST', 'CSUSHPINSA'],
  MANUFACTURING: ['INDPRO'],
  ALL: [
    'DFF', 'DGS10', 'DGS2', 'DGS5', 'DGS30', 'T10Y2Y',
    'CPIAUCSL', 'PCEPI', 'CPILFESL', 'T5YIE',
    'UNRATE', 'PAYEMS', 'CIVPART', 'ICSA',
    'GDP', 'GDPC1', 'GDPPOT',
    'M2SL', 'WALCL', 'BOGMBASE',
    'MORTGAGE30US', 'BAA10Y', 'DEXCHUS', 'DTWEXBGS',
    'RSXFS', 'PCE', 'UMCSENT',
    'HOUST', 'CSUSHPINSA',
    'INDPRO',
  ],
};

export default FREDClient;
