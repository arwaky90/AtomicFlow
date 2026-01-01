"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildGraph = buildGraph;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const parser_1 = require("./parser");
const resolver_1 = require("./resolver");
const archLinter_1 = require("./archLinter");
function buildGraph(filePath, workspaceRoot, maxDepth = 2) {
    const nodes = [];
    const edges = [];
    const visited = new Set();
    const archRules = (0, archLinter_1.loadArchRules)(workspaceRoot);
    const addNode = (p, impCount, d, externalLibs = []) => {
        const rel = path.relative(workspaceRoot, p);
        if (!nodes.some(n => n.id === rel)) {
            nodes.push({
                id: rel,
                name: path.basename(p, '.py'),
                imports: impCount,
                depth: d,
                lines: (0, parser_1.getLineCount)(p),
                externalLibs: externalLibs.length > 0 ? externalLibs : undefined
            });
        }
        return rel;
    };
    function process(fp, depth) {
        try {
            fp = fs.realpathSync(fp);
        }
        catch (e) { }
        let imports = [];
        let importDetails = [];
        try {
            importDetails = (0, parser_1.parseImportsDetailed)(fs.readFileSync(fp, 'utf-8'));
            imports = importDetails.map(i => i.module);
        }
        catch (e) { }
        const externalLibs = importDetails.filter(i => i.isExternal).map(i => i.module);
        const isInit = path.basename(fp) === '__init__.py';
        let sourceRel = '';
        if (!isInit || fp === filePath) {
            sourceRel = addNode(fp, imports.length, depth, externalLibs);
        }
        if (depth >= maxDepth || visited.has(fp))
            return;
        visited.add(fp);
        if (isInit && fp !== filePath)
            return;
        for (const imp of imports) {
            const target = (0, resolver_1.resolveModule)(imp, fp, workspaceRoot);
            if (target) {
                try {
                    const targetReal = fs.realpathSync(target);
                    if (path.basename(targetReal) === '__init__.py') {
                        try {
                            const initImports = (0, parser_1.parseImports)(fs.readFileSync(targetReal, 'utf-8'));
                            for (const subImp of initImports) {
                                const subTarget = (0, resolver_1.resolveModule)(subImp, targetReal, workspaceRoot);
                                if (subTarget) {
                                    try {
                                        const subTargetReal = fs.realpathSync(subTarget);
                                        if (path.basename(subTargetReal) === '__init__.py')
                                            continue;
                                        let subImpCount = 0;
                                        try {
                                            subImpCount = (0, parser_1.parseImports)(fs.readFileSync(subTargetReal, 'utf-8')).length;
                                        }
                                        catch (e) { }
                                        const subTargetRel = addNode(subTargetReal, subImpCount, depth + 1);
                                        if (sourceRel !== subTargetRel) {
                                            const violation = (0, archLinter_1.validateEdge)(sourceRel, subTargetRel, archRules);
                                            edges.push({
                                                source: sourceRel,
                                                target: subTargetRel,
                                                module: `${imp} -> ${subImp}`,
                                                violation: violation || undefined
                                            });
                                            process(subTargetReal, depth + 1);
                                        }
                                    }
                                    catch (e) { }
                                }
                            }
                        }
                        catch (e) { }
                    }
                    else {
                        let targetImpCount = 0;
                        try {
                            targetImpCount = (0, parser_1.parseImports)(fs.readFileSync(targetReal, 'utf-8')).length;
                        }
                        catch (e) { }
                        const targetRel = addNode(targetReal, targetImpCount, depth + 1);
                        if (sourceRel !== targetRel) {
                            const violation = (0, archLinter_1.validateEdge)(sourceRel, targetRel, archRules);
                            edges.push({
                                source: sourceRel,
                                target: targetRel,
                                module: imp,
                                violation: violation || undefined
                            });
                            process(targetReal, depth + 1);
                        }
                    }
                }
                catch (e) { }
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
function detectCycles(nodes, edges) {
    const adjList = new Map();
    nodes.forEach(n => adjList.set(n.id, []));
    edges.forEach(e => adjList.get(e.source)?.push(e.target));
    const index = new Map();
    const lowlink = new Map();
    const onStack = new Set();
    const stack = [];
    let currentIndex = 0;
    const sccs = [];
    function strongConnect(v) {
        index.set(v, currentIndex);
        lowlink.set(v, currentIndex);
        currentIndex++;
        stack.push(v);
        onStack.add(v);
        for (const w of adjList.get(v) || []) {
            if (!index.has(w)) {
                strongConnect(w);
                lowlink.set(v, Math.min(lowlink.get(v), lowlink.get(w)));
            }
            else if (onStack.has(w)) {
                lowlink.set(v, Math.min(lowlink.get(v), index.get(w)));
            }
        }
        if (lowlink.get(v) === index.get(v)) {
            const scc = [];
            let w;
            do {
                w = stack.pop();
                onStack.delete(w);
                scc.push(w);
            } while (w !== v);
            if (scc.length > 1)
                sccs.push(scc);
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
function detectOrphans(nodes, edges, rootId) {
    const hasIncoming = new Set();
    edges.forEach(e => hasIncoming.add(e.target));
    nodes.forEach(n => {
        n.isOrphan = !hasIncoming.has(n.id) && n.id !== rootId;
    });
}
//# sourceMappingURL=graphBuilder.js.map