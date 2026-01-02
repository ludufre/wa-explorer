<p align="center">
  <img src="https://raw.githubusercontent.com/ludufre/wa-explorer/refs/heads/main/packages/renderer/src/assets/icons/favicon.png" height="120" alt="wa-explorer">
  <br>
  <img src="https://flat.badgen.net/github/release/ludufre/wa-explorer" alt="Version">
  <img src="https://flat.badgen.net/github/license/ludufre/wa-explorer" alt="License">
  <a href="http://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html"><img src ="https://flat.badgen.net/badge/written%20in/TypeScript/294E80" alt="Written in TypeScript"></a>
</p>

# WA-Exploerer

An Electron-based desktop application that allows users to view WhatsApp chat conversations from iOS backup data. The project is built with:

- **Electron** - Desktop application framework
- **Angular** - Frontend framework with Ionic components
- **TypeScript** - Both frontend and backend

## Features

- [x] iOS: Read conversations and media
- [ ] iOS: Export conversations and media
- [ ] iOS: Import conversations
- [ ] iOS: Import media
- [ ] iOS: Merge conversation and media
- [ ] iOS: Convert Android to iOS
- [ ] Android: Convert iOS to Android
- [ ] Chat History Acessible Online

## Build and Development Commands

### Development

```bash
# Start development mode (Angular dev server + Electron)
pnpm run dev

# Start with build (production-like)
pnpm start
```

The `dev` command runs Angular's dev server (port 4200) and Electron concurrently. The application automatically connects Electron to the dev server in development mode.

### Building

```bash
# Build renderer (Angular frontend)
pnpm run ng:build

# Build renderer for production
pnpm run ng:build:prod

# Build main process (TypeScript compilation)
pnpm run electron:serve-tsc

# Full build for distribution
pnpm run build
```

### Testing

```bash
# Run tests (Angular/Karma)
cd packages/renderer && pnpm run test

# Run tests in watch mode
cd packages/renderer && pnpm run test:watch

# Run e2e tests (Playwright)
cd packages/renderer && pnpm run e2e
```

### Utilities

```bash
# Clean build artifacts and node_modules
pnpm run clear

# View Electron logs
pnpm run electron:logs
```

### VSCode Debugging

The project includes comprehensive VSCode debugging configurations:

- **Application Debug**: Debug both Main and Renderer processes simultaneously
- **Dev: Full Application**: Full development setup with dev server
- **Main**: Debug Electron main process
- **Main (Attach)**: Attach to running Electron instance (port 5858)
- **Renderer (Attach)**: Attach to renderer process (Chrome DevTools on port 9222)

Use the "Application Debug" compound configuration for full-stack debugging.

## Architecture

### Multi-Process Electron Architecture

The application follows Electron's standard multi-process pattern:

1. **Main Process** (`packages/main/`)
   - Entry point: `main.ts`
   - Handles window creation, IPC communication, and native OS interactions
   - Runs Node.js backend code
   - Compiled output: `dist/main/`

2. **Renderer Process** (`packages/renderer/`)
   - Angular application that runs in the Electron browser window
   - Communicates with main process via IPC (Inter-Process Communication)
   - Uses `preload.ts` to safely expose Electron APIs to the renderer
   - Compiled output: `dist/renderer/` (production) or served on port 4200 (development)

3. **Preload Script** (`packages/main/preload.ts`)
   - Bridge between main and renderer processes
   - Exposes limited Electron APIs to renderer with `contextIsolation: true`

### IPC Communication Pattern

Communication between processes uses Electron's IPC mechanism:

- **Events** are defined in `packages/main/interfaces/events.enum.ts`
  - `RendererEvent`: Events sent from renderer to main
  - `MainEvent`: Events sent from main to renderer

- **Handlers** are registered in `packages/main/listenners.ts` via `initializeIpcHandlers()`

Example flow:

```text
Renderer → RendererEvent.Initialize → Main Process → LoadController.load() → Response → Renderer
```

### iOS Backup Processing

The application reads WhatsApp data from iOS backups stored in iTunes/Finder backup locations:

1. **Manifest.db**: SQLite database containing file metadata and paths
2. **ChatStorage.sqlite**: WhatsApp's conversation database
3. Files are referenced using hash-based filenames (e.g., `7c/7c7fba66680ef796b916b067077cc246adacf01d`)

Key interfaces:

- `IBackup`: Represents an iOS backup with device info and chat storage path
- `ISession`: Represents a WhatsApp chat session (maps to ZWACHATSESSION table)
- `IManifestFile`: Represents a file entry in Manifest.db

The `LoadController` (`packages/main/controllers/load.controller.ts`) handles:

- Discovering backups in `~/Library/Application Support/MobileSync/Backup/` (macOS)
- Parsing Info.plist (both binary and XML formats)
- Querying SQLite databases to extract chat and media information
- Resolving file paths using the Manifest.db mapping

### Custom Protocol Handler

The app registers a `local-file://` protocol to securely load media files from the backup:

```typescript
// In main.ts
protocol.handle('local-file', request => {
  let filePath = decodeURIComponent(request.url.replace('local-file://', ''));
  return net.fetch('file://' + filePath);
});
```

This allows the renderer to display images like profile pictures without direct file system access.

### Angular Application Structure

- **Pages** (`packages/renderer/src/app/pages/`):
  - `home`: List of available backups and chats
  - `pickup`: Manual backup selection dialog
  - `detail`: Chat conversation view

- **Engine** (`packages/renderer/src/app/engine/`):
  - `services/`: Core services
    - `electron.service.ts`: Wrapper for Electron IPC APIs
    - `data.service.ts`: Application state management
    - `api.service.ts`: Backend communication
    - `icon.service.ts`: FontAwesome icon registration
  - `components/`: Reusable UI components

### Development Mode vs Production

The application behavior changes based on the `--serve` flag:

**Development (`--serve`)**:

- Loads from `http://localhost:4200` (Angular dev server)
- Opens DevTools automatically
- Window is not fullscreen/kiosk mode
- Shows cursor

**Production**:

- Loads from `file://` protocol (built Angular files)
- Fullscreen/kiosk mode
- Hides cursor (`cursor: none`)
- Uses hardware acceleration flags

## Package Management

This project **requires pnpm**. The `preinstall` script enforces this:

```bash
npx only-allow pnpm
```

### Workspace Structure

The root `package.json` manages the Electron main process, while `packages/renderer/` has its own `package.json` for Angular dependencies. After root install, the postinstall script automatically installs renderer dependencies.

### Patches

The project uses pnpm patches:

- `@types/object-hash@3.0.6` has a patch in `patches/` directory

## Key Development Notes

### TypeScript Configuration

- Root `tsconfig.json` uses project references pointing to `packages/main`
- Main process: `packages/main/tsconfig.json` compiles to `dist/main/`
- Renderer process: `packages/renderer/tsconfig.json` (Angular's configuration)

### nodemon Configuration

The `nodemon.json` watches `dist/main/**/*.js` and restarts Electron with debugging enabled:

- Inspector on port 5858
- Remote debugging on port 9222

### Entry Points

- **Development**: `pnpm run dev` → Angular dev server + Electron with `--serve` flag
- **Production build**: `pnpm run build` → Builds Angular → Compiles TypeScript → electron-builder

### Environment-Specific Behavior

Check `serve` variable in main.ts to understand mode-specific logic:

- Window configuration (fullscreen, kiosk, alwaysOnTop)
- Loading URL (localhost vs file://)
- DevTools availability
- CSS injection for cursor hiding

### Database Access Patterns

All SQLite database access happens in the main process using better-sqlite3:

1. Open database with `readonly: true`
2. Prepare and execute queries
3. Close database connection
4. Return results to renderer via IPC

Never access databases directly from the renderer process.

## Contributing

This project is open to contributions of all kinds!
Please read and follow the project's [Code of Conduct](CODE_OF_CONDUCT.md).

## License

This project is licensed under the **Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)**.

✔ Free to use, modify and redistribute  
❌ Commercial use is not allowed without explicit permission  

Author: Luan Freitas
