import { useMemo } from "react";
import type { FileDiff, DiffLine } from "@/lib/types";
import { splitDiffHunks, type SplitHunk, type SplitDiffRow } from "@/lib/splitDiff";
import { cn } from "@/lib/utils";

function SplitLineCell({ line, side }: { line: DiffLine | null; side: "left" | "right" }) {
  if (!line) {
    return <div className="flex font-mono text-xs bg-muted/30 min-h-[1.5rem]" />;
  }

  const isAdd = line.origin === "+";
  const isDel = line.origin === "-";

  const bgClass = isDel
    ? "bg-red-500/10 text-red-600 dark:text-red-400"
    : isAdd
      ? "bg-green-500/10 text-green-600 dark:text-green-400"
      : "";

  const lineNo = side === "left" ? line.old_lineno : line.new_lineno;

  return (
    <div className={cn("flex font-mono text-xs", bgClass)}>
      <span className="w-12 text-right pr-2 text-muted-foreground select-none border-r shrink-0">
        {lineNo || ""}
      </span>
      <span className="w-4 text-center select-none shrink-0">
        {isDel ? "-" : isAdd ? "+" : " "}
      </span>
      <pre className="flex-1 pl-1 whitespace-pre-wrap break-all">{line.content}</pre>
    </div>
  );
}

function SplitRow({ row }: { row: SplitDiffRow }) {
  return (
    <div className="flex">
      <div className="w-1/2 border-r">
        <SplitLineCell line={row.left} side="left" />
      </div>
      <div className="w-1/2">
        <SplitLineCell line={row.right} side="right" />
      </div>
    </div>
  );
}

function SplitHunkView({ hunk, index }: { hunk: SplitHunk; index: number }) {
  return (
    <div className="border-b last:border-b-0">
      <div className="bg-muted px-2 py-1 text-xs font-mono text-muted-foreground sticky top-0">
        {hunk.header.trim()}
      </div>
      <div>
        {hunk.rows.map((row, rowIndex) => (
          <SplitRow key={`${index}-${rowIndex}`} row={row} />
        ))}
      </div>
    </div>
  );
}

interface SplitDiffViewerProps {
  diff: FileDiff;
}

export function SplitDiffViewer({ diff }: SplitDiffViewerProps) {
  const splitHunks = useMemo(() => splitDiffHunks(diff.hunks), [diff.hunks]);

  if (diff.is_binary) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        <p>Binary file cannot be displayed</p>
      </div>
    );
  }

  if (diff.hunks.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        <p>No changes to display</p>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      {splitHunks.map((hunk, index) => (
        <SplitHunkView key={index} hunk={hunk} index={index} />
      ))}
    </div>
  );
}
