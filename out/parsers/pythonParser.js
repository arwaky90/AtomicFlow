"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PythonParser = void 0;
class PythonParser {
    parseImports(content) {
        const imports = [];
        const lines = content.split('\n');
        lines.forEach((line, index) => {
            const cleanLine = line.replace(/#.*/, '').trim();
            if (!cleanLine)
                return;
            // from x import y
            const fromMatch = /from\s+([.\w]+)\s+import/.exec(cleanLine);
            if (fromMatch) {
                imports.push({
                    module: fromMatch[1],
                    isExternal: !fromMatch[1].startsWith('.'),
                    line: index + 1
                });
                return;
            }
            // import x
            const importMatch = /^import\s+([\w.]+)/.exec(cleanLine);
            if (importMatch) {
                imports.push({
                    module: importMatch[1],
                    isExternal: true, // "import x" is usually external or absolute
                    line: index + 1
                });
            }
        });
        return imports;
    }
    getLineCount(content) {
        return content.split('\n').length;
    }
}
exports.PythonParser = PythonParser;
//# sourceMappingURL=pythonParser.js.map