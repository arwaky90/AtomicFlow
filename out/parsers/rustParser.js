"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RustParser = void 0;
class RustParser {
    parseImports(content) {
        const imports = [];
        const lines = content.split('\n');
        lines.forEach((line, index) => {
            const cleanLine = line.replace(/\/\/.*/, '').trim();
            if (!cleanLine)
                return;
            // use crate::module::submodule;
            const useMatch = /use\s+([a-zA-Z_][a-zA-Z0-9_:]*);/.exec(cleanLine);
            if (useMatch) {
                const module = useMatch[1];
                imports.push({
                    module: module.replace(/::/g, '/'), // Normalize to path-like
                    isExternal: !module.startsWith('crate::') && !module.startsWith('self::') && !module.startsWith('super::'),
                    line: index + 1
                });
                return;
            }
            // mod module_name;
            const modMatch = /^mod\s+([a-zA-Z_][a-zA-Z0-9_]*);/.exec(cleanLine);
            if (modMatch) {
                imports.push({
                    module: modMatch[1],
                    isExternal: false,
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
exports.RustParser = RustParser;
//# sourceMappingURL=rustParser.js.map