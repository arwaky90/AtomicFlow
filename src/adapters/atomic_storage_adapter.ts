import * as vscode from 'vscode';

export class AtomicStorageAdapter {
    private static readonly CACHE_KEY = 'atomicflow.selectedSourceRoot';

    constructor(private readonly _context: vscode.ExtensionContext) {}

    public getSourceRoot(): string | undefined {
        return this._context.globalState.get<string>(AtomicStorageAdapter.CACHE_KEY);
    }

    public async saveSourceRoot(sourcePath: string) {
        await this._context.globalState.update(AtomicStorageAdapter.CACHE_KEY, sourcePath);
    }

    public async clearCache() {
        await this._context.globalState.update(AtomicStorageAdapter.CACHE_KEY, undefined);
    }
}
