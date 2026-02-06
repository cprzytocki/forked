import React from "react";
import { useRepoStore } from "@/stores/repoStore";
import { useUiStore } from "@/stores/uiStore";
import { ScrollArea } from "@/components/common/ScrollArea";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { CommitInfo } from "@/lib/types";
import { GitCommit, GitBranch, GitMerge } from "lucide-react";

interface CommitItemProps {
  commit: CommitInfo;
  isSelected: boolean;
  onSelect: () => void;
}

function CommitItem({ commit, isSelected, onSelect }: CommitItemProps) {
  const isMerge = commit.parent_ids.length > 1;

  return (
    <div
      className={cn(
        "flex items-start gap-3 px-3 py-2 cursor-pointer hover:bg-accent border-b",
        isSelected && "bg-accent"
      )}
      onClick={onSelect}
    >
      <div className="flex flex-col items-center pt-1">
        <div className={cn(
          "w-2 h-2 rounded-full",
          isMerge ? "bg-purple-500" : "bg-blue-500"
        )} />
        <div className="w-px flex-1 bg-border mt-1" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">
            {commit.short_id}
          </span>
          {isMerge && (
            <GitMerge className="h-3 w-3 text-purple-500" />
          )}
        </div>
        <p className="text-sm truncate">{commit.summary}</p>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <span>{commit.author_name}</span>
          <span>-</span>
          <span>{formatRelativeTime(commit.time)}</span>
        </div>
      </div>
    </div>
  );
}

export function MainPanel() {
  const { commits, selectedCommit, selectCommit, currentBranch } = useRepoStore();
  const { loadCommitDiff } = useUiStore();

  const handleSelectCommit = (commit: CommitInfo) => {
    selectCommit(commit);
    loadCommitDiff(commit.id);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b flex items-center gap-2">
        <GitBranch className="h-4 w-4" />
        <span className="font-semibold text-sm">{currentBranch || "No branch"}</span>
        <span className="text-xs text-muted-foreground ml-auto">
          {commits.length} commits
        </span>
      </div>
      <ScrollArea className="flex-1">
        {commits.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <GitCommit className="h-12 w-12 mb-4" />
            <p>No commits yet</p>
          </div>
        ) : (
          commits.map((commit) => (
            <CommitItem
              key={commit.id}
              commit={commit}
              isSelected={selectedCommit?.id === commit.id}
              onSelect={() => handleSelectCommit(commit)}
            />
          ))
        )}
      </ScrollArea>
    </div>
  );
}
