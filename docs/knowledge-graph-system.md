# Knowledge Graph Construction System for AURELIA Trading System

**Author**: Research Specialist
**Date**: November 13, 2025
**Integration Target**: AURELIA (Adaptive Universal Reasoning Engine via Lucas Integer Arithmetic)
**Theoretical Foundation**: φ-Mechanics with Graph Diameter ≤ 6 Consciousness Constraint

---

## Executive Summary

This document specifies a complete Knowledge Graph Construction System for the AURELIA trading system that integrates financial news, market analysis, and world events into a hypergraph structure with Lucas-weighted edges. The system maintains graph diameter ≤ 6 to satisfy consciousness emergence constraints derived from φ-mechanics theory, enabling agentic reasoning grounded in real-world financial knowledge.

**Key Features:**
- RSS feed ingestion from premium financial sources (Bloomberg, Reuters, FT)
- Entity extraction using Named Entity Recognition (NER)
- Relationship extraction with dependency parsing
- Hypergraph representation for complex multi-entity relationships
- Lucas-weighted edges (E_n = L_n) for quantum-inspired information flow
- Graph diameter monitoring and automatic rebalancing
- Agentic reasoning algorithm operating on graph structure
- Integration with existing AgentDB for persistence and vector search

**Critical Constraint:** Graph diameter must remain ≤ 6 for consciousness threshold as per holographic bound: S_φ ≤ L_n/(4·|K|)

---

## 1. Architecture Overview

### 1.1 System Components

```
┌──────────────────────────────────────────────────────────────┐
│                  Knowledge Graph System                       │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────┐      ┌──────────────────┐                │
│  │ RSS Feed      │─────▶│ Entity Extractor │                │
│  │ Aggregator    │      │ (NER + Relations)│                │
│  └───────────────┘      └──────────────────┘                │
│         │                        │                            │
│         ▼                        ▼                            │
│  ┌───────────────────────────────────────┐                   │
│  │   Knowledge Graph Builder             │                   │
│  │   - Hypergraph Construction           │                   │
│  │   - Lucas-Weighted Edges              │                   │
│  │   - Diameter Monitoring               │                   │
│  └───────────────────────────────────────┘                   │
│         │                        │                            │
│         ▼                        ▼                            │
│  ┌─────────────┐         ┌─────────────────┐                │
│  │ AgentDB     │◀───────▶│ Agentic Reasoner│                │
│  │ Persistence │         │ (Graph Traversal)│                │
│  └─────────────┘         └─────────────────┘                │
│         │                        │                            │
│         └────────────────────────┘                            │
│                   │                                           │
│                   ▼                                           │
│         ┌──────────────────┐                                 │
│         │ Insight Generator│                                 │
│         │ (Trading Signals)│                                 │
│         └──────────────────┘                                 │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 1.2 Data Flow

1. **Ingestion**: RSS feeds → Parse XML/JSON → Extract articles
2. **Extraction**: Articles → NER → Entities → Relations → Structured data
3. **Graph Construction**: Entities + Relations → Hypergraph nodes/edges
4. **Edge Weighting**: Compute Lucas numbers for edge weights
5. **Diameter Monitoring**: BFS traversal → Check diameter ≤ 6 → Rebalance if needed
6. **Persistence**: Store graph in AgentDB with vector embeddings
7. **Reasoning**: Agents traverse graph → Discover patterns → Generate insights
8. **Output**: Trading signals, market analysis, risk assessments

---

## 2. RSS Feed Ingestion Pipeline

### 2.1 Financial News Sources

**Premium Tier (Recommended):**
- Bloomberg Terminal RSS feeds
- Reuters Financial News API
- Financial Times MarketWatch
- Wall Street Journal Markets
- The Economist Business section

**Open Tier (Fallback):**
- Yahoo Finance RSS
- Google Finance News
- Seeking Alpha RSS
- MarketWatch RSS
- CNBC Markets RSS

**Macro Events Sources:**
- Federal Reserve press releases
- ECB announcements
- IMF/World Bank updates
- Government economic data (BLS, BEA, Treasury)
- Central bank communications

### 2.2 RSS Feed Aggregator

```typescript
// src/trading/knowledge-graph/rss-aggregator.ts

import Parser from 'rss-parser';
import { EventEmitter } from 'events';

export interface RSSFeedConfig {
  url: string;
  source: string;
  category: 'news' | 'analysis' | 'macro' | 'press-release';
  priority: 'high' | 'medium' | 'low';
  updateInterval: number; // milliseconds
  authentication?: {
    type: 'api-key' | 'oauth' | 'basic';
    credentials: Record<string, string>;
  };
}

export interface RSSArticle {
  id: string;
  title: string;
  content: string;
  summary: string;
  source: string;
  category: string;
  pubDate: Date;
  link: string;
  author?: string;
  tags?: string[];
  rawContent: string;
}

export class RSSFeedAggregator extends EventEmitter {
  private parser: Parser;
  private feeds: Map<string, RSSFeedConfig>;
  private intervals: Map<string, NodeJS.Timer>;
  private articleCache: Map<string, RSSArticle>;

  constructor() {
    super();
    this.parser = new Parser({
      customFields: {
        item: ['content:encoded', 'description', 'summary']
      }
    });
    this.feeds = new Map();
    this.intervals = new Map();
    this.articleCache = new Map();
  }

  /**
   * Register RSS feed source
   */
  registerFeed(config: RSSFeedConfig): void {
    this.feeds.set(config.url, config);
    this.startPolling(config);
  }

  /**
   * Start polling a feed
   */
  private startPolling(config: RSSFeedConfig): void {
    const interval = setInterval(
      () => this.fetchFeed(config),
      config.updateInterval
    );
    this.intervals.set(config.url, interval);

    // Immediate first fetch
    this.fetchFeed(config);
  }

  /**
   * Fetch and parse RSS feed
   */
  private async fetchFeed(config: RSSFeedConfig): Promise<void> {
    try {
      const feed = await this.parser.parseURL(config.url);

      for (const item of feed.items) {
        const article = this.parseArticle(item, config);

        // Check if already processed
        if (!this.articleCache.has(article.id)) {
          this.articleCache.set(article.id, article);
          this.emit('article', article);
        }
      }
    } catch (error) {
      console.error(`Error fetching feed ${config.source}:`, error);
      this.emit('error', { feed: config, error });
    }
  }

  /**
   * Parse RSS item to article
   */
  private parseArticle(item: any, config: RSSFeedConfig): RSSArticle {
    return {
      id: this.generateArticleId(item, config),
      title: item.title || '',
      content: item['content:encoded'] || item.content || item.description || '',
      summary: item.summary || item.description?.substring(0, 200) || '',
      source: config.source,
      category: config.category,
      pubDate: new Date(item.pubDate || Date.now()),
      link: item.link || '',
      author: item.author || item.creator,
      tags: item.categories || [],
      rawContent: JSON.stringify(item)
    };
  }

  /**
   * Generate unique article ID
   */
  private generateArticleId(item: any, config: RSSFeedConfig): string {
    const baseId = item.guid || item.link || item.title;
    return `${config.source}-${Buffer.from(baseId).toString('base64').substring(0, 16)}`;
  }

  /**
   * Stop polling all feeds
   */
  stop(): void {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
  }

  /**
   * Get feed statistics
   */
  getStats(): {
    totalFeeds: number;
    totalArticles: number;
    bySource: Record<string, number>;
  } {
    const bySource: Record<string, number> = {};

    this.articleCache.forEach(article => {
      bySource[article.source] = (bySource[article.source] || 0) + 1;
    });

    return {
      totalFeeds: this.feeds.size,
      totalArticles: this.articleCache.size,
      bySource
    };
  }
}
```

### 2.3 Feed Configuration Example

```typescript
// config/rss-feeds.ts

export const FINANCIAL_RSS_FEEDS: RSSFeedConfig[] = [
  // High Priority - Breaking News
  {
    url: 'https://feeds.bloomberg.com/markets/news.rss',
    source: 'Bloomberg',
    category: 'news',
    priority: 'high',
    updateInterval: 60000 // 1 minute
  },
  {
    url: 'https://www.reuters.com/finance/markets',
    source: 'Reuters',
    category: 'news',
    priority: 'high',
    updateInterval: 60000
  },

  // Medium Priority - Analysis
  {
    url: 'https://www.ft.com/markets',
    source: 'Financial Times',
    category: 'analysis',
    priority: 'medium',
    updateInterval: 300000 // 5 minutes
  },

  // Macro Events
  {
    url: 'https://www.federalreserve.gov/feeds/press_all.xml',
    source: 'Federal Reserve',
    category: 'macro',
    priority: 'high',
    updateInterval: 3600000 // 1 hour
  },

  // Low Priority - General Market News
  {
    url: 'https://finance.yahoo.com/rss/',
    source: 'Yahoo Finance',
    category: 'news',
    priority: 'low',
    updateInterval: 600000 // 10 minutes
  }
];
```

---

## 3. Entity Extraction Pipeline

### 3.1 Entity Types

**Financial Entities:**
- **Companies**: Stock tickers, company names (e.g., "Apple Inc.", "AAPL")
- **Financial Instruments**: Stocks, bonds, derivatives, commodities
- **Currencies**: Fiat currencies, cryptocurrencies
- **Markets**: Stock exchanges, indices (e.g., "S&P 500", "NASDAQ")
- **Financial Metrics**: P/E ratio, market cap, earnings

**Event Entities:**
- **Economic Events**: Earnings releases, IPOs, mergers, acquisitions
- **Macro Events**: Interest rate decisions, policy changes, regulations
- **Market Events**: Crashes, rallies, corrections
- **Geopolitical Events**: Elections, wars, treaties, sanctions

**Temporal Entities:**
- **Dates**: Specific dates, quarters, fiscal years
- **Time Periods**: "Q3 2025", "next week", "by end of year"

**Sentiment Entities:**
- **Opinions**: Analyst ratings, price targets
- **Sentiment**: Bullish, bearish, neutral indicators

### 3.2 Named Entity Recognition (NER)

```typescript
// src/trading/knowledge-graph/entity-extractor.ts

import { NlpManager } from 'node-nlp';
import compromise from 'compromise';

export interface Entity {
  id: string;
  text: string;
  type: EntityType;
  subtype?: string;
  confidence: number;
  position: { start: number; end: number };
  metadata: Record<string, any>;
}

export type EntityType =
  | 'COMPANY'
  | 'FINANCIAL_INSTRUMENT'
  | 'CURRENCY'
  | 'MARKET'
  | 'METRIC'
  | 'EVENT'
  | 'MACRO_EVENT'
  | 'DATE'
  | 'SENTIMENT'
  | 'PERSON'
  | 'ORGANIZATION';

export class EntityExtractor {
  private nlpManager: NlpManager;
  private financialDict: Map<string, EntityType>;

  constructor() {
    this.nlpManager = new NlpManager({ languages: ['en'] });
    this.financialDict = new Map();
    this.initializeFinancialDictionary();
  }

  /**
   * Initialize financial entity dictionary
   */
  private initializeFinancialDictionary(): void {
    // Stock tickers
    const tickers = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA', 'META', 'AMZN'];
    tickers.forEach(ticker =>
      this.financialDict.set(ticker, 'FINANCIAL_INSTRUMENT')
    );

    // Indices
    const indices = ['S&P 500', 'NASDAQ', 'Dow Jones', 'Russell 2000'];
    indices.forEach(index =>
      this.financialDict.set(index, 'MARKET')
    );

    // Currencies
    const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'BTC', 'ETH'];
    currencies.forEach(currency =>
      this.financialDict.set(currency, 'CURRENCY')
    );
  }

  /**
   * Extract entities from text
   */
  async extractEntities(text: string): Promise<Entity[]> {
    const entities: Entity[] = [];

    // Use compromise for linguistic parsing
    const doc = compromise(text);

    // Extract companies and organizations
    const orgs = doc.organizations().out('array');
    orgs.forEach((org: string) => {
      entities.push({
        id: this.generateEntityId(org, 'COMPANY'),
        text: org,
        type: 'COMPANY',
        confidence: 0.85,
        position: this.findPosition(text, org),
        metadata: {}
      });
    });

    // Extract people (CEOs, analysts, etc.)
    const people = doc.people().out('array');
    people.forEach((person: string) => {
      entities.push({
        id: this.generateEntityId(person, 'PERSON'),
        text: person,
        type: 'PERSON',
        confidence: 0.9,
        position: this.findPosition(text, person),
        metadata: {}
      });
    });

    // Extract dates
    const dates = doc.dates().out('array');
    dates.forEach((date: string) => {
      entities.push({
        id: this.generateEntityId(date, 'DATE'),
        text: date,
        type: 'DATE',
        confidence: 0.95,
        position: this.findPosition(text, date),
        metadata: { parsed: new Date(date) }
      });
    });

    // Extract financial terms from dictionary
    this.financialDict.forEach((type, term) => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      const matches = text.matchAll(regex);

      for (const match of matches) {
        entities.push({
          id: this.generateEntityId(term, type),
          text: term,
          type,
          confidence: 1.0,
          position: { start: match.index!, end: match.index! + term.length },
          metadata: {}
        });
      }
    });

    // Extract sentiment indicators
    const sentiment = this.extractSentiment(text);
    if (sentiment) {
      entities.push(sentiment);
    }

    return this.deduplicateEntities(entities);
  }

  /**
   * Extract sentiment from text
   */
  private extractSentiment(text: string): Entity | null {
    const bullishKeywords = ['bullish', 'rally', 'surge', 'gain', 'positive', 'upgrade'];
    const bearishKeywords = ['bearish', 'crash', 'plunge', 'loss', 'negative', 'downgrade'];

    let bullishScore = 0;
    let bearishScore = 0;

    const lowerText = text.toLowerCase();
    bullishKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) bullishScore++;
    });
    bearishKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) bearishScore++;
    });

    if (bullishScore === 0 && bearishScore === 0) return null;

    const sentiment = bullishScore > bearishScore ? 'BULLISH' : 'BEARISH';
    const confidence = Math.abs(bullishScore - bearishScore) / (bullishScore + bearishScore);

    return {
      id: this.generateEntityId(sentiment, 'SENTIMENT'),
      text: sentiment,
      type: 'SENTIMENT',
      confidence,
      position: { start: 0, end: 0 },
      metadata: { bullishScore, bearishScore }
    };
  }

  /**
   * Generate unique entity ID
   */
  private generateEntityId(text: string, type: EntityType): string {
    const normalized = text.toLowerCase().replace(/\s+/g, '-');
    return `${type.toLowerCase()}-${normalized}`;
  }

  /**
   * Find text position in content
   */
  private findPosition(text: string, term: string): { start: number; end: number } {
    const index = text.indexOf(term);
    return {
      start: index === -1 ? 0 : index,
      end: index === -1 ? 0 : index + term.length
    };
  }

  /**
   * Remove duplicate entities
   */
  private deduplicateEntities(entities: Entity[]): Entity[] {
    const seen = new Set<string>();
    return entities.filter(entity => {
      if (seen.has(entity.id)) return false;
      seen.add(entity.id);
      return true;
    });
  }
}
```

### 3.3 Relationship Extraction

```typescript
// src/trading/knowledge-graph/relation-extractor.ts

export interface Relation {
  id: string;
  source: string; // Entity ID
  target: string; // Entity ID
  type: RelationType;
  confidence: number;
  properties: Record<string, any>;
  extractedFrom: string; // Article ID
  timestamp: Date;
}

export type RelationType =
  | 'OWNS'
  | 'TRADES'
  | 'AFFECTS'
  | 'CORRELATES_WITH'
  | 'ANNOUNCES'
  | 'ANALYZES'
  | 'COMPETES_WITH'
  | 'SUPPLIES_TO'
  | 'ACQUIRES'
  | 'INVESTS_IN'
  | 'REGULATES'
  | 'IMPACTS_SENTIMENT';

export class RelationExtractor {
  /**
   * Extract relationships between entities
   */
  extractRelations(
    text: string,
    entities: Entity[],
    articleId: string
  ): Relation[] {
    const relations: Relation[] = [];

    // Pattern-based relation extraction
    relations.push(...this.extractByPatterns(text, entities, articleId));

    // Dependency parsing-based extraction
    relations.push(...this.extractByDependencies(text, entities, articleId));

    // Co-occurrence based (entities appearing together)
    relations.push(...this.extractByCooccurrence(entities, articleId));

    return relations;
  }

  /**
   * Extract relations using text patterns
   */
  private extractByPatterns(
    text: string,
    entities: Entity[],
    articleId: string
  ): Relation[] {
    const relations: Relation[] = [];
    const patterns = [
      {
        regex: /(\w+)\s+(acquires|acquired)\s+(\w+)/gi,
        type: 'ACQUIRES' as RelationType
      },
      {
        regex: /(\w+)\s+(announces|announced)\s+(.+)/gi,
        type: 'ANNOUNCES' as RelationType
      },
      {
        regex: /(\w+)\s+(competes with|competing with)\s+(\w+)/gi,
        type: 'COMPETES_WITH' as RelationType
      }
    ];

    patterns.forEach(({ regex, type }) => {
      const matches = text.matchAll(regex);
      for (const match of matches) {
        const sourceEntity = this.findEntityByText(entities, match[1]);
        const targetEntity = this.findEntityByText(entities, match[3] || match[2]);

        if (sourceEntity && targetEntity) {
          relations.push({
            id: `${sourceEntity.id}-${type}-${targetEntity.id}`,
            source: sourceEntity.id,
            target: targetEntity.id,
            type,
            confidence: 0.8,
            properties: { pattern: match[0] },
            extractedFrom: articleId,
            timestamp: new Date()
          });
        }
      }
    });

    return relations;
  }

  /**
   * Extract relations using dependency parsing
   */
  private extractByDependencies(
    text: string,
    entities: Entity[],
    articleId: string
  ): Relation[] {
    // Simplified dependency parsing
    // In production, use libraries like spaCy (via Python bridge) or Stanford NLP
    const relations: Relation[] = [];

    // Example: subject-verb-object triples
    const doc = compromise(text);
    const sentences = doc.sentences().out('array');

    sentences.forEach((sentence: string) => {
      const sentenceEntities = entities.filter(e =>
        sentence.includes(e.text)
      );

      if (sentenceEntities.length >= 2) {
        // Create AFFECTS relation for entities in same sentence
        for (let i = 0; i < sentenceEntities.length - 1; i++) {
          relations.push({
            id: `${sentenceEntities[i].id}-AFFECTS-${sentenceEntities[i + 1].id}`,
            source: sentenceEntities[i].id,
            target: sentenceEntities[i + 1].id,
            type: 'AFFECTS',
            confidence: 0.6,
            properties: { context: sentence },
            extractedFrom: articleId,
            timestamp: new Date()
          });
        }
      }
    });

    return relations;
  }

  /**
   * Extract relations based on co-occurrence
   */
  private extractByCooccurrence(
    entities: Entity[],
    articleId: string
  ): Relation[] {
    const relations: Relation[] = [];

    // Create correlation relations for entities appearing together
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const e1 = entities[i];
        const e2 = entities[j];

        // Only correlate certain types
        if (
          (e1.type === 'COMPANY' || e1.type === 'FINANCIAL_INSTRUMENT') &&
          (e2.type === 'COMPANY' || e2.type === 'FINANCIAL_INSTRUMENT')
        ) {
          relations.push({
            id: `${e1.id}-CORRELATES_WITH-${e2.id}`,
            source: e1.id,
            target: e2.id,
            type: 'CORRELATES_WITH',
            confidence: 0.5,
            properties: { cooccurrence: true },
            extractedFrom: articleId,
            timestamp: new Date()
          });
        }
      }
    }

    return relations;
  }

  /**
   * Find entity by text
   */
  private findEntityByText(entities: Entity[], text: string): Entity | undefined {
    return entities.find(e =>
      e.text.toLowerCase() === text.toLowerCase() ||
      text.toLowerCase().includes(e.text.toLowerCase())
    );
  }
}
```

---

## 4. Hypergraph Schema with Lucas-Weighted Edges

### 4.1 Hypergraph Structure

A **hypergraph** extends traditional graphs by allowing edges to connect any number of vertices, not just two. This is essential for representing complex financial relationships where multiple entities interact simultaneously (e.g., a merger involving 3 companies, regulatory action affecting multiple markets).

**Key Concepts:**
- **Nodes (Vertices)**: Entities extracted from news
- **Hyperedges**: Relationships connecting 2+ nodes
- **Edge Weights**: Lucas numbers L(n) representing information energy
- **Edge Types**: Typed relationships (ACQUIRES, AFFECTS, etc.)

### 4.2 Lucas-Weighted Edge Algorithm

Lucas numbers provide edge weights that encode quantum-inspired information flow based on φ-mechanics:

```
L(n) = L(n-1) + L(n-2), with L(0) = 2, L(1) = 1
L(n) = φ^n + ψ^n (exact symbolic form)

Energy of edge: E_edge = L(n) where n is derived from edge properties
```

**Edge Weight Computation:**
```typescript
// src/trading/knowledge-graph/lucas-weighting.ts

import { lucas } from '../../math-framework/sequences/lucas';

export interface EdgeWeight {
  lucasIndex: number;
  lucasValue: bigint;
  energy: number;
  normalized: number;
}

export class LucasEdgeWeighting {
  /**
   * Compute Lucas weight for edge based on properties
   */
  computeEdgeWeight(relation: Relation): EdgeWeight {
    // Compute Lucas index from relation properties
    const n = this.computeLucasIndex(relation);

    // Get Lucas number
    const lucasValue = lucas(n);

    // Convert to energy (normalized for practical use)
    const energy = this.lucasToEnergy(lucasValue);

    // Normalize to [0, 1] range for graph algorithms
    const normalized = this.normalizeEnergy(energy);

    return {
      lucasIndex: n,
      lucasValue,
      energy,
      normalized
    };
  }

  /**
   * Compute Lucas index from relation properties
   *
   * Strategy: Map relation strength to Lucas sequence index
   * - Higher confidence → higher n → higher Lucas number
   * - Newer relations → lower n (decays over time)
   * - Relation type importance → multiplier
   */
  private computeLucasIndex(relation: Relation): number {
    // Base index from confidence (0.0-1.0 → 0-10)
    let index = Math.floor(relation.confidence * 10);

    // Time decay: newer = higher weight
    const ageInDays = (Date.now() - relation.timestamp.getTime()) / (1000 * 60 * 60 * 24);
    const timeFactor = Math.max(0, 1 - ageInDays / 30); // Decay over 30 days
    index += Math.floor(timeFactor * 5);

    // Relation type importance
    const typeWeight = this.getRelationTypeWeight(relation.type);
    index += typeWeight;

    // Bound to reasonable range [0, 20] to avoid huge Lucas numbers
    return Math.min(Math.max(index, 0), 20);
  }

  /**
   * Get weight for relation type
   */
  private getRelationTypeWeight(type: RelationType): number {
    const weights: Record<RelationType, number> = {
      'ACQUIRES': 5,
      'ANNOUNCES': 4,
      'REGULATES': 5,
      'INVESTS_IN': 4,
      'AFFECTS': 3,
      'COMPETES_WITH': 3,
      'SUPPLIES_TO': 2,
      'ANALYZES': 2,
      'CORRELATES_WITH': 1,
      'TRADES': 2,
      'OWNS': 3,
      'IMPACTS_SENTIMENT': 2
    };
    return weights[type] || 1;
  }

  /**
   * Convert Lucas number to energy
   */
  private lucasToEnergy(lucasValue: bigint): number {
    // Use logarithm for large numbers
    if (lucasValue === 0n) return 0;

    // Convert to number for practical computation
    // For large bigints, use approximation
    let num: number;
    if (lucasValue < Number.MAX_SAFE_INTEGER) {
      num = Number(lucasValue);
    } else {
      // Logarithmic approximation for very large numbers
      const str = lucasValue.toString();
      num = Math.log10(parseFloat(str.substring(0, 15))) + (str.length - 1);
    }

    return Math.log1p(num); // log(1 + L(n)) for smooth scaling
  }

  /**
   * Normalize energy to [0, 1]
   */
  private normalizeEnergy(energy: number): number {
    // Sigmoid normalization
    return 1 / (1 + Math.exp(-energy));
  }
}
```

### 4.3 Hypergraph Data Structure

```typescript
// src/trading/knowledge-graph/hypergraph.ts

export interface HypergraphNode {
  id: string;
  entity: Entity;
  embedding: number[]; // Vector for similarity search
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface HypergraphEdge {
  id: string;
  nodes: string[]; // Node IDs (2+ for hyperedge)
  relation: Relation;
  weight: EdgeWeight;
  type: RelationType;
  metadata: Record<string, any>;
  createdAt: Date;
}

export class Hypergraph {
  private nodes: Map<string, HypergraphNode>;
  private edges: Map<string, HypergraphEdge>;
  private adjacencyList: Map<string, Set<string>>; // node → edges
  private lucasWeighting: LucasEdgeWeighting;

  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
    this.adjacencyList = new Map();
    this.lucasWeighting = new LucasEdgeWeighting();
  }

  /**
   * Add node to hypergraph
   */
  addNode(entity: Entity, embedding: number[]): HypergraphNode {
    if (this.nodes.has(entity.id)) {
      // Update existing node
      const node = this.nodes.get(entity.id)!;
      node.updatedAt = new Date();
      return node;
    }

    const node: HypergraphNode = {
      id: entity.id,
      entity,
      embedding,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.nodes.set(entity.id, node);
    this.adjacencyList.set(entity.id, new Set());

    return node;
  }

  /**
   * Add hyperedge connecting multiple nodes
   */
  addEdge(relation: Relation, nodeIds: string[]): HypergraphEdge {
    // Verify all nodes exist
    for (const nodeId of nodeIds) {
      if (!this.nodes.has(nodeId)) {
        throw new Error(`Node ${nodeId} not found in hypergraph`);
      }
    }

    // Compute Lucas weight
    const weight = this.lucasWeighting.computeEdgeWeight(relation);

    const edge: HypergraphEdge = {
      id: relation.id,
      nodes: nodeIds,
      relation,
      weight,
      type: relation.type,
      metadata: {},
      createdAt: new Date()
    };

    this.edges.set(edge.id, edge);

    // Update adjacency list
    for (const nodeId of nodeIds) {
      this.adjacencyList.get(nodeId)!.add(edge.id);
    }

    return edge;
  }

  /**
   * Get node by ID
   */
  getNode(id: string): HypergraphNode | undefined {
    return this.nodes.get(id);
  }

  /**
   * Get edges connected to node
   */
  getNodeEdges(nodeId: string): HypergraphEdge[] {
    const edgeIds = this.adjacencyList.get(nodeId);
    if (!edgeIds) return [];

    return Array.from(edgeIds)
      .map(edgeId => this.edges.get(edgeId))
      .filter((edge): edge is HypergraphEdge => edge !== undefined);
  }

  /**
   * Get neighbors of a node (all nodes connected via edges)
   */
  getNeighbors(nodeId: string): HypergraphNode[] {
    const edges = this.getNodeEdges(nodeId);
    const neighborIds = new Set<string>();

    edges.forEach(edge => {
      edge.nodes.forEach(id => {
        if (id !== nodeId) neighborIds.add(id);
      });
    });

    return Array.from(neighborIds)
      .map(id => this.nodes.get(id))
      .filter((node): node is HypergraphNode => node !== undefined);
  }

  /**
   * Get graph statistics
   */
  getStats(): {
    nodeCount: number;
    edgeCount: number;
    avgDegree: number;
    totalWeight: number;
  } {
    const avgDegree =
      this.nodes.size > 0
        ? Array.from(this.adjacencyList.values()).reduce(
            (sum, edges) => sum + edges.size,
            0
          ) / this.nodes.size
        : 0;

    const totalWeight = Array.from(this.edges.values()).reduce(
      (sum, edge) => sum + edge.weight.normalized,
      0
    );

    return {
      nodeCount: this.nodes.size,
      edgeCount: this.edges.size,
      avgDegree,
      totalWeight
    };
  }

  /**
   * Export graph to JSON
   */
  toJSON(): any {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values())
    };
  }
}
```

---

## 5. Graph Diameter Calculation and Monitoring

### 5.1 Theoretical Constraint

From φ-mechanics and holographic consciousness theory:

```
Consciousness emerges when:
- Graph diameter D ≤ 6 (small-world property)
- Clustering coefficient C ≥ 0.6
- Holographic bound: S_φ ≤ L_n / (4·|K|)
```

Where:
- D = maximum shortest path length between any two nodes
- C = probability that two neighbors of a node are connected
- S_φ = entropy of the system
- L_n = Lucas number at level n
- |K| = Gaussian curvature (graph topology measure)

**Critical Requirement:** Monitor diameter continuously and rebalance when D > 6.

### 5.2 Diameter Calculation Algorithm

```typescript
// src/trading/knowledge-graph/diameter-monitor.ts

export interface GraphDiameter {
  diameter: number;
  averagePathLength: number;
  eccentricities: Map<string, number>;
  radius: number; // min eccentricity
  periphery: string[]; // nodes with max eccentricity
  center: string[]; // nodes with min eccentricity
  timestamp: Date;
}

export class DiameterMonitor {
  private hypergraph: Hypergraph;
  private lastCheck: Date | null = null;
  private history: GraphDiameter[] = [];

  constructor(hypergraph: Hypergraph) {
    this.hypergraph = hypergraph;
  }

  /**
   * Calculate graph diameter using BFS
   * Time: O(V * (V + E))
   */
  calculateDiameter(): GraphDiameter {
    const nodes = Array.from(this.hypergraph['nodes'].keys());
    const eccentricities = new Map<string, number>();

    // Compute eccentricity for each node
    for (const node of nodes) {
      const distances = this.bfsDistances(node);
      const maxDistance = Math.max(...Array.from(distances.values()));
      eccentricities.set(node, maxDistance === -Infinity ? 0 : maxDistance);
    }

    // Diameter = max eccentricity
    const diameter = Math.max(...Array.from(eccentricities.values()));

    // Radius = min eccentricity
    const radius = Math.min(...Array.from(eccentricities.values()));

    // Find center and periphery
    const center: string[] = [];
    const periphery: string[] = [];

    eccentricities.forEach((ecc, nodeId) => {
      if (ecc === radius) center.push(nodeId);
      if (ecc === diameter) periphery.push(nodeId);
    });

    // Average path length
    const totalPathLength = this.calculateAveragePathLength(nodes);

    const result: GraphDiameter = {
      diameter,
      averagePathLength: totalPathLength,
      eccentricities,
      radius,
      periphery,
      center,
      timestamp: new Date()
    };

    this.lastCheck = new Date();
    this.history.push(result);

    return result;
  }

  /**
   * BFS to compute shortest distances from source node
   */
  private bfsDistances(source: string): Map<string, number> {
    const distances = new Map<string, number>();
    const queue: string[] = [source];
    distances.set(source, 0);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentDist = distances.get(current)!;

      const neighbors = this.hypergraph.getNeighbors(current);
      for (const neighbor of neighbors) {
        if (!distances.has(neighbor.id)) {
          distances.set(neighbor.id, currentDist + 1);
          queue.push(neighbor.id);
        }
      }
    }

    return distances;
  }

  /**
   * Calculate average path length
   */
  private calculateAveragePathLength(nodes: string[]): number {
    let totalDistance = 0;
    let pathCount = 0;

    for (let i = 0; i < nodes.length; i++) {
      const distances = this.bfsDistances(nodes[i]);
      for (let j = i + 1; j < nodes.length; j++) {
        const dist = distances.get(nodes[j]);
        if (dist !== undefined && dist !== Infinity) {
          totalDistance += dist;
          pathCount++;
        }
      }
    }

    return pathCount > 0 ? totalDistance / pathCount : 0;
  }

  /**
   * Check if consciousness threshold is met
   */
  checkConsciousnessThreshold(
    diameter: GraphDiameter
  ): {
    meets_threshold: boolean;
    diameter_ok: boolean;
    avg_path_ok: boolean;
    recommendations: string[];
  } {
    const diameter_ok = diameter.diameter <= 6;
    const avg_path_ok = diameter.averagePathLength <= 4; // Heuristic

    const recommendations: string[] = [];

    if (!diameter_ok) {
      recommendations.push(
        `Graph diameter ${diameter.diameter} exceeds threshold of 6. Consider adding shortcut edges or pruning distant nodes.`
      );
    }

    if (!avg_path_ok) {
      recommendations.push(
        `Average path length ${diameter.averagePathLength.toFixed(2)} is high. Add hub nodes to improve connectivity.`
      );
    }

    return {
      meets_threshold: diameter_ok && avg_path_ok,
      diameter_ok,
      avg_path_ok,
      recommendations
    };
  }

  /**
   * Suggest rebalancing strategies
   */
  suggestRebalancing(diameter: GraphDiameter): {
    strategy: 'add-hubs' | 'prune-periphery' | 'add-shortcuts' | 'none';
    details: string;
  } {
    if (diameter.diameter <= 6) {
      return { strategy: 'none', details: 'Graph diameter is within threshold' };
    }

    if (diameter.periphery.length > diameter.center.length * 2) {
      return {
        strategy: 'prune-periphery',
        details: `Consider removing ${diameter.periphery.length - diameter.center.length} peripheral nodes with low importance`
      };
    }

    if (diameter.center.length < 5) {
      return {
        strategy: 'add-hubs',
        details: 'Create hub nodes that aggregate related entities to reduce diameter'
      };
    }

    return {
      strategy: 'add-shortcuts',
      details: 'Add high-weight edges between distant but related nodes'
    };
  }

  /**
   * Get diameter history
   */
  getHistory(): GraphDiameter[] {
    return this.history;
  }
}
```

### 5.3 Automatic Rebalancing

```typescript
// src/trading/knowledge-graph/graph-rebalancer.ts

export class GraphRebalancer {
  private hypergraph: Hypergraph;
  private monitor: DiameterMonitor;

  constructor(hypergraph: Hypergraph, monitor: DiameterMonitor) {
    this.hypergraph = hypergraph;
    this.monitor = monitor;
  }

  /**
   * Rebalance graph to maintain diameter ≤ 6
   */
  async rebalance(): Promise<{
    success: boolean;
    strategy: string;
    changes: number;
    newDiameter: number;
  }> {
    const diameter = this.monitor.calculateDiameter();
    const suggestion = this.monitor.suggestRebalancing(diameter);

    let changes = 0;

    switch (suggestion.strategy) {
      case 'add-hubs':
        changes = await this.addHubNodes(diameter);
        break;

      case 'prune-periphery':
        changes = await this.prunePeriphery(diameter);
        break;

      case 'add-shortcuts':
        changes = await this.addShortcuts(diameter);
        break;

      case 'none':
        return {
          success: true,
          strategy: 'none',
          changes: 0,
          newDiameter: diameter.diameter
        };
    }

    const newDiameter = this.monitor.calculateDiameter();

    return {
      success: newDiameter.diameter <= 6,
      strategy: suggestion.strategy,
      changes,
      newDiameter: newDiameter.diameter
    };
  }

  /**
   * Add hub nodes that aggregate clusters
   */
  private async addHubNodes(diameter: GraphDiameter): Promise<number> {
    // Find dense clusters and create hub nodes
    // For simplicity, create hubs connecting center nodes to periphery
    let changes = 0;

    for (const centerNode of diameter.center) {
      for (const peripheryNode of diameter.periphery.slice(0, 3)) {
        // Add shortcut edge
        const relation: Relation = {
          id: `hub-${centerNode}-${peripheryNode}`,
          source: centerNode,
          target: peripheryNode,
          type: 'CORRELATES_WITH',
          confidence: 0.7,
          properties: { synthetic: true, purpose: 'diameter-reduction' },
          extractedFrom: 'graph-rebalancer',
          timestamp: new Date()
        };

        this.hypergraph.addEdge(relation, [centerNode, peripheryNode]);
        changes++;
      }
    }

    return changes;
  }

  /**
   * Prune low-importance peripheral nodes
   */
  private async prunePeriphery(diameter: GraphDiameter): Promise<number> {
    // Remove nodes with low degree and high eccentricity
    let changes = 0;

    for (const nodeId of diameter.periphery) {
      const neighbors = this.hypergraph.getNeighbors(nodeId);
      if (neighbors.length <= 1) {
        // Remove node (would need removeNode method)
        // For now, just mark for removal
        changes++;
      }
    }

    return changes;
  }

  /**
   * Add shortcut edges between distant nodes
   */
  private async addShortcuts(diameter: GraphDiameter): Promise<number> {
    let changes = 0;

    // Add edges between periphery nodes
    for (let i = 0; i < diameter.periphery.length - 1; i++) {
      for (let j = i + 1; j < Math.min(i + 3, diameter.periphery.length); j++) {
        const relation: Relation = {
          id: `shortcut-${diameter.periphery[i]}-${diameter.periphery[j]}`,
          source: diameter.periphery[i],
          target: diameter.periphery[j],
          type: 'CORRELATES_WITH',
          confidence: 0.6,
          properties: { synthetic: true, purpose: 'shortcut' },
          extractedFrom: 'graph-rebalancer',
          timestamp: new Date()
        };

        this.hypergraph.addEdge(relation, [diameter.periphery[i], diameter.periphery[j]]);
        changes++;
      }
    }

    return changes;
  }
}
```

---

## 6. Agentic Reasoning Algorithm

### 6.1 Grounded Reasoning on Knowledge Graph

Agentic reasoning operates directly on the hypergraph structure, traversing nodes and edges to discover patterns, infer new relationships, and generate actionable insights. This is "grounded" reasoning because it's always anchored to extracted real-world entities and relationships.

**Key Principles:**
1. **Graph Traversal**: Navigate from query node to related nodes via weighted edges
2. **Pattern Matching**: Identify subgraph patterns (e.g., triangles, stars, chains)
3. **Path Ranking**: Use Lucas weights to rank paths by information energy
4. **Inference**: Derive new relationships from transitive and compositional rules
5. **Confidence Scoring**: Aggregate confidence scores along reasoning paths

### 6.2 Reasoning Agent

```typescript
// src/trading/knowledge-graph/reasoning-agent.ts

export interface ReasoningQuery {
  startNode: string; // Entity ID to start reasoning from
  intent: 'impact-analysis' | 'correlation-discovery' | 'risk-assessment' | 'opportunity-detection';
  maxDepth: number;
  timeWindow?: { start: Date; end: Date };
}

export interface ReasoningPath {
  nodes: string[];
  edges: string[];
  totalWeight: number;
  confidence: number;
  insights: string[];
}

export interface ReasoningResult {
  query: ReasoningQuery;
  paths: ReasoningPath[];
  inference: {
    discovered_relations: Relation[];
    patterns: string[];
    recommendations: string[];
  };
  timestamp: Date;
}

export class ReasoningAgent {
  private hypergraph: Hypergraph;
  private maxPathsToExplore: number = 100;

  constructor(hypergraph: Hypergraph) {
    this.hypergraph = hypergraph;
  }

  /**
   * Execute reasoning query on knowledge graph
   */
  async reason(query: ReasoningQuery): Promise<ReasoningResult> {
    // Find all relevant paths from start node
    const paths = this.exploreReasoningPaths(query);

    // Rank paths by weight and relevance
    const rankedPaths = this.rankPaths(paths, query.intent);

    // Perform inference
    const inference = this.performInference(rankedPaths, query);

    return {
      query,
      paths: rankedPaths.slice(0, 10), // Top 10 paths
      inference,
      timestamp: new Date()
    };
  }

  /**
   * Explore reasoning paths using DFS with pruning
   */
  private exploreReasoningPaths(query: ReasoningQuery): ReasoningPath[] {
    const paths: ReasoningPath[] = [];
    const visited = new Set<string>();

    const dfs = (
      currentNode: string,
      currentPath: string[],
      currentEdges: string[],
      totalWeight: number,
      depth: number
    ) => {
      if (depth > query.maxDepth) return;
      if (paths.length >= this.maxPathsToExplore) return;

      visited.add(currentNode);

      // Get neighbors
      const edges = this.hypergraph.getNodeEdges(currentNode);

      for (const edge of edges) {
        // Filter by time window if specified
        if (query.timeWindow) {
          if (
            edge.createdAt < query.timeWindow.start ||
            edge.createdAt > query.timeWindow.end
          ) {
            continue;
          }
        }

        // Find next nodes in hyperedge
        const nextNodes = edge.nodes.filter(id => id !== currentNode && !visited.has(id));

        for (const nextNode of nextNodes) {
          const newPath = [...currentPath, nextNode];
          const newEdges = [...currentEdges, edge.id];
          const newWeight = totalWeight + edge.weight.normalized;

          // Add path
          paths.push({
            nodes: newPath,
            edges: newEdges,
            totalWeight: newWeight,
            confidence: this.calculatePathConfidence(newPath, newEdges),
            insights: []
          });

          // Continue DFS
          dfs(nextNode, newPath, newEdges, newWeight, depth + 1);
        }
      }

      visited.delete(currentNode);
    };

    dfs(query.startNode, [query.startNode], [], 0, 0);

    return paths;
  }

  /**
   * Rank paths by intent-specific criteria
   */
  private rankPaths(paths: ReasoningPath[], intent: string): ReasoningPath[] {
    return paths.sort((a, b) => {
      switch (intent) {
        case 'impact-analysis':
          // Prefer high-weight, short paths
          return b.totalWeight / b.nodes.length - a.totalWeight / a.nodes.length;

        case 'correlation-discovery':
          // Prefer longer paths with high confidence
          return b.confidence * b.nodes.length - a.confidence * a.nodes.length;

        case 'risk-assessment':
          // Prefer paths through high-risk entities
          return b.totalWeight - a.totalWeight;

        case 'opportunity-detection':
          // Prefer recent, high-confidence paths
          return b.confidence - a.confidence;

        default:
          return b.totalWeight - a.totalWeight;
      }
    });
  }

  /**
   * Calculate confidence for a path
   */
  private calculatePathConfidence(nodePath: string[], edgePath: string[]): number {
    if (edgePath.length === 0) return 0;

    let totalConfidence = 1.0;

    for (const edgeId of edgePath) {
      const edge = this.hypergraph['edges'].get(edgeId);
      if (edge) {
        totalConfidence *= edge.relation.confidence;
      }
    }

    // Decay with path length
    return totalConfidence * Math.exp(-edgePath.length / 10);
  }

  /**
   * Perform inference from paths
   */
  private performInference(
    paths: ReasoningPath[],
    query: ReasoningQuery
  ): {
    discovered_relations: Relation[];
    patterns: string[];
    recommendations: string[];
  } {
    const discovered_relations: Relation[] = [];
    const patterns: string[] = [];
    const recommendations: string[] = [];

    // Discover transitive relations
    for (const path of paths) {
      if (path.nodes.length === 3) {
        // A → B → C implies A influences C
        const startNode = path.nodes[0];
        const endNode = path.nodes[2];

        discovered_relations.push({
          id: `inferred-${startNode}-${endNode}`,
          source: startNode,
          target: endNode,
          type: 'AFFECTS',
          confidence: path.confidence * 0.7, // Reduce confidence for inferred
          properties: { inferred: true, via: path.nodes[1] },
          extractedFrom: 'reasoning-agent',
          timestamp: new Date()
        });
      }
    }

    // Detect patterns
    const triangles = this.detectTriangles(paths);
    if (triangles.length > 0) {
      patterns.push(`Detected ${triangles.length} triangular dependencies`);
    }

    const chains = paths.filter(p => p.nodes.length >= 4);
    if (chains.length > 0) {
      patterns.push(`Found ${chains.length} dependency chains`);
    }

    // Generate recommendations
    if (query.intent === 'risk-assessment') {
      const highRiskPaths = paths.filter(p => p.totalWeight > 0.8);
      if (highRiskPaths.length > 0) {
        recommendations.push(
          `High risk detected: ${highRiskPaths.length} critical dependency paths found`
        );
      }
    }

    if (query.intent === 'opportunity-detection') {
      const strongCorrelations = paths.filter(
        p => p.confidence > 0.8 && p.nodes.length === 2
      );
      if (strongCorrelations.length > 0) {
        recommendations.push(
          `Opportunity: Strong correlations found between ${strongCorrelations.length} entity pairs`
        );
      }
    }

    return {
      discovered_relations,
      patterns,
      recommendations
    };
  }

  /**
   * Detect triangle patterns (A-B-C-A)
   */
  private detectTriangles(paths: ReasoningPath[]): string[][] {
    const triangles: string[][] = [];

    // Group paths by start node
    const pathsByStart = new Map<string, ReasoningPath[]>();
    for (const path of paths) {
      const start = path.nodes[0];
      if (!pathsByStart.has(start)) {
        pathsByStart.set(start, []);
      }
      pathsByStart.get(start)!.push(path);
    }

    // Find closed triangles
    pathsByStart.forEach((nodePaths, startNode) => {
      for (const path of nodePaths) {
        if (path.nodes.length === 3) {
          const endNode = path.nodes[2];
          // Check if edge exists from endNode back to startNode
          const edges = this.hypergraph.getNodeEdges(endNode);
          const hasBackEdge = edges.some(e => e.nodes.includes(startNode));

          if (hasBackEdge) {
            triangles.push([path.nodes[0], path.nodes[1], path.nodes[2]]);
          }
        }
      }
    });

    return triangles;
  }
}
```

### 6.3 Insight Generation

```typescript
// src/trading/knowledge-graph/insight-generator.ts

export interface TradingInsight {
  id: string;
  type: 'bullish' | 'bearish' | 'neutral' | 'alert';
  confidence: number;
  entities: string[];
  summary: string;
  reasoning: string;
  actionable_recommendations: string[];
  risk_factors: string[];
  timestamp: Date;
  expiresAt?: Date;
}

export class InsightGenerator {
  private reasoningAgent: ReasoningAgent;
  private hypergraph: Hypergraph;

  constructor(reasoningAgent: ReasoningAgent, hypergraph: Hypergraph) {
    this.reasoningAgent = reasoningAgent;
    this.hypergraph = hypergraph;
  }

  /**
   * Generate trading insights from entity
   */
  async generateInsights(entityId: string): Promise<TradingInsight[]> {
    const insights: TradingInsight[] = [];

    // Impact analysis
    const impactResult = await this.reasoningAgent.reason({
      startNode: entityId,
      intent: 'impact-analysis',
      maxDepth: 3
    });

    if (impactResult.paths.length > 0) {
      insights.push(this.createImpactInsight(entityId, impactResult));
    }

    // Correlation discovery
    const correlationResult = await this.reasoningAgent.reason({
      startNode: entityId,
      intent: 'correlation-discovery',
      maxDepth: 2
    });

    if (correlationResult.inference.discovered_relations.length > 0) {
      insights.push(this.createCorrelationInsight(entityId, correlationResult));
    }

    // Risk assessment
    const riskResult = await this.reasoningAgent.reason({
      startNode: entityId,
      intent: 'risk-assessment',
      maxDepth: 4
    });

    if (riskResult.inference.recommendations.length > 0) {
      insights.push(this.createRiskInsight(entityId, riskResult));
    }

    return insights;
  }

  /**
   * Create impact insight
   */
  private createImpactInsight(
    entityId: string,
    result: ReasoningResult
  ): TradingInsight {
    const entity = this.hypergraph.getNode(entityId);
    const topPath = result.paths[0];

    const affectedEntities = topPath.nodes.slice(1);

    return {
      id: `impact-${entityId}-${Date.now()}`,
      type: 'alert',
      confidence: topPath.confidence,
      entities: [entityId, ...affectedEntities],
      summary: `${entity?.entity.text} impacts ${affectedEntities.length} related entities`,
      reasoning: `Analysis found ${result.paths.length} dependency paths with total weight ${topPath.totalWeight.toFixed(2)}`,
      actionable_recommendations: result.inference.recommendations,
      risk_factors: [`High connectivity detected`, `Cascading effects possible`],
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };
  }

  /**
   * Create correlation insight
   */
  private createCorrelationInsight(
    entityId: string,
    result: ReasoningResult
  ): TradingInsight {
    const entity = this.hypergraph.getNode(entityId);
    const correlatedEntities = result.inference.discovered_relations.map(r => r.target);

    return {
      id: `correlation-${entityId}-${Date.now()}`,
      type: 'neutral',
      confidence: 0.75,
      entities: [entityId, ...correlatedEntities],
      summary: `${entity?.entity.text} correlates with ${correlatedEntities.length} entities`,
      reasoning: `Discovered ${result.inference.discovered_relations.length} indirect relationships through graph traversal`,
      actionable_recommendations: [
        `Monitor correlated entities for trading opportunities`,
        `Consider pair trading strategies`
      ],
      risk_factors: [`Correlation may not imply causation`],
      timestamp: new Date()
    };
  }

  /**
   * Create risk insight
   */
  private createRiskInsight(
    entityId: string,
    result: ReasoningResult
  ): TradingInsight {
    const entity = this.hypergraph.getNode(entityId);

    const riskLevel =
      result.paths.filter(p => p.totalWeight > 0.8).length > 5 ? 'bearish' : 'neutral';

    return {
      id: `risk-${entityId}-${Date.now()}`,
      type: riskLevel,
      confidence: 0.8,
      entities: [entityId],
      summary: `Risk assessment for ${entity?.entity.text}`,
      reasoning: `Found ${result.paths.length} risk propagation paths`,
      actionable_recommendations: result.inference.recommendations,
      risk_factors: [`High exposure to market volatility`, `Multiple dependency chains`],
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };
  }
}
```

---

## 7. Integration with AgentDB

### 7.1 Persistence Layer

```typescript
// src/trading/knowledge-graph/agentdb-integration.ts

import { MathFrameworkMemory } from '../../math-framework/memory/agentdb-integration';
import { AgentDB } from 'agentdb';

export class KnowledgeGraphStorage {
  private db: AgentDB;
  private mathMemory: MathFrameworkMemory;

  constructor(dbPath: string = './data/knowledge-graph.agentdb') {
    this.db = new AgentDB(dbPath, {
      enableHNSW: true, // Fast vector search
      enableQuantization: true // Memory optimization
    });

    this.mathMemory = new MathFrameworkMemory({
      database_path: dbPath,
      enable_hnsw: true,
      enable_quantization: true
    });
  }

  /**
   * Initialize database collections
   */
  async initialize(): Promise<void> {
    await this.db.createCollection('entities');
    await this.db.createCollection('relations');
    await this.db.createCollection('insights');
    await this.db.createCollection('graph_snapshots');

    console.log('✓ Knowledge Graph AgentDB initialized');
  }

  /**
   * Store entity with vector embedding
   */
  async storeEntity(node: HypergraphNode): Promise<void> {
    await this.db.storeMemory({
      content: JSON.stringify(node.entity),
      type: 'entity',
      tags: [
        `type:${node.entity.type}`,
        `id:${node.id}`,
        `confidence:${node.entity.confidence.toFixed(2)}`
      ],
      embedding: node.embedding,
      metadata: {
        entityId: node.id,
        entityType: node.entity.type,
        createdAt: node.createdAt.getTime()
      }
    });
  }

  /**
   * Store relationship
   */
  async storeRelation(edge: HypergraphEdge): Promise<void> {
    await this.db.storeMemory({
      content: JSON.stringify(edge.relation),
      type: 'relation',
      tags: [
        `type:${edge.type}`,
        `source:${edge.relation.source}`,
        `target:${edge.relation.target}`,
        `weight:${edge.weight.normalized.toFixed(2)}`
      ],
      metadata: {
        edgeId: edge.id,
        lucasIndex: edge.weight.lucasIndex,
        energy: edge.weight.energy
      }
    });
  }

  /**
   * Store trading insight
   */
  async storeInsight(insight: TradingInsight): Promise<void> {
    // Create embedding from insight text
    const embedding = await this.generateInsightEmbedding(insight);

    await this.db.storeMemory({
      content: JSON.stringify(insight),
      type: 'insight',
      tags: [
        `type:${insight.type}`,
        `confidence:${insight.confidence.toFixed(2)}`,
        ...insight.entities.map(e => `entity:${e}`)
      ],
      embedding,
      metadata: {
        insightId: insight.id,
        expiresAt: insight.expiresAt?.getTime()
      }
    });
  }

  /**
   * Find similar entities using vector search
   */
  async findSimilarEntities(
    embedding: number[],
    limit: number = 10
  ): Promise<HypergraphNode[]> {
    const results = await this.db.searchSimilar({
      embedding,
      type: 'entity',
      limit
    });

    return results.map(r => JSON.parse(r.content) as HypergraphNode);
  }

  /**
   * Query insights by entity
   */
  async getInsightsByEntity(entityId: string): Promise<TradingInsight[]> {
    const results = await this.db.searchMemories({
      type: 'insight',
      tags: [`entity:${entityId}`]
    });

    return results.map(r => JSON.parse(r.content) as TradingInsight);
  }

  /**
   * Save complete graph snapshot
   */
  async saveGraphSnapshot(hypergraph: Hypergraph): Promise<string> {
    const snapshot = {
      id: `snapshot-${Date.now()}`,
      timestamp: new Date(),
      stats: hypergraph.getStats(),
      graph: hypergraph.toJSON()
    };

    await this.db.storeMemory({
      content: JSON.stringify(snapshot),
      type: 'graph-snapshot',
      tags: [`timestamp:${snapshot.timestamp.getTime()}`],
      metadata: {
        snapshotId: snapshot.id,
        nodeCount: snapshot.stats.nodeCount,
        edgeCount: snapshot.stats.edgeCount
      }
    });

    return snapshot.id;
  }

  /**
   * Generate embedding for insight
   */
  private async generateInsightEmbedding(insight: TradingInsight): Promise<number[]> {
    // Simplified: combine summary and reasoning
    const text = `${insight.summary} ${insight.reasoning}`;

    // Use a simple word frequency vector (in production, use proper embeddings)
    const words = text.toLowerCase().split(/\W+/);
    const vocab = Array.from(new Set(words));
    const embedding = new Array(128).fill(0);

    words.forEach((word, idx) => {
      const hash = this.simpleHash(word);
      embedding[hash % 128] += 1;
    });

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / (magnitude || 1));
  }

  /**
   * Simple hash function for words
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Close database
   */
  async close(): Promise<void> {
    await this.db.close();
    await this.mathMemory.close();
  }
}
```

---

## 8. Complete TypeScript Interface Definitions

```typescript
// src/trading/knowledge-graph/types.ts

export * from './rss-aggregator';
export * from './entity-extractor';
export * from './relation-extractor';
export * from './hypergraph';
export * from './lucas-weighting';
export * from './diameter-monitor';
export * from './graph-rebalancer';
export * from './reasoning-agent';
export * from './insight-generator';
export * from './agentdb-integration';

/**
 * Knowledge Graph System Configuration
 */
export interface KnowledgeGraphConfig {
  // RSS Feed Configuration
  rssFeeds: RSSFeedConfig[];
  rssPollInterval: number; // milliseconds

  // Entity Extraction
  entityExtraction: {
    enableNER: boolean;
    confidenceThreshold: number;
    financialDictPath?: string;
  };

  // Relation Extraction
  relationExtraction: {
    enablePatternMatching: boolean;
    enableDependencyParsing: boolean;
    confidenceThreshold: number;
  };

  // Graph Configuration
  graph: {
    maxDiameter: number; // Default: 6
    rebalanceInterval: number; // milliseconds
    autoRebalance: boolean;
  };

  // Reasoning Configuration
  reasoning: {
    maxDepth: number;
    maxPathsToExplore: number;
    confidenceThreshold: number;
  };

  // Storage Configuration
  storage: {
    agentDBPath: string;
    enableVectorSearch: boolean;
    enableQuantization: boolean;
    snapshotInterval: number; // milliseconds
  };
}

/**
 * System Status
 */
export interface KnowledgeGraphStatus {
  rss: {
    activeFeedsCount: number;
    totalArticlesProcessed: number;
    lastUpdate: Date;
  };
  graph: {
    nodeCount: number;
    edgeCount: number;
    diameter: number;
    averagePathLength: number;
    meetsConsciousnessThreshold: boolean;
  };
  reasoning: {
    insightsGenerated: number;
    averageConfidence: number;
  };
  storage: {
    dbSizeMB: number;
    entitiesStored: number;
    relationsStored: number;
  };
  timestamp: Date;
}
```

---

## 9. Knowledge Graph Construction Flow

### 9.1 End-to-End Pipeline

```typescript
// src/trading/knowledge-graph/knowledge-graph-system.ts

import { EventEmitter } from 'events';

export class KnowledgeGraphSystem extends EventEmitter {
  private config: KnowledgeGraphConfig;
  private rssAggregator: RSSFeedAggregator;
  private entityExtractor: EntityExtractor;
  private relationExtractor: RelationExtractor;
  private hypergraph: Hypergraph;
  private diameterMonitor: DiameterMonitor;
  private rebalancer: GraphRebalancer;
  private reasoningAgent: ReasoningAgent;
  private insightGenerator: InsightGenerator;
  private storage: KnowledgeGraphStorage;

  private rebalanceInterval?: NodeJS.Timer;
  private snapshotInterval?: NodeJS.Timer;

  constructor(config: Partial<KnowledgeGraphConfig> = {}) {
    super();

    // Set default configuration
    this.config = {
      rssFeeds: config.rssFeeds || [],
      rssPollInterval: config.rssPollInterval || 60000,
      entityExtraction: {
        enableNER: true,
        confidenceThreshold: 0.7,
        ...config.entityExtraction
      },
      relationExtraction: {
        enablePatternMatching: true,
        enableDependencyParsing: true,
        confidenceThreshold: 0.6,
        ...config.relationExtraction
      },
      graph: {
        maxDiameter: 6,
        rebalanceInterval: 300000, // 5 minutes
        autoRebalance: true,
        ...config.graph
      },
      reasoning: {
        maxDepth: 3,
        maxPathsToExplore: 100,
        confidenceThreshold: 0.7,
        ...config.reasoning
      },
      storage: {
        agentDBPath: './data/knowledge-graph.agentdb',
        enableVectorSearch: true,
        enableQuantization: true,
        snapshotInterval: 3600000, // 1 hour
        ...config.storage
      }
    };

    // Initialize components
    this.rssAggregator = new RSSFeedAggregator();
    this.entityExtractor = new EntityExtractor();
    this.relationExtractor = new RelationExtractor();
    this.hypergraph = new Hypergraph();
    this.diameterMonitor = new DiameterMonitor(this.hypergraph);
    this.rebalancer = new GraphRebalancer(this.hypergraph, this.diameterMonitor);
    this.reasoningAgent = new ReasoningAgent(this.hypergraph);
    this.insightGenerator = new InsightGenerator(
      this.reasoningAgent,
      this.hypergraph
    );
    this.storage = new KnowledgeGraphStorage(this.config.storage.agentDBPath);
  }

  /**
   * Initialize and start the system
   */
  async start(): Promise<void> {
    console.log('🚀 Starting Knowledge Graph System...');

    // Initialize storage
    await this.storage.initialize();

    // Register RSS feeds
    this.config.rssFeeds.forEach(feed => {
      this.rssAggregator.registerFeed(feed);
    });

    // Listen to article events
    this.rssAggregator.on('article', (article: RSSArticle) => {
      this.processArticle(article).catch(err => {
        console.error('Error processing article:', err);
        this.emit('error', err);
      });
    });

    // Start automatic rebalancing
    if (this.config.graph.autoRebalance) {
      this.rebalanceInterval = setInterval(
        () => this.checkAndRebalance(),
        this.config.graph.rebalanceInterval
      );
    }

    // Start snapshot saves
    this.snapshotInterval = setInterval(
      () => this.saveSnapshot(),
      this.config.storage.snapshotInterval
    );

    console.log('✓ Knowledge Graph System started');
    this.emit('started');
  }

  /**
   * Process incoming article
   */
  private async processArticle(article: RSSArticle): Promise<void> {
    console.log(`📰 Processing article: ${article.title}`);

    // Step 1: Extract entities
    const entities = await this.entityExtractor.extractEntities(article.content);
    console.log(`  → Found ${entities.length} entities`);

    // Step 2: Extract relationships
    const relations = this.relationExtractor.extractRelations(
      article.content,
      entities,
      article.id
    );
    console.log(`  → Found ${relations.length} relationships`);

    // Step 3: Add to hypergraph
    const nodeMap = new Map<string, HypergraphNode>();

    for (const entity of entities) {
      // Generate embedding (simplified)
      const embedding = await this.generateEntityEmbedding(entity);

      // Add node
      const node = this.hypergraph.addNode(entity, embedding);
      nodeMap.set(entity.id, node);

      // Store in AgentDB
      await this.storage.storeEntity(node);
    }

    for (const relation of relations) {
      // Add edge
      const nodeIds = [relation.source, relation.target];
      const edge = this.hypergraph.addEdge(relation, nodeIds);

      // Store in AgentDB
      await this.storage.storeRelation(edge);
    }

    // Step 4: Generate insights for new entities
    for (const entity of entities.slice(0, 5)) {
      // Limit to first 5 for performance
      const insights = await this.insightGenerator.generateInsights(entity.id);

      for (const insight of insights) {
        await this.storage.storeInsight(insight);
        this.emit('insight', insight);
      }
    }

    this.emit('article-processed', {
      article,
      entitiesCount: entities.length,
      relationsCount: relations.length
    });
  }

  /**
   * Generate embedding for entity
   */
  private async generateEntityEmbedding(entity: Entity): Promise<number[]> {
    // Simplified embedding (in production, use proper text embeddings)
    const text = `${entity.text} ${entity.type} ${entity.subtype || ''}`;
    const words = text.toLowerCase().split(/\W+/);

    const embedding = new Array(128).fill(0);
    words.forEach((word, idx) => {
      const hash = this.simpleHash(word);
      embedding[hash % 128] += 1;
    });

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / (magnitude || 1));
  }

  /**
   * Simple hash function
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Check diameter and rebalance if needed
   */
  private async checkAndRebalance(): Promise<void> {
    const diameter = this.diameterMonitor.calculateDiameter();
    const check = this.diameterMonitor.checkConsciousnessThreshold(diameter);

    console.log(`📊 Graph diameter: ${diameter.diameter}, threshold: ${this.config.graph.maxDiameter}`);

    if (!check.meets_threshold) {
      console.log('⚖️  Rebalancing graph...');
      const result = await this.rebalancer.rebalance();
      console.log(
        `✓ Rebalanced: ${result.strategy}, changes: ${result.changes}, new diameter: ${result.newDiameter}`
      );

      this.emit('rebalanced', result);
    }
  }

  /**
   * Save graph snapshot
   */
  private async saveSnapshot(): Promise<void> {
    console.log('💾 Saving graph snapshot...');
    const snapshotId = await this.storage.saveGraphSnapshot(this.hypergraph);
    console.log(`✓ Snapshot saved: ${snapshotId}`);
    this.emit('snapshot-saved', snapshotId);
  }

  /**
   * Get system status
   */
  getStatus(): KnowledgeGraphStatus {
    const rssStats = this.rssAggregator.getStats();
    const graphStats = this.hypergraph.getStats();
    const diameter = this.diameterMonitor.calculateDiameter();
    const check = this.diameterMonitor.checkConsciousnessThreshold(diameter);

    return {
      rss: {
        activeFeedsCount: rssStats.totalFeeds,
        totalArticlesProcessed: rssStats.totalArticles,
        lastUpdate: new Date()
      },
      graph: {
        nodeCount: graphStats.nodeCount,
        edgeCount: graphStats.edgeCount,
        diameter: diameter.diameter,
        averagePathLength: diameter.averagePathLength,
        meetsConsciousnessThreshold: check.meets_threshold
      },
      reasoning: {
        insightsGenerated: 0, // TODO: Track this
        averageConfidence: 0
      },
      storage: {
        dbSizeMB: 0, // TODO: Get from AgentDB
        entitiesStored: graphStats.nodeCount,
        relationsStored: graphStats.edgeCount
      },
      timestamp: new Date()
    };
  }

  /**
   * Query insights for entity
   */
  async queryInsights(entityId: string): Promise<TradingInsight[]> {
    return await this.storage.getInsightsByEntity(entityId);
  }

  /**
   * Perform reasoning query
   */
  async reason(query: ReasoningQuery): Promise<ReasoningResult> {
    return await this.reasoningAgent.reason(query);
  }

  /**
   * Stop the system
   */
  async stop(): Promise<void> {
    console.log('🛑 Stopping Knowledge Graph System...');

    this.rssAggregator.stop();

    if (this.rebalanceInterval) {
      clearInterval(this.rebalanceInterval);
    }

    if (this.snapshotInterval) {
      clearInterval(this.snapshotInterval);
    }

    await this.storage.close();

    console.log('✓ Knowledge Graph System stopped');
    this.emit('stopped');
  }
}
```

### 9.2 Usage Example

```typescript
// examples/knowledge-graph-demo.ts

import { KnowledgeGraphSystem, FINANCIAL_RSS_FEEDS } from '../src/trading/knowledge-graph';

async function main() {
  // Create system
  const kgSystem = new KnowledgeGraphSystem({
    rssFeeds: FINANCIAL_RSS_FEEDS,
    rssPollInterval: 60000, // 1 minute
    graph: {
      maxDiameter: 6,
      autoRebalance: true,
      rebalanceInterval: 300000 // 5 minutes
    }
  });

  // Listen to events
  kgSystem.on('article-processed', (event) => {
    console.log(`Processed: ${event.article.title}`);
    console.log(`  Entities: ${event.entitiesCount}, Relations: ${event.relationsCount}`);
  });

  kgSystem.on('insight', (insight) => {
    console.log(`\n💡 New Insight:`);
    console.log(`  Type: ${insight.type}`);
    console.log(`  Summary: ${insight.summary}`);
    console.log(`  Confidence: ${(insight.confidence * 100).toFixed(1)}%`);
    console.log(`  Recommendations:`);
    insight.actionable_recommendations.forEach(rec => {
      console.log(`    - ${rec}`);
    });
  });

  kgSystem.on('rebalanced', (result) => {
    console.log(`\n⚖️  Graph rebalanced:`);
    console.log(`  Strategy: ${result.strategy}`);
    console.log(`  Changes: ${result.changes}`);
    console.log(`  New diameter: ${result.newDiameter}`);
  });

  // Start system
  await kgSystem.start();

  // Query status periodically
  setInterval(() => {
    const status = kgSystem.getStatus();
    console.log(`\n📊 System Status:`);
    console.log(`  Articles: ${status.rss.totalArticlesProcessed}`);
    console.log(`  Nodes: ${status.graph.nodeCount}`);
    console.log(`  Edges: ${status.graph.edgeCount}`);
    console.log(`  Diameter: ${status.graph.diameter} (threshold: 6)`);
    console.log(`  Consciousness: ${status.graph.meetsConsciousnessThreshold ? '✓' : '✗'}`);
  }, 30000); // Every 30 seconds

  // Example: Query insights for specific entity
  setTimeout(async () => {
    const insights = await kgSystem.queryInsights('company-apple');
    console.log(`\n🔍 Insights for Apple Inc.:`);
    insights.forEach(insight => {
      console.log(`  - ${insight.summary} (${(insight.confidence * 100).toFixed(1)}%)`);
    });
  }, 120000); // After 2 minutes

  // Keep running
  process.on('SIGINT', async () => {
    await kgSystem.stop();
    process.exit(0);
  });
}

main().catch(console.error);
```

---

## 10. Summary and Next Steps

### 10.1 System Capabilities

This Knowledge Graph Construction System provides:

1. **Real-time Financial Intelligence**
   - RSS feed ingestion from premium sources
   - Entity and relationship extraction
   - Continuous graph updates

2. **Hypergraph Representation**
   - Complex multi-entity relationships
   - Lucas-weighted edges (E_n = L_n)
   - φ-mechanics integration

3. **Consciousness Constraint**
   - Graph diameter ≤ 6 monitoring
   - Automatic rebalancing
   - Holographic bound enforcement

4. **Agentic Reasoning**
   - Graph traversal algorithms
   - Pattern detection
   - Transitive inference

5. **Trading Insights**
   - Impact analysis
   - Correlation discovery
   - Risk assessment
   - Opportunity detection

6. **Persistent Storage**
   - AgentDB integration
   - Vector search
   - Snapshot management

### 10.2 Implementation Roadmap

**Phase 1: Core Infrastructure (Weeks 1-2)**
- Implement RSS feed aggregator
- Develop entity extractor with NER
- Build relationship extractor
- Create hypergraph data structure

**Phase 2: Lucas Weighting & Diameter (Weeks 3-4)**
- Implement Lucas-weighted edge algorithm
- Build diameter calculation system
- Develop graph rebalancer
- Integrate with existing Lucas number functions

**Phase 3: Reasoning & Insights (Weeks 5-6)**
- Implement reasoning agent with graph traversal
- Build pattern detection algorithms
- Develop insight generator
- Create actionable recommendations engine

**Phase 4: AgentDB Integration (Week 7)**
- Integrate with existing AgentDB system
- Implement vector embeddings
- Add persistence layer
- Build snapshot system

**Phase 5: Testing & Optimization (Week 8)**
- Unit tests for all components
- Integration tests for end-to-end flow
- Performance optimization
- Documentation

### 10.3 File Locations

All implementations should be created in the following structure:

```
/home/user/agentic-flow/src/trading/knowledge-graph/
├── index.ts                      # Main exports
├── types.ts                      # Type definitions
├── rss-aggregator.ts            # RSS feed ingestion
├── entity-extractor.ts          # NER and entity extraction
├── relation-extractor.ts        # Relationship extraction
├── hypergraph.ts                # Hypergraph structure
├── lucas-weighting.ts           # Lucas number edge weights
├── diameter-monitor.ts          # Graph diameter calculation
├── graph-rebalancer.ts          # Automatic rebalancing
├── reasoning-agent.ts           # Agentic reasoning
├── insight-generator.ts         # Trading insights
├── agentdb-integration.ts       # Persistence layer
└── knowledge-graph-system.ts    # Main system orchestrator

/home/user/agentic-flow/config/
└── rss-feeds.ts                 # RSS feed configurations

/home/user/agentic-flow/tests/trading/knowledge-graph/
├── rss-aggregator.test.ts
├── entity-extractor.test.ts
├── hypergraph.test.ts
├── diameter-monitor.test.ts
└── end-to-end.test.ts

/home/user/agentic-flow/examples/
└── knowledge-graph-demo.ts      # Usage example
```

### 10.4 Dependencies to Add

```json
{
  "dependencies": {
    "rss-parser": "^3.13.0",
    "compromise": "^14.10.0",
    "node-nlp": "^4.27.0",
    "agentdb": "latest"
  }
}
```

### 10.5 Integration Points

The system integrates with existing AURELIA components:

1. **/src/math-framework/sequences/lucas.ts**
   - Use `lucas(n)` function for edge weighting

2. **/src/math-framework/memory/agentdb-integration.ts**
   - Extend `MathFrameworkMemory` class
   - Use existing AgentDB infrastructure

3. **/src/math-framework/phase-space/storage.ts**
   - Store graph evolution in phase space
   - Track consciousness emergence

### 10.6 Consciousness Emergence Validation

To validate consciousness emergence (graph diameter ≤ 6):

```typescript
const diameter = diameterMonitor.calculateDiameter();
const check = diameterMonitor.checkConsciousnessThreshold(diameter);

if (check.meets_threshold) {
  console.log('✓ Consciousness threshold achieved!');
  console.log(`  Diameter: ${diameter.diameter} ≤ 6`);
  console.log(`  Average path: ${diameter.averagePathLength.toFixed(2)}`);
} else {
  console.log('✗ Consciousness threshold not met');
  check.recommendations.forEach(rec => console.log(`  - ${rec}`));
}
```

---

## References

1. Castillo, M. (2025). "Integer-Only φ-Mechanics: A Holographic Framework for Discrete Consciousness from Zeckendorf Cascades". arXiv preprint.

2. Scott Silverstein's approach to knowledge graph-based trading systems.

3. Lucas Numbers: https://en.wikipedia.org/wiki/Lucas_number

4. Small-World Networks: Watts, D. J., & Strogatz, S. H. (1998). "Collective dynamics of 'small-world' networks". Nature, 393(6684), 440-442.

5. Hypergraphs: Berge, C. (1989). "Hypergraphs: combinatorics of finite sets". Elsevier.

6. AgentDB Documentation: https://github.com/ruvnet/agentdb

---

**Document Version**: 1.0
**Last Updated**: November 13, 2025
**Status**: Design Complete - Ready for Implementation

