# Atomic Flow ⚛️

**The Future of Coding. Move beyond text editors with a powerful Node-based Visual Interface for your architecture.**

[![Version](https://img.shields.io/badge/version-2.0.2-blue.svg)](https://open-vsx.org/extension/rakaarwaky/atomic-flow)
[![License](https://img.shields.io/badge/license-GPL--3.0-green.svg)](LICENSE)
[![Open VSX](https://img.shields.io/badge/Open%20VSX-Published-blueviolet)](https://open-vsx.org/extension/rakaarwaky/atomic-flow)

## 🚀 Features

- **Multi-Language Support**: Python, JavaScript/TypeScript, Vue, and Rust
- **Circular Dependency Detection**: Tarjan's algorithm highlights cycles in red
- **Architecture Linting**: Define forbidden import rules (e.g., Domain → Infrastructure)
- **God Component Heatmap**: Color-coded file size visualization (green → red)
- **Impact Analysis**: Alt+Click to see what breaks if you change a file
- **Real-time Visualization**: D3.js powered interactive graph
- **Export & Share**: PNG export and clipboard copy

## 📦 Installation

### From Open VSX (Recommended)
1. Open VS Code / VSCodium
2. Go to Extensions (`Ctrl+Shift+X`)
3. Search for "Atomic Flow"
4. Click Install

### From VSIX
```bash
code --install-extension atomic-flow-2.0.2.vsix
```

## 🎮 Usage

1. Open any supported file (`.py`, `.js`, `.ts`, `.vue`, `.rs`)
2. The dependency graph appears automatically in the bottom panel
3. Interact with the graph:
   - **Click node**: Open file
   - **Alt+Click**: Impact analysis
   - **Right-click**: Focus mode
   - **Scroll**: Zoom
   - **Drag**: Pan

## 🎨 Visual Legend

| Color | Meaning |
|-------|---------|
| 🔴 Red | Root file OR Circular dependency |
| 🟠 Orange | Warning (300-500 lines) |
| 🟡 Yellow | Caution (200-300 lines) |
| 🟢 Green | Healthy (<200 lines) |
| ⚫ Gray | Orphan file |

## ⚙️ Configuration

Create `.atomic-flow-rules.json` in your workspace root:

```json
[
  {
    "name": "Domain Independence",
    "description": "Domain layer must not import from Infrastructure",
    "forbidden": {
      "from": ".*/Domain/.*",
      "to": ".*/Infrastructure/.*"
    }
  }
]
```

## 📋 Supported Languages

| Language | Extensions | Import Patterns |
|----------|------------|-----------------|
| Python | `.py` | `import x`, `from x import y` |
| JavaScript | `.js`, `.jsx`, `.mjs`, `.cjs` | `import`, `require()` |
| TypeScript | `.ts`, `.tsx` | `import`, `require()` |
| Vue | `.vue` | Extracts from `<script>` |
| Rust | `.rs` | `use crate::`, `mod x;` |

## ☕ Support

If you find Atomic Flow helpful, consider buying me a coffee!

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/rakaarwaky)

## 🔗 Links

- [Open VSX](https://open-vsx.org/extension/rakaarwaky/atomic-flow)
- [GitHub Repository](https://github.com/arwaky90/AtomicFlow)
- [Report Issues](https://github.com/arwaky90/AtomicFlow/issues)
- [Buy Me a Coffee](https://buymeacoffee.com/rakaarwaky)

## 📄 License

GPL-3.0 - See [LICENSE](LICENSE) for details.

---

**Made with ⚛️ by Raka Arwaky**
