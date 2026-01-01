#!/usr/bin/env node
// Automated Debug Script for Python-Live Backend
const path = require('path');
const fs = require('fs');

console.log('🔍 Python-Live Backend Debug Script\n');

// Test 1: Check compiled files
console.log('1️⃣ Checking compiled files...');
const outDir = path.join(__dirname, 'out');
const requiredFiles = ['parser.js', 'resolver.js', 'graphBuilder.js', 'extension.js'];
let allFilesExist = true;

requiredFiles.forEach(file => {
    const filePath = path.join(outDir, file);
    const exists = fs.existsSync(filePath);
    console.log(`   ${exists ? '✅' : '❌'} ${file} ${exists ? 'exists' : 'MISSING'}`);
    if (!exists) allFilesExist = false;
});

if (!allFilesExist) {
    console.log('\n❌ CRITICAL: Missing compiled files. Run: npm run compile');
    process.exit(1);
}

// Test 2: Load modules
console.log('\n2️⃣ Loading modules...');
let parser, resolver, graphBuilder;
try {
    parser = require('./out/parser.js');
    console.log('   ✅ parser.js loaded');
    resolver = require('./out/resolver.js');
    console.log('   ✅ resolver.js loaded');
    graphBuilder = require('./out/graphBuilder.js');
    console.log('   ✅ graphBuilder.js loaded');
} catch (e) {
    console.log('   ❌ Failed to load modules:', e.message);
    process.exit(1);
}

// Test 3: Test parser
console.log('\n3️⃣ Testing parser...');
const testPythonCode = `
import os
from dataclasses import dataclass
from typing import List
import pandas as pd
`;

try {
    const imports = parser.parseImports(testPythonCode);
    console.log(`   ✅ Parsed ${imports.length} imports:`, imports);
    
    const detailed = parser.parseImportsDetailed(testPythonCode);
    console.log(`   ✅ External libs detected:`, detailed.filter(i => i.isExternal).map(i => i.module));
} catch (e) {
    console.log('   ❌ Parser failed:', e.message);
}

// Test 4: Test resolver
console.log('\n4️⃣ Testing resolver...');
const testFile = '/home/rakaarwaky/Work/App Project/client-app/src/Domain/core/engine.py';
const workspaceRoot = '/home/rakaarwaky/Work/App Project/client-app';

if (fs.existsSync(testFile)) {
    console.log(`   ✅ Test file exists: ${path.basename(testFile)}`);
    
    try {
        const resolved = resolver.resolveModule('..modules.animator', testFile, workspaceRoot);
        console.log(`   ✅ Resolver test: ${resolved ? 'Found' : 'Not found'}`);
    } catch (e) {
        console.log('   ⚠️ Resolver test failed:', e.message);
    }
} else {
    console.log(`   ⚠️ Test file not found: ${testFile}`);
}

// Test 5: Full graph build
console.log('\n5️⃣ Testing full graph build...');
if (fs.existsSync(testFile)) {
    try {
        const graph = graphBuilder.buildGraph(testFile, workspaceRoot, 1);
        console.log(`   ✅ Graph built successfully!`);
        console.log(`   📊 Nodes: ${graph.nodes.length}`);
        console.log(`   🔗 Edges: ${graph.edges.length}`);
        
        if (graph.nodes.length > 0) {
            const rootNode = graph.nodes[0];
            console.log(`\n   Root Node Details:`);
            console.log(`   - ID: ${rootNode.id}`);
            console.log(`   - Name: ${rootNode.name}`);
            console.log(`   - Imports: ${rootNode.imports}`);
            console.log(`   - Lines: ${rootNode.lines || 'N/A'}`);
            console.log(`   - Cyclic: ${rootNode.isCyclic}`);
            console.log(`   - Orphan: ${rootNode.isOrphan}`);
            if (rootNode.externalLibs) {
                console.log(`   - External Libs: ${rootNode.externalLibs.join(', ')}`);
            }
        }
        
        // Check for issues
        console.log(`\n   🔍 Analysis:`);
        const cyclicNodes = graph.nodes.filter(n => n.isCyclic);
        const orphanNodes = graph.nodes.filter(n => n.isOrphan);
        const violations = graph.edges.filter(e => e.violation);
        
        console.log(`   - Circular dependencies: ${cyclicNodes.length}`);
        console.log(`   - Orphan files: ${orphanNodes.length}`);
        console.log(`   - Architecture violations: ${violations.length}`);
        
    } catch (e) {
        console.log('   ❌ Graph build failed:', e.message);
        console.log('   Stack:', e.stack);
    }
} else {
    console.log(`   ⚠️ Cannot test graph build - test file missing`);
}

// Test 6: Check media files
console.log('\n6️⃣ Checking media files...');
const mediaDir = path.join(__dirname, 'media');
const mediaFiles = ['index.html', 'style.css', 'main.js'];

mediaFiles.forEach(file => {
    const filePath = path.join(mediaDir, file);
    const exists = fs.existsSync(filePath);
    console.log(`   ${exists ? '✅' : '❌'} ${file} ${exists ? 'exists' : 'MISSING'}`);
});

console.log('\n✅ Debug complete!\n');
