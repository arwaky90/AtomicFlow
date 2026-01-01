import { IParser } from './parser.interface';
import { PythonParser } from './pythonParser';
import { JavascriptParser } from './javascriptParser';
import { VueParser } from './vueParser';
import { RustParser } from './rustParser';

export class ParserFactory {
    private static pythonParser = new PythonParser();
    private static jsParser = new JavascriptParser();
    private static vueParser = new VueParser();
    private static rustParser = new RustParser();

    static getParser(extension: string): IParser | null {
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

    static getSupportedExtensions(): string[] {
        return ['.py', '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.vue', '.rs'];
    }
}
