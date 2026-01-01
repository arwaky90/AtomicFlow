"use strict";
// Architecture Linter Configuration
// Define rules for your project's hexagonal architecture
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_ARCH_RULES = void 0;
exports.loadArchRules = loadArchRules;
exports.validateEdge = validateEdge;
// Default rules for Hexagonal Architecture
exports.DEFAULT_ARCH_RULES = [
    {
        name: "Domain Independence",
        description: "Domain layer cannot import from Infrastructure/Adapters",
        forbidden: {
            from: ".*/(Domain|domain)/.*",
            to: ".*/([Aa]dapters?|[Ii]nfrastructure)/.*"
        }
    },
    {
        name: "No Reverse Dependencies",
        description: "Infrastructure cannot import from Application layer",
        forbidden: {
            from: ".*/([Ii]nfrastructure|adapters/driven)/.*",
            to: ".*/([Aa]pplication|use[_-]?cases)/.*"
        }
    }
];
function loadArchRules(workspaceRoot) {
    // Try to load .python-live-rules.json from workspace root
    const fs = require('fs');
    const path = require('path');
    const configPath = path.join(workspaceRoot, '.python-live-rules.json');
    if (fs.existsSync(configPath)) {
        try {
            const content = fs.readFileSync(configPath, 'utf-8');
            const custom = JSON.parse(content);
            return custom;
        }
        catch (e) {
            console.error("Failed to load custom rules, using defaults", e);
        }
    }
    return exports.DEFAULT_ARCH_RULES;
}
function validateEdge(sourceId, targetId, rules) {
    for (const rule of rules) {
        const fromRegex = new RegExp(rule.forbidden.from);
        const toRegex = new RegExp(rule.forbidden.to);
        if (fromRegex.test(sourceId) && toRegex.test(targetId)) {
            return rule.name; // Return violation name
        }
    }
    return null; // No violation
}
//# sourceMappingURL=archLinter.js.map