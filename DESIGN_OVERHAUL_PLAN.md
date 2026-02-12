# Frontend Design Overhaul — Polished & Refined

## Context

The current Forked UI is functional but visually generic — cold blue-gray palette, hard borders everywhere, minimal depth/shadows, no animations, tight spacing. The goal is a **Linear/Raycast-inspired** overhaul: warm refined palette, layered shadows, glass effects, smooth transitions, and generous spacing. Same layout structure, dramatically better visuals.

## Branch

Create `design-overhaul` branch from `main`.

## Implementation Order (6 phases, ~40 files)

### Phase 0: Dependencies & Tailwind Config

**Install:** `tailwindcss-animate` (enables dialog animations that are referenced but currently broken)

**`tailwind.config.js`** — Add:
- `tailwindcss-animate` plugin
- Custom shadow scale: `xs`, `soft`, `lifted`, `glow`, `inset`
- New color tokens: `sidebar`, `surface-hover`

### Phase 1: Design Tokens — `src/styles/globals.css`

Complete palette rewrite for both light and dark modes:

- **Light**: Warm whites/cream neutrals instead of cold blue-gray. Indigo primary (`234 80% 58%`)
- **Dark**: Rich near-black with subtle warmth (`240 6% 9%`) — Raycast-inspired, not pure black
- New variables: `--sidebar`, `--surface-hover` for surface layering
- Refined git colors and branch graph colors
- Thinner scrollbars (6px, transparent track, rounded-full thumb)
- Add `antialiased` to body
- Softer badge/diff utility classes

### Phase 2: Base Components (bottom-up)

| File | Key Changes |
|------|-------------|
| **`common/Button.tsx`** | `transition-all duration-150`, `active:scale-[0.97]`, layered shadow progression (`shadow-xs` → `hover:shadow-soft` → `active:shadow-xs`) |
| **`common/Input.tsx`** | `h-10`, `rounded-lg`, `shadow-xs`, softer border `border-border/60`, glow focus ring `ring-ring/20` |
| **`common/ScrollArea/ScrollBar.tsx`** | `w-1.5`/`h-1.5`, transparent track, `bg-muted-foreground/20` thumb |
| **`common/Dialog/DialogOverlay.tsx`** | `bg-black/50 backdrop-blur-sm` (was `bg-black/80`) |
| **`common/Dialog/DialogContent.tsx`** | `rounded-xl`, `shadow-lifted`, `border-border/50`, `bg-card` |
| **`common/Dialog/DialogTitle.tsx`** | `font-medium` (was `font-semibold`) |
| **`common/Dialog/DialogFooter.tsx`** | Add `border-t border-border/40 pt-4` separator |
| **`common/ContextMenu/`** | `shadow-lifted`, `backdrop-blur-lg`, `rounded-lg`, transition on items |

### Phase 3: Layout Components

| File | Key Changes |
|------|-------------|
| **`layout/Header.tsx`** | Glass effect: `bg-background/80 backdrop-blur-md`, `shadow-xs`, `border-border/40`. Toolbar button group in pill container |
| **`layout/Sidebar.tsx`** | `bg-sidebar` background. Pill-style tab indicators (`rounded-md shadow-xs` active, not border-b-2). Change count badge to pill |
| **`layout/SidebarFileSection.tsx`** | Section headers: `text-[10px] uppercase tracking-widest text-muted-foreground/70` |
| **`layout/SidebarFileItem.tsx`** | `hover:bg-accent/50`, selected: `bg-accent shadow-xs`. Fade-in actions via `opacity-0 group-hover:opacity-100 transition-opacity` |
| **`layout/SidebarCommitBox.tsx`** | Textarea: `rounded-lg`, `shadow-inset`, glow focus ring |
| **`layout/MainPanel.tsx`** | Softer borders `border-border/40`, refined table header `text-[10px] tracking-widest` |
| **`layout/CommitItem.tsx`** | `hover:bg-surface-hover`, lighter text weight, softer metadata contrast |
| **`layout/DetailsPanel.tsx`** | `border-border/40`, refined empty/loading states |
| **`App.tsx`** | 1px resize handles (`w-px`/`h-px`), glass error toast, remove redundant border-t |

### Phase 4: Feature Components

| File | Key Changes |
|------|-------------|
| **`diff/DiffLineComponent.tsx`** | Git CSS variable colors, softer gutter borders `border-border/30` |
| **`diff/HunkView.tsx`** | `bg-muted/40`, increased padding, softer border |
| **`diff/SplitLineCell.tsx`** | Git variable colors, softer empty cell `bg-muted/15` |
| **`diff/DiffViewToggle.tsx`** | Pill toggle group: `bg-secondary/50 rounded-md p-0.5`, active = `bg-background shadow-xs` |
| **`history/CommitDetails.tsx`** | `bg-card` for commit info, `text-git-added`/`text-git-removed` for stats |
| **`history/CommitDetailsFileItem.tsx`** | Softer borders, git color tokens |
| **`history/CommitGraph.tsx`** | Slightly larger nodes (4→4.5, 5→5.5 radius) |
| **`branch/BranchItem.tsx`** | Opacity transitions for actions, softer hover/selection |
| **`branch/BranchSection.tsx`** | Uppercase tracking section headers |
| **`branch/BranchOption.tsx`** | `rounded-md`, transition |

### Phase 5: Welcome Screen & Dialogs

| File | Key Changes |
|------|-------------|
| **`repository/RepoSelector.tsx`** | Subtle gradient background, icon-in-pill action cards (`h-28 rounded-xl`), refined recent repos list |
| **`repository/CloneDialog.tsx`** | Label spacing refinement |
| **`repository/InitDialog.tsx`** | Label spacing refinement |
| **`branch/CreateBranchDialog.tsx`** | Dropdown: `shadow-lifted`, `backdrop-blur-lg`, refined search input |
| **`staging/StashDialog.tsx`** | Inset hover items `rounded-md mx-1` |

## Consistent Patterns

1. **Transitions on everything**: `transition-colors duration-100` or `transition-all duration-150`
2. **Soft borders**: `border-border/40` instead of bare `border-b`
3. **Shadow progression**: rest=`shadow-xs` → hover=`shadow-soft` → elevated=`shadow-lifted`
4. **Reduced-opacity hover/select**: `hover:bg-accent/40`, `bg-accent/60` not full opacity
5. **Glass effects**: `backdrop-blur-md bg-background/80` for floating elements
6. **Section headers**: `text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70`
7. **Action reveal**: `opacity-0 group-hover:opacity-100 transition-opacity` not `hidden/flex`
8. **Focus glow**: `ring-2 ring-ring/20 border-primary/50` not hard ring
9. **Git design tokens**: Always `text-git-added`/`text-git-removed`, never raw `text-green-500`

## Verification

1. `pnpm install` — ensure tailwindcss-animate installs
2. `pnpm dev` — start Vite dev server, verify no build errors
3. Open the app, verify:
   - Light mode: warm whites, indigo accents, layered shadows
   - Dark mode: rich dark backgrounds, refined contrast
   - RepoSelector welcome screen looks polished
   - Open a repo: header glass effect, sidebar differentiation, smooth transitions
   - Commit list: hover states, selection, graph colors
   - Diff viewer: git-colored lines, soft hunk headers
   - Dialogs: blur overlay, rounded corners, shadow depth
   - All interactive elements have smooth transitions
4. `pnpm build` — verify TypeScript and production build pass
