import { useUiStore } from "@/stores/uiStore";
import { useRepoStore } from "@/stores/repoStore";
import { ScrollArea } from "@/components/common/ScrollArea";
import { DiffViewer } from "@/components/diff/DiffViewer";
import { CommitDetails } from "@/components/history/CommitDetails";
import { FileText, GitCommit, Loader2 } from "lucide-react";

export function DetailsPanel() {
  const {
    detailView,
    currentFileDiff,
    currentCommitDiff,
    isDiffLoading,
    isSelectedFileStaged,
  } = useUiStore();
  const { selectedCommit } = useRepoStore();

  if (isDiffLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Loading...</p>
      </div>
    );
  }

  if (detailView === "none") {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <FileText className="h-12 w-12 mb-4" />
        <p>Select a file or commit to view details</p>
      </div>
    );
  }

  if (detailView === "diff" && currentFileDiff) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-2 border-b">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="font-semibold text-sm truncate">{currentFileDiff.path}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <span className={isSelectedFileStaged ? "text-green-500" : "text-yellow-500"}>
              {isSelectedFileStaged ? "Staged" : "Unstaged"}
            </span>
            <span>-</span>
            <span className="capitalize">{currentFileDiff.status}</span>
          </div>
        </div>
        <ScrollArea className="flex-1">
          <DiffViewer diff={currentFileDiff} />
        </ScrollArea>
      </div>
    );
  }

  if (detailView === "commit" && selectedCommit && currentCommitDiff) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-2 border-b">
          <div className="flex items-center gap-2">
            <GitCommit className="h-4 w-4" />
            <span className="font-mono text-sm">{selectedCommit.short_id}</span>
          </div>
          <p className="text-sm mt-1 truncate">{selectedCommit.summary}</p>
        </div>
        <ScrollArea className="flex-1">
          <CommitDetails commit={selectedCommit} diff={currentCommitDiff} />
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
      <FileText className="h-12 w-12 mb-4" />
      <p>No content to display</p>
    </div>
  );
}
