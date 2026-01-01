# ⚛️ Atomic Flow - User Guide

**Versi:** 1.0.2 "Atomic Flow Edition"
**Penulis:** Raka Arwaky
**Tujuan:** Revolusi Node-based Code Editing untuk arsitektur software.

**Atomic Flow** adalah evolusi berikutnya dalam pemrograman. Tinggalkan cara lama mengedit teks linear. Atomic Flow menghadirkan antarmuka **Node-based Code Editing** yang memungkinkan Anda memanipulasi arsitektur software secara visual, logis, dan intuitif.

---

## 📋 Daftar Isi

1. [Instalasi](#-instalasi)
2. [Mulai Cepat](#-mulai-cepat)
3. [Fitur Utama](#-fitur-utama)
4. [Komponen UI](#-komponen-ui)
5. [Interaksi Grafik](#-interaksi-grafik)
6. [Konfigurasi Lanjutan](#-konfigurasi-lanjutan)
7. [Pemecahan Masalah](#-pemecahan-masalah)
8. [Tanya Jawab (FAQ)](#-tanya-jawab-faq)

---

## 📦 Instalasi

### Langkah 1: Install Extension

```bash
# Dari file VSIX
antigravity --install-extension python-live-0.3.0-FINAL.vsix
```

### Langkah 2: Reload VS Code

- Tekan `Ctrl+Shift+P` (Linux/Windows) atau `Cmd+Shift+P` (Mac)
- Ketik: "Developer: Reload Window"
- Tekan Enter

### Langkah 3: Verifikasi Instalasi

1. Buka file `.py` apa saja di project Anda
2. Cari panel **"Python-Live"** di bagian bawah VS Code
3. Anda seharusnya melihat grafik ketergantungan muncul secara otomatis

---

## 🚀 Mulai Cepat

### Penggunaan Dasar

1. **Buka file Python**
   - Navigasi ke file `.py` mana saja (contoh: `src/Domain/core/engine.py`)
   - Klik untuk membukanya

2. **Lihat Grafik**
   - Panel grafik muncul otomatis di bagian bawah
   - Menampilkan semua import/ketergantungan dari file tersebut

3. **Eksplorasi Ketergantungan**
   - **Zoom**: Scroll roda mouse
   - **Geser (Pan)**: Klik + tahan & geser, atau klik tengah + geser
   - **Klik node**: Membuka file tersebut
   - **Alt+Klik node**: Sorot analisis dampak (impact analysis)

---

## ✨ Fitur Utama

### 1. **Deteksi Circular Dependency** 🔴

**Fungsinya:**  
Mendeteksi file yang saling meng-import satu sama lain dalam lingkaran (A→B→C→A).

**Indikator Visual:**
- **Node merah berdenyut** dengan border animasi
- **Tooltip menampilkan:** "⚠️ CYCLIC!"

**Kenapa penting:**  
Circular dependency melanggar Clean Architecture dan membuat kode sulit dites serta di-maintain.

**Contoh:**
```
engine.py → animator.py → engine.py  ❌ CYCLIC!
```

**Cara memperbaiki:**
1. Ekstrak logika yang sama ke modul baru
2. Gunakan Dependency Injection
3. Terapkan prinsip Dependency Inversion

---

### 2. **Deteksi Pelanggaran Arsitektur** ⚡

**Fungsinya:**  
Mengecek apakah import Anda melanggar aturan arsitektur hexagonal (contoh: Domain meng-import Infrastructure).

**Indikator Visual:**
- **Garis putus-putus merah**
- Tooltip pada garis menampilkan tipe pelanggaran

**Aturan Bawaan:**
```json
{
  "Domain Independence": {
    "forbidden": "Domain → Infrastructure/Adapters"
  },
  "No Reverse Dependencies": {
    "forbidden": "Infrastructure → Application"
  }
}
```

**Konfigurasi:**  
Buat file `.python-live-rules.json` di root workspace:

```json
[
  {
    "name": "Kemandirian Domain",
    "description": "Layer Domain tidak boleh import dari Infrastructure/Adapters",
    "forbidden": {
      "from": ".*/(Domain|domain)/.*",
      "to": ".*/([Aa]dapters?|[Ii]nfrastructure)/.*"
    }
  }
]
```

---

### 3. **Deteksi File Yatim (Orphan)** 👻

**Fungsinya:**  
Menemukan file yang tidak memiliki ketergantungan masuk (tidak ada yang meng-import file ini).

**Indikator Visual:**
- **Node abu-abu semi-transparan**
- Tooltip menampilkan: "👻 Orphan"

**Kenapa penting:**  
File orphan mungkin adalah:
- Kode mati (dead code) yang bisa dihapus
- Titik masuk (seperti `main.py`) - ini tidak masalah
- Utilitas yang terlupakan

---

### 4. **Heatmap Komponen Dewa (God Component)** 🔥

**Fungsinya:**  
Memberi kode warna pada file berdasarkan jumlah baris kode untuk mendeteksi "God Objects" (file yang melakukan terlalu banyak hal).

**Skala Warna:**
- 🟢 **Hijau** (< 200 baris): Sehat
- 🟡 **Kuning** (200-300 baris): Hati-hati
- 🟠 **Oranye** (300-500 baris): Peringatan
- 🔴 **Merah** (> 500 baris): God Component!

**Tooltip menampilkan:**  
"Lines: 489" (contoh: untuk `render_manager_module.py`)

**Kenapa penting:**  
File besar melanggar Single Responsibility Principle dan sulit di-maintain.

**Cara memperbaiki:**
1. Pecah class menjadi file terpisah
2. Pisahkan berdasarkan tanggung jawab
3. Gunakan komposisi daripada pewarisan (inheritance)

---

### 5. **Deteksi Library Eksternal** 📦

**Fungsinya:**  
Mendaftar library pihak ketiga yang di-import oleh setiap file (pandas, numpy, dll).

**Indikator Visual:**  
Tooltip menampilkan: "📦 External: pandas, numpy"

**Kenapa penting:**
- Melacak ketergantungan
- Identifikasi coupling berat ke library luar
- Berguna untuk rencana migrasi

---

### 6. **Kontrol Kedalaman (Depth)** 🎚️

**Fungsinya:**  
Mengganti mode antara:
- **Direct Only** (depth=1): Hanya import langsung
- **Recursive** (depth=2+): Import dari import (berantai)

**Cara pakai:**  
Klik tombol **"Direct Only"** atau **"Recursive"** di header.

**Contoh:**
```
Direct Only:  engine.py → animator.py
Recursive:    engine.py → animator.py → bezier_solver.py
```

---

### 7. **Cari & Filter** 🔍

**Fungsinya:**  
Meredupkan node yang tidak cocok dengan kata kunci pencarian Anda.

**Cara pakai:**
1. Ketik di kotak pencarian (contoh: "render")
2. Node yang cocok tetap terang
3. Sisanya menjadi transparan
4. Kosongkan pencarian untuk reset

---

### 8. **Analisis Dampak** 💥

**Fungsinya:**  
Menampilkan file mana saja yang terdampak jika Anda memodifikasi file tertentu.

**Cara pakai:**
1. **Alt+Klik** pada node mana saja
2. Semua file yang bergantung padanya (langsung atau tidak langsung) akan tetap terang
3. Sisanya meredup
4. Efek reset otomatis setelah 3 detik

**Kegunaan:**  
Sebelum refactor `entity.py`, cek dulu apa yang akan rusak!

---

### 9. **Mode Fokus** 🎯

**Fungsinya:**  
Hanya menampilkan node tersebut dan tetangganya (1 lompatan).

**Cara pakai:**
1. **Klik Kanan** pada node mana saja
2. Grafik hanya menampilkan file tersebut + import/importer-nya
3. Klik di tempat kosong untuk reset

---

### 10. **Ekspor & Berbagi** 📸

**Ekspor ke PNG:**
- Klik tombol **"📸 Export"**
- Menyimpan ke folder Downloads
- Nama file: `python-live-graph-[timestamp].png`

**Salin ke Clipboard:**
- Klik tombol **"📋 Copy"**
- Tempel (Paste) ke Slack, Notion, dll.

---

## 🎨 Komponen UI

### Header
```
┌────────────────────────────────────────────────┐
│ 🐍 engine.py              28 nodes · 85 links │
│ [Direct Only] [Search...] [📸 Export] [📋 Copy]│
└────────────────────────────────────────────────┘
```

- **Title**: Nama file saat ini
- **Stats**: Jumlah node dan edge (garis)
- **Depth Toggle**: Ganti mode direct/recursive
- **Search**: Filter node
- **Export/Copy**: Simpan grafik

### Status Bar (Bawah)
```
Graph updated • Showing 28 files • 0 violations • 1 cyclic
```

---

## 🖱️ Interaksi Grafik

### Kontrol Mouse

| Aksi | Hasil |
|--------|--------|
| **Klik node** | Buka file di editor |
| **Alt+Klik node** | Analisis dampak (highlight dependents) |
| **Klik Kanan node** | Mode fokus (hanya tampilkan tetangga) |
| **Geser (Drag) node** | Reposisi manual (fisika dinonaktifkan) |
| **Scroll Roda** | Zoom in/out |
| **Klik + Geser** | Geser (Pan) grafik |
| **Klik Tengah + Geser** | Geser (Pan) grafik (alternatif) |

### Warna Node

| Warna | Arti |
|-------|---------|
| 🔴 Merah | File Root ATAU Circular dependency |
| 🔴 Merah (berdenyut) | Circular dependency |
| 🔴 Merah (500+ baris) | God Component |
| 🟠 Oranye (300-500) | Ukuran Peringatan |
| 🟡 Kuning (200-300) | Ukuran Hati-hati |
| 🟢 Hijau (< 200) | Ukuran Sehat |
| ⚫ Abu-abu (transparan) | File Orphan (Yatim) |
| 🔵 Biru | Default |

### Gaya Garis (Edge)

| Gaya | Arti |
|-------|---------|
| Garis abu-abu solid | Import normal |
| **Garis merah putus-putus** | Pelanggaran arsitektur |
| **Garis highlight** | Bagian dari analisis dampak |

---

## ⚙️ Konfigurasi Lanjutan

### Aturan Arsitektur Kustom

Buat file `.python-live-rules.json`:

```json
[
  {
    "name": "Kemurnian Layer Domain",
    "description": "Domain tidak boleh import dari Infrastructure",
    "forbidden": {
      "from": ".*/Domain/.*",
      "to": ".*/Infrastructure/.*"
    }
  },
  {
    "name": "Kemandirian Use Case",
    "description": "Use case tidak boleh import dari use case lain",
    "forbidden": {
      "from": ".*/use_cases/.*",
      "to": ".*/use_cases/.*"
    }
  }
]
```

**Pola Regex:**
- `.*/Domain/.*` = Semua file di folder `Domain/`
- `.*adapters.*` = Semua file yang mengandung kata "adapters"
- `.*/(Domain|Core)/.*` = File di Domain ATAU Core

---

### Konfigurasi Pemeriksa Ejaan (Spell Checker)

Sudah dikonfigurasi di `.vscode/cspell.json`:

```json
{
  "words": [
    "Tarjan's", "modelcontextprotocol", "cupy", "ffmpeg"
  ],
  "ignorePaths": [
    "**/.gemini/antigravity/brain/**"
  ]
}
```

Tambahkan istilah teknis Anda ke array `words`.

---

## 🐛 Pemecahan Masalah

### Masalah: "Loading... 0 nodes · 0 links"

**Penyebab:**
1. Tidak ada file Python yang terbuka
2. File tidak memiliki import
3. Extension belum aktif

**Solusi:**
1. Buka file `.py` apa saja
2. Cek Developer Console untuk error:
   - `Help → Toggle Developer Tools → Console`
3. Reload window: `Ctrl+Shift+P → Reload Window`

---

### Masalah: "Grafik tidak update saat ganti file"

**Solusi:**
- Klik file tersebut lagi
- Atau reload window

---

### Masalah: "Tidak bisa melihat beberapa dependensi"

**Penyebab:**
1. Depth diset ke "Direct Only"
2. Import gagal (ada syntax error di file target)

**Solusi:**
1. Klik tombol **"Recursive"**
2. Cek console untuk error parsing

---

### Masalah: "Extension membuat VS Code crash"

**Solusi:**
1. Cek ukuran file - project sangat besar (1000+ file) mungkin lambat
2. Naikkan limit depth secara bertahap
3. Laporkan isu dengan:
   ```bash
   cd Graph/PythonLive
   node debug.js > debug-log.txt
   ```

---

## ❓ Tanya Jawab (FAQ)

### Q: Apakah ini bekerja dengan virtual environment?

**A:** Ya! Python-Live hanya menganalisis statement import, bukan runtime. Ini bekerja dengan struktur project Python apa saja.

---

### Q: Bisakah saya pakai untuk project Django/Flask?

**A:** Tentu saja! Sangat berguna untuk framework besar untuk memvisualisasikan ketergantungan aplikasi.

---

### Q: Bagaimana cara mengabaikan file test?

**A:** Saat ini belum didukung. Akan hadir di v0.4.0. Untuk sekarang, jangan buka file test sebagai root.

---

### Q: Apa bedanya dengan tool grafik lainnya?

**A:** Python-Live fokus pada **arsitektur**:
- Mendeteksi pelanggaran arsitektur
- Aturan arsitektur hexagonal
- Real-time (tidak perlu CLI)
- Terintegrasi di VS Code

---

### Q: Bisakah saya kustomisasi warna node?

**A:** Belum. Warna di-hardcode untuk semantik arsitektur. Tema kustom direncanakan untuk v0.5.0.

---

### Q: Bagaimana cara ekspor data grafik?

**A:** Gunakan fitur MCP Server:
1. Jalankan: `cd Graph/PythonLive && npm run mcp`
2. Di terminal lain: Query via MCP client
3. Ekspor struktur grafik JSON

---

## 📚 Praktik Terbaik

### 1. **Mulai dari Kecil**
- Mulai dengan file entry point (`main.py`, `app.py`)
- Gunakan mode "Direct Only" dulu
- Naikkan depth secara bertahap

### 2. **Pengecekan Rutin**
- Review grafik setiap minggu
- Perbaiki circular dependency SEGERA
- Jaga file di bawah 300 baris

### 3. **Penggunaan Tim**
- Ekspor grafik untuk code review
- Tunjukkan pelanggaran di PR
- Gunakan sebagai alat onboarding

### 4. **Panduan Refactoring**
1. Identifikasi Komponen Dewa (node merah)
2. Cek siklus (cycle)
3. Perbaiki pelanggaran arsitektur
4. Ekspor ulang grafik untuk melacak progress

---

## 🎯 Contoh Penggunaan

### 1. **Code Review**
- Ekspor grafik sebelum PR
- Tunjukkan dampak dependensi
- Verifikasi tidak ada pelanggaran baru

### 2. **Onboarding**
- Dev baru paham struktur
- Peta project visual
- Lihat dependensi nyata, bukan dokumentasi

### 3. **Refactoring**
- Identifikasi God Objects
- Temukan kode yatim (orphan) untuk dihapus
- Rencanakan strategi ekstraksi

### 4. **Audit Arsitektur**
- Cek kepatuhan hexagonal
- Deteksi pelanggaran layer
- Ukur kesehatan kode

---

## 🔗 Referensi

- **GitHub Issues**: Lapor bug
- **Contoh Project**: folder `examples/`
- **Video Tutorial**: Segera hadir
- **Dokumentasi MCP Server**: komentar di `src/mcpServer.ts`

---

## 📝 Changelog

### v0.3.0 (2026-01-01)
- ✅ Deteksi circular dependency (Algoritma Tarjan)
- ✅ Linter pelanggaran arsitektur
- ✅ Heatmap Komponen Dewa
- ✅ Pelacakan library eksternal
- ✅ Cari & filter
- ✅ Analisis dampak (Alt+Klik)
- ✅ Mode fokus (Klik Kanan)
- ✅ Ekspor ke PNG / Salin ke clipboard
- ✅ Integrasi MCP Server
- ✅ Toggle kedalaman (Direct/Recursive)
- ✅ Deteksi Orphan

### v0.2.1
- Zoom & pan
- Klik-untuk-buka file
- Ukuran node berdasarkan jumlah import

### v0.2.0
- Fork khusus Python awal
- Visualisasi D3.js
- Dukungan import multi-line

---

## 🙏 Kredit

Dibangun dengan:
- **D3.js** v7 - Grafik interaktif
- **TypeScript** - Backend type-safe
- **VS Code API** - Framework extension
- **Algoritma Tarjan** - Deteksi SCC

---

## 📧 Dukungan

Masalah? Pertanyaan?  
Buka GitHub issue atau email maintainer.

---

**Selamat Berarsitektur! 🏗️**
