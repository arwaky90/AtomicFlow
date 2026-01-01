"use strict";
// MCP Server for Python-Live
// Exposes graph data and analysis to AI agents via Model Context Protocol
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMcpServer = createMcpServer;
exports.startMcpServer = startMcpServer;
exports.updateGraphCache = updateGraphCache;
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
let cachedGraph = null;
function createMcpServer(getLatestGraph) {
    const server = new index_js_1.Server({
        name: 'python-live-server',
        version: '1.0.0',
    }, {
        capabilities: {
            resources: {},
            tools: {},
        },
    });
    // Resource: python-live://graph
    server.setRequestHandler(types_js_1.ListResourcesRequestSchema, async () => {
        return {
            resources: [
                {
                    uri: 'python-live://graph/json',
                    name: 'Python Dependency Graph',
                    description: 'Full dependency graph with nodes and edges',
                    mimeType: 'application/json',
                },
            ],
        };
    });
    server.setRequestHandler(types_js_1.ReadResourceRequestSchema, async (request) => {
        const uri = request.params.uri;
        if (uri === 'python-live://graph/json') {
            const graph = getLatestGraph();
            return {
                contents: [
                    {
                        uri,
                        mimeType: 'application/json',
                        text: JSON.stringify(graph, null, 2),
                    },
                ],
            };
        }
        throw new Error(`Unknown resource: ${uri}`);
    });
    // Tool: analyze_architecture
    server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
        return {
            tools: [
                {
                    name: 'analyze_architecture',
                    description: 'Analyze Python project architecture for issues',
                    inputSchema: {
                        type: 'object',
                        properties: {},
                    },
                },
            ],
        };
    });
    server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
        if (request.params.name === 'analyze_architecture') {
            const graph = getLatestGraph();
            const cyclicNodes = graph.nodes.filter(n => n.isCyclic);
            const orphanNodes = graph.nodes.filter(n => n.isOrphan);
            const godComponents = graph.nodes.filter(n => n.lines && n.lines > 500);
            const violations = graph.edges.filter(e => e.violation);
            let report = `# Architecture Analysis Report\n\n`;
            report += `**Total Nodes:** ${graph.nodes.length}\n`;
            report += `**Total Edges:** ${graph.edges.length}\n\n`;
            if (cyclicNodes.length > 0) {
                report += `## 🔴 Circular Dependencies (${cyclicNodes.length})\n`;
                cyclicNodes.forEach(n => {
                    report += `- \`${n.id}\` (${n.imports} imports)\n`;
                });
                report += `\n`;
            }
            if (violations.length > 0) {
                report += `## 🚫 Architecture Violations (${violations.length})\n`;
                violations.forEach(e => {
                    report += `- \`${e.source}\` → \`${e.target}\` (${e.violation})\n`;
                });
                report += `\n`;
            }
            if (godComponents.length > 0) {
                report += `## 🔥 God Components (${godComponents.length})\n`;
                godComponents.forEach(n => {
                    report += `- \`${n.id}\` (${n.lines} lines)\n`;
                });
                report += `\n`;
            }
            if (orphanNodes.length > 0) {
                report += `## 👻 Orphan Files (${orphanNodes.length})\n`;
                orphanNodes.forEach(n => {
                    report += `- \`${n.id}\`\n`;
                });
                report += `\n`;
            }
            if (cyclicNodes.length === 0 && violations.length === 0 && godComponents.length === 0) {
                report += `✅ **All checks passed!** Architecture is clean.\n`;
            }
            return {
                content: [{ type: 'text', text: report }],
            };
        }
        throw new Error('Unknown tool');
    });
    return server;
}
// CLI entry point for MCP
async function startMcpServer() {
    const server = createMcpServer(() => {
        // Return cached graph or empty
        return cachedGraph || { nodes: [], edges: [] };
    });
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error('Python-Live MCP Server started');
}
// Export function for VS Code extension to update cache
function updateGraphCache(graph) {
    cachedGraph = {
        ...graph,
        timestamp: Date.now(),
    };
}
//# sourceMappingURL=mcpServer.js.map