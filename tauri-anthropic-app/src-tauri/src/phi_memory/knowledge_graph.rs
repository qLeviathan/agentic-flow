/// Knowledge Graph in Zeckendorf Space
///
/// Graph structure:
/// - Nodes = documents/concepts (BitField states)
/// - Edges = bit overlap (shared entities)
/// - Weight = cascade transition cost
/// - Traversal = maximum bit overlap path
///
/// No traditional embeddings - pure Fibonacci bit algebra

use super::{BitField, PhiMemoryCell};
use std::collections::{HashMap, HashSet, BinaryHeap};
use std::cmp::Ordering;
use serde::{Deserialize, Serialize};

/// Graph node representing a knowledge state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KnowledgeNode {
    pub id: String,
    pub bits: BitField,
    pub node_type: NodeType,
    pub metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum NodeType {
    Entity,
    Concept,
    Document,
}

/// Graph edge with Zeckendorf-based weight
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KnowledgeEdge {
    pub from: String,
    pub to: String,
    pub overlap: u32,        // Bit overlap count
    pub hamming: u32,        // Hamming distance
    pub cascade_cost: f64,   // Cost of transitioning via cascade
}

impl KnowledgeEdge {
    /// Compute edge weight (lower = better connection)
    /// Weight = hamming_distance / (overlap + 1)
    pub fn weight(&self) -> f64 {
        self.hamming as f64 / (self.overlap as f64 + 1.0)
    }
}

/// Knowledge graph structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KnowledgeGraph {
    pub nodes: HashMap<String, KnowledgeNode>,
    pub edges: Vec<KnowledgeEdge>,

    /// Adjacency list for fast traversal
    adjacency: HashMap<String, Vec<String>>,
}

impl KnowledgeGraph {
    /// Create empty graph
    pub fn new() -> Self {
        KnowledgeGraph {
            nodes: HashMap::new(),
            edges: Vec::new(),
            adjacency: HashMap::new(),
        }
    }

    /// Build graph from memory cell
    pub fn from_memory(cell: &PhiMemoryCell) -> Self {
        let mut graph = KnowledgeGraph::new();

        // Add entity nodes
        for (entity, bit_pos) in &cell.entity_map {
            let bits = BitField::from_bits(1u64 << bit_pos).unwrap_or_default();
            graph.add_node(entity.clone(), bits, NodeType::Entity);
        }

        // Add concept nodes
        for (concept, bits) in &cell.concept_map {
            graph.add_node(concept.clone(), *bits, NodeType::Concept);
        }

        // Add document nodes
        for (doc, bits) in &cell.document_map {
            graph.add_node(doc.clone(), *bits, NodeType::Document);
        }

        // Compute edges based on bit overlap
        graph.compute_edges();

        graph
    }

    /// Add node to graph
    pub fn add_node(&mut self, id: String, bits: BitField, node_type: NodeType) {
        let node = KnowledgeNode {
            id: id.clone(),
            bits,
            node_type,
            metadata: HashMap::new(),
        };

        self.nodes.insert(id.clone(), node);
        self.adjacency.insert(id, Vec::new());
    }

    /// Compute edges between all nodes with overlap > 0
    pub fn compute_edges(&mut self) {
        let node_ids: Vec<String> = self.nodes.keys().cloned().collect();
        self.edges.clear();

        for i in 0..node_ids.len() {
            for j in (i + 1)..node_ids.len() {
                let id1 = &node_ids[i];
                let id2 = &node_ids[j];

                if let (Some(node1), Some(node2)) = (self.nodes.get(id1), self.nodes.get(id2)) {
                    let overlap = node1.bits.overlap(&node2.bits);

                    if overlap > 0 {
                        let hamming = node1.bits.hamming_distance(&node2.bits);
                        let cascade_cost = self.cascade_transition_cost(&node1.bits, &node2.bits);

                        let edge = KnowledgeEdge {
                            from: id1.clone(),
                            to: id2.clone(),
                            overlap,
                            hamming,
                            cascade_cost,
                        };

                        // Add to adjacency list
                        self.adjacency.get_mut(id1).unwrap().push(id2.clone());
                        self.adjacency.get_mut(id2).unwrap().push(id1.clone());

                        self.edges.push(edge);
                    }
                }
            }
        }
    }

    /// Compute cascade transition cost
    /// Cost = number of cascade operations needed to reach target from source
    fn cascade_transition_cost(&self, source: &BitField, target: &BitField) -> f64 {
        // XOR to find differing bits
        let diff = source.xor(target);
        let cascaded = diff.cascade();

        // Cost = number of bits that changed during cascade
        (diff.bits ^ cascaded.bits).count_ones() as f64
    }

    /// Find k-nearest neighbors to query bits
    pub fn k_nearest(&self, query: &BitField, k: usize) -> Vec<(String, f64)> {
        let mut distances: Vec<(String, f64)> = self.nodes
            .iter()
            .map(|(id, node)| {
                let hamming = node.bits.hamming_distance(query) as f64;
                let overlap = node.bits.overlap(query) as f64;

                // Distance metric: hamming / (overlap + 1)
                // Favors high overlap, low hamming
                let distance = hamming / (overlap + 1.0);

                (id.clone(), distance)
            })
            .collect();

        // Sort by distance (ascending)
        distances.sort_by(|a, b| a.1.partial_cmp(&b.1).unwrap_or(Ordering::Equal));

        distances.into_iter().take(k).collect()
    }

    /// Traverse graph following maximum overlap path
    pub fn max_overlap_path(&self, start: &str, target: &str) -> Option<Vec<String>> {
        if !self.nodes.contains_key(start) || !self.nodes.contains_key(target) {
            return None;
        }

        let mut visited = HashSet::new();
        let mut path = Vec::new();

        self.dfs_max_overlap(start, target, &mut visited, &mut path)
    }

    /// DFS with maximum overlap heuristic
    fn dfs_max_overlap(
        &self,
        current: &str,
        target: &str,
        visited: &mut HashSet<String>,
        path: &mut Vec<String>,
    ) -> Option<Vec<String>> {
        visited.insert(current.to_string());
        path.push(current.to_string());

        if current == target {
            return Some(path.clone());
        }

        // Get neighbors sorted by overlap with target
        if let Some(neighbors) = self.adjacency.get(current) {
            let target_node = self.nodes.get(target)?;

            let mut sorted_neighbors: Vec<_> = neighbors
                .iter()
                .filter(|n| !visited.contains(*n))
                .map(|n| {
                    let neighbor_node = self.nodes.get(n).unwrap();
                    let overlap = neighbor_node.bits.overlap(&target_node.bits);
                    (n.clone(), overlap)
                })
                .collect();

            // Sort by overlap (descending)
            sorted_neighbors.sort_by(|a, b| b.1.cmp(&a.1));

            for (neighbor, _) in sorted_neighbors {
                if let Some(result) = self.dfs_max_overlap(&neighbor, target, visited, path) {
                    return Some(result);
                }
            }
        }

        path.pop();
        None
    }

    /// Find all paths with minimum overlap threshold
    pub fn paths_with_overlap(&self, start: &str, min_overlap: u32) -> Vec<Vec<String>> {
        let mut all_paths = Vec::new();
        let mut visited = HashSet::new();
        let mut current_path = Vec::new();

        self.explore_paths(start, min_overlap, &mut visited, &mut current_path, &mut all_paths);

        all_paths
    }

    fn explore_paths(
        &self,
        current: &str,
        min_overlap: u32,
        visited: &mut HashSet<String>,
        current_path: &mut Vec<String>,
        all_paths: &mut Vec<Vec<String>>,
    ) {
        visited.insert(current.to_string());
        current_path.push(current.to_string());

        if current_path.len() > 1 {
            all_paths.push(current_path.clone());
        }

        if let Some(neighbors) = self.adjacency.get(current) {
            for neighbor in neighbors {
                if visited.contains(neighbor) {
                    continue;
                }

                // Check overlap threshold
                if let Some(edge) = self.find_edge(current, neighbor) {
                    if edge.overlap >= min_overlap {
                        self.explore_paths(
                            neighbor,
                            min_overlap,
                            visited,
                            current_path,
                            all_paths,
                        );
                    }
                }
            }
        }

        current_path.pop();
        visited.remove(current);
    }

    /// Find edge between two nodes
    fn find_edge(&self, from: &str, to: &str) -> Option<&KnowledgeEdge> {
        self.edges.iter().find(|e| {
            (e.from == from && e.to == to) || (e.from == to && e.to == from)
        })
    }

    /// Get node neighbors sorted by overlap
    pub fn neighbors_by_overlap(&self, node_id: &str) -> Vec<(String, u32)> {
        let node = match self.nodes.get(node_id) {
            Some(n) => n,
            None => return Vec::new(),
        };

        let neighbors = match self.adjacency.get(node_id) {
            Some(n) => n,
            None => return Vec::new(),
        };

        let mut neighbor_overlaps: Vec<(String, u32)> = neighbors
            .iter()
            .filter_map(|n| {
                self.nodes.get(n).map(|neighbor_node| {
                    let overlap = node.bits.overlap(&neighbor_node.bits);
                    (n.clone(), overlap)
                })
            })
            .collect();

        neighbor_overlaps.sort_by(|a, b| b.1.cmp(&a.1));
        neighbor_overlaps
    }

    /// Compute graph statistics
    pub fn statistics(&self) -> GraphStats {
        let total_edges = self.edges.len();
        let avg_degree = if self.nodes.is_empty() {
            0.0
        } else {
            (total_edges * 2) as f64 / self.nodes.len() as f64
        };

        let avg_overlap = if total_edges > 0 {
            self.edges.iter().map(|e| e.overlap as f64).sum::<f64>() / total_edges as f64
        } else {
            0.0
        };

        let avg_hamming = if total_edges > 0 {
            self.edges.iter().map(|e| e.hamming as f64).sum::<f64>() / total_edges as f64
        } else {
            0.0
        };

        GraphStats {
            node_count: self.nodes.len(),
            edge_count: total_edges,
            avg_degree,
            avg_overlap,
            avg_hamming,
        }
    }
}

impl Default for KnowledgeGraph {
    fn default() -> Self {
        Self::new()
    }
}

/// Graph statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphStats {
    pub node_count: usize,
    pub edge_count: usize,
    pub avg_degree: f64,
    pub avg_overlap: f64,
    pub avg_hamming: f64,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_graph_creation() {
        let mut graph = KnowledgeGraph::new();

        let bits1 = BitField::from_integer(5);
        let bits2 = BitField::from_integer(8);

        graph.add_node("node1".to_string(), bits1, NodeType::Entity);
        graph.add_node("node2".to_string(), bits2, NodeType::Entity);

        assert_eq!(graph.nodes.len(), 2);
    }

    #[test]
    fn test_edge_computation() {
        let mut graph = KnowledgeGraph::new();

        // Create overlapping bit fields
        let bits1 = BitField::from_integer(5);  // F_5 = 5
        let bits2 = BitField::from_integer(13); // F_7 = 13 = 8 + 5

        graph.add_node("a".to_string(), bits1, NodeType::Entity);
        graph.add_node("b".to_string(), bits2, NodeType::Entity);

        graph.compute_edges();

        // Should have edge if overlap > 0
        assert!(!graph.edges.is_empty() || bits1.overlap(&bits2) == 0);
    }

    #[test]
    fn test_k_nearest() {
        let mut graph = KnowledgeGraph::new();

        for i in 1..10 {
            let bits = BitField::from_integer(i);
            graph.add_node(format!("node{}", i), bits, NodeType::Entity);
        }

        let query = BitField::from_integer(5);
        let nearest = graph.k_nearest(&query, 3);

        assert!(nearest.len() <= 3);
    }

    #[test]
    fn test_graph_from_memory() {
        let cell = PhiMemoryCell::new();
        let graph = KnowledgeGraph::from_memory(&cell);

        // Should have nodes from entity map
        assert!(graph.nodes.len() > 0);
    }
}
