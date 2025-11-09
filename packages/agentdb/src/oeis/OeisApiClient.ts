/**
 * OeisApiClient - OEIS API Integration
 *
 * Fetches integer sequences from the Online Encyclopedia of Integer Sequences (OEIS).
 * Implements rate limiting, retry logic, and comprehensive error handling.
 *
 * API Documentation: https://oeis.org/wiki/JSON_Format,_Lightweight
 */

export interface OeisSequence {
  number: number;          // A-number (e.g., 45 for A000045)
  id: string;              // Full ID (e.g., "A000045")
  data: number[];          // Sequence values
  name: string;            // Sequence name/description
  comment?: string[];      // Comments about the sequence
  formula?: string[];      // Mathematical formulas
  example?: string[];      // Examples
  keyword?: string[];      // Keywords (e.g., "nonn", "easy")
  offset?: string;         // Offset information
  author?: string;         // Author information
  references?: string[];   // References
  links?: string[];        // External links
  crossrefs?: string[];    // Cross-references to other sequences
  extensions?: string[];   // Extensions to the sequence
}

export interface OeisSearchResult {
  count: number;
  results: OeisSequence[];
  start: number;
  greeting?: string;
}

export interface OeisApiConfig {
  baseUrl?: string;
  rateLimit?: number;      // Requests per minute
  timeout?: number;        // Request timeout in ms
  maxRetries?: number;     // Max retry attempts
  retryDelay?: number;     // Delay between retries in ms
}

export class OeisApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'OeisApiError';
  }
}

/**
 * OEIS API Client with rate limiting and error handling
 */
export class OeisApiClient {
  private config: Required<OeisApiConfig>;
  private lastRequestTime: number = 0;
  private requestQueue: Array<() => Promise<void>> = [];
  private isProcessingQueue: boolean = false;

  constructor(config: OeisApiConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || 'https://oeis.org',
      rateLimit: config.rateLimit || 10,        // 10 requests per minute (conservative)
      timeout: config.timeout || 30000,         // 30 seconds
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,    // 1 second
    };
  }

  /**
   * Search for sequences matching a query
   */
  async search(query: string, start: number = 0): Promise<OeisSearchResult> {
    const url = this.buildSearchUrl(query, start);
    return this.makeRequest<OeisSearchResult>(url);
  }

  /**
   * Get a specific sequence by A-number
   */
  async getSequence(aNumber: string): Promise<OeisSequence | null> {
    // Normalize A-number format (e.g., "45" -> "A000045", "A45" -> "A000045")
    const normalizedId = this.normalizeANumber(aNumber);
    const url = this.buildSequenceUrl(normalizedId);

    try {
      const result = await this.makeRequest<OeisSearchResult>(url);
      return result.results?.[0] || null;
    } catch (error) {
      if (error instanceof OeisApiError && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Search for sequences by value pattern
   */
  async searchByValues(values: number[]): Promise<OeisSearchResult> {
    const query = values.join(',');
    return this.search(query);
  }

  /**
   * Normalize A-number to standard format (A000000)
   */
  private normalizeANumber(aNumber: string): string {
    // Remove 'A' prefix if present
    const numStr = aNumber.replace(/^A/i, '');
    const num = parseInt(numStr, 10);

    if (isNaN(num) || num < 0) {
      throw new OeisApiError(
        `Invalid A-number: ${aNumber}`,
        'INVALID_A_NUMBER'
      );
    }

    // Pad to 6 digits
    return `A${num.toString().padStart(6, '0')}`;
  }

  /**
   * Build search URL
   */
  private buildSearchUrl(query: string, start: number): string {
    const params = new URLSearchParams({
      q: query,
      fmt: 'json',
      start: start.toString(),
    });
    return `${this.config.baseUrl}/search?${params.toString()}`;
  }

  /**
   * Build sequence URL
   */
  private buildSequenceUrl(aNumber: string): string {
    const params = new URLSearchParams({
      q: `id:${aNumber}`,
      fmt: 'json',
    });
    return `${this.config.baseUrl}/search?${params.toString()}`;
  }

  /**
   * Make HTTP request with rate limiting and retries
   */
  private async makeRequest<T>(url: string, retryCount: number = 0): Promise<T> {
    return new Promise((resolve, reject) => {
      const task = async () => {
        try {
          // Apply rate limiting
          await this.applyRateLimit();

          // Make the request with timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

          try {
            const response = await fetch(url, {
              signal: controller.signal,
              headers: {
                'User-Agent': 'AgentDB-OEIS-Client/1.0',
                'Accept': 'application/json',
              },
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
              throw new OeisApiError(
                `OEIS API request failed: ${response.statusText}`,
                'HTTP_ERROR',
                response.status
              );
            }

            const data = await response.json() as T;
            resolve(data);
          } catch (error) {
            clearTimeout(timeoutId);

            // Handle abort (timeout)
            if (error instanceof Error && error.name === 'AbortError') {
              throw new OeisApiError(
                `Request timeout after ${this.config.timeout}ms`,
                'TIMEOUT'
              );
            }

            throw error;
          }
        } catch (error) {
          // Retry logic
          if (retryCount < this.config.maxRetries) {
            console.warn(`OEIS API request failed, retrying (${retryCount + 1}/${this.config.maxRetries})...`);
            await this.delay(this.config.retryDelay * (retryCount + 1));

            try {
              const result = await this.makeRequest<T>(url, retryCount + 1);
              resolve(result);
            } catch (retryError) {
              reject(retryError);
            }
          } else {
            if (error instanceof OeisApiError) {
              reject(error);
            } else {
              reject(new OeisApiError(
                `OEIS API request failed: ${error instanceof Error ? error.message : String(error)}`,
                'REQUEST_FAILED',
                undefined,
                error
              ));
            }
          }
        }
      };

      this.requestQueue.push(task);
      this.processQueue();
    });
  }

  /**
   * Process request queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const task = this.requestQueue.shift();
      if (task) {
        await task();
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Apply rate limiting
   */
  private async applyRateLimit(): Promise<void> {
    const minInterval = 60000 / this.config.rateLimit; // Convert to ms per request
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < minInterval) {
      const delay = minInterval - timeSinceLastRequest;
      await this.delay(delay);
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Utility: delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Parse sequence data from OEIS format
   */
  parseSequenceData(sequence: OeisSequence): number[] {
    return sequence.data || [];
  }

  /**
   * Get sequence formulas
   */
  getFormulas(sequence: OeisSequence): string[] {
    return sequence.formula || [];
  }

  /**
   * Check if sequence is finite
   */
  isFiniteSequence(sequence: OeisSequence): boolean {
    return sequence.keyword?.includes('fini') || false;
  }

  /**
   * Check if sequence is easy to compute
   */
  isEasySequence(sequence: OeisSequence): boolean {
    return sequence.keyword?.includes('easy') || false;
  }

  /**
   * Get sequence cross-references
   */
  getCrossReferences(sequence: OeisSequence): string[] {
    return sequence.crossrefs || [];
  }
}
