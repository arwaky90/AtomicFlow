"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VueParser = void 0;
const javascriptParser_1 = require("./javascriptParser");
class VueParser {
    constructor() {
        this.jsParser = new javascriptParser_1.JavascriptParser();
    }
    parseImports(content) {
        let imports = [];
        // Extract script content
        const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/g;
        let match;
        while ((match = scriptRegex.exec(content)) !== null) {
            const scriptContent = match[1];
            // Calculate line offset based on where <script> tag starts
            const preScript = content.substring(0, match.index);
            const lineOffset = preScript.split('\n').length - 1;
            const scriptImports = this.jsParser.parseImports(scriptContent);
            // Adjust line numbers
            const adjustedImports = scriptImports.map(imp => ({
                ...imp,
                line: imp.line + lineOffset
            }));
            imports = imports.concat(adjustedImports);
        }
        return imports;
    }
    getLineCount(content) {
        return content.split('\n').length;
    }
}
exports.VueParser = VueParser;
//# sourceMappingURL=vueParser.js.map