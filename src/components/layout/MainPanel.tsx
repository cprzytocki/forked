import { GitBranch, GitCommit, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BranchTrackingIndicators } from '@/components/branch/BranchTrackingIndicators';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ContextMenu } from '@/components/common/ContextMenu/ContextMenu';
import { ContextMenuItem } from '@/components/common/ContextMenu/ContextMenuItem';
import { Dialog } from '@/components/common/Dialog/Dialog';
import { DialogContent } from '@/components/common/Dialog/DialogContent';
import { DialogDescription } from '@/components/common/Dialog/DialogDescription';
import { DialogFooter } from '@/components/common/Dialog/DialogFooter';
import { DialogHeader } from '@/components/common/Dialog/DialogHeader';
import { DialogTitle } from '@/components/common/Dialog/DialogTitle';
import { ScrollArea } from '@/components/common/ScrollArea/ScrollArea';
import { CommitItem } from '@/components/layout/CommitItem';
import { useBranches } from '@/hooks/useBranches';
import type { CommitInfo } from '@/lib/types';
import { useRepoStore } from '@/stores/repoStore';
import { useUiStore } from '@/stores/uiStore';

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
    commits: CommitInfo[];
    message: string;
  } | null>(null);

  const canReset = viewingBranch === null || viewingBranch === currentBranch;
  const isViewingDifferentBranch =
    viewingBranch !== null && viewingBranch !== currentBranch;

  const branch = useBranches().branches.find(
    (current) => current.name === currentBranch,
  );

  const commitIndexById = useMemo(() => {
    const map = new Map<string, number>();
    commits.forEach((entry, index) => {
      map.set(entry.commit.id, index);
    });
    return map;
  }, [commits]);

  const selectedInOrder = useMemo(() => {
    return Array.from(selectedCommitIds)
      .map((id) => {
        const index = commitIndexById.get(id);
        if (index === undefined) return null;
        return { id, index, commit: commits[index].commit };
      })
      .filter(
        (item): item is { id: string; index: number; commit: CommitInfo } =>
          item !== null,
      )
      .sort((a, b) => a.index - b.index);
  }, [selectedCommitIds, commitIndexById, commits]);

  const canSquashSelection = useMemo(() => {
    if (!canReset || selectedInOrder.length < 2) return false;

    for (let i = 0; i < selectedInOrder.length - 1; i += 1) {
      const current = selectedInOrder[i];
      const next = selectedInOrder[i + 1];
      if (next.index !== current.index + 1) return false;
      if (current.commit.parent_ids[0] !== next.commit.id) return false;
    }

    return true;
  }, [canReset, selectedInOrder]);

  const maxLanes = useMemo(() => {
    if (commits.length === 0) return 0;
    let max = 0;
    for (const entry of commits) {
      max = Math.max(max, entry.graph.lane);
      for (const connection of entry.graph.connections_to_parents) {
        max = Math.max(max, connection.to_lane);
      }
      for (const passThrough of entry.graph.pass_through_lanes) {
        max = Math.max(max, passThrough.lane);
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
        const rangeIds = commits
          .slice(start, end + 1)
          .map((entry) => entry.commit.id);
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
      const next = new Set(
        Array.from(previous).filter((id) => validIds.has(id)),
      );
      if (next.size > 0) return next;
      if (selectedCommit && validIds.has(selectedCommit.id)) {
        return new Set([selectedCommit.id]);
      }
      return next;
    });

    setSelectionAnchorId((previous) => {
      if (previous && validIds.has(previous)) return previous;
      if (selectedCommit && validIds.has(selectedCommit.id))
        return selectedCommit.id;
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
        <span className="font-semibold text-sm">
          {currentBranch || 'No branch'}
          {isViewingDifferentBranch ? (
            <span className="font-normal text-muted-foreground">
              {' '}
              (viewing {viewingBranch})
            </span>
          ) : null}
        </span>
        <BranchTrackingIndicators
          ahead={branch?.ahead}
          behind={branch?.behind}
        />
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
                const commitsOldToNew = selectedInOrder
                  .map((entry) => entry.commit)
                  .reverse();
                setSquashConfirm({
                  commitIds: selectedInOrder.map((entry) => entry.id),
                  commits: commitsOldToNew,
                  message: commitsOldToNew
                    .map((commit) => commit.message.trim())
                    .filter((message) => message.length > 0)
                    .join('\n\n'),
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
              <span className="font-semibold text-destructive">hard reset</span>{' '}
              to{' '}
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
        confirmLabel={
          resetConfirm?.mode === 'hard' ? 'Hard Reset' : 'Soft Reset'
        }
        confirmVariant={
          resetConfirm?.mode === 'hard' ? 'destructive' : 'default'
        }
        onConfirm={() => {
          if (resetConfirm) {
            resetToCommit(resetConfirm.commitId, resetConfirm.mode);
          }
          setResetConfirm(null);
        }}
        onCancel={() => setResetConfirm(null)}
      />

      <Dialog
        open={squashConfirm !== null}
        onOpenChange={(open) => {
          if (!open) setSquashConfirm(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Squash Commits</DialogTitle>
            <DialogDescription>
              These commits will be squashed into one. Edit the new commit
              message below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="max-h-32 overflow-auto rounded-md border bg-muted/20 p-2">
              <ul className="space-y-1.5">
                {squashConfirm?.commits.map((commit) => (
                  <li key={commit.id} className="text-xs text-muted-foreground">
                    <span className="font-mono mr-2">{commit.short_id}</span>
                    <span className="text-foreground">{commit.summary}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <label
                htmlFor="squash-message"
                className="text-sm font-medium text-foreground"
              >
                New commit message
              </label>
              <textarea
                id="squash-message"
                className="mt-1 w-full h-36 p-2 text-sm bg-background border rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                value={squashConfirm?.message ?? ''}
                onChange={(e) =>
                  setSquashConfirm((previous) =>
                    previous
                      ? { ...previous, message: e.target.value }
                      : previous,
                  )
                }
              />
            </div>
            <p className="text-xs text-muted-foreground">
              This rewrites history and may require a force push.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSquashConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!squashConfirm?.message.trim()}
              onClick={() => {
                if (squashConfirm) {
                  squashCommits(squashConfirm.commitIds, squashConfirm.message);
                  setSelectedCommitIds(new Set());
                  setSelectionAnchorId(null);
                }
                setSquashConfirm(null);
              }}
            >
              Squash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
