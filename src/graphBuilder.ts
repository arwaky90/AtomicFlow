import * as path from 'path';
import * as fs from 'fs';
import { parseImports, parseImportsDetailed, getLineCount, ImportInfo } from './parser';
import { resolveModule } from './resolver';
import { loadArchRules, validateEdge, ArchRule } from './archLinter';

export interface GraphNode {
    id: string;
    name: string;
    imports: number;
    depth: number;
    lines?: number;
    isCyclic?: boolean;
    isOrphan?: boolean;
    externalLibs?: string[];
}

export interface GraphEdge {
    source: string;
    target: string;
    module: string;
    violation?: string;
}

export interface DependencyGraph {
    nodes: GraphNode[];
    edges: GraphEdge[];
}

export function buildGraph(filePath: string, workspaceRoot: string, maxDepth: number = 2): DependencyGraph {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const visited = new Set<string>();
    const archRules = loadArchRules(workspaceRoot);
    
    const addNode = (p: string, impCount: number, d: number, externalLibs: string[] = []): string => {
        const rel = path.relative(workspaceRoot, p);
        if (!nodes.some(n => n.id === rel)) {
            nodes.push({ 
                id: rel, 
                name: path.basename(p, '.py'), 
                imports: impCount, 
                depth: d,
                lines: getLineCount(p),
                externalLibs: externalLibs.length > 0 ? externalLibs : undefined
            });
        }
        return rel;
    };

    function process(fp: string, depth: number) {
        try { fp = fs.realpathSync(fp); } catch(e) {}
        let imports: string[] = [];
        let importDetails: ImportInfo[] = [];
        try { 
            importDetails = parseImportsDetailed(fs.readFileSync(fp, 'utf-8'));
            imports = importDetails.map(i => i.module);
        } catch (e) {}

        const externalLibs = importDetails.filter(i => i.isExternal).map(i => i.module);
        const isInit = path.basename(fp) === '__init__.py';
        let sourceRel = '';
        if (!isInit || fp === filePath) {
            sourceRel = addNode(fp, imports.length, depth, externalLibs);
        }

        if (depth >= maxDepth || visited.has(fp)) return;
        visited.add(fp);
        
        if (isInit && fp !== filePath) return; 

        for (const imp of imports) {
            const target = resolveModule(imp, fp, workspaceRoot);
            if (target) {
                try {
                    const targetReal = fs.realpathSync(target);
                    if (path.basename(targetReal) === '__init__.py') {
                        try {
                            const initImports = parseImports(fs.readFileSync(targetReal, 'utf-8'));
                            for (const subImp of initImports) {
                                const subTarget = resolveModule(subImp, targetReal, workspaceRoot);
                                if (subTarget) {
                                    try {
                                        const subTargetReal = fs.realpathSync(subTarget);
                                        if (path.basename(subTargetReal) === '__init__.py') continue;
                                        let subImpCount = 0;
                                        try {subImpCount = parseImports(fs.readFileSync(subTargetReal, 'utf-8')).length;} catch(e) {}
                                        const subTargetRel = addNode(subTargetReal, subImpCount, depth + 1);
                                        if (sourceRel !== subTargetRel) {
                                            const violation = validateEdge(sourceRel, subTargetRel, archRules);
                                            edges.push({ 
                                                source: sourceRel, 
                                                target: subTargetRel, 
                                                module: `${imp} -> ${subImp}`,
                                                violation: violation || undefined
                                            });
                                            process(subTargetReal, depth + 1);
                                        }
                                    } catch(e) {}
                                }
                            }
                        } catch(e) {}
                    } else {
                        let targetImpCount = 0;
                        try {targetImpCount = parseImports(fs.readFileSync(targetReal, 'utf-8')).length;} catch(e) {}
                        const targetRel = addNode(targetReal, targetImpCount, depth + 1);
                        if (sourceRel !== targetRel) {
                            const violation = validateEdge(sourceRel, targetRel, archRules);
                            edges.push({ 
                                source: sourceRel, 
                                target: targetRel, 
                                module: imp,
                                violation: violation || undefined
                            });
                            process(targetReal, depth + 1);
                        }
                    }
                } catch (e) {}
            }
        }
    }
    
    process(filePath, 0);
    
    // Analyze cycles and orphans
    detectCycles(nodes, edges);
    detectOrphans(nodes, edges, path.relative(workspaceRoot, filePath));
    
    return { nodes, edges };
}

// Tarjan's Algorithm for Strongly Connected Components
function detectCycles(nodes: GraphNode[], edges: GraphEdge[]) {
    const adjList = new Map<string, string[]>();
    nodes.forEach(n => adjList.set(n.id, []));
    edges.forEach(e => adjList.get(e.source)?.push(e.target));
    
    const index = new Map<string, number>();
    const lowlink = new Map<string, number>();
    const onStack = new Set<string>();
    const stack: string[] = [];
    let currentIndex = 0;
    const sccs: string[][] = [];
    
    function strongConnect(v: string) {
        index.set(v, currentIndex);
        lowlink.set(v, currentIndex);
        currentIndex++;
        stack.push(v);
        onStack.add(v);
        
        for (const w of adjList.get(v) || []) {
            if (!index.has(w)) {
                strongConnect(w);
                lowlink.set(v, Math.min(lowlink.get(v)!, lowlink.get(w)!));
            } else if (onStack.has(w)) {
                lowlink.set(v, Math.min(lowlink.get(v)!, index.get(w)!));
            }
        }
        
        if (lowlink.get(v) === index.get(v)) {
            const scc: string[] = [];
            let w: string;
            do {
                w = stack.pop()!;
                onStack.delete(w);
                scc.push(w);
            } while (w !== v);
            if (scc.length > 1) sccs.push(scc);
        }
    }
    
    for (const node of nodes) {
        if (!index.has(node.id)) {
            strongConnect(node.id);
        }
    }
    
    // Mark cyclic nodes
    const cyclicSet = new Set(sccs.flat());
    nodes.forEach(n => { n.isCyclic = cyclicSet.has(n.id); });
}

function detectOrphans(nodes: GraphNode[], edges: GraphEdge[], rootId: string) {
    const hasIncoming = new Set<string>();
    edges.forEach(e => hasIncoming.add(e.target));
    nodes.forEach(n => {
        n.isOrphan = !hasIncoming.has(n.id) && n.id !== rootId;
    });
}
