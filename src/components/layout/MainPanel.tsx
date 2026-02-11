import { GitBranch, GitCommit, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useBranches } from '@/hooks/useBranches';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
  ContextMenu,
  ContextMenuItem,
} from '@/components/common/ContextMenu';
import { ScrollArea } from '@/components/common/ScrollArea';
import { CommitGraph } from '@/components/history/CommitGraph';
import type { CommitGraphEntry, CommitInfo } from '@/lib/types';
import { cn, formatRelativeTime, getBranchColorHsl } from '@/lib/utils';
import { useRepoStore } from '@/stores/repoStore';
import { useUiStore } from '@/stores/uiStore';

interface CommitItemProps {
  entry: CommitGraphEntry;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  maxLanes: number;
}

function CommitItem({
  entry,
  isSelected,
  onSelect,
  onContextMenu,
  maxLanes,
}: CommitItemProps) {
  const { commit, graph } = entry;

  return (
    <button
      type="button"
      className={cn(
        'pl-1 flex items-center cursor-pointer transition-colors w-full text-left',
        'hover:bg-accent/50',
        isSelected && 'bg-accent',
      )}
      onClick={onSelect}
      onContextMenu={onContextMenu}
    >
      <div className="flex-shrink-0">
        <CommitGraph node={graph} maxLanes={maxLanes} />
      </div>

      <div className="flex-1 min-w-0 px-2 py-1.5 flex items-center gap-2">
        {graph.branch_names.map((name) => (
          <span
            key={name}
            className="branch-badge"
            style={{
              backgroundColor: `${getBranchColorHsl(graph.color_index)}`,
              color: 'white',
            }}
          >
            {name}
          </span>
        ))}
        <span className="text-[13px] font-medium truncate">{commit.summary}</span>
      </div>

      <div className="flex-shrink-0 w-[120px] px-2 text-xs text-muted-foreground truncate">
        {commit.author_name}
      </div>

      <div className="flex-shrink-0 w-[70px] px-2 font-mono text-[11px] text-muted-foreground">
        {commit.short_id}
      </div>

      <div className="flex-shrink-0 w-[100px] px-2 pr-3 text-xs text-muted-foreground text-right">
        {formatRelativeTime(commit.time)}
      </div>
    </button>
  );
}

export function MainPanel() {
  const {
    commits,
    selectedCommit,
    selectCommit,
    currentBranch,
    viewingBranch,
    hasMoreCommits,
    isLoadingMoreCommits,
    resetToCommit,
    squashCommits,
  } = useRepoStore();
  const { loadCommitDiff } = useUiStore();

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const [selectedCommitIds, setSelectedCommitIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectionAnchorId, setSelectionAnchorId] = useState<string | null>(
    null,
  );

  const [contextMenu, setContextMenu] = useState<{
    position: { x: number; y: number };
    commit: CommitInfo;
  } | null>(null);

  const [resetConfirm, setResetConfirm] = useState<{
    commitId: string;
    commitSummary: string;
    mode: 'soft' | 'hard';
  } | null>(null);

  const [squashConfirm, setSquashConfirm] = useState<{
    commitIds: string[];
    count: number;
  } | null>(null);

  const canReset = viewingBranch === null || viewingBranch === currentBranch;

  const branch = useBranches().branches.find(
    (branch) => branch.name === currentBranch,
  );
  const headCommitId = branch?.commit_id ?? null;

  const commitIndexById = useMemo(() => {
    const map = new Map<string, number>();
    commits.forEach((entry, index) => map.set(entry.commit.id, index));
    return map;
  }, [commits]);

  const selectedInOrder = useMemo(() => {
    return Array.from(selectedCommitIds)
      .map((id) => {
        const index = commitIndexById.get(id);
        if (index === undefined) return null;
        return { id, index, commit: commits[index].commit };
      })
      .filter((item): item is { id: string; index: number; commit: CommitInfo } => item !== null)
      .sort((a, b) => a.index - b.index);
  }, [selectedCommitIds, commitIndexById, commits]);

  const canSquashSelection = useMemo(() => {
    if (!canReset || !headCommitId || selectedInOrder.length < 2) return false;
    if (selectedCommitIds.has(headCommitId)) return false;

    for (let i = 0; i < selectedInOrder.length - 1; i += 1) {
      const current = selectedInOrder[i];
      const next = selectedInOrder[i + 1];
      if (next.index !== current.index + 1) return false;
      if (current.commit.parent_ids[0] !== next.commit.id) return false;
    }

    return true;
  }, [canReset, headCommitId, selectedInOrder, selectedCommitIds]);

  const maxLanes = useMemo(() => {
    if (commits.length === 0) return 0;
    let max = 0;
    for (const e of commits) {
      max = Math.max(max, e.graph.lane);
      for (const conn of e.graph.connections_to_parents) {
        max = Math.max(max, conn.to_lane);
      }
      for (const pt of e.graph.pass_through_lanes) {
        max = Math.max(max, pt.lane);
      }
    }
    return max + 1;
  }, [commits]);

  const selectSingleCommit = (commit: CommitInfo) => {
    setSelectedCommitIds(new Set([commit.id]));
    setSelectionAnchorId(commit.id);
    selectCommit(commit);
    loadCommitDiff(commit.id);
  };

  const handleSelectCommit = (commit: CommitInfo, e: React.MouseEvent) => {
    const clickedIndex = commitIndexById.get(commit.id);
    if (clickedIndex === undefined) return;

    if (e.shiftKey && selectionAnchorId) {
      const anchorIndex = commitIndexById.get(selectionAnchorId);
      if (anchorIndex !== undefined) {
        const start = Math.min(anchorIndex, clickedIndex);
        const end = Math.max(anchorIndex, clickedIndex);
        const rangeIds = commits.slice(start, end + 1).map((entry) => entry.commit.id);
        setSelectedCommitIds(new Set(rangeIds));
        selectCommit(commit);
        loadCommitDiff(commit.id);
        return;
      }
    }

    if (e.metaKey || e.ctrlKey) {
      setSelectedCommitIds((previous) => {
        const next = new Set(previous);
        if (next.has(commit.id)) {
          next.delete(commit.id);
        } else {
          next.add(commit.id);
        }
        return next;
      });
      setSelectionAnchorId(commit.id);
      selectCommit(commit);
      loadCommitDiff(commit.id);
      return;
    }

    selectSingleCommit(commit);
  };

  useEffect(() => {
    const validIds = new Set(commits.map((entry) => entry.commit.id));

    setSelectedCommitIds((previous) => {
      const next = new Set(Array.from(previous).filter((id) => validIds.has(id)));
      if (next.size > 0) return next;
      if (selectedCommit && validIds.has(selectedCommit.id)) {
        return new Set([selectedCommit.id]);
      }
      return next;
    });

    setSelectionAnchorId((previous) => {
      if (previous && validIds.has(previous)) return previous;
      if (selectedCommit && validIds.has(selectedCommit.id)) return selectedCommit.id;
      return null;
    });
  }, [commits, selectedCommit]);

  useEffect(() => {
    if (!hasMoreCommits || commits.length === 0) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const viewport = scrollAreaRef.current?.querySelector(
      '[data-radix-scroll-area-viewport]',
    );

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          const state = useRepoStore.getState();
          if (state.hasMoreCommits && !state.isLoadingMoreCommits) {
            state.loadMoreCommits();
          }
        }
      },
      {
        root: viewport || null,
        rootMargin: '100px',
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [commits.length, hasMoreCommits]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b flex items-center gap-2">
        <GitBranch className="h-4 w-4" />
        <span className="font-semibold text-sm">{currentBranch || 'No branch'}</span>
        {branch?.ahead != null && branch.ahead > 0 && (
          <span
            className="font-mono text-xs shrink-0 text-git-added"
            title={`${branch.ahead} commit${branch.ahead === 1 ? '' : 's'} ahead of upstream (to push)`}
          >
            ↑{branch.ahead}
          </span>
        )}
        {branch?.behind != null && branch.behind > 0 && (
          <span
            className="font-mono text-xs shrink-0 text-git-renamed"
            title={`${branch.behind} commit${branch.behind === 1 ? '' : 's'} behind upstream (to pull)`}
          >
            ↓{branch.behind}
          </span>
        )}
        <span className="text-xs text-muted-foreground ml-auto">
          {commits.length}
          {hasMoreCommits ? '+' : ''} commits
        </span>
      </div>

      {commits.length > 0 && (
        <div className="flex items-center border-b bg-muted/30 text-[11px] text-muted-foreground uppercase tracking-wider font-medium select-none">
          <div
            className="flex-shrink-0"
            style={{ width: Math.max((maxLanes + 1) * 16, 48) }}
          />
          <div className="flex-1 min-w-0 px-2 py-1">Description</div>
          <div className="flex-shrink-0 w-[120px] px-2 py-1">Author</div>
          <div className="flex-shrink-0 w-[70px] px-2 py-1">Hash</div>
          <div className="flex-shrink-0 w-[100px] px-2 pr-3 py-1 text-right">
            Date
          </div>
        </div>
      )}

      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        {commits.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <GitCommit className="h-12 w-12 mb-4" />
            <p>No commits yet</p>
          </div>
        ) : (
          <>
            {commits.map((entry) => (
              <CommitItem
                key={entry.commit.id}
                entry={entry}
                isSelected={selectedCommitIds.has(entry.commit.id)}
                onSelect={(e) => handleSelectCommit(entry.commit, e)}
                onContextMenu={(e) => {
                  if (!canReset) return;
                  e.preventDefault();
                  if (!selectedCommitIds.has(entry.commit.id)) {
                    selectSingleCommit(entry.commit);
                  }
                  setContextMenu({
                    position: { x: e.clientX, y: e.clientY },
                    commit: entry.commit,
                  });
                }}
                maxLanes={maxLanes}
              />
            ))}
            {hasMoreCommits && (
              <div
                ref={sentinelRef}
                className="flex items-center justify-center py-3 text-xs text-muted-foreground"
              >
                {isLoadingMoreCommits && (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                    Loading more commits...
                  </>
                )}
              </div>
            )}
          </>
        )}
      </ScrollArea>

      {contextMenu && (
        <ContextMenu
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
        >
          {canSquashSelection && (
            <ContextMenuItem
              onClick={() => {
                setSquashConfirm({
                  commitIds: selectedInOrder.map((entry) => entry.id),
                  count: selectedInOrder.length,
                });
                setContextMenu(null);
              }}
            >
              Squash Commits
            </ContextMenuItem>
          )}
          <ContextMenuItem
            onClick={() => {
              setResetConfirm({
                commitId: contextMenu.commit.id,
                commitSummary: contextMenu.commit.summary,
                mode: 'soft',
              });
              setContextMenu(null);
            }}
          >
            Soft Reset to Here
          </ContextMenuItem>
          <ContextMenuItem
            destructive
            onClick={() => {
              setResetConfirm({
                commitId: contextMenu.commit.id,
                commitSummary: contextMenu.commit.summary,
                mode: 'hard',
              });
              setContextMenu(null);
            }}
          >
            Hard Reset to Here
          </ContextMenuItem>
        </ContextMenu>
      )}

      <ConfirmDialog
        open={resetConfirm !== null}
        onOpenChange={(open) => {
          if (!open) setResetConfirm(null);
        }}
        title={resetConfirm?.mode === 'hard' ? 'Hard Reset' : 'Soft Reset'}
        description={
          resetConfirm?.mode === 'hard' ? (
            <>
              Are you sure you want to{' '}
              <span className="font-semibold text-destructive">hard reset</span> to{' '}
              <span className="font-semibold text-foreground">
                {resetConfirm?.commitSummary}
              </span>
              ? This will discard all uncommitted changes and cannot be undone.
            </>
          ) : (
            <>
              Reset HEAD to{' '}
              <span className="font-semibold text-foreground">
                {resetConfirm?.commitSummary}
              </span>
              ? Changes after this commit will be preserved as staged changes.
            </>
          )
        }
        confirmLabel={resetConfirm?.mode === 'hard' ? 'Hard Reset' : 'Soft Reset'}
        confirmVariant={resetConfirm?.mode === 'hard' ? 'destructive' : 'default'}
        onConfirm={() => {
          if (resetConfirm) {
            resetToCommit(resetConfirm.commitId, resetConfirm.mode);
          }
          setResetConfirm(null);
        }}
        onCancel={() => setResetConfirm(null)}
      />

      <ConfirmDialog
        open={squashConfirm !== null}
        onOpenChange={(open) => {
          if (!open) setSquashConfirm(null);
        }}
        title="Squash Commits"
        description={
          <>
            Squash {squashConfirm?.count} selected commits into one commit? This
            rewrites history and will require a force push if commits were already
            pushed.
          </>
        }
        confirmLabel="Squash"
        confirmVariant="destructive"
        onConfirm={() => {
          if (squashConfirm) {
            squashCommits(squashConfirm.commitIds);
            setSelectedCommitIds(new Set());
            setSelectionAnchorId(null);
          }
          setSquashConfirm(null);
        }}
        onCancel={() => setSquashConfirm(null)}
      />
    </div>
  );
}
