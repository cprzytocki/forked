import { useMemo } from "react";
import { useRepoStore } from "@/stores/repoStore";
import { useUiStore } from "@/stores/uiStore";
import { ScrollArea } from "@/components/common/ScrollArea";
import { CommitGraph } from "@/components/history/CommitGraph";
import { cn, formatRelativeTime, getBranchColorHsl } from "@/lib/utils";
import type { CommitInfo, CommitGraphEntry } from "@/lib/types";
import { GitCommit, GitBranch } from "lucide-react";

interface CommitItemProps {
  entry: CommitGraphEntry;
  isSelected: boolean;
  onSelect: () => void;
  maxLanes: number;
}

function CommitItem({ entry, isSelected, onSelect, maxLanes }: CommitItemProps) {
  const { commit, graph } = entry;

  return (
    <div
      className={cn(
        "flex items-center cursor-pointer transition-colors",
        "hover:bg-accent/50",
        isSelected && "bg-accent"
      )}
      onClick={onSelect}
    >
      {/* Graph column */}
      <div className="flex-shrink-0">
        <CommitGraph node={graph} maxLanes={maxLanes} />
      </div>

      {/* Message column */}
      <div className="flex-1 min-w-0 px-2 py-1.5 flex items-center gap-2">
        {/* Branch labels */}
        {graph.branch_names.map((name) => (
          <span
            key={name}
            className="branch-badge"
            style={{
              backgroundColor: `${getBranchColorHsl(graph.color_index)}`,
              color: "white",
            }}
          >
            {name}
          </span>
        ))}
        <span className="text-[13px] font-medium truncate">{commit.summary}</span>
      </div>

      {/* Author column */}
      <div className="flex-shrink-0 w-[120px] px-2 text-xs text-muted-foreground truncate">
        {commit.author_name}
      </div>

      {/* Hash column */}
      <div className="flex-shrink-0 w-[70px] px-2 font-mono text-[11px] text-muted-foreground">
        {commit.short_id}
      </div>

      {/* Date column */}
      <div className="flex-shrink-0 w-[100px] px-2 pr-3 text-xs text-muted-foreground text-right">
        {formatRelativeTime(commit.time)}
      </div>
    </div>
  );
}

export function MainPanel() {
  const { commits, selectedCommit, selectCommit, currentBranch } = useRepoStore();
  const { loadCommitDiff } = useUiStore();

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

  const handleSelectCommit = (commit: CommitInfo) => {
    selectCommit(commit);
    loadCommitDiff(commit.id);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-2 border-b flex items-center gap-2">
        <GitBranch className="h-4 w-4" />
        <span className="font-semibold text-sm">{currentBranch || "No branch"}</span>
        <span className="text-xs text-muted-foreground ml-auto">
          {commits.length} commits
        </span>
      </div>

      {/* Column headers */}
      {commits.length > 0 && (
        <div className="flex items-center border-b bg-muted/30 text-[11px] text-muted-foreground uppercase tracking-wider font-medium select-none">
          <div className="flex-shrink-0" style={{ width: Math.max((maxLanes + 1) * 16, 48) }} />
          <div className="flex-1 min-w-0 px-2 py-1">Description</div>
          <div className="flex-shrink-0 w-[120px] px-2 py-1">Author</div>
          <div className="flex-shrink-0 w-[70px] px-2 py-1">Hash</div>
          <div className="flex-shrink-0 w-[100px] px-2 pr-3 py-1 text-right">Date</div>
        </div>
      )}

      {/* Commit list */}
      <ScrollArea className="flex-1">
        {commits.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <GitCommit className="h-12 w-12 mb-4" />
            <p>No commits yet</p>
          </div>
        ) : (
          commits.map((entry) => (
            <CommitItem
              key={entry.commit.id}
              entry={entry}
              isSelected={selectedCommit?.id === entry.commit.id}
              onSelect={() => handleSelectCommit(entry.commit)}
              maxLanes={maxLanes}
            />
          ))
        )}
      </ScrollArea>
    </div>
  );
}
