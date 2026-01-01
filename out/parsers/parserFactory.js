"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParserFactory = void 0;
const pythonParser_1 = require("./pythonParser");
const javascriptParser_1 = require("./javascriptParser");
const vueParser_1 = require("./vueParser");
const rustParser_1 = require("./rustParser");
class ParserFactory {
    static getParser(extension) {
        const ext = extension.toLowerCase();
        switch (ext) {
            case '.py':
                return this.pythonParser;
            case '.js':
            case '.jsx':
            case '.ts':
            case '.tsx':
            case '.mjs':
            case '.cjs':
                return this.jsParser;
            case '.vue':
                return this.vueParser;
            case '.rs':
                return this.rustParser;
            default:
                return null;
        }
    }
    static getSupportedExtensions() {
        return ['.py', '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.vue', '.rs'];
    }
}
exports.ParserFactory = ParserFactory;
ParserFactory.pythonParser = new pythonParser_1.PythonParser();
ParserFactory.jsParser = new javascriptParser_1.JavascriptParser();
ParserFactory.vueParser = new vueParser_1.VueParser();
ParserFactory.rustParser = new rustParser_1.RustParser();
//# sourceMappingURL=parserFactory.js.map