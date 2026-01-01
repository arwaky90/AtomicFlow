import * as path from 'path';
import * as fs from 'fs';
import { ParserFactory, ImportInfo } from './parsers';
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
        const ext = path.extname(p);
        if (!nodes.some(n => n.id === rel)) {
            let lineCount = 0;
            try {
                const content = fs.readFileSync(p, 'utf-8');
                const parser = ParserFactory.getParser(ext);
                lineCount = parser ? parser.getLineCount(content) : content.split('\n').length;
            } catch (e) {}
            
            nodes.push({ 
                id: rel, 
                name: path.basename(p, ext), 
                imports: impCount, 
                depth: d,
                lines: lineCount,
                externalLibs: externalLibs.length > 0 ? externalLibs : undefined
            });
        }
        return rel;
    };

    function process(fp: string, depth: number) {
        try { fp = fs.realpathSync(fp); } catch(e) {}
        
        const ext = path.extname(fp);
        const parser = ParserFactory.getParser(ext);
        if (!parser) return; // Unsupported file type
        
        let importDetails: ImportInfo[] = [];
        try { 
            const content = fs.readFileSync(fp, 'utf-8');
            importDetails = parser.parseImports(content);
        } catch (e) {}

        const externalLibs = importDetails.filter(i => i.isExternal).map(i => i.module);
        
        // Python-specific: skip __init__.py files
        const isInit = path.basename(fp) === '__init__.py';
        let sourceRel = '';
        if (!isInit || fp === filePath) {
            sourceRel = addNode(fp, importDetails.length, depth, externalLibs);
        }

        if (depth >= maxDepth || visited.has(fp)) return;
        visited.add(fp);
        
        if (isInit && fp !== filePath) return; 

        for (const impInfo of importDetails) {
            const imp = impInfo.module;
            const target = resolveModule(imp, fp, workspaceRoot);
            if (target) {
                try {
                    const targetReal = fs.realpathSync(target);
                    const targetExt = path.extname(targetReal);
                    const targetParser = ParserFactory.getParser(targetExt);
                    
                    // Python-specific: handle __init__.py
                    if (path.basename(targetReal) === '__init__.py' && targetParser) {
                        try {
                            const initContent = fs.readFileSync(targetReal, 'utf-8');
                            const initImports = targetParser.parseImports(initContent);
                            for (const subImpInfo of initImports) {
                                const subTarget = resolveModule(subImpInfo.module, targetReal, workspaceRoot);
                                if (subTarget) {
                                    try {
                                        const subTargetReal = fs.realpathSync(subTarget);
                                        if (path.basename(subTargetReal) === '__init__.py') continue;
                                        
                                        const subExt = path.extname(subTargetReal);
                                        const subParser = ParserFactory.getParser(subExt);
                                        let subImpCount = 0;
                                        if (subParser) {
                                            try {
                                                const subContent = fs.readFileSync(subTargetReal, 'utf-8');
                                                subImpCount = subParser.parseImports(subContent).length;
                                            } catch(e) {}
                                        }
                                        const subTargetRel = addNode(subTargetReal, subImpCount, depth + 1);
                                        if (sourceRel !== subTargetRel) {
                                            const violation = validateEdge(sourceRel, subTargetRel, archRules);
                                            edges.push({ 
                                                source: sourceRel, 
                                                target: subTargetRel, 
                                                module: `${imp} -> ${subImpInfo.module}`,
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
                        if (targetParser) {
                            try {
                                const targetContent = fs.readFileSync(targetReal, 'utf-8');
                                targetImpCount = targetParser.parseImports(targetContent).length;
                            } catch(e) {}
                        }
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
