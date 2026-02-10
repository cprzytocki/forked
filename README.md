# Forked

A fast, multiplatform desktop Git client built with Tauri, Rust, and React.

## Features

- **Visual Commit Graph** — Browse commit history with a lane-based visual graph
- **Dual Diff Views** — Switch between unified and side-by-side diff modes
- **Staging Area** — Stage, unstage, and discard changes per-file or in bulk
- **Branch Management** — Create, checkout, delete, and merge branches with ahead/behind tracking
- **Remote Operations** — Fetch, pull, and push with merge conflict detection
- **Stash Support** — Save, pop, apply, and drop stashes
- **Repository Setup** — Open, init, or clone repositories
- **Commit Reset** — Soft and hard reset to any commit
- **Live File Watching** — Automatic status updates when files change on disk
- **Dark/Light Theme** — Toggle between themes with persistent preference
- **Configurable UI** — Adjustable font size, tab size, diff context lines, panel widths

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Tauri 2.x |
| Backend | Rust, git2-rs, tokio, parking_lot |
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, Radix UI (shadcn/ui pattern) |
| State | Zustand (with localStorage persistence) |
| Icons | lucide-react |
| Linting | Biome (frontend), Clippy (Rust) |

## Getting Started

### Prerequisites

- [Rust](https://rustup.rs/) (latest stable)
- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/)
- System dependencies for [Tauri 2.x](https://tauri.app/start/prerequisites/)

### Setup

```bash
pnpm install
pnpm tauri dev
```

### Build

```bash
pnpm tauri build
```

## Commands

| Command | Description |
|---------|-------------|
| `pnpm tauri dev` | Run full app in development (Vite + Rust) |
| `pnpm tauri build` | Build production app for current platform |
| `pnpm dev` | Start Vite dev server only (frontend at localhost:1420) |
| `pnpm build` | TypeScript check + Vite build (frontend only) |
| `pnpm lint` | Lint frontend with Biome |
| `pnpm lint:fix` | Lint and auto-fix frontend |
| `pnpm check:rust` | Run Clippy on Rust backend |
| `pnpm check:all` | Lint frontend + Clippy backend |

## Project Structure

```
forked/
├── src/                        # React frontend
│   ├── components/
│   │   ├── layout/             # Header, Sidebar, MainPanel, DetailsPanel
│   │   ├── history/            # CommitGraph, CommitDetails
│   │   ├── branch/             # BranchList, CreateBranchDialog
│   │   ├── diff/               # DiffViewer, SplitDiffViewer, DiffViewToggle
│   │   ├── repository/         # RepoSelector, InitDialog, CloneDialog
│   │   ├── staging/            # StashDialog
│   │   └── common/             # Button, Dialog, Input, ScrollArea, etc.
│   ├── stores/                 # Zustand stores (repo, ui, settings)
│   ├── lib/                    # Tauri IPC wrappers, types, utilities
│   ├── hooks/                  # React hooks
│   └── styles/                 # Global CSS & theme variables
├── src-tauri/                  # Rust backend
│   ├── src/
│   │   ├── commands/           # Tauri IPC command handlers
│   │   │   ├── repo.rs         # Open, init, clone, status
│   │   │   ├── commit.rs       # Stage, commit, history, reset
│   │   │   ├── branch.rs       # Create, checkout, delete, merge
│   │   │   ├── remote.rs       # Fetch, pull, push
│   │   │   ├── diff.rs         # File and commit diffs
│   │   │   ├── stash.rs        # Save, pop, apply, drop
│   │   │   └── config.rs       # Git config
│   │   ├── git/                # Pure git logic (git2-rs)
│   │   │   ├── repository.rs   # Repo open/init/clone, status
│   │   │   ├── history.rs      # Commit log with graph computation
│   │   │   ├── diff.rs         # Diff calculation & formatting
│   │   │   ├── index.rs        # Staging, unstaging, discard, reset
│   │   │   ├── merge.rs        # Branch operations & merging
│   │   │   └── credentials.rs  # SSH & credential handling
│   │   ├── state.rs            # AppState (Mutex<Repository>)
│   │   └── error.rs            # GitClientError (thiserror)
│   └── Cargo.toml
└── package.json
```

## Architecture

The app uses Tauri's IPC invoke system. The flow for any git operation:

1. **React component** triggers a Zustand store action
2. **Store action** calls a typed wrapper in `src/lib/tauri.ts`
3. **Tauri** routes the invoke to a `#[tauri::command]` handler in `src-tauri/src/commands/`
4. **Command handler** acquires a `Mutex` lock on the repository and calls into `src-tauri/src/git/`
5. Results serialize back as JSON through the chain

## License

MIT
