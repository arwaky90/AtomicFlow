import * as fs from 'fs';

export interface ImportInfo {
    module: string;
    isExternal: boolean;
}

export function parseImports(content: string): string[] {
    const imports: string[] = [];
    const cleanContent = content.replace(/#.*/g, '');
    const fromRegex = /from\s+([.\w]+)\s+import/g;
    let match;
    while ((match = fromRegex.exec(cleanContent)) !== null) imports.push(match[1]);
    const importRegex = /^import\s+([\w.]+)/gm;
    while ((match = importRegex.exec(cleanContent)) !== null) imports.push(match[1]);
    return [...new Set(imports)];
}

export function parseImportsDetailed(content: string): ImportInfo[] {
    const imports: string[] = [];
    const cleanContent = content.replace(/#.*/g, '');
    const fromRegex = /from\s+([.\w]+)\s+import/g;
    let match;
    while ((match = fromRegex.exec(cleanContent)) !== null) imports.push(match[1]);
    const importRegex = /^import\s+([\w.]+)/gm;
    while ((match = importRegex.exec(cleanContent)) !== null) imports.push(match[1]);
    
    return [...new Set(imports)].map(module => ({
        module,
        isExternal: !module.startsWith('.')  // External if not relative
    }));
}

export function getLineCount(filePath: string): number {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        return content.split('\n').length;
    } catch (e) {
        return 0;
    }
}
