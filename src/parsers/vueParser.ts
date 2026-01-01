import { IParser, ImportInfo } from './parser.interface';
import { JavascriptParser } from './javascriptParser';

export class VueParser implements IParser {
    private jsParser = new JavascriptParser();

    parseImports(content: string): ImportInfo[] {
        let imports: ImportInfo[] = [];
        
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

    getLineCount(content: string): number {
        return content.split('\n').length;
    }
}
