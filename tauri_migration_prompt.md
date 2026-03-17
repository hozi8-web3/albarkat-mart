# Context
I have an existing Point of Sale (POS) system for "Al-Barkat Mart" built with Electron. I want to migrate it to Tauri (v2) to achieve better performance, lower memory usage, and a significantly smaller executable size, while keeping my existing frontend interface exactly as it is.

# Current Stack (Electron)
- **Frontend**: React 19, Vite, TailwindCSS (v4), Zustand (state management), React Router DOM, Recharts, Lucide React for UI.
- **Backend/Main Process**: Node.js (Electron main process).
- **Database**: `better-sqlite3` local database.
- **Packaging**: `electron-builder` building for Windows `.exe`.

# Target Stack (Tauri)
- **Frontend**: Retain the exact same stack (React, Vite, Tailwind, Zustand).
- **Backend**: Rust + Tauri v2 core.
- **Database**: Use either `@tauri-apps/plugin-sql` or write custom Rust commands using the `rusqlite` crate to interface with my local SQLite database.
- **Packaging**: Tauri's built-in CLI (`tauri build`) to generate Windows installers (`.msi` / `.exe`).

# Detailed Objectives & Requirements

1. **Scaffolding & Configuration:**
   - Integrate Tauri into the existing Vite project (e.g., via `npm tauri init`).
   - Configure `tauri.conf.json` with the app name "Al-Barkat Mart POS" and appropriate window settings.
   - Adjust `vite.config.ts` to work with Tauri's development server.

2. **Database Migration:**
   - Replace `better-sqlite3` logic. 
   - Define a solid approach for storing the `.sqlite` file in the correct OS-level Application Data directory using Tauri's `path` module.
   - Migrate all SQL queries to Tauri.

3. **IPC Bridge Migration:**
   - Find all occurrences of Electron's `ipcRenderer.invoke` and `ipcRenderer.send`.
   - Replace them with Tauri's `invoke('command_name', { payload })`.
   - Write the corresponding `#[tauri::command]` Rust functions in `src-tauri/src/main.rs` to handle these frontend requests.

4. **Hardware/Native Integrations (If applicable):**
   - Implement printing logic (e.g., for thermal receipt printers) using Rust libraries or compatible Tauri plugins, replacing any Electron webContents printing.

5. **CI/CD Workflow:**
   - Create a GitHub Actions workflow (`.github/workflows/release.yml`) that uses `tauri-apps/tauri-action` to automatically build the Rust binaries and upload the Windows installer to GitHub Releases when a version tag (`v*`) is pushed.

# Instructions for the AI
Act as an expert Rust and Tauri developer. We will do this step-by-step:
1. First, guide me on how to run the `tauri init` command and what exact changes to make in my `package.json` and `vite.config.ts`.
2. Second, let's map out my current SQLite database schema and IPC handlers, and you will provide the Rust equivalents.
3. Finally, we'll swap out my frontend API calls and set up the GitHub Action.

Please wait for my confirmation after each step before writing the full code for the next one.
