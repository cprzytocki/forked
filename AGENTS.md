# AGENTS.md

Instructions for AI coding agents working in this repository.

## Project Overview

Multiplatform desktop Git client: **Tauri 2.x** (Rust backend) + **React 18** (TypeScript frontend). Uses `git2-rs` for git operations, Zustand for state management, Tailwind CSS with shadcn/ui components.

## Build & Development Commands

```bash
# Frontend
pnpm install                 # Install dependencies (use pnpm, not npm/yarn)
pnpm dev                     # Vite dev server only (localhost:1420)
pnpm build                   # TypeScript check + Vite build (runs: tsc && vite build)
pnpm tsc --noEmit            # Type-check frontend without build

# Full app (frontend + Rust backend)
pnpm tauri dev               # Development mode
pnpm tauri build             # Production build

# Rust backend only (run from src-tauri/)
cargo build                  # Build
cargo check                  # Type-check
cargo clippy                 # Lint
```

### Tests

No test infrastructure exists. No test runner, no test files, no `#[cfg(test)]` blocks. If you add tests:
- Frontend: add Vitest (`vitest.config.ts`) and place tests as `*.test.ts(x)` next to source files
- Rust: add `#[cfg(test)] mod tests` blocks in the relevant module files

### Linting & Formatting

```bash
# Frontend (Biome — linter + formatter)
pnpm lint                    # Check lint + format (no writes)
pnpm lint:fix                # Auto-fix lint + format issues
pnpm format                  # Format only

# Rust
pnpm check:rust              # cargo clippy with -D warnings
pnpm format:rust             # cargo fmt

# Full project
pnpm check:all               # pnpm lint && pnpm check:rust
```

**Biome** (`biome.json`) handles linting and formatting for TypeScript/React:
- 2-space indentation, single quotes, double quotes for JSX, trailing commas, 80 char line width
- Recommended lint rules enabled (includes a11y, correctness, style, suspicious)
- Import sorting via `organizeImports`
- Tailwind CSS directive support enabled

**TypeScript** strict mode (`strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`) is also enforced via `tsc` in the build.

**Rust** uses `cargo clippy` (default rules, warnings treated as errors) and `cargo fmt` (edition 2021, configured in `src-tauri/rustfmt.toml`).

## Architecture & IPC Flow

Every git operation follows this chain:

1. React component -> Zustand store action (`src/stores/`)
2. Store action -> typed wrapper in `src/lib/tauri.ts` (calls `invoke()`)
3. Tauri routes to `#[tauri::command]` in `src-tauri/src/commands/`
4. Command acquires `AppState.repository` mutex lock, calls `src-tauri/src/git/`
5. Result serializes back as JSON

### Adding a New Feature (Checklist)

1. Add git logic in `src-tauri/src/git/` (pure `git2` operations)
2. Add command handler in `src-tauri/src/commands/` (acquires mutex, calls git module)
3. Register command in `src-tauri/src/lib.rs` `invoke_handler`
4. Add TypeScript wrapper in `src/lib/tauri.ts`
5. Add/update types in `src/lib/types.ts` (must match Rust serde structs)
6. Wire through a store action in `src/stores/repoStore.ts`
7. Call `refreshStatus()` or `refreshAll()` after mutations

## Code Style

### TypeScript

**Imports** - Biome auto-sorts imports alphabetically. Use single quotes:
```typescript
import { GitBranch, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/common/Button';
import * as tauri from '@/lib/tauri';
import type { FileStatus } from '@/lib/types';    // use `import type` for type-only
import { useRepoStore } from '@/stores/repoStore';
```

- Use `@/*` path alias for all cross-directory imports (`@/` maps to `./src/`)
- Use relative imports (`./`) only within the same directory (e.g., inside `src/lib/`)
- Use `import type { ... }` for type-only imports
- Use `import * as tauri from '@/lib/tauri'` in stores (namespace import)
- Use `import * as DialogPrimitive from '@radix-ui/react-dialog'` for Radix primitives

**Naming:**
- Components: PascalCase files (`BranchList.tsx`), PascalCase function names, named exports
- Non-components: camelCase files (`repoStore.ts`, `tauri.ts`, `splitDiff.ts`)
- Hooks: camelCase with `use` prefix (`useBranches.ts`)
- Types/interfaces: PascalCase (`RepoInfo`, `FileStatus`, `CommitInfo`)
- Zustand stores: `use` + PascalCase + `Store` (`useRepoStore`, `useUiStore`)
- Store state interfaces: PascalCase + `State` (`RepoState`, `UiState`)

**Components:**
- Feature components: plain `export function ComponentName()` declarations
- Common UI components (shadcn/ui): use `React.forwardRef` with `displayName`
- Use `cn()` from `@/lib/utils` for conditional class merging (clsx + tailwind-merge)
- Use `cva` from `class-variance-authority` for component variants

**Error handling in stores:**
```typescript
try {
  const result = await tauri.someOperation(args);
  set({ data: result });
} catch (e) {
  set({ error: String(e) });
} finally {
  set({ isLoading: false });
}
```

**IPC property names:** Use `snake_case` in TypeScript interfaces to match Rust serde output (e.g., `is_bare`, `head_name`, `author_email`, `parent_ids`).

### Rust

**Imports** - ordered: std, external crates, crate-internal:
```rust
use std::path::PathBuf;
use git2::Repository;
use serde::Serialize;
use crate::error::GitClientError;
use crate::state::AppState;
```

**Naming:**
- Files: `snake_case.rs`
- Functions: `snake_case` (including `#[tauri::command]` handlers)
- Structs/Enums: PascalCase, enum variants PascalCase
- Module re-exports: `pub use submodule::*;` in `mod.rs`

**Structs** that cross the IPC boundary: derive `Debug, Serialize, Clone`:
```rust
#[derive(Debug, Serialize, Clone)]
pub struct RepoInfo {
    pub path: String,
    pub is_bare: bool,
    pub head_name: Option<String>,
}
```

**Command handler pattern** - every command must:
1. Accept `state: State<'_, AppState>` parameter
2. Return `Result<T, GitClientError>`
3. Lock the mutex: `let guard = state.repo.lock();`
4. Check for open repo: `let repo = guard.repository.as_ref().ok_or(GitClientError::NoRepository)?;`
5. Use `?` for error propagation

**Error type:** `GitClientError` in `src-tauri/src/error.rs` (thiserror enum). Use existing variants:
- `Git(git2::Error)` - auto-converted via `#[from]`
- `NoRepository` - when no repo is open
- `Operation(String)` - for custom error messages
- `Io(std::io::Error)` - auto-converted via `#[from]`

### CSS & Theming

- Dark/light mode via Tailwind `class` strategy, toggled on `<html>` element
- Design tokens as CSS variables in `src/styles/globals.css`
- Git-specific classes: `text-git-added`, `text-git-removed`, `text-git-modified`, `text-git-renamed`, `text-git-untracked` (and `bg-git-*` variants)
- All colors reference CSS variables (e.g., `hsl(var(--primary))`) for theme compatibility

## Key Files

| Purpose | Path |
|---------|------|
| Tauri command registration | `src-tauri/src/lib.rs` |
| Error enum | `src-tauri/src/error.rs` |
| App state (mutex) | `src-tauri/src/state.rs` |
| Command handlers | `src-tauri/src/commands/*.rs` |
| Git operations | `src-tauri/src/git/*.rs` |
| TypeScript IPC wrappers | `src/lib/tauri.ts` |
| Shared types | `src/lib/types.ts` |
| Main git state store | `src/stores/repoStore.ts` |
| UI state store | `src/stores/uiStore.ts` |
| Settings (persisted) | `src/stores/settingsStore.ts` |
| Tailwind theme/tokens | `src/styles/globals.css` |
| Utility (cn helper) | `src/lib/utils.ts` |
| Biome config (linter/fmt) | `biome.json` |
| Rust fmt config | `src-tauri/rustfmt.toml` |

## Common Pitfalls

- **Type sync**: TypeScript interfaces in `src/lib/types.ts` must exactly match Rust serde structs (including `snake_case` field names)
- **Command registration**: Every new `#[tauri::command]` must be added to the `invoke_handler` array in `lib.rs`
- **Mutex discipline**: Always acquire via `state.repo.lock()`, never hold across `.await` points
- **Refresh after mutation**: Store actions that modify repo state must call `refreshStatus()` or `refreshAll()` afterward
- **Package manager**: Use `pnpm`, not npm or yarn
