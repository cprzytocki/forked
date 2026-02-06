# Forked

A fast, multiplatform desktop Git client built with Tauri, Rust, and React.

## Features

- **Repository Management**: Open, init, and clone repositories
- **Staging Area**: Stage/unstage files with a visual interface
- **Commit History**: View commit history with a visual graph
- **Diff Viewer**: See changes in a side-by-side or unified view
- **Branch Management**: Create, switch, delete, and merge branches
- **Remote Operations**: Fetch, pull, and push to remotes
- **Stash Support**: Save and restore work in progress
- **Dark/Light Theme**: Toggle between themes

## Tech Stack

- **Framework**: Tauri 2.x
- **Backend**: Rust with git2-rs
- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand

## Development

### Prerequisites

- [Rust](https://rustup.rs/) (latest stable)
- [Node.js](https://nodejs.org/) (18+)
- [pnpm](https://pnpm.io/) or npm

### Setup

```bash
# Install dependencies
npm install

# Run development server
npm run tauri dev
```

### Build

```bash
# Build for current platform
npm run tauri build
```

## Project Structure

```
git-client/
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── commands/       # Tauri IPC commands
│   │   ├── git/           # Git operation wrappers
│   │   ├── error.rs       # Error types
│   │   └── state.rs       # App state
│   └── Cargo.toml
├── src/                    # React frontend
│   ├── components/        # UI components
│   ├── hooks/            # React hooks
│   ├── stores/           # Zustand stores
│   ├── lib/              # Utilities & Tauri API
│   └── styles/           # Global styles
└── package.json
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build frontend |
| `npm run tauri dev` | Run Tauri in development mode |
| `npm run tauri build` | Build production app |

## License

MIT
