import { FileText, GitCommit, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/common/ScrollArea/ScrollArea';
import { DiffViewer } from '@/components/diff/DiffViewer';
import { DiffViewToggle } from '@/components/diff/DiffViewToggle';
import { SplitDiffViewer } from '@/components/diff/SplitDiffViewer';
import { CommitDetails } from '@/components/history/CommitDetails';
import { useRepoStore } from '@/stores/repoStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useUiStore } from '@/stores/uiStore';

export function DetailsPanel() {
  const {
    detailView,
    currentFileDiff,
    currentCommitDiff,
    isDiffLoading,
    isSelectedFileStaged,
  } = useUiStore();
  const { selectedCommit } = useRepoStore();
  const diffViewMode = useSettingsStore((s) => s.diffViewMode);

  if (isDiffLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-muted-foreground/80">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Loading...</p>
      </div>
    );
  }

  if (detailView === 'none') {
    return (
      <div className="flex h-full flex-col items-center justify-center text-muted-foreground/80">
        <FileText className="h-12 w-12 mb-4" />
        <p>Select a file or commit to view details</p>
      </div>
    );
  }

  if (detailView === 'diff' && currentFileDiff) {
    return (
      <div className="flex flex-col h-full">
        <div className="border-b border-border/40 p-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="font-semibold text-sm truncate">
              {currentFileDiff.path}
            </span>
            <div className="ml-auto">
              <DiffViewToggle />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <span
              className={
                isSelectedFileStaged ? 'text-git-added' : 'text-git-modified'
              }
            >
              {isSelectedFileStaged ? 'Staged' : 'Unstaged'}
            </span>
            <span>-</span>
            <span className="capitalize">{currentFileDiff.status}</span>
          </div>
        </div>
        <ScrollArea className="flex-1">
          {diffViewMode === 'split' ? (
            <SplitDiffViewer diff={currentFileDiff} />
          ) : (
            <DiffViewer diff={currentFileDiff} />
          )}
        </ScrollArea>
      </div>
    );
  }

  if (detailView === 'commit' && selectedCommit && currentCommitDiff) {
    return (
      <div className="flex flex-col h-full">
        <div className="border-b border-border/40 p-2">
          <div className="flex items-center gap-2">
            <GitCommit className="h-4 w-4" />
            <span className="font-mono text-sm">
              {selectedCommit.short_id} - {selectedCommit.summary}
            </span>
          </div>
        </div>
        <ScrollArea className="flex-1">
          <CommitDetails commit={selectedCommit} diff={currentCommitDiff} />
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center text-muted-foreground/80">
      <FileText className="h-12 w-12 mb-4" />
      <p>No content to display</p>
    </div>
  );
}
