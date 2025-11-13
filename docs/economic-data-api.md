# Economic Data Pipeline API - AURELIA Trading System

**Version:** 1.0.0
**Author:** Backend API Development Team
**Date:** 2025-11-13
**Status:** Design Specification

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Data Sources](#data-sources)
4. [TypeScript Interfaces](#typescript-interfaces)
5. [Zeckendorf Encoding Strategy](#zeckendorf-encoding-strategy)
6. [API Endpoints](#api-endpoints)
7. [Real-Time Data Ingestion](#real-time-data-ingestion)
8. [Moody's-Style Modeling](#moodys-style-modeling)
9. [GMV Anomaly Scoring](#gmv-anomaly-scoring)
10. [Caching Strategy](#caching-strategy)
11. [Error Handling](#error-handling)
12. [Rate Limiting](#rate-limiting)
13. [Integration Examples](#integration-examples)
14. [Performance Optimization](#performance-optimization)
15. [Security Considerations](#security-considerations)

---

## Overview

The Economic Data Pipeline API provides a comprehensive interface for fetching, processing, and storing 50+ critical economic indicators using φ-Mechanics integer-only mathematics. All data is Zeckendorf-encoded before storage in AgentDB, ensuring symbolic integrity and enabling phase-space analysis.

### Core Principles

- **Integer-Only Mechanics**: All values scaled to integers before Zeckendorf decomposition
- **Symbolic φ/ψ Representation**: Economic indicators mapped to phase space coordinates
- **Real-Time Processing**: Sub-second latency for critical market data
- **Anomaly Detection**: GMV-style scoring for market disruptions
- **Credit Risk Integration**: Moody's-inspired rating synthesis

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     AURELIA Trading System                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐        ┌──────────────────┐               │
│  │  Data Ingestion │───────▶│  Normalization   │               │
│  │   Layer         │        │  & Scaling       │               │
│  └─────────────────┘        └──────────────────┘               │
│           │                          │                          │
│           │                          ▼                          │
│           │                 ┌──────────────────┐               │
│           │                 │   Zeckendorf     │               │
│           │                 │   Encoding       │               │
│           │                 └──────────────────┘               │
│           │                          │                          │
│           ▼                          ▼                          │
│  ┌─────────────────┐        ┌──────────────────┐               │
│  │  Rate Limiter   │        │  Phase Space     │               │
│  │  & Cache        │        │  Mapping         │               │
│  └─────────────────┘        └──────────────────┘               │
│           │                          │                          │
│           └──────────┬───────────────┘                          │
│                      ▼                                          │
│              ┌──────────────────┐                               │
│              │   AgentDB        │                               │
│              │   Memory Store   │                               │
│              └──────────────────┘                               │
│                      │                                          │
│           ┌──────────┼──────────┐                               │
│           ▼          ▼          ▼                               │
│    ┌──────────┐ ┌────────┐ ┌─────────┐                        │
│    │ Moody's  │ │  GMV   │ │ Trading │                        │
│    │ Modeling │ │ Scoring│ │ Signals │                        │
│    └──────────┘ └────────┘ └─────────┘                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

External Data Sources:
├── FRED API (Federal Reserve Economic Data)
├── Yahoo Finance (Market Indices)
├── Alpha Vantage (Alternative Data)
└── Quandl/Nasdaq Data Link (Additional Indicators)
```

---

## Data Sources

### 1. FRED API (Federal Reserve Economic Data)

**Base URL:** `https://api.stlouisfed.org/fred/`
**Authentication:** API Key (query parameter)
**Rate Limit:** 120 requests/minute

#### Primary Economic Indicators (30 series)

| Category | Series ID | Description | Update Frequency |
|----------|-----------|-------------|------------------|
| **Interest Rates** | DFF | Federal Funds Rate | Daily |
| | DGS10 | 10-Year Treasury Rate | Daily |
| | DGS2 | 2-Year Treasury Rate | Daily |
| | DGS5 | 5-Year Treasury Rate | Daily |
| | DGS30 | 30-Year Treasury Rate | Daily |
| | T10Y2Y | 10-Year - 2-Year Spread | Daily |
| **Inflation** | CPIAUCSL | Consumer Price Index | Monthly |
| | PCEPI | PCE Price Index | Monthly |
| | CPILFESL | Core CPI | Monthly |
| | T5YIE | 5-Year Breakeven Inflation | Daily |
| **Employment** | UNRATE | Unemployment Rate | Monthly |
| | PAYEMS | Nonfarm Payrolls | Monthly |
| | CIVPART | Labor Force Participation | Monthly |
| | ICSA | Initial Jobless Claims | Weekly |
| **GDP & Growth** | GDP | Gross Domestic Product | Quarterly |
| | GDPC1 | Real GDP | Quarterly |
| | GDPPOT | Potential GDP | Quarterly |
| **Money Supply** | M2SL | M2 Money Supply | Monthly |
| | WALCL | Fed Balance Sheet | Weekly |
| | BOGMBASE | Monetary Base | Weekly |
| **Credit Markets** | MORTGAGE30US | 30-Year Mortgage Rate | Weekly |
| | BAA10Y | BAA-10Y Spread | Daily |
| | DEXCHUS | USD/CNY Exchange Rate | Daily |
| | DTWEXBGS | Dollar Index (Broad) | Daily |
| **Consumer Metrics** | RSXFS | Retail Sales | Monthly |
| | PCE | Personal Consumption | Monthly |
| | UMCSENT | Consumer Sentiment | Monthly |
| **Housing** | HOUST | Housing Starts | Monthly |
| | CSUSHPINSA | Case-Shiller Index | Monthly |
| **Manufacturing** | INDPRO | Industrial Production | Monthly |

### 2. Yahoo Finance API

**Base URL:** `https://query1.finance.yahoo.com/v8/finance/`
**Authentication:** None (public)
**Rate Limit:** Best effort (implement exponential backoff)

#### Major Market Indices (10 symbols)

| Symbol | Name | Update Frequency |
|--------|------|------------------|
| ^GSPC (SPY) | S&P 500 | Real-time (15s delay) |
| ^IXIC (QQQ) | Nasdaq 100 | Real-time (15s delay) |
| ^DJI (DIA) | Dow Jones Industrial | Real-time (15s delay) |
| ^RUT (IWM) | Russell 2000 | Real-time (15s delay) |
| ^VIX | CBOE Volatility Index | Real-time (15s delay) |
| GLD | Gold ETF | Real-time |
| TLT | 20+ Year Treasury ETF | Real-time |
| USO | Oil ETF | Real-time |
| UUP | Dollar Index ETF | Real-time |
| HYG | High Yield Corporate Bonds | Real-time |

### 3. Alpha Vantage (Supplementary)

**Base URL:** `https://www.alphavantage.co/query`
**Authentication:** API Key (query parameter)
**Rate Limit:** 5 requests/minute (free), 75/minute (premium)

#### Additional Indicators (10 series)

- Economic indicators not in FRED
- Cryptocurrency correlation data
- Commodity prices (Gold, Oil, Copper)
- Global market indices

---

## TypeScript Interfaces

### Core Data Types

```typescript
/**
 * Raw economic indicator before encoding
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
 * Scaled integer representation for Zeckendorf encoding
 * All economic values scaled to integers (e.g., basis points, cents)
 */
export interface ScaledEconomicValue {
  seriesId: string;
  rawValue: number;
  scaledValue: number;  // Integer representation
  scaleFactor: number;  // Multiplier used (e.g., 10000 for bps)
  unit: 'basis_points' | 'cents' | 'thousands' | 'millions' | 'index_points';
  timestamp: number;
}

/**
 * Zeckendorf-encoded economic indicator
 * Ready for phase space mapping
 */
export interface ZeckendorfEconomicIndicator {
  seriesId: string;
  rawValue: number;
  scaledValue: number;
  zeckendorf: {
    indices: Set<number>;      // Z(n): Fibonacci indices
    values: number[];          // Actual Fibonacci values
    summandCount: number;      // z(n): |Z(n)|
    lucasSummandCount: number; // ℓ(n): Lucas indices
    representation: string;    // Human-readable (e.g., "500 = F12+F9+F6")
  };
  phaseSpace: {
    phi: number;               // φ(n) coordinate
    psi: number;               // ψ(n) coordinate
    theta: number;             // Phase angle arctan(ψ/φ)
    magnitude: number;         // √(φ² + ψ²)
  };
  timestamp: number;
  source: 'FRED' | 'YAHOO' | 'ALPHAVANTAGE' | 'QUANDL';
}

/**
 * Economic indicator collection (snapshot)
 */
export interface EconomicSnapshot {
  id: string;
  timestamp: number;
  indicators: ZeckendorfEconomicIndicator[];
  aggregates: {
    totalPhiEnergy: number;     // Sum of all φ coordinates
    totalPsiEnergy: number;     // Sum of all ψ coordinates
    systemPhase: number;        // Overall market phase
    systemMagnitude: number;    // Market energy level
  };
  moodyScore: MoodysRiskScore;
  gmvScore: GMVAnomalyScore;
}

/**
 * Moody's-style credit risk scoring
 */
export interface MoodysRiskScore {
  rating: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'CCC' | 'CC' | 'C' | 'D';
  score: number;              // 0-100
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
  score: number;              // 0-100 (higher = more anomalous)
  severity: 'low' | 'medium' | 'high' | 'critical';
  anomalies: Array<{
    indicator: string;
    expectedValue: number;
    actualValue: number;
    deviation: number;        // Standard deviations from mean
    zScore: number;
  }>;
  geometricMean: number;
  variance: number;
  timestamp: number;
}

/**
 * Real-time market index data
 */
export interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: number;
  zeckendorf: {
    priceEncoded: number[];   // Price in basis points encoded
    volumeEncoded: number[];  // Volume in thousands encoded
  };
  technicals: {
    sma20: number;
    sma50: number;
    sma200: number;
    rsi14: number;
    macd: number;
  };
}

/**
 * API Configuration
 */
export interface EconomicDataConfig {
  fred: {
    apiKey: string;
    baseUrl: string;
    rateLimit: number;        // requests per minute
  };
  yahoo: {
    baseUrl: string;
    symbols: string[];
    updateInterval: number;   // milliseconds
  };
  alphaVantage?: {
    apiKey: string;
    baseUrl: string;
    rateLimit: number;
  };
  cache: {
    enabled: boolean;
    ttl: number;             // Time-to-live in seconds
    strategy: 'memory' | 'redis' | 'agentdb';
  };
  rateLimiting: {
    enabled: boolean;
    maxRequests: number;
    windowMs: number;
  };
  zeckendorf: {
    maxFibonacciIndex: number;  // Maximum Fibonacci index to use
    scalingFactors: {
      interestRates: number;    // e.g., 10000 for basis points
      prices: number;           // e.g., 100 for cents
      volumes: number;          // e.g., 1000 for thousands
      indices: number;          // e.g., 100 for index points
    };
  };
}

/**
 * Historical data request
 */
export interface HistoricalDataRequest {
  seriesId: string;
  startDate: Date;
  endDate: Date;
  frequency?: 'daily' | 'weekly' | 'monthly';
  aggregation?: 'avg' | 'eop' | 'sum';
}

/**
 * Historical data response
 */
export interface HistoricalDataResponse {
  seriesId: string;
  data: Array<{
    date: Date;
    value: number;
    zeckendorf: ZeckendorfEconomicIndicator;
  }>;
  metadata: {
    totalPoints: number;
    firstDate: Date;
    lastDate: Date;
    frequency: string;
  };
}
```

---

## Zeckendorf Encoding Strategy

### Overview

All economic indicators are converted to **integer representations** before Zeckendorf encoding. This ensures compatibility with the φ-Mechanics framework's integer-only constraint.

### Scaling Rules

```typescript
/**
 * Scaling factors for different economic data types
 */
export const SCALING_FACTORS = {
  // Interest rates: 10000x (basis points)
  // Example: 5.25% → 525 basis points
  INTEREST_RATE: 10000,

  // Prices: 100x (cents)
  // Example: $125.50 → 12550 cents
  PRICE: 100,

  // Volumes: 1000x (thousands)
  // Example: 1,250,000 shares → 1250 thousands
  VOLUME: 1000,

  // Indices: 100x (index points)
  // Example: SPY 450.25 → 45025 points
  INDEX: 100,

  // Percentages: 10000x (basis points)
  // Example: 3.5% → 350 basis points
  PERCENTAGE: 10000,

  // Dollar amounts: 100x (cents)
  // Example: $1,234.56 → 123456 cents
  DOLLAR: 100,

  // Inflation: 1000x (per mille)
  // Example: 2.5% → 25 per mille
  INFLATION: 1000,

  // GDP: 1000000x (millions)
  // Example: $25.5T → 25,500,000 millions
  GDP: 1000000
};

/**
 * Scale economic value to integer for Zeckendorf encoding
 */
export function scaleEconomicValue(
  value: number,
  dataType: keyof typeof SCALING_FACTORS
): ScaledEconomicValue {
  const scaleFactor = SCALING_FACTORS[dataType];
  const scaledValue = Math.round(value * scaleFactor);

  // Ensure positive integer
  if (scaledValue <= 0) {
    throw new Error(`Cannot encode non-positive value: ${scaledValue}`);
  }

  return {
    seriesId: '',
    rawValue: value,
    scaledValue,
    scaleFactor,
    unit: getUnitName(dataType),
    timestamp: Date.now()
  };
}

/**
 * Encode economic indicator using Zeckendorf decomposition
 */
export async function encodeEconomicIndicator(
  indicator: RawEconomicIndicator,
  dataType: keyof typeof SCALING_FACTORS
): Promise<ZeckendorfEconomicIndicator> {
  // Step 1: Scale to integer
  const scaled = scaleEconomicValue(indicator.value, dataType);

  // Step 2: Zeckendorf decomposition
  const zeckendorf = zeckendorfDecompose(scaled.scaledValue);

  // Step 3: Calculate phase space coordinates
  const phi = calculatePhi(scaled.scaledValue);
  const psi = calculatePsi(scaled.scaledValue);
  const theta = calculateTheta(phi, psi);
  const magnitude = calculateMagnitude(phi, psi);

  return {
    seriesId: indicator.seriesId,
    rawValue: indicator.value,
    scaledValue: scaled.scaledValue,
    zeckendorf: {
      indices: zeckendorf.indices,
      values: zeckendorf.values,
      summandCount: zeckendorf.summandCount,
      lucasSummandCount: zeckendorf.lucasSummandCount,
      representation: zeckendorf.representation
    },
    phaseSpace: {
      phi,
      psi,
      theta,
      magnitude
    },
    timestamp: indicator.timestamp,
    source: indicator.source
  };
}
```

### Example Encodings

```typescript
// Example 1: Federal Funds Rate (5.25%)
const fredRate = {
  seriesId: 'DFF',
  value: 5.25,
  // ... other fields
};

// Scaled: 5.25 * 10000 = 52500 basis points
// Zeckendorf: 52500 = F₂₄ + F₂₂ + F₁₉ + F₁₇ + F₁₄ + ...
// Phase: φ(52500) ≈ 1.234, ψ(52500) ≈ -0.456

// Example 2: S&P 500 Price ($4,500.00)
const spyPrice = {
  symbol: 'SPY',
  price: 450.00,
  // ... other fields
};

// Scaled: 450.00 * 100 = 45000 cents
// Zeckendorf: 45000 = F₂₃ + F₂₁ + F₁₈ + F₁₆ + ...
// Phase: φ(45000) ≈ 1.178, ψ(45000) ≈ -0.389

// Example 3: CPI (304.500)
const cpi = {
  seriesId: 'CPIAUCSL',
  value: 304.5,
  // ... other fields
};

// Scaled: 304.5 * 100 = 30450 index points
// Zeckendorf: 30450 = F₂₂ + F₂₀ + F₁₇ + F₁₅ + ...
// Phase: φ(30450) ≈ 1.089, ψ(30450) ≈ -0.312
```

### Handling Negative Values

Since Zeckendorf decomposition requires positive integers, negative economic values (e.g., negative interest rate spreads, price changes) are handled using a **dual-encoding system**:

```typescript
/**
 * Encode signed economic value
 */
export interface SignedZeckendorfEncoding {
  sign: 1 | -1;
  magnitude: ZeckendorfEconomicIndicator;
  originalValue: number;
}

export function encodeSignedValue(
  value: number,
  dataType: keyof typeof SCALING_FACTORS
): SignedZeckendorfEncoding {
  const sign = value >= 0 ? 1 : -1;
  const magnitude = Math.abs(value);

  const encoded = encodeEconomicIndicator(
    { value: magnitude, /* ... */ },
    dataType
  );

  return {
    sign,
    magnitude: encoded,
    originalValue: value
  };
}
```

---

## API Endpoints

### Base URL

```
Production: https://api.aurelia-trading.com/v1
Development: http://localhost:3000/v1
```

### Authentication

All requests require API key in header:
```
Authorization: Bearer <API_KEY>
```

### Endpoints

#### 1. Get Current Economic Snapshot

```http
GET /economic/snapshot
```

**Response:**
```json
{
  "id": "snapshot_1699900800000",
  "timestamp": 1699900800000,
  "indicators": [
    {
      "seriesId": "DFF",
      "rawValue": 5.25,
      "scaledValue": 52500,
      "zeckendorf": {
        "indices": [24, 22, 19, 17],
        "values": [46368, 17711, 4181, 1597],
        "summandCount": 4,
        "lucasSummandCount": 1,
        "representation": "52500 = F24 + F22 + F19 + F17"
      },
      "phaseSpace": {
        "phi": 1.234,
        "psi": -0.456,
        "theta": -0.349,
        "magnitude": 1.316
      },
      "timestamp": 1699900800000,
      "source": "FRED"
    }
  ],
  "aggregates": {
    "totalPhiEnergy": 45.678,
    "totalPsiEnergy": -12.345,
    "systemPhase": -0.261,
    "systemMagnitude": 47.321
  },
  "moodyScore": {
    "rating": "BBB",
    "score": 72.5,
    "outlook": "stable",
    "components": {
      "creditSpreadRisk": 18.5,
      "interestRateRisk": 24.2,
      "liquidityRisk": 12.8,
      "macroeconomicRisk": 17.0
    },
    "timestamp": 1699900800000
  },
  "gmvScore": {
    "score": 23.4,
    "severity": "low",
    "anomalies": [],
    "geometricMean": 1.0234,
    "variance": 0.00456,
    "timestamp": 1699900800000
  }
}
```

#### 2. Get Specific Indicator

```http
GET /economic/indicator/:seriesId
```

**Parameters:**
- `seriesId` (path): FRED series ID or symbol (e.g., "DFF", "SPY")
- `encode` (query, optional): Return Zeckendorf encoding (default: true)

**Example:**
```http
GET /economic/indicator/DFF?encode=true
```

**Response:**
```json
{
  "seriesId": "DFF",
  "name": "Federal Funds Effective Rate",
  "rawValue": 5.25,
  "scaledValue": 52500,
  "zeckendorf": {
    "indices": [24, 22, 19, 17],
    "values": [46368, 17711, 4181, 1597],
    "summandCount": 4,
    "lucasSummandCount": 1,
    "representation": "52500 = F24 + F22 + F19 + F17"
  },
  "phaseSpace": {
    "phi": 1.234,
    "psi": -0.456,
    "theta": -0.349,
    "magnitude": 1.316
  },
  "timestamp": 1699900800000,
  "source": "FRED"
}
```

#### 3. Get Historical Data

```http
POST /economic/historical
```

**Request Body:**
```json
{
  "seriesId": "DFF",
  "startDate": "2023-01-01",
  "endDate": "2023-12-31",
  "frequency": "daily",
  "encode": true
}
```

**Response:**
```json
{
  "seriesId": "DFF",
  "data": [
    {
      "date": "2023-01-01T00:00:00Z",
      "value": 4.33,
      "zeckendorf": {
        "scaledValue": 43300,
        "indices": [23, 21, 18],
        "phaseSpace": {
          "phi": 1.189,
          "psi": -0.423,
          "theta": -0.338,
          "magnitude": 1.263
        }
      }
    }
  ],
  "metadata": {
    "totalPoints": 365,
    "firstDate": "2023-01-01T00:00:00Z",
    "lastDate": "2023-12-31T00:00:00Z",
    "frequency": "daily"
  }
}
```

#### 4. Get Market Indices

```http
GET /market/indices
```

**Query Parameters:**
- `symbols` (optional): Comma-separated list (default: all major indices)
- `includeOptions` (optional): Include options data (default: false)

**Response:**
```json
{
  "timestamp": 1699900800000,
  "indices": [
    {
      "symbol": "SPY",
      "name": "SPDR S&P 500 ETF",
      "price": 450.00,
      "change": 2.50,
      "changePercent": 0.56,
      "volume": 125000000,
      "timestamp": 1699900800000,
      "zeckendorf": {
        "priceEncoded": [23, 21, 18, 16],
        "volumeEncoded": [26, 24, 22]
      },
      "technicals": {
        "sma20": 448.50,
        "sma50": 445.00,
        "sma200": 430.00,
        "rsi14": 58.5,
        "macd": 1.25
      }
    }
  ]
}
```

#### 5. Batch Encode Indicators

```http
POST /economic/batch-encode
```

**Request Body:**
```json
{
  "indicators": [
    {
      "seriesId": "DFF",
      "value": 5.25,
      "dataType": "INTEREST_RATE"
    },
    {
      "seriesId": "SPY",
      "value": 450.00,
      "dataType": "PRICE"
    }
  ]
}
```

**Response:**
```json
{
  "encoded": [
    {
      "seriesId": "DFF",
      "scaledValue": 52500,
      "zeckendorf": { /* ... */ },
      "phaseSpace": { /* ... */ }
    }
  ],
  "processingTime": 45
}
```

#### 6. Get Moody's Risk Score

```http
GET /risk/moodys
```

**Response:**
```json
{
  "rating": "BBB",
  "score": 72.5,
  "outlook": "stable",
  "components": {
    "creditSpreadRisk": 18.5,
    "interestRateRisk": 24.2,
    "liquidityRisk": 12.8,
    "macroeconomicRisk": 17.0
  },
  "historicalRatings": [
    {
      "date": "2023-11-01",
      "rating": "BBB",
      "score": 72.5
    }
  ],
  "timestamp": 1699900800000
}
```

#### 7. Get GMV Anomaly Score

```http
GET /anomaly/gmv
```

**Query Parameters:**
- `lookback` (optional): Days to analyze (default: 30)
- `threshold` (optional): Anomaly threshold (default: 2.5)

**Response:**
```json
{
  "score": 23.4,
  "severity": "low",
  "anomalies": [
    {
      "indicator": "VIX",
      "expectedValue": 15.2,
      "actualValue": 18.7,
      "deviation": 2.3,
      "zScore": 2.8
    }
  ],
  "geometricMean": 1.0234,
  "variance": 0.00456,
  "timestamp": 1699900800000
}
```

#### 8. Stream Real-Time Updates (WebSocket)

```
ws://api.aurelia-trading.com/v1/stream
```

**Subscribe Message:**
```json
{
  "action": "subscribe",
  "channels": ["indices", "rates", "anomalies"],
  "symbols": ["SPY", "QQQ", "DFF"]
}
```

**Update Message:**
```json
{
  "channel": "indices",
  "symbol": "SPY",
  "data": {
    "price": 450.25,
    "change": 0.25,
    "timestamp": 1699900815000,
    "zeckendorf": { /* ... */ }
  }
}
```

---

## Real-Time Data Ingestion

### Update Frequencies

| Data Type | Update Interval | Source | Method |
|-----------|----------------|--------|---------|
| Market Indices | 15 seconds | Yahoo Finance | HTTP Polling |
| VIX | 15 seconds | Yahoo Finance | HTTP Polling |
| Treasury Rates | 1 minute | FRED | HTTP Polling |
| Fed Funds Rate | 5 minutes | FRED | HTTP Polling |
| Economic Releases | Event-driven | FRED | Webhook |
| Anomaly Scores | 30 seconds | Internal | Computed |

### Polling Architecture

```typescript
/**
 * Real-time data ingestion manager
 */
export class RealTimeDataIngestion {
  private pollers: Map<string, NodeJS.Timeout> = new Map();
  private wsConnections: Set<WebSocket> = new Set();
  private cache: EconomicDataCache;
  private memory: MathFrameworkMemory;

  constructor(
    private config: EconomicDataConfig,
    memory: MathFrameworkMemory
  ) {
    this.cache = new EconomicDataCache(config.cache);
    this.memory = memory;
  }

  /**
   * Start polling for market indices
   */
  startMarketIndicesPolling(): void {
    const interval = 15000; // 15 seconds

    const poller = setInterval(async () => {
      try {
        const indices = await this.fetchMarketIndices();

        // Encode each index
        for (const index of indices) {
          const encoded = await encodeEconomicIndicator(
            {
              seriesId: index.symbol,
              value: index.price,
              timestamp: index.timestamp,
              source: 'YAHOO',
              frequency: 'realtime',
              unit: 'USD',
              metadata: {
                seasonallyAdjusted: false,
                revision: 0
              }
            },
            'PRICE'
          );

          // Store in AgentDB
          await this.memory.storeComputedValues({
            n: encoded.scaledValue,
            F: 0, // Placeholder
            L: 0, // Placeholder
            Z: encoded.phaseSpace.phi + encoded.phaseSpace.psi,
            S: 0, // Placeholder
            phase: {
              phi: encoded.phaseSpace.phi,
              psi: encoded.phaseSpace.psi,
              n: encoded.scaledValue,
              timestamp: encoded.timestamp
            },
            is_nash_point: false,
            timestamp: encoded.timestamp
          });

          // Broadcast to WebSocket clients
          this.broadcast({
            channel: 'indices',
            symbol: index.symbol,
            data: encoded
          });

          // Update cache
          await this.cache.set(`index:${index.symbol}`, encoded);
        }
      } catch (error) {
        console.error('Market indices polling error:', error);
      }
    }, interval);

    this.pollers.set('market_indices', poller);
  }

  /**
   * Start polling for FRED data
   */
  startFREDPolling(seriesIds: string[]): void {
    const interval = 60000; // 1 minute

    const poller = setInterval(async () => {
      for (const seriesId of seriesIds) {
        try {
          const data = await this.fetchFREDSeries(seriesId);
          const encoded = await this.encodeAndStore(data);

          // Broadcast update
          this.broadcast({
            channel: 'rates',
            seriesId,
            data: encoded
          });
        } catch (error) {
          console.error(`FRED polling error for ${seriesId}:`, error);
        }
      }
    }, interval);

    this.pollers.set('fred_data', poller);
  }

  /**
   * Compute and broadcast anomaly scores
   */
  startAnomalyDetection(): void {
    const interval = 30000; // 30 seconds

    const poller = setInterval(async () => {
      try {
        const snapshot = await this.getCurrentSnapshot();
        const gmvScore = await this.computeGMVScore(snapshot);

        // Alert if anomaly detected
        if (gmvScore.severity === 'high' || gmvScore.severity === 'critical') {
          this.broadcast({
            channel: 'anomalies',
            data: gmvScore,
            alert: true
          });
        }
      } catch (error) {
        console.error('Anomaly detection error:', error);
      }
    }, interval);

    this.pollers.set('anomaly_detection', poller);
  }

  /**
   * Stop all polling
   */
  stopAll(): void {
    for (const [name, poller] of this.pollers.entries()) {
      clearInterval(poller);
      console.log(`Stopped poller: ${name}`);
    }
    this.pollers.clear();
  }

  /**
   * Broadcast to WebSocket clients
   */
  private broadcast(message: any): void {
    const payload = JSON.stringify(message);

    for (const ws of this.wsConnections) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    }
  }

  /**
   * Fetch market indices from Yahoo Finance
   */
  private async fetchMarketIndices(): Promise<MarketIndex[]> {
    const symbols = this.config.yahoo.symbols;
    const indices: MarketIndex[] = [];

    for (const symbol of symbols) {
      const response = await fetch(
        `${this.config.yahoo.baseUrl}/quote/${symbol}`
      );
      const data = await response.json();

      indices.push({
        symbol,
        name: data.longName,
        price: data.regularMarketPrice,
        change: data.regularMarketChange,
        changePercent: data.regularMarketChangePercent,
        volume: data.regularMarketVolume,
        timestamp: data.regularMarketTime * 1000,
        zeckendorf: { priceEncoded: [], volumeEncoded: [] },
        technicals: {
          sma20: data.fiftyDayAverage,
          sma50: data.fiftyDayAverage,
          sma200: data.twoHundredDayAverage,
          rsi14: 50, // Placeholder
          macd: 0    // Placeholder
        }
      });
    }

    return indices;
  }

  /**
   * Fetch FRED series data
   */
  private async fetchFREDSeries(seriesId: string): Promise<RawEconomicIndicator> {
    const url = `${this.config.fred.baseUrl}/series/observations`;
    const params = new URLSearchParams({
      series_id: seriesId,
      api_key: this.config.fred.apiKey,
      file_type: 'json',
      sort_order: 'desc',
      limit: '1'
    });

    const response = await fetch(`${url}?${params}`);
    const data = await response.json();
    const latest = data.observations[0];

    return {
      seriesId,
      name: seriesId,
      value: parseFloat(latest.value),
      timestamp: new Date(latest.date).getTime(),
      source: 'FRED',
      frequency: 'daily',
      unit: '',
      metadata: {
        seasonallyAdjusted: true,
        revision: 0
      }
    };
  }
}
```

---

## Moody's-Style Modeling

### Credit Risk Scoring Algorithm

The Moody's-inspired rating system synthesizes multiple economic indicators into a unified credit risk score.

```typescript
/**
 * Calculate Moody's-style credit risk score
 */
export async function calculateMoodysScore(
  snapshot: EconomicSnapshot
): Promise<MoodysRiskScore> {
  // Extract key indicators
  const indicators = extractKeyIndicators(snapshot);

  // Component 1: Credit Spread Risk (25%)
  const creditSpreadRisk = calculateCreditSpreadRisk(
    indicators.baa10ySpread,
    indicators.highYieldSpread
  );

  // Component 2: Interest Rate Risk (30%)
  const interestRateRisk = calculateInterestRateRisk(
    indicators.fedFundsRate,
    indicators.treasuryYieldCurve,
    indicators.realRates
  );

  // Component 3: Liquidity Risk (20%)
  const liquidityRisk = calculateLiquidityRisk(
    indicators.moneySupply,
    indicators.fedBalanceSheet,
    indicators.vix
  );

  // Component 4: Macroeconomic Risk (25%)
  const macroeconomicRisk = calculateMacroeconomicRisk(
    indicators.gdpGrowth,
    indicators.unemployment,
    indicators.inflation,
    indicators.consumerSentiment
  );

  // Weighted average score (0-100)
  const score =
    creditSpreadRisk * 0.25 +
    interestRateRisk * 0.30 +
    liquidityRisk * 0.20 +
    macroeconomicRisk * 0.25;

  // Map score to rating
  const rating = scoreToRating(score);
  const outlook = determineOutlook(snapshot, indicators);

  return {
    rating,
    score,
    outlook,
    components: {
      creditSpreadRisk,
      interestRateRisk,
      liquidityRisk,
      macroeconomicRisk
    },
    timestamp: Date.now()
  };
}

/**
 * Calculate credit spread component
 */
function calculateCreditSpreadRisk(
  baa10ySpread: number,
  highYieldSpread: number
): number {
  // BAA-10Y spread thresholds
  const baaScore = mapToScore(baa10ySpread, {
    excellent: [0, 1.5],     // Tight spreads
    good: [1.5, 2.5],
    fair: [2.5, 3.5],
    poor: [3.5, 5.0],
    critical: [5.0, Infinity] // Distressed
  });

  // High yield spread thresholds
  const hyScore = mapToScore(highYieldSpread, {
    excellent: [0, 3.0],
    good: [3.0, 5.0],
    fair: [5.0, 7.0],
    poor: [7.0, 10.0],
    critical: [10.0, Infinity]
  });

  // Weighted average
  return baaScore * 0.6 + hyScore * 0.4;
}

/**
 * Calculate interest rate component
 */
function calculateInterestRateRisk(
  fedFundsRate: number,
  yieldCurveSpread: number,
  realRates: number
): number {
  // Yield curve inversion is major risk signal
  const yieldCurveScore = yieldCurveSpread < 0 ? 90 : // Inverted
                          yieldCurveSpread < 0.5 ? 70 : // Flat
                          yieldCurveSpread < 1.0 ? 50 : // Normal
                          30; // Steep (healthy)

  // Fed funds rate level
  const fedScore = mapToScore(fedFundsRate, {
    excellent: [0, 2.0],     // Accommodative
    good: [2.0, 3.5],
    fair: [3.5, 5.0],
    poor: [5.0, 6.5],
    critical: [6.5, Infinity] // Restrictive
  });

  // Real rates (inflation-adjusted)
  const realRateScore = mapToScore(realRates, {
    excellent: [-2.0, 0],    // Negative real rates
    good: [0, 1.0],
    fair: [1.0, 2.0],
    poor: [2.0, 3.0],
    critical: [3.0, Infinity] // Very restrictive
  });

  return yieldCurveScore * 0.4 + fedScore * 0.3 + realRateScore * 0.3;
}

/**
 * Calculate liquidity risk component
 */
function calculateLiquidityRisk(
  m2Growth: number,
  fedBalanceSheetGrowth: number,
  vix: number
): number {
  // M2 money supply growth
  const m2Score = mapToScore(m2Growth, {
    excellent: [8.0, Infinity],  // High liquidity
    good: [4.0, 8.0],
    fair: [0, 4.0],
    poor: [-4.0, 0],
    critical: [-Infinity, -4.0]  // Contracting money supply
  }, true); // Inverse scoring

  // Fed balance sheet
  const fedScore = mapToScore(fedBalanceSheetGrowth, {
    excellent: [10.0, Infinity], // Expanding
    good: [5.0, 10.0],
    fair: [0, 5.0],
    poor: [-5.0, 0],
    critical: [-Infinity, -5.0]  // Quantitative tightening
  }, true);

  // VIX (fear gauge)
  const vixScore = mapToScore(vix, {
    excellent: [0, 12],      // Low volatility
    good: [12, 20],
    fair: [20, 30],
    poor: [30, 40],
    critical: [40, Infinity] // Panic
  });

  return m2Score * 0.3 + fedScore * 0.3 + vixScore * 0.4;
}

/**
 * Calculate macroeconomic risk component
 */
function calculateMacroeconomicRisk(
  gdpGrowth: number,
  unemployment: number,
  inflation: number,
  consumerSentiment: number
): number {
  // GDP growth
  const gdpScore = mapToScore(gdpGrowth, {
    excellent: [3.0, Infinity],  // Strong growth
    good: [2.0, 3.0],
    fair: [0, 2.0],
    poor: [-2.0, 0],
    critical: [-Infinity, -2.0]  // Recession
  }, true);

  // Unemployment rate
  const unemploymentScore = mapToScore(unemployment, {
    excellent: [0, 4.0],     // Full employment
    good: [4.0, 5.0],
    fair: [5.0, 6.5],
    poor: [6.5, 8.0],
    critical: [8.0, Infinity] // High unemployment
  });

  // Inflation (target is 2%)
  const inflationScore = mapToScore(Math.abs(inflation - 2.0), {
    excellent: [0, 0.5],     // On target
    good: [0.5, 1.0],
    fair: [1.0, 2.0],
    poor: [2.0, 4.0],
    critical: [4.0, Infinity] // High deviation
  });

  // Consumer sentiment
  const sentimentScore = mapToScore(consumerSentiment, {
    excellent: [90, Infinity],   // Optimistic
    good: [75, 90],
    fair: [60, 75],
    poor: [45, 60],
    critical: [0, 45]            // Pessimistic
  }, true);

  return gdpScore * 0.3 + unemploymentScore * 0.25 +
         inflationScore * 0.25 + sentimentScore * 0.2;
}

/**
 * Map value to score range
 */
function mapToScore(
  value: number,
  ranges: {
    excellent: [number, number];
    good: [number, number];
    fair: [number, number];
    poor: [number, number];
    critical: [number, number];
  },
  inverse: boolean = false
): number {
  const scores = inverse ? {
    excellent: 10,
    good: 30,
    fair: 50,
    poor: 70,
    critical: 90
  } : {
    excellent: 90,
    good: 70,
    fair: 50,
    poor: 30,
    critical: 10
  };

  for (const [level, [min, max]] of Object.entries(ranges)) {
    if (value >= min && value <= max) {
      return scores[level as keyof typeof scores];
    }
  }

  return 50; // Default
}

/**
 * Convert score to Moody's-style rating
 */
function scoreToRating(score: number): MoodysRiskScore['rating'] {
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
 * Determine rating outlook
 */
function determineOutlook(
  snapshot: EconomicSnapshot,
  indicators: any
): 'positive' | 'stable' | 'negative' {
  // Analyze trends over past 30 days
  // Positive: Improving credit spreads, economic growth
  // Negative: Widening spreads, slowing growth
  // Stable: Mixed or neutral signals

  // Placeholder implementation
  return 'stable';
}
```

---

## GMV Anomaly Scoring

### Geometric Mean Variance Algorithm

The GMV anomaly detection system identifies market disruptions using geometric statistics and phase space divergence.

```typescript
/**
 * Calculate GMV anomaly score
 */
export async function calculateGMVScore(
  snapshot: EconomicSnapshot,
  historicalWindow: number = 30
): Promise<GMVAnomalyScore> {
  // Get historical snapshots for comparison
  const historical = await getHistoricalSnapshots(historicalWindow);

  // Calculate geometric mean of φ-energies
  const phiEnergies = historical.map(s => s.aggregates.totalPhiEnergy);
  const geometricMean = calculateGeometricMean(phiEnergies);

  // Calculate variance
  const variance = calculateVariance(phiEnergies, geometricMean);

  // Detect anomalies for each indicator
  const anomalies: GMVAnomalyScore['anomalies'] = [];

  for (const indicator of snapshot.indicators) {
    const historicalValues = await getHistoricalIndicator(
      indicator.seriesId,
      historicalWindow
    );

    const expectedValue = calculateGeometricMean(
      historicalValues.map(v => v.phaseSpace.magnitude)
    );

    const actualValue = indicator.phaseSpace.magnitude;
    const stdDev = Math.sqrt(variance);
    const deviation = Math.abs(actualValue - expectedValue) / stdDev;
    const zScore = (actualValue - expectedValue) / stdDev;

    // Flag if deviation > 2.5 standard deviations
    if (deviation > 2.5) {
      anomalies.push({
        indicator: indicator.seriesId,
        expectedValue,
        actualValue,
        deviation,
        zScore
      });
    }
  }

  // Calculate overall anomaly score (0-100)
  const score = calculateAnomalyScore(anomalies, variance);

  // Determine severity
  const severity = score < 25 ? 'low' :
                   score < 50 ? 'medium' :
                   score < 75 ? 'high' : 'critical';

  return {
    score,
    severity,
    anomalies,
    geometricMean,
    variance,
    timestamp: Date.now()
  };
}

/**
 * Calculate geometric mean
 */
function calculateGeometricMean(values: number[]): number {
  // GM = (∏ᵢ xᵢ)^(1/n)
  const product = values.reduce((acc, val) => acc * Math.abs(val), 1);
  return Math.pow(product, 1 / values.length);
}

/**
 * Calculate variance
 */
function calculateVariance(values: number[], mean: number): number {
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Calculate overall anomaly score
 */
function calculateAnomalyScore(
  anomalies: GMVAnomalyScore['anomalies'],
  variance: number
): number {
  if (anomalies.length === 0) return 0;

  // Weight by z-score magnitude
  const weightedSum = anomalies.reduce(
    (sum, a) => sum + Math.abs(a.zScore),
    0
  );

  // Normalize to 0-100 scale
  const avgZScore = weightedSum / anomalies.length;
  const score = Math.min(100, avgZScore * 20);

  return score;
}

/**
 * Phase space divergence detection
 * Detects when current trajectory diverges from historical patterns
 */
export async function detectPhaseSpaceDivergence(
  currentSnapshot: EconomicSnapshot,
  historicalSnapshots: EconomicSnapshot[]
): Promise<{
  divergenceScore: number;
  divergentIndicators: string[];
  trajectoryDeviation: number;
}> {
  const divergentIndicators: string[] = [];
  let totalDivergence = 0;

  for (const indicator of currentSnapshot.indicators) {
    // Get historical phase space trajectory
    const historicalPhases = historicalSnapshots
      .map(s => s.indicators.find(i => i.seriesId === indicator.seriesId))
      .filter(i => i !== undefined)
      .map(i => i!.phaseSpace);

    // Calculate expected phase angle
    const expectedTheta = calculateGeometricMean(
      historicalPhases.map(p => p.theta)
    );

    // Calculate divergence
    const thetaDivergence = Math.abs(indicator.phaseSpace.theta - expectedTheta);

    if (thetaDivergence > Math.PI / 4) { // > 45 degrees
      divergentIndicators.push(indicator.seriesId);
      totalDivergence += thetaDivergence;
    }
  }

  const divergenceScore = Math.min(100, (totalDivergence / Math.PI) * 50);

  // Calculate trajectory deviation (rate of phase change)
  const trajectoryDeviation = calculateTrajectoryDeviation(
    currentSnapshot,
    historicalSnapshots[historicalSnapshots.length - 1]
  );

  return {
    divergenceScore,
    divergentIndicators,
    trajectoryDeviation
  };
}
```

---

## Caching Strategy

### Multi-Layer Cache Architecture

```typescript
/**
 * Economic data caching system
 */
export class EconomicDataCache {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private redisClient?: RedisClient;
  private agentDB?: MathFrameworkMemory;

  constructor(config: EconomicDataConfig['cache']) {
    if (config.strategy === 'redis') {
      this.redisClient = new RedisClient();
    } else if (config.strategy === 'agentdb') {
      this.agentDB = new MathFrameworkMemory();
    }
  }

  /**
   * Get cached value with TTL check
   */
  async get<T>(key: string): Promise<T | null> {
    // L1: Memory cache (fastest)
    const memEntry = this.memoryCache.get(key);
    if (memEntry && !this.isExpired(memEntry)) {
      return memEntry.value as T;
    }

    // L2: Redis cache (fast)
    if (this.redisClient) {
      const redisValue = await this.redisClient.get(key);
      if (redisValue) {
        const parsed = JSON.parse(redisValue) as T;
        // Populate L1
        this.memoryCache.set(key, {
          value: parsed,
          timestamp: Date.now()
        });
        return parsed;
      }
    }

    // L3: AgentDB (persistent, searchable)
    if (this.agentDB) {
      const memories = await this.agentDB.searchMemories({
        type: 'economic-indicator',
        tags: [`key:${key}`],
        limit: 1
      });

      if (memories.length > 0) {
        const value = JSON.parse(memories[0].content) as T;
        // Populate L1 and L2
        await this.set(key, value);
        return value;
      }
    }

    return null;
  }

  /**
   * Set cached value
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const entry: CacheEntry = {
      value,
      timestamp: Date.now(),
      ttl: ttl || 300000 // Default 5 minutes
    };

    // L1: Memory
    this.memoryCache.set(key, entry);

    // L2: Redis
    if (this.redisClient) {
      await this.redisClient.setex(
        key,
        Math.floor(entry.ttl / 1000),
        JSON.stringify(value)
      );
    }

    // L3: AgentDB (for long-term storage and search)
    if (this.agentDB && value && typeof value === 'object' && 'phaseSpace' in value) {
      await this.agentDB.storeMemory({
        content: JSON.stringify(value),
        type: 'economic-indicator',
        tags: [`key:${key}`],
        embedding: this.createEmbedding(value),
        metadata: { timestamp: Date.now() }
      });
    }
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    const age = Date.now() - entry.timestamp;
    return age > (entry.ttl || 300000);
  }

  /**
   * Clear all caches
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    if (this.redisClient) {
      await this.redisClient.flushdb();
    }
  }

  /**
   * Create embedding for AgentDB storage
   */
  private createEmbedding(value: any): number[] {
    if (value.phaseSpace) {
      return [
        value.phaseSpace.phi,
        value.phaseSpace.psi,
        value.phaseSpace.theta,
        value.phaseSpace.magnitude
      ];
    }
    return [];
  }
}

interface CacheEntry {
  value: any;
  timestamp: number;
  ttl?: number;
}
```

### Cache Invalidation Strategy

```typescript
/**
 * Cache key patterns and TTL
 */
export const CACHE_CONFIG = {
  // Real-time data (short TTL)
  'index:*': 15000,        // 15 seconds
  'rate:DFF': 60000,       // 1 minute
  'rate:DGS*': 60000,      // 1 minute
  'vix': 15000,            // 15 seconds

  // Economic releases (medium TTL)
  'indicator:UNRATE': 86400000,      // 1 day
  'indicator:GDP*': 2592000000,      // 30 days
  'indicator:CPI*': 2592000000,      // 30 days

  // Computed scores (short TTL)
  'moody_score': 300000,   // 5 minutes
  'gmv_score': 30000,      // 30 seconds

  // Historical data (long TTL)
  'historical:*': 3600000  // 1 hour
};
```

---

## Error Handling

### Robust Error Handling Strategy

```typescript
/**
 * Custom error types
 */
export class APIRateLimitError extends Error {
  constructor(
    public source: string,
    public retryAfter: number
  ) {
    super(`Rate limit exceeded for ${source}. Retry after ${retryAfter}ms`);
  }
}

export class DataSourceUnavailableError extends Error {
  constructor(
    public source: string,
    public fallback?: string
  ) {
    super(`Data source ${source} unavailable. Fallback: ${fallback || 'none'}`);
  }
}

export class EncodingError extends Error {
  constructor(
    public seriesId: string,
    public value: number,
    public reason: string
  ) {
    super(`Cannot encode ${seriesId}=${value}: ${reason}`);
  }
}

/**
 * Error handler with retry logic
 */
export class DataSourceErrorHandler {
  private retryQueue: Map<string, RetryEntry> = new Map();

  /**
   * Handle API errors with exponential backoff
   */
  async handleWithRetry<T>(
    operation: () => Promise<T>,
    options: {
      maxRetries: number;
      baseDelay: number;
      source: string;
      fallback?: () => Promise<T>;
    }
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Handle rate limiting
        if (error instanceof APIRateLimitError) {
          await this.sleep(error.retryAfter);
          continue;
        }

        // Handle data source unavailable
        if (error instanceof DataSourceUnavailableError && options.fallback) {
          console.warn(`Using fallback for ${options.source}`);
          return await options.fallback();
        }

        // Exponential backoff
        if (attempt < options.maxRetries) {
          const delay = options.baseDelay * Math.pow(2, attempt);
          console.log(`Retry ${attempt + 1}/${options.maxRetries} after ${delay}ms`);
          await this.sleep(delay);
        }
      }
    }

    throw new Error(`Failed after ${options.maxRetries} retries: ${lastError?.message}`);
  }

  /**
   * Handle encoding errors gracefully
   */
  handleEncodingError(error: EncodingError): ZeckendorfEconomicIndicator | null {
    console.error(`Encoding error: ${error.message}`);

    // Log to monitoring system
    this.logError(error);

    // Return null or default value
    return null;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private logError(error: Error): void {
    // Send to monitoring system (Sentry, DataDog, etc.)
    console.error('[ERROR]', error);
  }
}

interface RetryEntry {
  attempts: number;
  nextRetry: number;
}
```

### Fallback Data Sources

```typescript
/**
 * Fallback hierarchy for data sources
 */
export const FALLBACK_SOURCES = {
  'DFF': ['FRED', 'ALPHAVANTAGE', 'CACHED'],
  'SPY': ['YAHOO', 'ALPHAVANTAGE', 'CACHED'],
  'DGS10': ['FRED', 'TREASURY_DIRECT', 'CACHED'],
  'VIX': ['YAHOO', 'CBOE', 'CACHED']
};

/**
 * Attempt multiple data sources in order
 */
export async function fetchWithFallback(
  seriesId: string,
  sources: string[]
): Promise<RawEconomicIndicator> {
  const handler = new DataSourceErrorHandler();

  for (const source of sources) {
    try {
      const fetcher = getDataFetcher(source);
      return await handler.handleWithRetry(
        () => fetcher(seriesId),
        {
          maxRetries: 2,
          baseDelay: 1000,
          source
        }
      );
    } catch (error) {
      console.warn(`Failed to fetch ${seriesId} from ${source}`);
      continue;
    }
  }

  throw new DataSourceUnavailableError(
    seriesId,
    'All sources exhausted'
  );
}
```

---

## Rate Limiting

### Rate Limiter Implementation

```typescript
/**
 * Token bucket rate limiter
 */
export class RateLimiter {
  private buckets: Map<string, TokenBucket> = new Map();

  constructor(private config: EconomicDataConfig['rateLimiting']) {}

  /**
   * Check if request is allowed
   */
  async checkLimit(source: string): Promise<boolean> {
    if (!this.config.enabled) return true;

    const bucket = this.getBucket(source);
    return bucket.consume();
  }

  /**
   * Wait for rate limit to reset
   */
  async waitForLimit(source: string): Promise<void> {
    const bucket = this.getBucket(source);

    while (!bucket.consume()) {
      await this.sleep(bucket.getRefillDelay());
    }
  }

  /**
   * Get or create bucket for source
   */
  private getBucket(source: string): TokenBucket {
    if (!this.buckets.has(source)) {
      this.buckets.set(source, new TokenBucket({
        capacity: this.getSourceLimit(source),
        refillRate: this.getSourceRefillRate(source)
      }));
    }

    return this.buckets.get(source)!;
  }

  /**
   * Get rate limit for data source
   */
  private getSourceLimit(source: string): number {
    const limits: Record<string, number> = {
      'FRED': 120,           // 120/minute
      'YAHOO': 60,           // 60/minute
      'ALPHAVANTAGE': 5,     // 5/minute (free tier)
      'default': 100
    };

    return limits[source] || limits.default;
  }

  /**
   * Get refill rate (tokens per second)
   */
  private getSourceRefillRate(source: string): number {
    return this.getSourceLimit(source) / 60;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Token bucket implementation
 */
class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private config: {
      capacity: number;
      refillRate: number;
    }
  ) {
    this.tokens = config.capacity;
    this.lastRefill = Date.now();
  }

  /**
   * Attempt to consume a token
   */
  consume(): boolean {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens--;
      return true;
    }

    return false;
  }

  /**
   * Refill tokens based on time elapsed
   */
  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000; // seconds
    const tokensToAdd = elapsed * this.config.refillRate;

    this.tokens = Math.min(
      this.config.capacity,
      this.tokens + tokensToAdd
    );

    this.lastRefill = now;
  }

  /**
   * Get time until next token available (ms)
   */
  getRefillDelay(): number {
    return (1 / this.config.refillRate) * 1000;
  }
}
```

### API Key Management

```typescript
/**
 * Secure API key management
 */
export class APIKeyManager {
  private keys: Map<string, APIKeyConfig> = new Map();

  /**
   * Load API keys from environment
   */
  loadFromEnvironment(): void {
    this.keys.set('FRED', {
      key: process.env.FRED_API_KEY!,
      rotationDate: null,
      usageCount: 0
    });

    this.keys.set('ALPHAVANTAGE', {
      key: process.env.ALPHAVANTAGE_API_KEY!,
      rotationDate: null,
      usageCount: 0
    });
  }

  /**
   * Get API key for source
   */
  getKey(source: string): string {
    const config = this.keys.get(source);

    if (!config) {
      throw new Error(`No API key configured for ${source}`);
    }

    config.usageCount++;
    return config.key;
  }

  /**
   * Rotate API key
   */
  rotateKey(source: string, newKey: string): void {
    const config = this.keys.get(source);

    if (config) {
      config.key = newKey;
      config.rotationDate = Date.now();
      config.usageCount = 0;
    }
  }
}

interface APIKeyConfig {
  key: string;
  rotationDate: number | null;
  usageCount: number;
}
```

---

## Integration Examples

### Example 1: Fetch and Encode Current Snapshot

```typescript
import {
  RealTimeDataIngestion,
  encodeEconomicIndicator,
  createMathFrameworkMemory
} from './economic-data-api';

async function example1() {
  // Initialize memory store
  const memory = createMathFrameworkMemory({
    database_path: './aurelia.db',
    enable_hnsw: true,
    enable_quantization: true
  });

  // Initialize data ingestion
  const config: EconomicDataConfig = {
    fred: {
      apiKey: process.env.FRED_API_KEY!,
      baseUrl: 'https://api.stlouisfed.org/fred',
      rateLimit: 120
    },
    yahoo: {
      baseUrl: 'https://query1.finance.yahoo.com/v8/finance',
      symbols: ['SPY', 'QQQ', 'DIA', 'IWM', 'VIX'],
      updateInterval: 15000
    },
    cache: {
      enabled: true,
      ttl: 300000,
      strategy: 'agentdb'
    },
    rateLimiting: {
      enabled: true,
      maxRequests: 120,
      windowMs: 60000
    },
    zeckendorf: {
      maxFibonacciIndex: 50,
      scalingFactors: {
        interestRates: 10000,
        prices: 100,
        volumes: 1000,
        indices: 100
      }
    }
  };

  const ingestion = new RealTimeDataIngestion(config, memory);

  // Start real-time polling
  ingestion.startMarketIndicesPolling();
  ingestion.startFREDPolling(['DFF', 'DGS10', 'DGS2']);
  ingestion.startAnomalyDetection();

  // Wait for some data to collect
  await new Promise(resolve => setTimeout(resolve, 30000));

  // Get current snapshot
  const snapshot = await ingestion.getCurrentSnapshot();

  console.log('Economic Snapshot:');
  console.log(`Timestamp: ${new Date(snapshot.timestamp).toISOString()}`);
  console.log(`Total φ-Energy: ${snapshot.aggregates.totalPhiEnergy.toFixed(3)}`);
  console.log(`System Phase: ${snapshot.aggregates.systemPhase.toFixed(3)}`);
  console.log(`Moody's Rating: ${snapshot.moodyScore.rating}`);
  console.log(`GMV Anomaly: ${snapshot.gmvScore.severity}`);

  // Stop polling
  ingestion.stopAll();
  await memory.close();
}
```

### Example 2: Historical Analysis with Phase Space

```typescript
import {
  fetchHistoricalData,
  calculateMoodysScore,
  detectPhaseSpaceDivergence
} from './economic-data-api';

async function example2() {
  // Fetch 1 year of Fed Funds Rate
  const historicalData = await fetchHistoricalData({
    seriesId: 'DFF',
    startDate: new Date('2023-01-01'),
    endDate: new Date('2023-12-31'),
    frequency: 'daily'
  });

  // Analyze phase space trajectory
  const phaseTrajectory = historicalData.data.map(d => ({
    date: d.date,
    phi: d.zeckendorf.phaseSpace.phi,
    psi: d.zeckendorf.phaseSpace.psi,
    theta: d.zeckendorf.phaseSpace.theta,
    magnitude: d.zeckendorf.phaseSpace.magnitude
  }));

  // Detect Nash equilibrium points (where S(n) ≈ 0)
  const nashPoints = phaseTrajectory.filter(p =>
    Math.abs(p.phi + p.psi) < 0.01
  );

  console.log(`Found ${nashPoints.length} Nash equilibrium points`);
  nashPoints.forEach(p => {
    console.log(`Date: ${p.date}, θ: ${p.theta.toFixed(3)}, r: ${p.magnitude.toFixed(3)}`);
  });

  // Calculate Lyapunov exponent (chaos indicator)
  const lyapunov = calculateLyapunovExponent(phaseTrajectory);
  console.log(`Lyapunov Exponent: ${lyapunov.toFixed(4)}`);
  console.log(`Market Regime: ${lyapunov > 0 ? 'Chaotic' : 'Stable'}`);
}
```

### Example 3: Real-Time Anomaly Detection

```typescript
import {
  calculateGMVScore,
  detectPhaseSpaceDivergence
} from './economic-data-api';

async function example3() {
  const memory = createMathFrameworkMemory();

  // Monitor for anomalies in real-time
  setInterval(async () => {
    const snapshot = await getCurrentSnapshot();
    const gmvScore = await calculateGMVScore(snapshot);

    if (gmvScore.severity === 'high' || gmvScore.severity === 'critical') {
      console.log('⚠️  ANOMALY DETECTED ⚠️');
      console.log(`Score: ${gmvScore.score.toFixed(1)}`);
      console.log(`Severity: ${gmvScore.severity}`);

      gmvScore.anomalies.forEach(a => {
        console.log(`  ${a.indicator}: ${a.deviation.toFixed(2)}σ deviation`);
        console.log(`    Expected: ${a.expectedValue.toFixed(2)}`);
        console.log(`    Actual: ${a.actualValue.toFixed(2)}`);
      });

      // Check phase space divergence
      const historical = await getHistoricalSnapshots(30);
      const divergence = await detectPhaseSpaceDivergence(
        snapshot,
        historical
      );

      console.log(`Phase Divergence: ${divergence.divergenceScore.toFixed(1)}`);
      console.log(`Divergent Indicators: ${divergence.divergentIndicators.join(', ')}`);

      // Alert trading system
      await sendTradingAlert({
        type: 'anomaly',
        severity: gmvScore.severity,
        score: gmvScore.score,
        divergence: divergence.divergenceScore
      });
    }
  }, 30000); // Check every 30 seconds
}
```

### Example 4: Moody's Risk Assessment

```typescript
import {
  calculateMoodysScore,
  generateRiskReport
} from './economic-data-api';

async function example4() {
  const snapshot = await getCurrentSnapshot();
  const moodyScore = await calculateMoodysScore(snapshot);

  console.log('=== Moody\'s Credit Risk Assessment ===');
  console.log(`Rating: ${moodyScore.rating}`);
  console.log(`Score: ${moodyScore.score.toFixed(1)}/100`);
  console.log(`Outlook: ${moodyScore.outlook.toUpperCase()}`);
  console.log('');
  console.log('Component Breakdown:');
  console.log(`  Credit Spread Risk:    ${moodyScore.components.creditSpreadRisk.toFixed(1)}`);
  console.log(`  Interest Rate Risk:    ${moodyScore.components.interestRateRisk.toFixed(1)}`);
  console.log(`  Liquidity Risk:        ${moodyScore.components.liquidityRisk.toFixed(1)}`);
  console.log(`  Macroeconomic Risk:    ${moodyScore.components.macroeconomicRisk.toFixed(1)}`);

  // Generate trading recommendations
  if (moodyScore.rating === 'AAA' || moodyScore.rating === 'AA') {
    console.log('\n✅ Low risk environment - Favorable for risk-on strategies');
  } else if (moodyScore.rating === 'B' || moodyScore.rating === 'CCC') {
    console.log('\n⚠️  High risk environment - Defensive positioning recommended');
  } else {
    console.log('\n ℹ️  Moderate risk - Balanced portfolio approach');
  }
}
```

---

## Performance Optimization

### Batch Processing

```typescript
/**
 * Batch encode multiple indicators in parallel
 */
export async function batchEncodeIndicators(
  indicators: RawEconomicIndicator[]
): Promise<ZeckendorfEconomicIndicator[]> {
  // Process in parallel chunks of 10
  const CHUNK_SIZE = 10;
  const results: ZeckendorfEconomicIndicator[] = [];

  for (let i = 0; i < indicators.length; i += CHUNK_SIZE) {
    const chunk = indicators.slice(i, i + CHUNK_SIZE);

    const encoded = await Promise.all(
      chunk.map(ind => encodeEconomicIndicator(ind, getDataType(ind.seriesId)))
    );

    results.push(...encoded);
  }

  return results;
}
```

### Connection Pooling

```typescript
/**
 * HTTP connection pool for API requests
 */
export class ConnectionPool {
  private agent: https.Agent;

  constructor() {
    this.agent = new https.Agent({
      keepAlive: true,
      maxSockets: 50,
      maxFreeSockets: 10,
      timeout: 30000
    });
  }

  getAgent(): https.Agent {
    return this.agent;
  }
}
```

### Database Query Optimization

```typescript
/**
 * Optimized batch storage in AgentDB
 */
export async function batchStoreIndicators(
  indicators: ZeckendorfEconomicIndicator[],
  memory: MathFrameworkMemory
): Promise<void> {
  // Create batch transaction
  const batch = indicators.map(ind => ({
    n: ind.scaledValue,
    F: 0,
    L: 0,
    Z: ind.phaseSpace.phi + ind.phaseSpace.psi,
    S: 0,
    phase: {
      phi: ind.phaseSpace.phi,
      psi: ind.phaseSpace.psi,
      n: ind.scaledValue,
      timestamp: ind.timestamp
    },
    is_nash_point: false,
    timestamp: ind.timestamp
  }));

  // Store all at once
  await memory.batchCompute(
    Math.min(...batch.map(b => b.n)),
    Math.max(...batch.map(b => b.n))
  );
}
```

---

## Security Considerations

### 1. API Key Security

```typescript
// ✅ CORRECT: Environment variables
const fredApiKey = process.env.FRED_API_KEY;

// ❌ WRONG: Hardcoded keys
const fredApiKey = 'abcd1234...'; // NEVER DO THIS
```

### 2. Input Validation

```typescript
/**
 * Validate economic indicator input
 */
export function validateIndicator(
  indicator: RawEconomicIndicator
): void {
  // Check value bounds
  if (!Number.isFinite(indicator.value)) {
    throw new Error('Invalid value: must be finite number');
  }

  // Check timestamp
  if (indicator.timestamp < 0 || indicator.timestamp > Date.now() + 86400000) {
    throw new Error('Invalid timestamp');
  }

  // Sanitize series ID
  if (!/^[A-Z0-9_]+$/.test(indicator.seriesId)) {
    throw new Error('Invalid series ID format');
  }
}
```

### 3. Rate Limiting Headers

```typescript
/**
 * Add rate limit headers to responses
 */
export function addRateLimitHeaders(
  res: Response,
  limit: number,
  remaining: number,
  reset: number
): void {
  res.setHeader('X-RateLimit-Limit', limit.toString());
  res.setHeader('X-RateLimit-Remaining', remaining.toString());
  res.setHeader('X-RateLimit-Reset', reset.toString());
}
```

### 4. CORS Configuration

```typescript
/**
 * CORS configuration for production
 */
export const CORS_CONFIG = {
  origin: [
    'https://aurelia-trading.com',
    'https://app.aurelia-trading.com'
  ],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  credentials: true,
  maxAge: 86400
};
```

---

## Deployment Configuration

### Environment Variables

```bash
# FRED API
FRED_API_KEY=your_fred_api_key_here
FRED_BASE_URL=https://api.stlouisfed.org/fred

# Alpha Vantage
ALPHAVANTAGE_API_KEY=your_alphavantage_key_here

# Database
AGENTDB_PATH=./aurelia.db
REDIS_URL=redis://localhost:6379

# Server
PORT=3000
NODE_ENV=production

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=1000
RATE_LIMIT_WINDOW_MS=60000

# Caching
CACHE_ENABLED=true
CACHE_TTL=300000
CACHE_STRATEGY=agentdb

# WebSocket
WS_PORT=3001
WS_MAX_CONNECTIONS=1000
```

### Docker Compose

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
      - "3001:3001"
    environment:
      - FRED_API_KEY=${FRED_API_KEY}
      - ALPHAVANTAGE_API_KEY=${ALPHAVANTAGE_API_KEY}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    volumes:
      - ./data:/app/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

---

## Appendix: Complete Economic Indicator List

### 50+ Critical Economic Indicators

| # | Series ID | Name | Category | Frequency |
|---|-----------|------|----------|-----------|
| 1 | DFF | Federal Funds Rate | Interest Rates | Daily |
| 2 | DGS10 | 10-Year Treasury | Interest Rates | Daily |
| 3 | DGS2 | 2-Year Treasury | Interest Rates | Daily |
| 4 | DGS5 | 5-Year Treasury | Interest Rates | Daily |
| 5 | DGS30 | 30-Year Treasury | Interest Rates | Daily |
| 6 | T10Y2Y | 10Y-2Y Spread | Interest Rates | Daily |
| 7 | CPIAUCSL | CPI | Inflation | Monthly |
| 8 | PCEPI | PCE Price Index | Inflation | Monthly |
| 9 | CPILFESL | Core CPI | Inflation | Monthly |
| 10 | T5YIE | 5Y Breakeven Inflation | Inflation | Daily |
| 11 | UNRATE | Unemployment Rate | Employment | Monthly |
| 12 | PAYEMS | Nonfarm Payrolls | Employment | Monthly |
| 13 | CIVPART | Labor Force Participation | Employment | Monthly |
| 14 | ICSA | Initial Jobless Claims | Employment | Weekly |
| 15 | GDP | Nominal GDP | GDP & Growth | Quarterly |
| 16 | GDPC1 | Real GDP | GDP & Growth | Quarterly |
| 17 | GDPPOT | Potential GDP | GDP & Growth | Quarterly |
| 18 | M2SL | M2 Money Supply | Money Supply | Monthly |
| 19 | WALCL | Fed Balance Sheet | Money Supply | Weekly |
| 20 | BOGMBASE | Monetary Base | Money Supply | Weekly |
| 21 | MORTGAGE30US | 30Y Mortgage Rate | Credit Markets | Weekly |
| 22 | BAA10Y | BAA-10Y Spread | Credit Markets | Daily |
| 23 | DEXCHUS | USD/CNY | Credit Markets | Daily |
| 24 | DTWEXBGS | Dollar Index | Credit Markets | Daily |
| 25 | RSXFS | Retail Sales | Consumer | Monthly |
| 26 | PCE | Personal Consumption | Consumer | Monthly |
| 27 | UMCSENT | Consumer Sentiment | Consumer | Monthly |
| 28 | HOUST | Housing Starts | Housing | Monthly |
| 29 | CSUSHPINSA | Case-Shiller Index | Housing | Monthly |
| 30 | INDPRO | Industrial Production | Manufacturing | Monthly |
| 31 | SPY | S&P 500 ETF | Market Indices | Real-time |
| 32 | QQQ | Nasdaq 100 ETF | Market Indices | Real-time |
| 33 | DIA | Dow Jones ETF | Market Indices | Real-time |
| 34 | IWM | Russell 2000 ETF | Market Indices | Real-time |
| 35 | VIX | Volatility Index | Market Indices | Real-time |
| 36 | GLD | Gold ETF | Commodities | Real-time |
| 37 | TLT | 20Y+ Treasury ETF | Fixed Income | Real-time |
| 38 | USO | Oil ETF | Commodities | Real-time |
| 39 | UUP | Dollar Index ETF | Currencies | Real-time |
| 40 | HYG | High Yield Bonds | Fixed Income | Real-time |
| 41 | T10YFF | 10Y-Fed Funds Spread | Interest Rates | Daily |
| 42 | DFEDTARU | Fed Target Rate Upper | Interest Rates | Daily |
| 43 | SOFR | Secured Overnight Financing | Interest Rates | Daily |
| 44 | PCEPILFE | Core PCE | Inflation | Monthly |
| 45 | T10YIE | 10Y Breakeven Inflation | Inflation | Daily |
| 46 | AHETPI | Avg Hourly Earnings | Employment | Monthly |
| 47 | JTSJOL | Job Openings (JOLTS) | Employment | Monthly |
| 48 | PERMIT | Building Permits | Housing | Monthly |
| 49 | HSN1F | New Home Sales | Housing | Monthly |
| 50 | UMTMVS | Retail Trade Sales | Consumer | Monthly |
| 51 | DCOILWTICO | WTI Crude Oil Price | Commodities | Daily |
| 52 | GOLDAMGBD228NLBM | Gold Price | Commodities | Daily |

---

## Next Steps

1. **Implementation**: Begin with core data fetching and Zeckendorf encoding
2. **Testing**: Unit tests for encoding accuracy, integration tests for API endpoints
3. **Optimization**: Profile and optimize hot paths (encoding, phase space calculation)
4. **Monitoring**: Set up alerts for anomalies and data source failures
5. **Documentation**: API reference documentation for consumers

---

**Document Version:** 1.0.0
**Last Updated:** 2025-11-13
**Review Date:** 2025-12-13
