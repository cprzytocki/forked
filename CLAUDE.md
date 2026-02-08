# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A multiplatform desktop Git client built with **Tauri 2.x** (Rust backend) + **React 18** (TypeScript frontend). Uses `git2-rs` for git operations, Zustand for state management, and Tailwind CSS with shadcn/ui-style components.

## Development Commands

```bash
pnpm install                 # Install frontend dependencies
pnpm tauri dev               # Run full app in development (starts Vite + Rust backend)
pnpm tauri build             # Build production app for current platform
pnpm dev                     # Start Vite dev server only (frontend at localhost:1420)
pnpm build                   # TypeScript check + Vite build (frontend only)
pnpm tsc --noEmit            # Type-check frontend without emitting
```

Rust backend builds are handled by Tauri automatically. To work on Rust code directly:
```bash
cd src-tauri && cargo build  # Build Rust backend
cd src-tauri && cargo check  # Type-check Rust backend
cd src-tauri && cargo clippy # Lint Rust backend
```

## Architecture

### Frontend-Backend Communication

The app uses Tauri's IPC invoke system. The full flow for any git operation is:

1. **React component** calls an action on a Zustand store (`src/stores/`)
2. **Store action** calls a typed wrapper in `src/lib/tauri.ts` (which calls `invoke()`)
3. **Tauri routes** the invoke to a `#[tauri::command]` function in `src-tauri/src/commands/`
4. **Command function** acquires a lock on `AppState.repository` (a `Mutex<Option<Repository>>`) and calls into `src-tauri/src/git/` modules
5. Results serialize back through the chain as JSON

### Rust Backend (`src-tauri/src/`)

- **`state.rs`** — `AppState` holds a single open `git2::Repository` behind `parking_lot::Mutex`. Only one repo is open at a time.
- **`commands/`** — Tauri IPC command handlers organized by domain: `repo`, `commit`, `branch`, `remote`, `diff`, `stash`, `config`. All commands are registered in `lib.rs`.
- **`git/`** — Pure git logic using `git2-rs`: `repository` (open/init/clone/status), `index` (staging), `history` (log/details), `diff`, `merge`, `credentials`.
- **`error.rs`** — `GitClientError` enum using `thiserror`, implements `Serialize` for Tauri IPC.

### Frontend (`src/`)

- **`stores/`** — Three Zustand stores:
  - `repoStore` — All git state (repo info, status, commits, branches, remotes, stashes) and actions that call Tauri
  - `uiStore` — View mode, selection, diff loading, dialog open/close, theme
  - `settingsStore` — Persisted to localStorage via `zustand/middleware/persist` (recent repos, font size, panel widths)
- **`lib/tauri.ts`** — Typed async wrappers around every `invoke()` call. When adding a new Tauri command, add the wrapper here.
- **`lib/types.ts`** — All TypeScript interfaces for data exchanged over IPC. Must stay in sync with Rust serde structs.
- **`components/`** — Organized by feature: `layout/` (Header, Sidebar, MainPanel, DetailsPanel), `branch/`, `diff/`, `history/`, `repository/`, `staging/`, `common/` (Button, Dialog, Input, ScrollArea — shadcn/ui pattern using Radix primitives + `cn()` utility).

### Path Alias

TypeScript and Vite are configured with `@/*` → `./src/*` path alias.

### Theming

Dark/light mode via Tailwind's `class` strategy. CSS variables defined in `src/styles/globals.css`. Git-specific colors (added/removed/modified/renamed/untracked) available as `text-git-*` / `bg-git-*` classes.

## Key Patterns

- **Adding a new git feature**: Add git logic in `src-tauri/src/git/`, create a command in `src-tauri/src/commands/`, register it in `lib.rs`'s `invoke_handler`, add a TypeScript wrapper in `src/lib/tauri.ts`, add types in `src/lib/types.ts`, wire it through a store action.
- **All Tauri commands** must acquire the repo mutex via `state.repository.lock()` and handle the `None` case with `GitClientError::NoRepository`.
- **Error propagation**: Rust uses `Result<T, GitClientError>` which auto-serializes to a string for the frontend. Frontend stores catch errors and set an `error` string state.
- **After mutating operations**, stores call `refreshStatus()` / `refreshAll()` to keep the UI in sync.

## Prerequisites

- Rust (latest stable via rustup)
- Node.js 18+
- System dependencies for Tauri 2.x (platform-specific — see Tauri docs)
