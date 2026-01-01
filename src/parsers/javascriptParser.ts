import { IParser, ImportInfo } from './parser.interface';

export class JavascriptParser implements IParser {
    parseImports(content: string): ImportInfo[] {
        const imports: ImportInfo[] = [];
        const lines = content.split('\n');

        lines.forEach((line, index) => {
            const cleanLine = line.replace(/\/\/.*/, '').trim(); // Remove comments
            if (!cleanLine) return;

            // ES6 Import: import ... from 'module'
            const es6Match = /import\s+.*?from\s+['"]([^'"]+)['"]/.exec(cleanLine);
            if (es6Match) {
                imports.push({
                    module: es6Match[1],
                    isExternal: !es6Match[1].startsWith('.'),
                    line: index + 1
                });
                return;
            }

            // CommonJS: require('module')
            const requireMatch = /require\(['"]([^'"]+)['"]\)/.exec(cleanLine);
            if (requireMatch) {
                imports.push({
                    module: requireMatch[1],
                    isExternal: !requireMatch[1].startsWith('.'),
                    line: index + 1
                });
                return;
            }

            // Dynamic Import: import('module')
            const dynamicMatch = /import\(['"]([^'"]+)['"]\)/.exec(cleanLine);
            if (dynamicMatch) {
                imports.push({
                    module: dynamicMatch[1],
                    isExternal: !dynamicMatch[1].startsWith('.'),
                    line: index + 1
                });
            }
        });

        return imports;
    }

    getLineCount(content: string): number {
        return content.split('\n').length;
    }
}
