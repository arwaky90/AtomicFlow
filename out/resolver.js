"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveModule = resolveModule;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const parsers_1 = require("./parsers");
const SUPPORTED_EXTENSIONS = parsers_1.ParserFactory.getSupportedExtensions();
function resolveModule(module, currentFile, workspaceRoot) {
    const currentExt = path.extname(currentFile);
    let targetPath = '';
    if (module.startsWith('.')) {
        // Relative import
        let currentDir = path.dirname(currentFile);
        const leadingDots = (module.match(/^\.+/) || [''])[0].length;
        const moduleName = module.substring(leadingDots);
        for (let i = 1; i < leadingDots; i++)
            currentDir = path.dirname(currentDir);
        if (moduleName)
            targetPath = path.join(currentDir, moduleName.replace(/\./g, '/'));
        else
            targetPath = currentDir;
    }
    else {
        // Absolute import - try src folder first
        targetPath = path.join(workspaceRoot, 'src', module.replace(/\./g, '/').replace(/::/g, '/'));
        // Check if exists with any extension
        const srcExists = SUPPORTED_EXTENSIONS.some(ext => fs.existsSync(targetPath + ext) || fs.existsSync(path.join(targetPath, 'index' + ext)));
        if (!srcExists) {
            // Try from root
            targetPath = path.join(workspaceRoot, module.replace(/\./g, '/').replace(/::/g, '/'));
        }
    }
    // Build candidate list based on language context
    const candidates = [];
    // Python specific
    if (currentExt === '.py') {
        candidates.push(targetPath + '.py', path.join(targetPath, '__init__.py'));
    }
    // JavaScript/TypeScript specific
    if (['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.vue'].includes(currentExt)) {
        candidates.push(targetPath + '.ts', targetPath + '.tsx', targetPath + '.js', targetPath + '.jsx', targetPath + '.vue', path.join(targetPath, 'index.ts'), path.join(targetPath, 'index.js'), path.join(targetPath, 'index.vue'));
    }
    // Vue specific (also check JS/TS)
    if (currentExt === '.vue') {
        candidates.push(targetPath + '.vue');
    }
    // Rust specific
    if (currentExt === '.rs') {
        candidates.push(targetPath + '.rs', path.join(targetPath, 'mod.rs'), path.join(targetPath, 'lib.rs'));
    }
    // Generic fallback: try all supported extensions
    if (candidates.length === 0) {
        for (const ext of SUPPORTED_EXTENSIONS) {
            candidates.push(targetPath + ext);
        }
    }
    for (const candidate of candidates) {
        if (fs.existsSync(candidate))
            return candidate;
    }
    return null;
}
//# sourceMappingURL=resolver.js.map