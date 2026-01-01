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
const parsers_1 = require("./parsers");
const resolver_1 = require("./resolver");
const archLinter_1 = require("./archLinter");
function buildGraph(filePath, workspaceRoot, maxDepth = 2) {
    const nodes = [];
    const edges = [];
    const visited = new Set();
    const archRules = (0, archLinter_1.loadArchRules)(workspaceRoot);
    const addNode = (p, impCount, d, externalLibs = []) => {
        const rel = path.relative(workspaceRoot, p);
        const ext = path.extname(p);
        if (!nodes.some(n => n.id === rel)) {
            let lineCount = 0;
            try {
                const content = fs.readFileSync(p, 'utf-8');
                const parser = parsers_1.ParserFactory.getParser(ext);
                lineCount = parser ? parser.getLineCount(content) : content.split('\n').length;
            }
            catch (e) { }
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
    function process(fp, depth) {
        try {
            fp = fs.realpathSync(fp);
        }
        catch (e) { }
        const ext = path.extname(fp);
        const parser = parsers_1.ParserFactory.getParser(ext);
        if (!parser)
            return; // Unsupported file type
        let importDetails = [];
        try {
            const content = fs.readFileSync(fp, 'utf-8');
            importDetails = parser.parseImports(content);
        }
        catch (e) { }
        const externalLibs = importDetails.filter(i => i.isExternal).map(i => i.module);
        // Python-specific: skip __init__.py files
        const isInit = path.basename(fp) === '__init__.py';
        let sourceRel = '';
        if (!isInit || fp === filePath) {
            sourceRel = addNode(fp, importDetails.length, depth, externalLibs);
        }
        if (depth >= maxDepth || visited.has(fp))
            return;
        visited.add(fp);
        if (isInit && fp !== filePath)
            return;
        for (const impInfo of importDetails) {
            const imp = impInfo.module;
            const target = (0, resolver_1.resolveModule)(imp, fp, workspaceRoot);
            if (target) {
                try {
                    const targetReal = fs.realpathSync(target);
                    const targetExt = path.extname(targetReal);
                    const targetParser = parsers_1.ParserFactory.getParser(targetExt);
                    // Python-specific: handle __init__.py
                    if (path.basename(targetReal) === '__init__.py' && targetParser) {
                        try {
                            const initContent = fs.readFileSync(targetReal, 'utf-8');
                            const initImports = targetParser.parseImports(initContent);
                            for (const subImpInfo of initImports) {
                                const subTarget = (0, resolver_1.resolveModule)(subImpInfo.module, targetReal, workspaceRoot);
                                if (subTarget) {
                                    try {
                                        const subTargetReal = fs.realpathSync(subTarget);
                                        if (path.basename(subTargetReal) === '__init__.py')
                                            continue;
                                        const subExt = path.extname(subTargetReal);
                                        const subParser = parsers_1.ParserFactory.getParser(subExt);
                                        let subImpCount = 0;
                                        if (subParser) {
                                            try {
                                                const subContent = fs.readFileSync(subTargetReal, 'utf-8');
                                                subImpCount = subParser.parseImports(subContent).length;
                                            }
                                            catch (e) { }
                                        }
                                        const subTargetRel = addNode(subTargetReal, subImpCount, depth + 1);
                                        if (sourceRel !== subTargetRel) {
                                            const violation = (0, archLinter_1.validateEdge)(sourceRel, subTargetRel, archRules);
                                            edges.push({
                                                source: sourceRel,
                                                target: subTargetRel,
                                                module: `${imp} -> ${subImpInfo.module}`,
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
                        if (targetParser) {
                            try {
                                const targetContent = fs.readFileSync(targetReal, 'utf-8');
                                targetImpCount = targetParser.parseImports(targetContent).length;
                            }
                            catch (e) { }
                        }
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