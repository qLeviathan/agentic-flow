/**
 * Market Data Client for Real-Time Indices
 *
 * Yahoo Finance integration for real-time market data (SPY, QQQ, DIA, IWM, VIX)
 * with 15-second polling and WebSocket streaming support.
 */

import { encodeEconomicIndicator, ZeckendorfEconomicIndicator } from './zeckendorf-encoder';
import { EventEmitter } from 'events';

/**
 * Market index data
 */
export interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: number;
  zeckendorf?: {
    priceEncoded: number[];
    volumeEncoded: number[];
  };
  technicals?: {
    sma20: number;
    sma50: number;
    sma200: number;
    rsi14: number;
    macd: number;
  };
}

/**
 * Market client configuration
 */
export interface MarketClientConfig {
  baseUrl: string;
  symbols: string[];
  updateInterval: number; // milliseconds
  enableWebSocket: boolean;
  timeout: number;
  retryAttempts: number;
}

/**
 * Yahoo Finance quote response
 */
interface YahooQuoteResponse {
  quoteResponse: {
    result: Array<{
      symbol: string;
      longName?: string;
      shortName?: string;
      regularMarketPrice: number;
      regularMarketChange: number;
      regularMarketChangePercent: number;
      regularMarketVolume: number;
      regularMarketTime: number;
      fiftyDayAverage?: number;
      twoHundredDayAverage?: number;
    }>;
    error: null | any;
  };
}

/**
 * Market Data Client
 */
export class MarketClient extends EventEmitter {
  private config: MarketClientConfig;
  private pollingInterval: NodeJS.Timeout | null = null;
  private cache: Map<string, MarketIndex> = new Map();
  private isPolling: boolean = false;

  // Default major market indices
  static readonly DEFAULT_SYMBOLS = [
    'SPY',   // S&P 500 ETF
    'QQQ',   // Nasdaq 100 ETF
    'DIA',   // Dow Jones ETF
    'IWM',   // Russell 2000 ETF
    '^VIX',  // Volatility Index
    'GLD',   // Gold ETF
    'TLT',   // 20+ Year Treasury ETF
    'USO',   // Oil ETF
    'UUP',   // Dollar Index ETF
    'HYG',   // High Yield Corporate Bonds
  ];

  constructor(config: Partial<MarketClientConfig> = {}) {
    super();

    this.config = {
      baseUrl: config.baseUrl || 'https://query1.finance.yahoo.com/v7/finance',
      symbols: config.symbols || MarketClient.DEFAULT_SYMBOLS,
      updateInterval: config.updateInterval || 15000, // 15 seconds
      enableWebSocket: config.enableWebSocket || false,
      timeout: config.timeout || 10000,
      retryAttempts: config.retryAttempts || 3,
    };
  }

  /**
   * Start polling for market data
   */
  startPolling(): void {
    if (this.isPolling) {
      console.log('Market polling already active');
      return;
    }

    this.isPolling = true;
    console.log(`Starting market data polling (${this.config.updateInterval}ms interval)`);

    // Immediate fetch
    this.fetchAllIndices().catch(err => {
      console.error('Initial market fetch failed:', err.message);
    });

    // Set up polling
    this.pollingInterval = setInterval(async () => {
      try {
        await this.fetchAllIndices();
      } catch (error) {
        console.error('Market polling error:', error);
        this.emit('error', error);
      }
    }, this.config.updateInterval);
  }

  /**
   * Stop polling
   */
  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      this.isPolling = false;
      console.log('Market data polling stopped');
    }
  }

  /**
   * Fetch all configured indices
   */
  async fetchAllIndices(): Promise<MarketIndex[]> {
    const symbols = this.config.symbols.join(',');
    const url = `${this.config.baseUrl}/quote?symbols=${symbols}`;

    try {
      const response = await this.fetchWithRetry(url);
      const data: YahooQuoteResponse = await response.json();

      if (data.quoteResponse.error) {
        throw new Error(`Yahoo Finance error: ${JSON.stringify(data.quoteResponse.error)}`);
      }

      const indices = data.quoteResponse.result.map(quote => this.parseQuote(quote));

      // Update cache
      indices.forEach(index => {
        this.cache.set(index.symbol, index);
      });

      // Emit update event
      this.emit('update', indices);

      return indices;
    } catch (error) {
      console.error('Failed to fetch market indices:', error);
      throw error;
    }
  }

  /**
   * Fetch single index
   */
  async fetchIndex(symbol: string): Promise<MarketIndex> {
    const url = `${this.config.baseUrl}/quote?symbols=${symbol}`;

    const response = await this.fetchWithRetry(url);
    const data: YahooQuoteResponse = await response.json();

    if (data.quoteResponse.error || data.quoteResponse.result.length === 0) {
      throw new Error(`No data found for symbol ${symbol}`);
    }

    const index = this.parseQuote(data.quoteResponse.result[0]);
    this.cache.set(symbol, index);

    return index;
  }

  /**
   * Fetch and encode to Zeckendorf representation
   */
  async fetchIndexEncoded(symbol: string): Promise<{
    index: MarketIndex;
    priceEncoded: ZeckendorfEconomicIndicator;
    volumeEncoded: ZeckendorfEconomicIndicator;
  }> {
    const index = await this.fetchIndex(symbol);

    const priceEncoded = encodeEconomicIndicator(
      symbol,
      index.price,
      'PRICE',
      'YAHOO',
      index.timestamp
    );

    const volumeEncoded = encodeEconomicIndicator(
      `${symbol}_VOL`,
      index.volume,
      'VOLUME',
      'YAHOO',
      index.timestamp
    );

    return {
      index,
      priceEncoded,
      volumeEncoded,
    };
  }

  /**
   * Fetch all indices encoded
   */
  async fetchAllIndicesEncoded(): Promise<Array<{
    index: MarketIndex;
    priceEncoded: ZeckendorfEconomicIndicator;
    volumeEncoded: ZeckendorfEconomicIndicator;
  }>> {
    const indices = await this.fetchAllIndices();

    return Promise.all(
      indices.map(async index => {
        const priceEncoded = encodeEconomicIndicator(
          index.symbol,
          index.price,
          'PRICE',
          'YAHOO',
          index.timestamp
        );

        const volumeEncoded = encodeEconomicIndicator(
          `${index.symbol}_VOL`,
          index.volume,
          'VOLUME',
          'YAHOO',
          index.timestamp
        );

        return {
          index,
          priceEncoded,
          volumeEncoded,
        };
      })
    );
  }

  /**
   * Get cached index data
   */
  getCached(symbol: string): MarketIndex | undefined {
    return this.cache.get(symbol);
  }

  /**
   * Get all cached indices
   */
  getAllCached(): MarketIndex[] {
    return Array.from(this.cache.values());
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Parse Yahoo Finance quote response
   */
  private parseQuote(quote: any): MarketIndex {
    return {
      symbol: quote.symbol,
      name: quote.longName || quote.shortName || quote.symbol,
      price: quote.regularMarketPrice || 0,
      change: quote.regularMarketChange || 0,
      changePercent: quote.regularMarketChangePercent || 0,
      volume: quote.regularMarketVolume || 0,
      timestamp: quote.regularMarketTime * 1000, // Convert to milliseconds
      technicals: {
        sma20: quote.fiftyDayAverage || 0,
        sma50: quote.fiftyDayAverage || 0,
        sma200: quote.twoHundredDayAverage || 0,
        rsi14: 50, // Placeholder - would need additional API call
        macd: 0,   // Placeholder - would need additional API call
      },
    };
  }

  /**
   * Fetch with retry logic
   */
  private async fetchWithRetry(url: string, attempt: number = 0): Promise<Response> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AURELIA-Trading/1.0)',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      if (attempt < this.config.retryAttempts) {
        const delay = 1000 * Math.pow(2, attempt);
        console.log(`Retry ${attempt + 1}/${this.config.retryAttempts} after ${delay}ms`);
        await this.sleep(delay);
        return this.fetchWithRetry(url, attempt + 1);
      }

      throw error;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stopPolling();
    this.clearCache();
    this.removeAllListeners();
  }
}

/**
 * WebSocket-based real-time market data stream (future implementation)
 */
export class MarketWebSocketClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private symbols: string[];
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  constructor(symbols: string[]) {
    super();
    this.symbols = symbols;
  }

  /**
   * Connect to WebSocket stream
   * Note: This is a placeholder for future WebSocket implementation
   */
  connect(): void {
    console.log('WebSocket streaming not yet implemented');
    console.log('Use HTTP polling via MarketClient for now');
    // TODO: Implement WebSocket connection to real-time market data provider
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Subscribe to additional symbols
   */
  subscribe(symbols: string[]): void {
    this.symbols = [...new Set([...this.symbols, ...symbols])];
    // TODO: Send subscribe message via WebSocket
  }

  /**
   * Unsubscribe from symbols
   */
  unsubscribe(symbols: string[]): void {
    this.symbols = this.symbols.filter(s => !symbols.includes(s));
    // TODO: Send unsubscribe message via WebSocket
  }
}

/**
 * Predefined symbol groups
 */
export const SYMBOL_GROUPS = {
  MAJOR_INDICES: ['SPY', 'QQQ', 'DIA', 'IWM'],
  VOLATILITY: ['^VIX', '^VXN'],
  COMMODITIES: ['GLD', 'SLV', 'USO', 'UNG'],
  FIXED_INCOME: ['TLT', 'IEF', 'SHY', 'LQD', 'HYG'],
  CURRENCIES: ['UUP', 'FXE', 'FXY'],
  SECTORS: ['XLF', 'XLK', 'XLE', 'XLV', 'XLI', 'XLP', 'XLY', 'XLU', 'XLB', 'XLRE'],
  ALL_DEFAULT: MarketClient.DEFAULT_SYMBOLS,
};

export default MarketClient;
