import * as path from 'path';
import * as fs from 'fs';
import { ParserFactory } from './parsers';

const SUPPORTED_EXTENSIONS = ParserFactory.getSupportedExtensions();

export function resolveModule(module: string, currentFile: string, workspaceRoot: string): string | null {
    const currentExt = path.extname(currentFile);
    let targetPath = '';

    if (module.startsWith('.')) {
        // Relative import
        let currentDir = path.dirname(currentFile);
        const leadingDots = (module.match(/^\.+/) || [''])[0].length;
        const moduleName = module.substring(leadingDots);
        for (let i = 1; i < leadingDots; i++) currentDir = path.dirname(currentDir);
        if (moduleName) targetPath = path.join(currentDir, moduleName.replace(/\./g, '/'));
        else targetPath = currentDir;
    } else {
        // Absolute import - try src folder first
        targetPath = path.join(workspaceRoot, 'src', module.replace(/\./g, '/').replace(/::/g, '/'));
        
        // Check if exists with any extension
        const srcExists = SUPPORTED_EXTENSIONS.some(ext => 
            fs.existsSync(targetPath + ext) || fs.existsSync(path.join(targetPath, 'index' + ext))
        );
        
        if (!srcExists) {
            // Try from root
            targetPath = path.join(workspaceRoot, module.replace(/\./g, '/').replace(/::/g, '/'));
        }
    }

    // Build candidate list based on language context
    const candidates: string[] = [];
    
    // Python specific
    if (currentExt === '.py') {
        candidates.push(targetPath + '.py', path.join(targetPath, '__init__.py'));
    }
    
    // JavaScript/TypeScript specific
    if (['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.vue'].includes(currentExt)) {
        candidates.push(
            targetPath + '.ts',
            targetPath + '.tsx',
            targetPath + '.js',
            targetPath + '.jsx',
            targetPath + '.vue',
            path.join(targetPath, 'index.ts'),
            path.join(targetPath, 'index.js'),
            path.join(targetPath, 'index.vue')
        );
    }
    
    // Vue specific (also check JS/TS)
    if (currentExt === '.vue') {
        candidates.push(targetPath + '.vue');
    }
    
    // Rust specific
    if (currentExt === '.rs') {
        candidates.push(
            targetPath + '.rs',
            path.join(targetPath, 'mod.rs'),
            path.join(targetPath, 'lib.rs')
        );
    }
    
    // Generic fallback: try all supported extensions
    if (candidates.length === 0) {
        for (const ext of SUPPORTED_EXTENSIONS) {
            candidates.push(targetPath + ext);
        }
    }

    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) return candidate;
    }
    
    return null;
}
