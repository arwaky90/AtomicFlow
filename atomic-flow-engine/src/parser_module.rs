//! Parser module for extracting imports/exports from TypeScript/JavaScript files
//! Uses regex-based parsing for reliable import/export extraction

use anyhow::Result;
use std::path::Path;

/// Represents an import extracted from a file
#[derive(Debug, Clone)]
pub struct ImportInfo {
    /// The import path (e.g., "./utils", "@/components/Button")
    pub source: String,
    /// Whether this is a default import
    #[allow(dead_code)]
    pub is_default: bool,
    /// Whether this is a namespace import (import * as X)
    #[allow(dead_code)]
    pub is_namespace: bool,
}

/// Represents an export extracted from a file
#[derive(Debug, Clone)]
pub struct ExportInfo {
    /// The exported name
    #[allow(dead_code)]
    pub name: String,
    /// Whether this is a default export
    #[allow(dead_code)]
    pub is_default: bool,
}

/// Result of parsing a file
#[derive(Debug, Default)]
pub struct ParseResult {
    pub imports: Vec<ImportInfo>,
    pub exports: Vec<ExportInfo>,
    pub line_count: usize,
}

/// Parse a TypeScript/JavaScript file and extract imports/exports
/// Uses regex-based extraction for reliability
pub fn parse_file(file_path: &Path) -> Result<ParseResult> {
    let content = std::fs::read_to_string(file_path)?;
    let line_count = content.lines().count();
    
    // Check if it's a parseable file
    let ext = file_path.extension().and_then(|e| e.to_str()).unwrap_or("");
    match ext {
        "ts" | "tsx" | "js" | "jsx" | "mjs" | "cjs" | "vue" => {}
        _ => return Ok(ParseResult { line_count, ..Default::default() }),
    }

    let imports = extract_imports(&content);
    let exports = extract_exports(&content);

    Ok(ParseResult {
        imports,
        exports,
        line_count,
    })
}

/// Extract imports using pattern matching
fn extract_imports(content: &str) -> Vec<ImportInfo> {
    let mut imports = Vec::new();
    
    for line in content.lines() {
        let line = line.trim();
        
        // Skip comments
        if line.starts_with("//") || line.starts_with("/*") || line.starts_with("*") {
            continue;
        }
        
        // Match import statements
        if line.starts_with("import ") {
            if let Some(source) = extract_import_source(line) {
                let is_default = line.contains("import ") && 
                    !line.contains("import {") && 
                    !line.contains("import *") &&
                    !line.contains("import type ");
                let is_namespace = line.contains("import * as");
                
                imports.push(ImportInfo {
                    source,
                    is_default,
                    is_namespace,
                });
            }
        }
        
        // Also match require() calls
        if line.contains("require(") {
            if let Some(source) = extract_require_source(line) {
                imports.push(ImportInfo {
                    source,
                    is_default: true,
                    is_namespace: false,
                });
            }
        }
    }
    
    imports
}

/// Extract the source path from an import statement
fn extract_import_source(line: &str) -> Option<String> {
    // Find the quoted string after "from" or in the import
    let parts: Vec<&str> = if line.contains(" from ") {
        line.split(" from ").collect()
    } else {
        // import 'module' style
        vec![line]
    };
    
    let quote_part = parts.last()?;
    extract_quoted_string(quote_part)
}

/// Extract the source path from a require() call
fn extract_require_source(line: &str) -> Option<String> {
    let start = line.find("require(")?;
    let after_require = &line[start + 8..];
    extract_quoted_string(after_require)
}

/// Extract a quoted string from text
fn extract_quoted_string(text: &str) -> Option<String> {
    // Try single quotes
    if let Some(start) = text.find('\'') {
        let after_start = &text[start + 1..];
        if let Some(end) = after_start.find('\'') {
            return Some(after_start[..end].to_string());
        }
    }
    
    // Try double quotes
    if let Some(start) = text.find('"') {
        let after_start = &text[start + 1..];
        if let Some(end) = after_start.find('"') {
            return Some(after_start[..end].to_string());
        }
    }
    
    // Try backticks
    if let Some(start) = text.find('`') {
        let after_start = &text[start + 1..];
        if let Some(end) = after_start.find('`') {
            return Some(after_start[..end].to_string());
        }
    }
    
    None
}

/// Extract exports using pattern matching
fn extract_exports(content: &str) -> Vec<ExportInfo> {
    let mut exports = Vec::new();
    
    for line in content.lines() {
        let line = line.trim();
        
        // Skip comments
        if line.starts_with("//") || line.starts_with("/*") || line.starts_with("*") {
            continue;
        }
        
        // export default
        if line.starts_with("export default ") {
            exports.push(ExportInfo {
                name: "default".to_string(),
                is_default: true,
            });
            continue;
        }
        
        // export const/let/var/function/class
        if line.starts_with("export const ") || 
           line.starts_with("export let ") || 
           line.starts_with("export var ") {
            if let Some(name) = extract_variable_name(line) {
                exports.push(ExportInfo {
                    name,
                    is_default: false,
                });
            }
        } else if line.starts_with("export function ") {
            if let Some(name) = extract_function_name(line) {
                exports.push(ExportInfo {
                    name,
                    is_default: false,
                });
            }
        } else if line.starts_with("export class ") {
            if let Some(name) = extract_class_name(line) {
                exports.push(ExportInfo {
                    name,
                    is_default: false,
                });
            }
        } else if line.starts_with("export interface ") || line.starts_with("export type ") {
            if let Some(name) = extract_type_name(line) {
                exports.push(ExportInfo {
                    name,
                    is_default: false,
                });
            }
        }
    }
    
    exports
}

fn extract_variable_name(line: &str) -> Option<String> {
    // export const NAME = ...
    let parts: Vec<&str> = line.split_whitespace().collect();
    if parts.len() >= 3 {
        let name = parts[2].trim_end_matches(|c| c == ':' || c == '=' || c == ',');
        if !name.is_empty() && name.chars().next()?.is_alphabetic() {
            return Some(name.to_string());
        }
    }
    None
}

fn extract_function_name(line: &str) -> Option<String> {
    // export function NAME(...
    let parts: Vec<&str> = line.split_whitespace().collect();
    if parts.len() >= 3 {
        let name = parts[2].split('(').next()?.trim();
        if !name.is_empty() {
            return Some(name.to_string());
        }
    }
    None
}

fn extract_class_name(line: &str) -> Option<String> {
    // export class NAME ...
    let parts: Vec<&str> = line.split_whitespace().collect();
    if parts.len() >= 3 {
        let name = parts[2].trim_end_matches(|c: char| !c.is_alphanumeric() && c != '_');
        if !name.is_empty() {
            return Some(name.to_string());
        }
    }
    None
}

fn extract_type_name(line: &str) -> Option<String> {
    // export interface/type NAME ...
    let parts: Vec<&str> = line.split_whitespace().collect();
    if parts.len() >= 3 {
        let name = parts[2].trim_end_matches(|c: char| !c.is_alphanumeric() && c != '_');
        if !name.is_empty() {
            return Some(name.to_string());
        }
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_imports() {
        let content = r#"
            import { Foo } from "./components";
            import React from 'react';
            import * as utils from "@/utils";
            const lib = require("lib-name");
            // import { commented } from "commented";
        "#;

        let imports = extract_imports(content);
        
        assert_eq!(imports.len(), 4);
        
        // Assertions for specific imports
        assert!(imports.iter().any(|i| i.source == "./components" && !i.is_default && !i.is_namespace));
        assert!(imports.iter().any(|i| i.source == "react" && i.is_default));
        assert!(imports.iter().any(|i| i.source == "@/utils" && i.is_namespace));
        assert!(imports.iter().any(|i| i.source == "lib-name" && i.is_default)); // require is treated as default
    }

    #[test]
    fn test_extract_exports() {
        let content = r#"
            export default class Main {}
            export const constant = 1;
            export function helper() {}
            export interface Config {}
        "#;

        let exports = extract_exports(content);
        
        assert_eq!(exports.len(), 4);
        
        assert!(exports.iter().any(|e| e.name == "default" && e.is_default));
        assert!(exports.iter().any(|e| e.name == "constant" && !e.is_default));
        assert!(exports.iter().any(|e| e.name == "helper" && !e.is_default));
        assert!(exports.iter().any(|e| e.name == "Config" && !e.is_default));
    }
}
