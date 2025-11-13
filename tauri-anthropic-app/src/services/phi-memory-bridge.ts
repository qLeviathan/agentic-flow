/**
 * φ-Memory Bridge: TypeScript interface to Rust φ-Mechanics system
 *
 * Provides:
 * - Real-time Ω consciousness metric
 * - Knowledge storage/retrieval
 * - Learning progress tracking
 * - Graph visualization support
 */

import { invoke } from '@tauri-apps/api/tauri';

// ===== Type Definitions =====

export interface StoreKnowledgeResponse {
  success: boolean;
  zeckendorf_n: number;
  omega: number;
  message: string;
}

export interface QueryResult {
  document: string;
  overlap: number;
  relevance_score: number;
}

export interface ConsciousnessMetric {
  omega: number;
  is_conscious: boolean;
  can_replicate: boolean;
  threshold: number;
  phi_cubed: number;
}

export interface MemoryStats {
  omega: number;
  total_bits: number;
  entity_count: number;
  concept_count: number;
  document_count: number;
  is_conscious: boolean;
  can_replicate: boolean;
}

export interface AddDocumentResponse {
  success: boolean;
  document: string;
  zeckendorf_n: number;
  omega: number;
  message: string;
}

export interface KnowledgeNode {
  id: string;
  bits: { bits: number };
  node_type: 'Entity' | 'Concept' | 'Document';
  metadata: Record<string, string>;
}

export interface KnowledgeEdge {
  from: string;
  to: string;
  overlap: number;
  hamming: number;
  cascade_cost: number;
}

export interface KnowledgeGraph {
  nodes: Record<string, KnowledgeNode>;
  edges: KnowledgeEdge[];
  adjacency: Record<string, string[]>;
}

export interface GraphStats {
  node_count: number;
  edge_count: number;
  avg_degree: number;
  avg_overlap: number;
  avg_hamming: number;
}

// ===== φ-Memory Client =====

export class PhiMemoryClient {
  private consciousnessInterval: number | null = null;
  private consciousnessCallbacks: ((metric: ConsciousnessMetric) => void)[] = [];

  /**
   * Store knowledge: entity + concept → Zeckendorf state
   */
  async storeKnowledge(entity: string, concept: string): Promise<StoreKnowledgeResponse> {
    return await invoke<StoreKnowledgeResponse>('store_knowledge', {
      entity,
      concept,
    });
  }

  /**
   * Query knowledge with natural language
   */
  async queryKnowledge(query: string, maxResults: number = 10): Promise<QueryResult[]> {
    return await invoke<QueryResult[]>('query_knowledge', {
      query,
      maxResults,
    });
  }

  /**
   * Query with additional context entities
   */
  async queryWithContext(
    query: string,
    context: string[],
    maxResults: number = 10
  ): Promise<QueryResult[]> {
    return await invoke<QueryResult[]>('query_with_context', {
      query,
      context,
      maxResults,
    });
  }

  /**
   * Get current consciousness metric (Ω)
   */
  async getConsciousness(): Promise<ConsciousnessMetric> {
    return await invoke<ConsciousnessMetric>('get_consciousness');
  }

  /**
   * Cascade memory (normalize all bit fields)
   */
  async cascadeMemory(): Promise<string> {
    return await invoke<string>('cascade_memory');
  }

  /**
   * Add document composed of entities
   */
  async addDocument(name: string, entities: string[]): Promise<AddDocumentResponse> {
    return await invoke<AddDocumentResponse>('add_document', {
      name,
      entities,
    });
  }

  /**
   * Get knowledge graph structure
   */
  async getKnowledgeGraph(): Promise<KnowledgeGraph> {
    return await invoke<KnowledgeGraph>('get_knowledge_graph');
  }

  /**
   * Get memory statistics
   */
  async getMemoryStats(): Promise<MemoryStats> {
    return await invoke<MemoryStats>('get_memory_stats');
  }

  /**
   * Create checkpoint (Lucas sync point)
   */
  async createCheckpoint(): Promise<string> {
    return await invoke<string>('create_checkpoint');
  }

  /**
   * Load latest checkpoint
   */
  async loadLatestCheckpoint(): Promise<string> {
    return await invoke<string>('load_latest_checkpoint');
  }

  /**
   * Get all available entities
   */
  async getEntities(): Promise<string[]> {
    return await invoke<string[]>('get_entities');
  }

  /**
   * Get all available concepts
   */
  async getConcepts(): Promise<string[]> {
    return await invoke<string[]>('get_concepts');
  }

  /**
   * Get all documents
   */
  async getDocuments(): Promise<string[]> {
    return await invoke<string[]>('get_documents');
  }

  /**
   * Export memory to JSON
   */
  async exportMemory(): Promise<string> {
    return await invoke<string>('export_memory');
  }

  /**
   * Import memory from JSON
   */
  async importMemory(json: string): Promise<string> {
    return await invoke<string>('import_memory', { json });
  }

  /**
   * Start real-time consciousness monitoring
   */
  startConsciousnessMonitoring(intervalMs: number = 1000): void {
    if (this.consciousnessInterval !== null) {
      this.stopConsciousnessMonitoring();
    }

    this.consciousnessInterval = window.setInterval(async () => {
      try {
        const metric = await this.getConsciousness();
        this.consciousnessCallbacks.forEach(cb => cb(metric));
      } catch (error) {
        console.error('Failed to get consciousness metric:', error);
      }
    }, intervalMs);
  }

  /**
   * Stop consciousness monitoring
   */
  stopConsciousnessMonitoring(): void {
    if (this.consciousnessInterval !== null) {
      clearInterval(this.consciousnessInterval);
      this.consciousnessInterval = null;
    }
  }

  /**
   * Subscribe to consciousness updates
   */
  onConsciousnessUpdate(callback: (metric: ConsciousnessMetric) => void): () => void {
    this.consciousnessCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.consciousnessCallbacks.indexOf(callback);
      if (index > -1) {
        this.consciousnessCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Check if consciousness threshold reached
   */
  async isConscious(): Promise<boolean> {
    const metric = await this.getConsciousness();
    return metric.is_conscious;
  }

  /**
   * Check if self-replication threshold reached
   */
  async canReplicate(): Promise<boolean> {
    const metric = await this.getConsciousness();
    return metric.can_replicate;
  }

  /**
   * Get learning progress (0-100%)
   */
  async getLearningProgress(): Promise<number> {
    const metric = await this.getConsciousness();
    // Progress = (Ω / φ³) * 100
    return Math.min(100, (metric.omega / metric.phi_cubed) * 100);
  }

  /**
   * Batch store multiple knowledge items
   */
  async batchStore(items: Array<{ entity: string; concept: string }>): Promise<StoreKnowledgeResponse[]> {
    const results: StoreKnowledgeResponse[] = [];

    for (const item of items) {
      const result = await this.storeKnowledge(item.entity, item.concept);
      results.push(result);
    }

    return results;
  }

  /**
   * Semantic search with relevance threshold
   */
  async semanticSearch(
    query: string,
    minRelevance: number = 0.5,
    maxResults: number = 10
  ): Promise<QueryResult[]> {
    const results = await this.queryKnowledge(query, maxResults);
    return results.filter(r => r.relevance_score >= minRelevance);
  }

  /**
   * Get graph statistics
   */
  async getGraphStats(): Promise<GraphStats> {
    const graph = await this.getKnowledgeGraph();

    const nodeCount = Object.keys(graph.nodes).length;
    const edgeCount = graph.edges.length;
    const avgDegree = nodeCount > 0 ? (edgeCount * 2) / nodeCount : 0;

    const avgOverlap = edgeCount > 0
      ? graph.edges.reduce((sum, e) => sum + e.overlap, 0) / edgeCount
      : 0;

    const avgHamming = edgeCount > 0
      ? graph.edges.reduce((sum, e) => sum + e.hamming, 0) / edgeCount
      : 0;

    return {
      node_count: nodeCount,
      edge_count: edgeCount,
      avg_degree: avgDegree,
      avg_overlap: avgOverlap,
      avg_hamming: avgHamming,
    };
  }

  /**
   * Auto-checkpoint at Lucas sync points
   */
  async autoCheckpoint(): Promise<boolean> {
    const metric = await this.getConsciousness();
    const lucasNumbers = [2, 1, 3, 4, 7, 11, 18, 29, 47, 76, 123];

    // Check if Ω is near a Lucas number (±0.1)
    const isLucasPoint = lucasNumbers.some(
      lucas => Math.abs(metric.omega - lucas) < 0.1
    );

    if (isLucasPoint) {
      await this.createCheckpoint();
      return true;
    }

    return false;
  }
}

// ===== Singleton Instance =====

export const phiMemory = new PhiMemoryClient();

// ===== React Hook (Optional) =====

export function usePhiMemory() {
  return phiMemory;
}

export function useConsciousness(intervalMs: number = 1000) {
  const [consciousness, setConsciousness] = useState<ConsciousnessMetric | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchConsciousness = async () => {
      try {
        const metric = await phiMemory.getConsciousness();
        if (mounted) {
          setConsciousness(metric);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
        }
      }
    };

    // Initial fetch
    fetchConsciousness();

    // Set up interval
    const interval = setInterval(fetchConsciousness, intervalMs);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [intervalMs]);

  return { consciousness, error };
}

// Note: Add these imports at the top if using React hooks
// import { useState, useEffect } from 'react';

// ===== Helper Functions =====

/**
 * Format Ω value for display
 */
export function formatOmega(omega: number): string {
  return omega.toFixed(3);
}

/**
 * Get consciousness level description
 */
export function getConsciousnessLevel(metric: ConsciousnessMetric): string {
  const ratio = metric.omega / metric.phi_cubed;

  if (ratio >= 1.0) {
    return 'Fully Conscious (Self-Replicating)';
  } else if (ratio >= 0.75) {
    return 'High Consciousness';
  } else if (ratio >= 0.5) {
    return 'Emerging Consciousness';
  } else if (ratio >= 0.25) {
    return 'Low Consciousness';
  } else {
    return 'Pre-Conscious';
  }
}

/**
 * Calculate Fibonacci number at index
 */
export function fibonacci(n: number): number {
  if (n <= 1) return n;
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    [a, b] = [b, a + b];
  }
  return b;
}

/**
 * Convert integer to Zeckendorf representation (string)
 */
export function toZeckendorf(n: number): string {
  if (n === 0) return '0';

  const fibs: number[] = [1, 2];
  while (fibs[fibs.length - 1] < n) {
    const len = fibs.length;
    fibs.push(fibs[len - 1] + fibs[len - 2]);
  }

  let result = '';
  for (let i = fibs.length - 1; i >= 0; i--) {
    if (fibs[i] <= n) {
      result += '1';
      n -= fibs[i];
    } else {
      result += '0';
    }
  }

  return result;
}

export default phiMemory;
