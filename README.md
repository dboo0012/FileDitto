<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/132.png" alt="Ditto"/>

# FileDitto

> Transform your files, Ditto-style.

Convert any files to your desired format. A ffmpeg-based media conversion tool, birthed from my resentment against ad-bloated online alternatives.

## Screenshots

<img width="1265" height="791" alt="image" src="https://github.com/user-attachments/assets/f29ea99a-31ac-4e55-abdd-20534db9713c" />

## Features

- Convert any media to your format of choice
  - Supports video (.mp4, .mov, .webm, .avi)
  - Supports image (.png, .webp, .jpeg, .jpg, .gif)
  - Supports audio (.mp4, .mp3, .wav, .aac)
- Keeping it simple.
  - Batch conversion.
  - Custom preset controls
  - Custom compression settings
- Lightweight, fast, secure conversion without the worry of uploading media online!
  - Output directory directly to local machine.

## Download & Installation

### Latest Release

Download the latest version from the [Releases](#) page.

### Platform-Specific Instructions

#### Windows

1. Download the installer (`.exe` or `.msi` file)
2. **Important**: If you see a "Windows protected your PC" warning:
   - Click **"More info"**
   - Click **"Run anyway"**
   - This is normal for unsigned applications from open-source projects
3. Follow the installation wizard
4. Launch FileDitto from the Start menu

#### macOS

1. Download the `.dmg` file for your Mac:
   - **Apple Silicon (M1/M2/M3)**: `FileDitto_*_aarch64.dmg`
   - **Intel Macs**: `FileDitto_*_x64.dmg`
2. Open the downloaded `.dmg` file
3. **Important**: If you see "FileDitto cannot be opened because the developer cannot be verified":
   - **Right-click** the app icon → **Open**
   - Click **"Open"** in the security dialog
   - Alternatively: Go to **System Settings** → **Privacy & Security** → Scroll down and click **"Open Anyway"** next to FileDitto
4. Drag FileDitto to your Applications folder
5. Launch from Applications

### System Requirements

- **Windows**: Windows 10 or later (x64)
- **macOS**: macOS 10.13 or later

## Development setup

### Prerequisites

1. Install [Node.js](https://nodejs.org/en/download/) (v20 or later)
2. Install [Rust](https://www.rust-lang.org/tools/install)

### Development

1. Install dependencies

```
npm install
```

2. Start dev server

```
npm run tauri dev
```

### Build

Build the application locally:

```bash
npm run tauri build
```

Built files will be in `src-tauri/target/release/bundle/`:

- **Windows**: `nsis/` or `msi/` folders
- **macOS**: `dmg/` folder
- **Linux**: `deb/` or `appimage/` folders

## Built with

![Tauri](https://img.shields.io/badge/Tauri-24C8D8?logo=tauri&logoColor=white&style=flat)
![Rust](https://img.shields.io/badge/Rust-000000?logo=rust&logoColor=white&style=flat)
![FFmpeg](https://img.shields.io/badge/FFmpeg-007808?logo=ffmpeg&logoColor=white&style=flat)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black&style=flat)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white&style=flat)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?logo=tailwindcss&logoColor=white&style=flat)
