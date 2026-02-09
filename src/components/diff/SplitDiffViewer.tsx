import { useMemo } from 'react';
import {
  type InlineSegment,
  type SplitDiffRow,
  type SplitHunk,
  splitDiffHunks,
} from '@/lib/splitDiff';
import type { DiffLine, FileDiff } from '@/lib/types';
import { cn } from '@/lib/utils';

function SplitLineCell({
  line,
  side,
  segments,
}: {
  line: DiffLine | null;
  side: 'left' | 'right';
  segments?: InlineSegment[];
}) {
  if (!line) {
    return (
      <div className="flex font-mono text-xs bg-muted/30"/>
    );
  }

  const isAdd = line.origin === '+';
  const isDel = line.origin === '-';

  const bgClass = isDel ? 'bg-red-500/15' : isAdd ? 'bg-green-500/15' : '';

  const highlightClass = isDel
    ? 'bg-red-500/30'
    : isAdd
      ? 'bg-green-500/30'
      : '';

  const lineNo = side === 'left' ? line.old_lineno : line.new_lineno;

  return (
    <div className={cn('flex font-mono text-xs', bgClass)}>
      <span className="w-12 text-right pr-2 text-muted-foreground/60 select-none shrink-0">
        {lineNo || ''}
      </span>
      <pre className="flex-1 pl-2 whitespace-pre-wrap break-all">
        {segments
          ? segments.map((seg) =>
              seg.highlighted ? (
                <span key={seg.text} className={highlightClass}>
                  {seg.text}
                </span>
              ) : (
                seg.text
              ),
            )
          : line.content}
      </pre>
    </div>
  );
}

function SplitRow({ row }: { row: SplitDiffRow }) {
  return (
    <div className="flex">
      <div className="w-1/2 border-r border-border/50">
        <SplitLineCell
          line={row.left}
          side="left"
          segments={row.leftSegments}
        />
      </div>
      <div className="w-1/2">
        <SplitLineCell
          line={row.right}
          side="right"
          segments={row.rightSegments}
        />
      </div>
    </div>
  );
}

function SplitHunkView({ hunk }: { hunk: SplitHunk }) {
  return (
    <div className="border-b last:border-b-0">
      <div className="bg-muted px-2 py-1 text-xs font-mono text-muted-foreground sticky top-0">
        {hunk.header.trim()}
      </div>
      <div>
        {hunk.rows.map((row) => (
          <SplitRow
            key={`${row.left?.origin ?? 'x'}-${row.left?.old_lineno ?? 'x'}-${row.right?.new_lineno ?? 'x'}`}
            row={row}
          />
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
      {splitHunks.map((hunk) => (
        <SplitHunkView key={hunk.header} hunk={hunk} />
      ))}
    </div>
  );
}
