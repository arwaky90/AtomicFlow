import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import * as vscode from 'vscode';

export class AtomicRustAdapter {
    constructor(private readonly _extensionUri: vscode.Uri) {}

    public invokeRustEngine(rootPath: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let binaryPath = '';
            
            const releasePath = path.join(this._extensionUri.fsPath, 'atomic-flow-engine', 'target', 'release', 'atomic-flow-engine');
            const devPath = path.join(this._extensionUri.fsPath, 'atomic-flow-engine', 'target', 'debug', 'atomic-flow-engine');
            
            if (fs.existsSync(releasePath)) {
                binaryPath = releasePath;
            } else if (fs.existsSync(devPath)) {
                binaryPath = devPath;
            } else {
                 reject("AtomicFlow Engine binary not found!");
                 return;
            }

            console.log(`Running Rust Engine: ${binaryPath} --path ${rootPath} --deps`);
            const child = spawn(binaryPath, ['--path', rootPath, '--deps']);
            
            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => stdout += data.toString());
            child.stderr.on('data', (data) => stderr += data.toString());

            child.on('close', (code) => {
                if (code !== 0) {
                    console.error('Rust engine stderr:', stderr);
                    reject(new Error(`Process exited with code ${code}`));
                } else {
                    try {
                        const json = JSON.parse(stdout);
                        resolve(json);
                    } catch (e) {
                         console.error('Failed to parse Rust JSON:', stdout);
                        reject(e);
                    }
                }
            });
        });
    }
}
