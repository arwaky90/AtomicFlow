import * as path from 'path';
import * as fs from 'fs';

export function resolveModule(module: string, currentFile: string, workspaceRoot: string): string | null {
    let targetPath = '';
    if (module.startsWith('.')) {
        let currentDir = path.dirname(currentFile);
        const leadingDots = (module.match(/^\.+/) || [''])[0].length;
        const moduleName = module.substring(leadingDots);
        for (let i = 1; i < leadingDots; i++) currentDir = path.dirname(currentDir);
        if (moduleName) targetPath = path.join(currentDir, moduleName.replace(/\./g, '/'));
        else targetPath = currentDir;
    } else {
        targetPath = path.join(workspaceRoot, 'src', module.replace(/\./g, '/'));
        if (!fs.existsSync(targetPath + '.py') && !fs.existsSync(path.join(targetPath, '__init__.py'))) {
           targetPath = path.join(workspaceRoot, module.replace(/\./g, '/')); 
        }
    }
    const candidates = [targetPath + '.py', path.join(targetPath, '__init__.py')];
    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) return candidate;
    }
    return null;
}
