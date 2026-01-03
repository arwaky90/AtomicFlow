//! AtomicFlow Engine - Rust backend for code analysis and visualization
//! 
//! Features:
//! - AST parsing with SWC for import/export extraction
//! - Dependency graph construction with petgraph
//! - Sugiyama hierarchical layout algorithm
//! - Hexagonal architecture layer detection

mod parser_module;
mod layout_module;

use anyhow::Result;
use clap::Parser;
use serde::Serialize;
use std::collections::HashMap;
use std::path::PathBuf;
use walkdir::WalkDir;

use parser_module::{parse_file, ParseResult};
use layout_module::{calculate_hex_layer, LayoutConfig, SugiyamaLayout};

#[derive(Parser, Debug)]
#[command(author, version, about = "AtomicFlow code analysis engine", long_about = None)]
struct Args {
    /// Path to the project directory to scan
    #[arg(short, long)]
    path: String,
    
    /// Enable dependency graph mode (parse imports)
    #[arg(short, long, default_value = "false")]
    deps: bool,
}

#[derive(Serialize, Debug)]
struct Node {
    id: String,
    name: String,
    #[serde(rename = "type")]
    node_type: String,
    path: String,
    /// Hexagonal architecture layer
    hex_layer: String,
    /// File line count (if file)
    #[serde(skip_serializing_if = "Option::is_none")]
    line_count: Option<usize>,
    /// Number of imports (if file)
    #[serde(skip_serializing_if = "Option::is_none")]
    imports: Option<usize>,
    /// Number of exports (if file)
    #[serde(skip_serializing_if = "Option::is_none")]
    exports: Option<usize>,
    /// Position X (calculated by layout)
    #[serde(skip_serializing_if = "Option::is_none")]
    x: Option<f64>,
    /// Position Y (calculated by layout)
    #[serde(skip_serializing_if = "Option::is_none")]
    y: Option<f64>,
}

#[derive(Serialize, Debug)]
struct Link {
    source: String,
    target: String,
    /// Number of imports from source to target
    #[serde(skip_serializing_if = "Option::is_none")]
    weight: Option<usize>,
}

#[derive(Serialize, Debug)]
struct Graph {
    nodes: Vec<Node>,
    links: Vec<Link>,
}

fn main() -> Result<()> {
    let args = Args::parse();
    let root_path = PathBuf::from(&args.path);

    if !root_path.exists() {
        eprintln!("Error: Path does not exist: {}", args.path);
        std::process::exit(1);
    }

    let mut nodes = Vec::new();
    let mut links = Vec::new();
    let mut file_imports: HashMap<String, Vec<String>> = HashMap::new();
    let mut parse_results: HashMap<String, ParseResult> = HashMap::new();

    let walker = WalkDir::new(&root_path).into_iter();

    // Phase 1: Scan files and collect nodes
    for entry in walker.filter_entry(|e| !is_hidden(e)) {
        let entry = entry?;
        let path = entry.path();
        
        let relative_path = path.strip_prefix(&root_path).unwrap_or(path);
        let path_str = relative_path.to_string_lossy().to_string();
        let id = path_str.replace("\\", "/");
        
        let node_type = if entry.file_type().is_dir() {
            "directory".to_string()
        } else {
            "file".to_string()
        };

        let name = entry.file_name().to_string_lossy().to_string();

        if name.is_empty() || id.is_empty() {
            continue;
        }

        // Parse file for imports/exports if in dependency mode
        let mut line_count = None;
        let mut imports_count = None;
        let mut exports_count = None;

        if args.deps && entry.file_type().is_file() {
            if let Ok(result) = parse_file(path) {
                line_count = Some(result.line_count);
                imports_count = Some(result.imports.len());
                exports_count = Some(result.exports.len());
                
                // Collect import sources for dependency graph
                let import_sources: Vec<String> = result.imports
                    .iter()
                    .filter(|imp| imp.source.starts_with('.') || imp.source.starts_with('@'))
                    .map(|imp| resolve_import_path(&id, &imp.source))
                    .collect();
                
                if !import_sources.is_empty() {
                    file_imports.insert(id.clone(), import_sources);
                }
                
                parse_results.insert(id.clone(), result);
            }
        }

        let hex_layer = calculate_hex_layer(&id).to_string();

        nodes.push(Node {
            id: id.clone(),
            name,
            node_type,
            path: id,
            hex_layer,
            line_count,
            imports: imports_count,
            exports: exports_count,
            x: None,
            y: None,
        });
    }

    // Phase 2: Build dependency links
    if args.deps {
        let node_ids: std::collections::HashSet<String> = 
            nodes.iter().map(|n| n.id.clone()).collect();
        
        for (source_id, imports) in &file_imports {
            for target_path in imports {
                // Try to find matching node
                let target_id = find_matching_node(target_path, &node_ids);
                
                if let Some(target) = target_id {
                    links.push(Link {
                        source: source_id.clone(),
                        target,
                        weight: Some(1),
                    });
                }
            }
        }
    }

    // Phase 3: Calculate layout positions
    if args.deps && !nodes.is_empty() {
        let layout = SugiyamaLayout::new(LayoutConfig::default());
        
        let node_ids: Vec<String> = nodes.iter().map(|n| n.id.clone()).collect();
        let edges: Vec<(String, String)> = links.iter()
            .map(|l| (l.source.clone(), l.target.clone()))
            .collect();
        
        let positions = layout.calculate_positions(&node_ids, &edges);
        
        // Apply positions to nodes
        for node in &mut nodes {
            if let Some(pos) = positions.get(&node.id) {
                node.x = Some(pos.x);
                node.y = Some(pos.y);
            }
        }
    }

    let graph = Graph { nodes, links };
    let json = serde_json::to_string_pretty(&graph)?;
    
    println!("{}", json);

    Ok(())
}

/// Resolve relative import path to absolute path within project
fn resolve_import_path(from_file: &str, import_source: &str) -> String {
    if import_source.starts_with('@') {
        // Alias import (e.g., @/components/Button)
        // Assume @ maps to src/
        import_source.replace("@/", "src/")
    } else {
        // Relative import
        let from_dir = PathBuf::from(from_file)
            .parent()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_default();
        
        let mut result_parts: Vec<&str> = from_dir.split('/').filter(|s| !s.is_empty()).collect();
        
        for part in import_source.split('/') {
            match part {
                "." => {}
                ".." => { result_parts.pop(); }
                other => result_parts.push(other),
            }
        }
        
        result_parts.join("/")
    }
}

/// Find matching node for an import path
fn find_matching_node(import_path: &str, node_ids: &std::collections::HashSet<String>) -> Option<String> {
    // Try exact match
    if node_ids.contains(import_path) {
        return Some(import_path.to_string());
    }
    
    // Try with common extensions
    let extensions = ["", ".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.tsx", "/index.js"];
    
    for ext in extensions {
        let candidate = format!("{}{}", import_path, ext);
        if node_ids.contains(&candidate) {
            return Some(candidate);
        }
    }
    
    None
}

fn is_hidden(entry: &walkdir::DirEntry) -> bool {
    entry.file_name()
         .to_str()
         .map(|s| {
             s.starts_with('.') 
             || s == "node_modules" 
             || s == "target" 
             || s == "dist" 
             || s == "out" 
             || s == "build"
             || s == "__pycache__"
         })
         .unwrap_or(false)
}
