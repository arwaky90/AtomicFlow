import * as fs from 'fs';
import * as path from 'path';

/** Source folder info for dashboard selection */
export interface SourceFolder {
    path: string;
    name: string;
    relativePath: string;
    fileCount: number;
}

export class AtomicScannerService {
    /**
     * Scan workspace for all source folders (src, app, lib, etc.)
     */
    public async scanSourceFolders(workspaceRoot: string): Promise<SourceFolder[]> {
        const folders: SourceFolder[] = [];
        const targetNames = ['src', 'app', 'lib', 'source', 'packages'];
        
        const scanDir = (dir: string, depth: number = 0) => {
            if (depth > 3) return; // Max depth to avoid deep scanning
            
            try {
                const entries = fs.readdirSync(dir, { withFileTypes: true });
                for (const entry of entries) {
                    if (!entry.isDirectory()) continue;
                    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
                    
                    const fullPath = path.join(dir, entry.name);
                    const relativePath = path.relative(workspaceRoot, fullPath);
                    
                    if (targetNames.includes(entry.name.toLowerCase())) {
                        const fileCount = this.countFiles(fullPath);
                        folders.push({
                            path: fullPath,
                            name: entry.name,
                            relativePath,
                            fileCount
                        });
                    }
                    
                    scanDir(fullPath, depth + 1);
                }
            } catch (err) {
                // Ignore permission errors
            }
        };
        
        scanDir(workspaceRoot);
        return folders;
    }

    /** Count files in a directory (non-recursive) */
    private countFiles(dir: string): number {
        try {
            return fs.readdirSync(dir).filter(f => {
                const full = path.join(dir, f);
                return fs.statSync(full).isFile();
            }).length;
        } catch {
            return 0;
        }
    }

    /**
     * Auto-detect source root folder.
     */
    public detectSourceRoot(workspaceRoot: string): string {
        const candidates = ['src', 'app', 'lib', 'source', 'packages'];
        for (const dir of candidates) {
            const candidate = path.join(workspaceRoot, dir);
            if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
                return candidate;
            }
        }
        return workspaceRoot;
    }
}
