// Architecture Linter Configuration
// Define rules for your project's hexagonal architecture

export interface ArchRule {
    name: string;
    description: string;
    forbidden: {
        from: string;      // Regex pattern for source path
        to: string;        // Regex pattern for target path
    };
}

// Default rules for Hexagonal Architecture
export const DEFAULT_ARCH_RULES: ArchRule[] = [
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

export function loadArchRules(workspaceRoot: string): ArchRule[] {
    // Try to load .python-live-rules.json from workspace root
    const fs = require('fs');
    const path = require('path');
    const configPath = path.join(workspaceRoot, '.python-live-rules.json');
    
    if (fs.existsSync(configPath)) {
        try {
            const content = fs.readFileSync(configPath, 'utf-8');
            const custom: ArchRule[] = JSON.parse(content);
            return custom;
        } catch (e) {
            console.error("Failed to load custom rules, using defaults", e);
        }
    }
    
    return DEFAULT_ARCH_RULES;
}

export function validateEdge(sourceId: string, targetId: string, rules: ArchRule[]): string | null {
    for (const rule of rules) {
        const fromRegex = new RegExp(rule.forbidden.from);
        const toRegex = new RegExp(rule.forbidden.to);
        
        if (fromRegex.test(sourceId) && toRegex.test(targetId)) {
            return rule.name;  // Return violation name
        }
    }
    return null;  // No violation
}
