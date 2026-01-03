//! Layout module for calculating node positions using Sugiyama hierarchical layout
//! Uses petgraph for graph algorithms

use petgraph::graph::{DiGraph, NodeIndex};
use petgraph::algo::toposort;
use petgraph::Direction;
use std::collections::HashMap;

/// Node position after layout calculation
#[derive(Debug, Clone, Default)]
pub struct NodePosition {
    pub x: f64,
    pub y: f64,
    #[allow(dead_code)]
    pub layer: usize,
}

/// Configuration for layout algorithm
#[derive(Debug, Clone)]
pub struct LayoutConfig {
    /// Horizontal spacing between nodes
    pub node_spacing_x: f64,
    /// Vertical spacing between layers
    pub layer_spacing_y: f64,
    /// Starting X offset
    pub offset_x: f64,
    /// Starting Y offset
    pub offset_y: f64,
}

impl Default for LayoutConfig {
    fn default() -> Self {
        Self {
            node_spacing_x: 200.0,
            layer_spacing_y: 150.0,
            offset_x: 50.0,
            offset_y: 50.0,
        }
    }
}

/// Sugiyama hierarchical layout algorithm implementation
pub struct SugiyamaLayout {
    config: LayoutConfig,
}

impl SugiyamaLayout {
    pub fn new(config: LayoutConfig) -> Self {
        Self { config }
    }

    /// Calculate positions for all nodes in the graph
    /// Returns a map of node_id -> position
    pub fn calculate_positions(
        &self,
        nodes: &[String],
        edges: &[(String, String)],
    ) -> HashMap<String, NodePosition> {
        let mut positions = HashMap::new();
        
        if nodes.is_empty() {
            return positions;
        }

        // Build petgraph graph
        let mut graph: DiGraph<String, ()> = DiGraph::new();
        let mut node_indices: HashMap<String, NodeIndex> = HashMap::new();
        let mut index_to_id: HashMap<NodeIndex, String> = HashMap::new();

        // Add nodes
        for node_id in nodes {
            let idx = graph.add_node(node_id.clone());
            node_indices.insert(node_id.clone(), idx);
            index_to_id.insert(idx, node_id.clone());
        }

        // Add edges
        for (source, target) in edges {
            if let (Some(&src_idx), Some(&tgt_idx)) = (node_indices.get(source), node_indices.get(target)) {
                graph.add_edge(src_idx, tgt_idx, ());
            }
        }

        // Step 1: Layer assignment using topological sort
        let layers = self.assign_layers(&graph, &index_to_id);
        
        // Step 2: Calculate X positions within each layer
        let layer_nodes = self.group_by_layer(&layers);
        
        // Step 3: Calculate final positions
        for (layer_idx, layer_node_ids) in layer_nodes.iter().enumerate() {
            let y = self.config.offset_y + (layer_idx as f64 * self.config.layer_spacing_y);
            
            for (pos_in_layer, node_id) in layer_node_ids.iter().enumerate() {
                let x = self.config.offset_x + (pos_in_layer as f64 * self.config.node_spacing_x);
                
                positions.insert(node_id.clone(), NodePosition {
                    x,
                    y,
                    layer: layer_idx,
                });
            }
        }

        positions
    }

    /// Assign layers to nodes using topological sort and longest path
    fn assign_layers(
        &self,
        graph: &DiGraph<String, ()>,
        index_to_id: &HashMap<NodeIndex, String>,
    ) -> HashMap<String, usize> {
        let mut layers: HashMap<String, usize> = HashMap::new();

        // Try topological sort
        match toposort(graph, None) {
            Ok(sorted) => {
                // Assign layers based on longest path from sources
                for idx in sorted {
                    let node_id = &index_to_id[&idx];
                    
                    // Find max layer of predecessors
                    let max_pred_layer = graph
                        .neighbors_directed(idx, Direction::Incoming)
                        .filter_map(|pred_idx| {
                            let pred_id = &index_to_id[&pred_idx];
                            layers.get(pred_id).copied()
                        })
                        .max()
                        .unwrap_or(0);

                    // If has predecessors, place one layer below
                    let layer = if graph.neighbors_directed(idx, Direction::Incoming).count() > 0 {
                        max_pred_layer + 1
                    } else {
                        0 // Root nodes at layer 0
                    };

                    layers.insert(node_id.clone(), layer);
                }
            }
            Err(_) => {
                // Graph has cycles - use BFS from nodes with no incoming edges
                let mut visited = std::collections::HashSet::new();
                let mut queue = std::collections::VecDeque::new();

                // Start from nodes with no incoming edges
                for idx in graph.node_indices() {
                    if graph.neighbors_directed(idx, Direction::Incoming).count() == 0 {
                        queue.push_back((idx, 0usize));
                        visited.insert(idx);
                    }
                }

                // If all nodes have incoming edges (pure cycle), start from first node
                if queue.is_empty() {
                    if let Some(idx) = graph.node_indices().next() {
                        queue.push_back((idx, 0));
                        visited.insert(idx);
                    }
                }

                while let Some((idx, layer)) = queue.pop_front() {
                    let node_id = &index_to_id[&idx];
                    layers.insert(node_id.clone(), layer);

                    for neighbor in graph.neighbors_directed(idx, Direction::Outgoing) {
                        if !visited.contains(&neighbor) {
                            visited.insert(neighbor);
                            queue.push_back((neighbor, layer + 1));
                        }
                    }
                }

                // Handle any unvisited nodes (disconnected components)
                for idx in graph.node_indices() {
                    let node_id = &index_to_id[&idx];
                    layers.entry(node_id.clone()).or_insert(0);
                }
            }
        }

        layers
    }

    /// Group nodes by their layer
    fn group_by_layer(&self, layers: &HashMap<String, usize>) -> Vec<Vec<String>> {
        let max_layer = layers.values().copied().max().unwrap_or(0);
        let mut layer_nodes: Vec<Vec<String>> = vec![Vec::new(); max_layer + 1];

        for (node_id, &layer) in layers {
            layer_nodes[layer].push(node_id.clone());
        }

        // Sort nodes within each layer alphabetically for consistency
        for layer in &mut layer_nodes {
            layer.sort();
        }

        layer_nodes
    }
}

/// Calculate hexagonal architecture layer from file path
pub fn calculate_hex_layer(path: &str) -> &'static str {
    let lower = path.to_lowercase();
    
    if lower.contains("component") || lower.contains("view") || lower.contains("page") {
        "driving"
    } else if lower.contains("domain") || lower.contains("entities") || lower.contains("core") {
        "domain"
    } else if lower.contains("composable") || lower.contains("hook") || lower.contains("service") {
        "application"
    } else if lower.contains("adapter") || lower.contains("api") || lower.contains("infra") {
        "driven"
    } else {
        "default"
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sugiyama_layout() {
        let layout = SugiyamaLayout::new(LayoutConfig::default());
        
        let nodes = vec![
            "a".to_string(),
            "b".to_string(),
            "c".to_string(),
        ];
        let edges = vec![
            ("a".to_string(), "b".to_string()),
            ("a".to_string(), "c".to_string()),
        ];
        
        let positions = layout.calculate_positions(&nodes, &edges);
        
        assert_eq!(positions.len(), 3);
        assert_eq!(positions["a"].layer, 0);
        assert_eq!(positions["b"].layer, 1);
        assert_eq!(positions["c"].layer, 1);
    }

    #[test]
    fn test_hex_layer() {
        assert_eq!(calculate_hex_layer("src/components/Button.tsx"), "driving");
        assert_eq!(calculate_hex_layer("src/domain/User.ts"), "domain");
        assert_eq!(calculate_hex_layer("src/hooks/useAuth.ts"), "application");
        assert_eq!(calculate_hex_layer("src/api/client.ts"), "driven");
    }
}
